use super::super::time_series;
use super::aac;
use super::base;
use cpal::traits::StreamTrait;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::broadcast;
use tokio::sync::RwLock;

pub fn init(
  timeseries_time_limit_ms: u64,
  timeseries_path: PathBuf,
) -> (
  broadcast::Receiver<Vec<u8>>,
  Option<broadcast::Sender<Vec<f32>>>,
  Arc<RwLock<Box<dyn time_series::base::Store<Vec<u8>> + Send + Sync>>>,
  Option<tokio::task::JoinHandle<()>>,
) {
  // **Log which features are enabled**
  println!("PRINT: About to log feature flags");
  log::info!(
        "Feature Flags - Audio Capture: {}, Audio Recording: {}, Memory-Only Storage: {}",
        base::ENABLE_AUDIO_CAPTURE,
        base::ENABLE_AUDIO_RECORDING,
        base::USE_MEMORY_ONLY_STORAGE
    );
  println!("PRINT: Finished logging feature flags");

  // --- mic initialization ---
  // IMPORTANT: Keep mic_pcm_tx alive! If it's dropped, the channel closes and the encoder stops.
  // The audio capture stream sends to this channel, and the encoder receives from it.
  let (mic_pcm_tx, _mic_pcm_rx) = broadcast::channel::<Vec<f32>>(10);
  let (mic_aac_tx, mic_aac_rx) = broadcast::channel::<Vec<u8>>(100);
  let (_mic_stream, _mic_pcm_tx_keeper, mic_store, _encoder_task) =
    if base::ENABLE_AUDIO_CAPTURE {
      let mic_pcm_rx_encoder = mic_pcm_tx.subscribe();
      let mic_aac_rx_timeseries = mic_aac_tx.subscribe();
      let stream = match base::capture(mic_pcm_tx.clone()) {
        Ok(stream) => {
          if let Err(e) = stream.play() {
            log::error!("Failed to start audio capture stream: {}", e);
            log::error!("This means the microphone is not capturing audio!");
            log::error!("The AAC encoder will not produce any init segment without audio input.");
            None
          } else {
            log::info!("Audio capture stream started successfully");
            log::warn!("CRITICAL: Stream .play() succeeded. If no 'I16 audio callback' logs appear within 10 seconds, the USB mic hardware is not producing data.");
            Some(stream)
          }
        }
        Err(e) => {
          log::error!("Failed to create audio capture stream: {}", e);
          log::error!("This means the microphone cannot be accessed!");
          log::error!("Possible causes:");
          log::error!("  1. No microphone connected");
          log::error!("  2. Microphone permission denied (macOS requires explicit permission)");
          log::error!("  3. Microphone already in use by another application");
          None
        }
      };
      let sample_rate = base::SAMPLE_RATE.get().copied().unwrap_or(48000);
      let channels = base::CHANNEL_COUNT.get().copied().unwrap_or(1);
      println!(
        "PRINT: About to spawn encoder task with {}Hz, {} ch",
        sample_rate, channels
      );
      log::info!(
        "Spawning AAC encoder task: {}Hz, {} channels",
        sample_rate,
        channels
      );
      let encoder_task = aac::spawn_encoder_task(
        sample_rate,
        channels,
        mic_pcm_rx_encoder,
        mic_aac_tx.clone(),
      );
      println!("PRINT: Encoder task spawned");
      let chunk_size_bytes = 50_000;
      let store: Arc<
        RwLock<Box<dyn time_series::base::Store<Vec<u8>> + Send + Sync>>,
      > = if base::ENABLE_AUDIO_RECORDING {
        let max_entries = (1_000_000_000 / 1024).max(1000) as usize;
        let store: Box<dyn time_series::base::Store<Vec<u8>> + Send + Sync> =
          if base::USE_MEMORY_ONLY_STORAGE {
            let delegate = time_series::mem::Store::<Vec<u8>>::new(
              max_entries,
              Some(timeseries_time_limit_ms),
            );
            Box::new(time_series::buf::BufferedStore::new(
              chunk_size_bytes,
              delegate,
            ))
          } else {
            let delegate = time_series::disk::Store::<Vec<u8>>::new(
              &timeseries_path.join("mic"),
              1_000_000_000,
              Some(timeseries_time_limit_ms),
              0.8,
              0.8,
            );
            Box::new(time_series::buf::BufferedStore::new(
              chunk_size_bytes,
              delegate,
            ))
          };
        let store = Arc::new(RwLock::new(store));
        listen(store.clone(), mic_aac_rx_timeseries);
        store
      } else {
        let delegate = time_series::disk::Store::new(
          &timeseries_path.join("mic_disabled"),
          0,
          None,
          0.0,
          0.0,
        );
        let store: Box<dyn time_series::base::Store<Vec<u8>> + Send + Sync> =
          Box::new(time_series::buf::BufferedStore::new(
            chunk_size_bytes,
            delegate,
          ));
        Arc::new(RwLock::new(store))
      };
      // Return mic_pcm_tx to keep it alive - if it's dropped, the channel closes!
      (stream, Some(mic_pcm_tx), store, Some(encoder_task))
    } else {
      let disabled_store: Arc<
        RwLock<Box<dyn time_series::base::Store<Vec<u8>> + Send + Sync>>,
      > = Arc::new(RwLock::new(Box::new(time_series::mem::Store::new(
        0,
        Some(0),
      ))));
      (None, None, disabled_store, None)
    };

  (mic_aac_rx, _mic_pcm_tx_keeper, mic_store, _encoder_task)
}

/// Per-client aac playback reader
///
/// Wraps a time series store and provides stateful reading that:
/// - Loads aggregated chunks from disk
/// - Splits them into individual aac fragments (moof+mdat)
/// - Caches fragments in memory
/// - Returns fragments one at a time for smooth playback
/// - Tracks timestamps for each fragment based on aac duration
///
/// Each client gets their own instance with independent read state.
pub struct AacTimeSeries {
  store: Arc<RwLock<dyn time_series::base::Store<Vec<u8>>>>,
  // Cached split fragments from the current aggregated chunk
  cached_fragments: Vec<Vec<u8>>,
  cached_base_timestamp: u64,
  pub sample_rate: u32, // For calculating fragment durations (public for scrub)
}

impl AacTimeSeries {
  pub fn new(
    store: Arc<RwLock<dyn time_series::base::Store<Vec<u8>>>>,
  ) -> Self {
    let sample_rate = super::base::SAMPLE_RATE.get().copied().unwrap_or(48000);
    Self {
      store,
      cached_fragments: Vec::new(),
      cached_base_timestamp: 0,
      sample_rate,
    }
  }
  /// Split an aggregated aac chunk back into individual moof+mdat fragments
  fn split_aac(aggregated: &[u8]) -> Vec<Vec<u8>> {
    let mut fragments = Vec::new();
    let mut pos = 0;
    let mut current_fragment = Vec::new();
    let mut in_fragment = false;

    while pos + 8 <= aggregated.len() {
      let box_size = u32::from_be_bytes([
        aggregated[pos],
        aggregated[pos + 1],
        aggregated[pos + 2],
        aggregated[pos + 3],
      ]) as usize;

      if box_size < 8 || pos + box_size > aggregated.len() {
        break;
      }

      let box_type = &aggregated[pos + 4..pos + 8];
      let box_data = &aggregated[pos..pos + box_size];

      match box_type {
        b"moof" => {
          // Start of a new fragment
          if in_fragment && !current_fragment.is_empty() {
            // Save previous fragment before starting new one
            fragments.push(current_fragment.clone());
            current_fragment.clear();
          }
          current_fragment.extend_from_slice(box_data);
          in_fragment = true;
        }
        b"mdat" if in_fragment => {
          // End of fragment
          current_fragment.extend_from_slice(box_data);
          fragments.push(current_fragment.clone());
          current_fragment.clear();
          in_fragment = false;
        }
        _ if in_fragment => {
          // Other boxes that are part of the fragment
          current_fragment.extend_from_slice(box_data);
        }
        _ => {
          // Boxes outside fragments (shouldn't happen)
          log::warn!(
            "aacReader: Unexpected box outside fragment: {:?}",
            std::str::from_utf8(box_type)
          );
        }
      }

      pos += box_size;
    }

    // Don't forget the last fragment if it's incomplete
    if !current_fragment.is_empty() {
      fragments.push(current_fragment);
    }

    log::debug!(
      "aacReader: split {} bytes into {} fragments",
      aggregated.len(),
      fragments.len()
    );
    fragments
  }

  /// Get the next individual aac fragment for playback
  /// Returns (timestamp, fragment_data)
  ///
  /// If the requested timestamp falls within the cached fragments, returns from cache.
  /// Otherwise, loads a new aggregated chunk from the store.
  pub async fn next(&mut self, timestamp: u64) -> Option<(u64, Vec<u8>)> {
    // Check if we have cached fragments and the requested timestamp is within our cached range
    if !self.cached_fragments.is_empty() {
      // Calculate the timestamp range of our cached fragments
      let mut cached_timestamp = self.cached_base_timestamp;

      for (idx, fragment) in self.cached_fragments.iter().enumerate() {
        let duration_ms =
          Self::parse_aac_duration(fragment, self.sample_rate).unwrap_or(1);
        let fragment_end = cached_timestamp + duration_ms;

        // For next(), we want the fragment that starts AFTER the requested timestamp
        // This ensures we always move forward
        if cached_timestamp > timestamp {
          log::debug!(
                        "aacReader::next: returning cached fragment {}/{} at timestamp {} (requested {}, duration {}ms)",
                        idx + 1,
                        self.cached_fragments.len(),
                        cached_timestamp,
                        timestamp,
                        duration_ms
                    );
          return Some((cached_timestamp, fragment.clone()));
        }

        cached_timestamp = fragment_end;
      }
    }

    // Not in cache or no cache - load next aggregated chunk from store
    log::debug!(
      "aacReader::next: cache miss for timestamp {}, loading from store",
      timestamp
    );

    let store_read = self.store.read().await;
    if let Some((chunk_ts, aggregated)) = store_read.next(timestamp) {
      drop(store_read); // Release lock

      // Split the aggregated chunk into individual fragments
      let fragments = Self::split_aac(&aggregated);
      log::debug!(
                "aacReader::next: loaded aggregated chunk at timestamp {}, {} bytes, split into {} fragments",
                chunk_ts,
                aggregated.len(),
                fragments.len()
            );

      if fragments.is_empty() {
        return None;
      }

      // Cache the fragments
      self.cached_fragments = fragments;
      self.cached_base_timestamp = chunk_ts;

      // Yield first_fragment
      let first_fragment = self.cached_fragments[0].clone();
      Some((chunk_ts, first_fragment))
    } else {
      log::info!(
        "aacReader::next: No more chunks available after timestamp {}",
        timestamp
      );
      None
    }
  }

  /// Get the previous individual aac fragment before the given timestamp
  /// Returns (timestamp, fragment_data)
  ///
  /// If the requested timestamp falls within the cached fragments, returns from cache.
  /// Otherwise, loads a new aggregated chunk from the store.
  pub async fn prev(&mut self, timestamp: u64) -> Option<(u64, Vec<u8>)> {
    // Check if we have cached fragments and the requested timestamp is within our cached range
    if !self.cached_fragments.is_empty() {
      // Calculate the timestamp range of our cached fragments
      let mut cached_timestamp = self.cached_base_timestamp;

      // Iterate through cached fragments to find the one before the requested timestamp
      for (idx, fragment) in self.cached_fragments.iter().enumerate() {
        let duration_ms =
          Self::parse_aac_duration(fragment, self.sample_rate).unwrap_or(1);
        let fragment_end = cached_timestamp + duration_ms;

        // If this fragment ends after the requested timestamp,
        // we want the previous fragment (if it exists)
        if fragment_end > timestamp && idx > 0 {
          let prev_idx = idx - 1;
          let prev_fragment = &self.cached_fragments[prev_idx];

          // Calculate the timestamp of the previous fragment
          let mut prev_timestamp = self.cached_base_timestamp;
          for i in 0..prev_idx {
            let dur = Self::parse_aac_duration(
              &self.cached_fragments[i],
              self.sample_rate,
            )
            .unwrap_or(1);
            prev_timestamp += dur;
          }

          log::debug!(
                        "aacReader::prev: returning cached fragment {}/{} at timestamp {} (requested {})",
                        prev_idx + 1,
                        self.cached_fragments.len(),
                        prev_timestamp,
                        timestamp
                    );
          return Some((prev_timestamp, prev_fragment.clone()));
        }

        // If we're at the last fragment and it starts before timestamp, return it
        if idx == self.cached_fragments.len() - 1
          && cached_timestamp < timestamp
        {
          log::debug!(
                        "aacReader::prev: returning last cached fragment at timestamp {} (requested {})",
                        cached_timestamp,
                        timestamp
                    );
          return Some((cached_timestamp, fragment.clone()));
        }

        cached_timestamp = fragment_end;
      }
    }

    // Not in cache or no cache - load prev aggregated chunk from store
    log::debug!(
      "aacReader::prev: cache miss for timestamp {}, loading from store",
      timestamp
    );

    let store_read = self.store.read().await;
    if let Some((chunk_ts, aggregated)) = store_read.prev(timestamp) {
      drop(store_read); // Release lock

      // Split the aggregated chunk into individual fragments
      let fragments = Self::split_aac(&aggregated);
      log::debug!(
                "aacReader::prev: loaded aggregated chunk at timestamp {}, {} bytes, split into {} fragments",
                chunk_ts,
                aggregated.len(),
                fragments.len()
            );

      if fragments.is_empty() {
        return None;
      }

      // Cache the fragments
      self.cached_fragments = fragments;
      self.cached_base_timestamp = chunk_ts;

      // Return the last fragment in the chunk (closest to the requested timestamp)
      let last_idx = self.cached_fragments.len() - 1;
      let last_fragment = self.cached_fragments[last_idx].clone();

      // Calculate timestamp of last fragment
      let mut last_timestamp = chunk_ts;
      for i in 0..last_idx {
        let dur =
          Self::parse_aac_duration(&self.cached_fragments[i], self.sample_rate)
            .unwrap_or(1);
        last_timestamp += dur;
      }
      Some((last_timestamp, last_fragment))
    } else {
      log::info!(
        "aacReader::prev: No chunks available before timestamp {}",
        timestamp
      );
      None
    }
  }

  /// Parse aac fragment to extract duration in milliseconds
  fn parse_aac_duration(fragment: &[u8], sample_rate: u32) -> Option<u64> {
    // Reuse the same parsing logic from time_series.rs
    parse_aac_duration(fragment, sample_rate)
  }

  /// Get timestamp range from the underlying store
  pub async fn timestamp_range(&self) -> Option<(u64, u64)> {
    let store_read = self.store.read().await;
    store_read.timestamp_range()
  }
}

/// **Starts an async listener task that saves incoming data with timestamps**
pub fn listen<T: time_series::base::Data + 'static>(
  store_lock: Arc<RwLock<Box<dyn time_series::base::Store<T> + Send + Sync>>>,
  mut rx: broadcast::Receiver<T>,
) {
  tokio::spawn(async move {
    log::info!("Time series listener started");
    let mut last_lag_warning = std::time::Instant::now();
    let lag_warning_interval = std::time::Duration::from_secs(5); // Only warn every 5 seconds

    let mut current_timestamp = std::time::SystemTime::now()
      .duration_since(std::time::UNIX_EPOCH)
      .unwrap()
      .as_millis() as u64;

    loop {
      match rx.recv().await {
        Ok(entry) => {
          let timestamp = current_timestamp;

          // Calculate duration for next timestamp
          // For Vec<u8> (aac fragments), parse duration from moof box
          // For other types, use default 1ms increment
          let duration_ms = if std::any::TypeId::of::<T>()
            == std::any::TypeId::of::<Vec<u8>>()
          {
            // Try to parse aac duration
            let sample_rate =
              super::base::SAMPLE_RATE.get().copied().unwrap_or(48000);
            // SAFETY: We just checked the type is Vec<u8>
            let fragment_bytes =
              unsafe { &*((&entry as *const T) as *const Vec<u8>) };
            let parsed_duration =
              parse_aac_duration(fragment_bytes, sample_rate);
            log::debug!(
                            "Time series: fragment {} bytes, parsed duration: {:?}ms, sample_rate: {}, will store at timestamp: {}",
                            fragment_bytes.len(),
                            parsed_duration,
                            sample_rate,
                            timestamp
                        );
            parsed_duration.unwrap_or_else(|| {
              log::warn!("Failed to parse aac duration, using 1ms default");
              1
            })
          } else {
            1 // Default 1ms for non-aac data
          };

          current_timestamp += duration_ms;

          let store_lock = Arc::clone(&store_lock);
          if let Err(e) = tokio::task::spawn_blocking(move || {
            let mut store = store_lock.blocking_write();
            store.push(timestamp, entry);
          })
          .await
          {
            log::error!(
              "Failed to spawn blocking task for time series storage: {}",
              e
            );
          }
        }
        Err(broadcast::error::RecvError::Lagged(skipped)) => {
          // Throttle lag warnings to reduce log spam
          if last_lag_warning.elapsed() >= lag_warning_interval {
            log::warn!(
              "Time series listener lagged, skipped {} messages",
              skipped
            );
            last_lag_warning = std::time::Instant::now();
          }
          // Continue listening despite being lagged
          continue;
        }
        Err(broadcast::error::RecvError::Closed) => {
          log::error!("Time series listener exited - broadcast channel closed");
          break;
        }
      }
    }
    log::info!("Time series listener task finished");
  });
}

/// **Extract sample duration in milliseconds from an aac fragment (moof+mdat)**
///
/// Parses the moof box structure to find the trun (track run) box which contains
/// sample information. Returns duration in milliseconds based on sample count and rate.
pub fn parse_aac_duration(fragment: &[u8], sample_rate: u32) -> Option<u64> {
  if fragment.len() < 8 {
    return None;
  }

  let mut pos = 0;
  while pos + 8 <= fragment.len() {
    let box_size = u32::from_be_bytes([
      fragment[pos],
      fragment[pos + 1],
      fragment[pos + 2],
      fragment[pos + 3],
    ]) as usize;
    let box_type = &fragment[pos + 4..pos + 8];

    if box_size < 8 || pos + box_size > fragment.len() {
      break;
    }

    // Look for moof box
    if box_type == b"moof" {
      // Inside moof, look for traf (track fragment) box
      let mut moof_pos = pos + 8;
      while moof_pos + 8 <= pos + box_size {
        let traf_size = u32::from_be_bytes([
          fragment[moof_pos],
          fragment[moof_pos + 1],
          fragment[moof_pos + 2],
          fragment[moof_pos + 3],
        ]) as usize;
        let traf_type = &fragment[moof_pos + 4..moof_pos + 8];

        if traf_size < 8 || moof_pos + traf_size > pos + box_size {
          break;
        }

        if traf_type == b"traf" {
          // Inside traf, look for trun (track run) box
          let mut traf_pos = moof_pos + 8;
          while traf_pos + 16 <= moof_pos + traf_size {
            let trun_size = u32::from_be_bytes([
              fragment[traf_pos],
              fragment[traf_pos + 1],
              fragment[traf_pos + 2],
              fragment[traf_pos + 3],
            ]) as usize;
            let trun_type = &fragment[traf_pos + 4..traf_pos + 8];

            if trun_size < 16 || traf_pos + trun_size > moof_pos + traf_size {
              break;
            }

            if trun_type == b"trun" {
              // trun found! Extract sample count
              // trun structure: size(4) + type(4) + version/flags(4) + sample_count(4) + ...
              if traf_pos + 16 <= fragment.len() {
                // Debug: show the trun box bytes
                let trun_bytes = &fragment
                  [traf_pos..traf_pos.saturating_add(20).min(fragment.len())];
                log::debug!(
                  "aac parser: trun box bytes (first 20): {:02x?}",
                  trun_bytes
                );

                // The sample_count is at offset 8 (after size(4) + type(4))
                // But position depends on version/flags
                let version_flags = u32::from_be_bytes([
                  fragment[traf_pos + 8],
                  fragment[traf_pos + 9],
                  fragment[traf_pos + 10],
                  fragment[traf_pos + 11],
                ]);
                log::debug!(
                  "aac parser: trun version_flags={:08x}",
                  version_flags
                );

                let sample_count = u32::from_be_bytes([
                  fragment[traf_pos + 12],
                  fragment[traf_pos + 13],
                  fragment[traf_pos + 14],
                  fragment[traf_pos + 15],
                ]) as u64;

                // In aac, trun sample_count = number of AAC frames (not individual samples)
                // Each AAC frame contains 1024 audio samples
                const AAC_FRAME_SIZE: u64 = 1024;
                let audio_sample_count = sample_count * AAC_FRAME_SIZE;

                // Calculate duration: (audio_samples * 1000) / sample_rate
                let duration_ms = if audio_sample_count > 0 {
                  // Add half the divisor for rounding
                  ((audio_sample_count * 1000) + (sample_rate as u64 / 2))
                    / sample_rate as u64
                } else {
                  0
                };

                log::debug!(
                                    "aac duration: aac_frame_count={}, audio_samples={}, sample_rate={}, calculated_duration={}ms",
                                    sample_count,
                                    audio_sample_count,
                                    sample_rate,
                                    duration_ms
                                );
                return Some(duration_ms.max(1)); // Always return at least 1ms
              }
            }
            traf_pos += trun_size;
          }
        }
        moof_pos += traf_size;
      }
    }
    pos += box_size;
  }
  None
}
