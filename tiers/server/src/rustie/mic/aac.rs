use base64::Engine;
use gstreamer as gst;
use gstreamer::prelude::*;
use gstreamer_app as gst_app;
use std::sync::{Arc, Mutex};
use tokio::sync::{broadcast, RwLock};
use warp::hyper::body::Bytes;

pub struct Encoder {
  appsrc: gst_app::AppSrc,
  appsink: gst_app::AppSink,
  pipeline: gst::Pipeline,
  sample_rate: u32,
  timestamp: Arc<Mutex<gst::ClockTime>>,
}

impl Encoder {
  pub fn new(sample_rate: u32, channels: u16) -> Result<Self, String> {
    log::info!(
      "Creating AAC encoder with sample_rate={} Hz, channels={}",
      sample_rate,
      channels
    );

    gst::init().map_err(|e| format!("Failed to init GStreamer: {}", e))?;

    // Create pipeline: appsrc ! audioconvert ! avenc_aac ! mp4mux ! appsink
    let pipeline = gst::Pipeline::new();

    let appsrc = gst::ElementFactory::make("appsrc")
      .name("audio_source")
      .build()
      .map_err(|e| format!("Failed to create appsrc: {}", e))?;

    let audioconvert = gst::ElementFactory::make("audioconvert")
      .build()
      .map_err(|e| format!("Failed to create audioconvert: {}", e))?;

    // Try different AAC encoders in order of preference:
    // 1. avenc_aac (gst-libav) - best quality, not always available
    // 2. voaacenc (gst-plugins-bad) - lightweight, good for ARM/RPi
    // 3. fdkaacenc (gst-plugins-bad with fdk-aac) - high quality but requires extra package
    let aac_encoder = if let Ok(enc) = gst::ElementFactory::make("avenc_aac")
      .property("bitrate", 128000i32)
      .build()
    {
      log::info!("Using avenc_aac encoder");
      enc
    } else if let Ok(enc) = gst::ElementFactory::make("voaacenc")
      .property("bitrate", 128000i32)
      .build()
    {
      log::info!("Using voaacenc encoder (avenc_aac not available)");
      enc
    } else if let Ok(enc) = gst::ElementFactory::make("fdkaacenc")
      .property("bitrate", 128000i32)
      .build()
    {
      log::info!("Using fdkaacenc encoder");
      enc
    } else {
      return Err("No AAC encoder found! Please install gstreamer1.0-plugins-bad or gstreamer1.0-libav".to_string());
    };

    let aacparse = gst::ElementFactory::make("aacparse")
      .build()
      .map_err(|e| format!("Failed to create aacparse: {}", e))?;

    let mp4mux = gst::ElementFactory::make("mp4mux")
      .property("fragment-duration", 100u32) // 100ms fragments = ~2 AAC frames at 24kHz (faster scrubbing)
      .property("streamable", true)
      .property_from_str("fragment-mode", "dash-or-mss") // fragmented MP4 for streaming
      .build()
      .map_err(|e| format!("Failed to create mp4mux: {}", e))?;

    let appsink = gst::ElementFactory::make("appsink")
      .name("audio_sink")
      .build()
      .map_err(|e| format!("Failed to create appsink: {}", e))?;

    pipeline
      .add_many([
        &appsrc,
        &audioconvert,
        &aac_encoder,
        &aacparse,
        &mp4mux,
        &appsink,
      ])
      .map_err(|e| format!("Failed to add elements: {}", e))?;

    gst::Element::link_many([
      &appsrc,
      &audioconvert,
      &aac_encoder,
      &aacparse,
      &mp4mux,
      &appsink,
    ])
    .map_err(|e| format!("Failed to link elements: {}", e))?;

    // Configure appsrc
    let appsrc = appsrc.downcast::<gst_app::AppSrc>().unwrap();
    appsrc.set_caps(Some(
      &gst::Caps::builder("audio/x-raw")
        .field("format", "F32LE")
        .field("rate", sample_rate as i32)
        .field("channels", channels as i32)
        .field("layout", "interleaved")
        .build(),
    ));
    appsrc.set_format(gst::Format::Time);
    appsrc.set_property("is-live", true);
    appsrc.set_property("do-timestamp", true);
    appsrc.set_property("min-latency", 0i64);

    // Configure appsink
    let appsink = appsink.downcast::<gst_app::AppSink>().unwrap();
    appsink.set_property("emit-signals", false);
    appsink.set_property("sync", false);
    appsink.set_property("max-buffers", 100u32); // Increased buffer to avoid drops
    appsink.set_property("drop", false);

    Ok(Self {
      appsrc,
      appsink,
      pipeline,
      sample_rate,
      timestamp: Arc::new(Mutex::new(gst::ClockTime::ZERO)),
    })
  }

  pub fn start(&self) -> Result<(), String> {
    self
      .pipeline
      .set_state(gst::State::Playing)
      .map_err(|e| format!("Failed to start pipeline: {}", e))?;

    // Check for any immediate errors on the bus
    if let Some(bus) = self.pipeline.bus() {
      if let Some(msg) = bus.pop_filtered(&[gst::MessageType::Error]) {
        if let gst::MessageView::Error(err) = msg.view() {
          return Err(format!(
            "Pipeline error: {} - {}",
            err.error(),
            err.debug().unwrap_or_default()
          ));
        }
      }
    }

    Ok(())
  }

  pub fn push_samples(&self, samples: &[f32]) -> Result<(), String> {
    static mut PUSH_COUNT: u32 = 0;

    let mut buffer = gst::Buffer::with_size(samples.len() * 4)
      .map_err(|e| format!("Failed to create buffer: {}", e))?;

    {
      let buffer_ref = buffer.get_mut().unwrap();

      // Set timestamp and duration
      let mut ts = self.timestamp.lock().unwrap();
      buffer_ref.set_pts(*ts);
      buffer_ref.set_dts(*ts);

      // Calculate duration based on number of samples
      let duration_ns = (samples.len() as u64
        * gst::ClockTime::SECOND.nseconds())
        / self.sample_rate as u64;
      buffer_ref.set_duration(gst::ClockTime::from_nseconds(duration_ns));

      unsafe {
        PUSH_COUNT += 1;
        if PUSH_COUNT <= 5 {
          let duration_ms = duration_ns / 1_000_000;
          log::info!(
            "AAC encoder push_samples #{}: {} samples, {} bytes, {}ms duration",
            PUSH_COUNT,
            samples.len(),
            samples.len() * 4,
            duration_ms
          );
        }
      }

      // Update timestamp for next buffer
      *ts += gst::ClockTime::from_nseconds(duration_ns);

      let mut data = buffer_ref
        .map_writable()
        .map_err(|e| format!("Failed to map buffer: {}", e))?;
      let slice = data.as_mut_slice();

      // Copy f32 samples as bytes
      unsafe {
        std::ptr::copy_nonoverlapping(
          samples.as_ptr() as *const u8,
          slice.as_mut_ptr(),
          samples.len() * 4,
        );
      }
    }

    self
      .appsrc
      .push_buffer(buffer)
      .map_err(|_| "Failed to push buffer".to_string())?;
    Ok(())
  }

  pub fn try_pull_sample(&self) -> Option<Bytes> {
    static mut PULL_COUNT: u32 = 0;

    // Pull sample without timeout - returns immediately if available
    self
      .appsink
      .try_pull_sample(gst::ClockTime::ZERO)
      .map(|sample| {
        let buffer = sample.buffer().unwrap();
        let map = buffer.map_readable().unwrap();
        let bytes = Bytes::copy_from_slice(map.as_slice());

        unsafe {
          PULL_COUNT += 1;
          if PULL_COUNT <= 10 {
            log::info!(
              "AAC encoder try_pull_sample #{}: {} bytes from GStreamer",
              PULL_COUNT,
              bytes.len()
            );
          }
        }

        bytes
      })
  }

  pub fn stop(&self) {
    let _ = self.appsrc.end_of_stream();
    let _ = self.pipeline.set_state(gst::State::Null);
  }
}

impl Drop for Encoder {
  fn drop(&mut self) {
    self.stop();
  }
}

// Global storage for initialization segment (shared across all clients)
static INIT_SEGMENT: std::sync::OnceLock<Vec<u8>> = std::sync::OnceLock::new();

/// Get the cached initialization segment (if available)
pub fn get_init_segment() -> Option<Vec<u8>> {
  INIT_SEGMENT.get().cloned()
}

/// Global AAC encoder that processes PCM and outputs fMP4 fragments
/// This is the Phase 2 architecture: encode once, use everywhere
pub struct GlobalEncoder {
  encoder: Encoder,
  init_segment: Arc<RwLock<Option<Vec<u8>>>>,
}

impl GlobalEncoder {
  pub fn new(sample_rate: u32, channels: u16) -> Result<Self, String> {
    let encoder = Encoder::new(sample_rate, channels)?;
    Ok(Self {
      encoder,
      init_segment: Arc::new(RwLock::new(None)),
    })
  }

  pub fn start(&self) -> Result<(), String> {
    self.encoder.start()
  }

  pub fn stop(&self) {
    self.encoder.stop();
  }

  /// Process PCM samples and return fMP4 fragments
  /// Returns (init_segment_if_new, media_fragments)
  pub async fn process_pcm(&self, pcm: &[f32]) -> Result<Vec<Vec<u8>>, String> {
    // Push samples to encoder
    self.encoder.push_samples(pcm)?;

    let mut fragments = Vec::new();
    let mut box_accumulator: Vec<u8> = Vec::new();
    let mut temp_init_segment: Vec<u8> = Vec::new();
    let mut fragment_buffer: Vec<u8> = Vec::new();
    let mut in_fragment = false;

    // Pull all available fMP4 data
    loop {
      match self.encoder.try_pull_sample() {
        Some(fmp4_data) => {
          // Accumulate data
          box_accumulator.extend_from_slice(&fmp4_data);

          // Process all complete boxes
          while box_accumulator.len() >= 8 {
            let box_size = u32::from_be_bytes([
              box_accumulator[0],
              box_accumulator[1],
              box_accumulator[2],
              box_accumulator[3],
            ]) as usize;

            if box_accumulator.len() < box_size {
              break; // Need more data
            }

            let box_data: Vec<u8> = box_accumulator.drain(..box_size).collect();
            let box_type = String::from_utf8_lossy(&box_data[4..8]).to_string();

            match box_type.as_str() {
              "ftyp" | "moov" => {
                // Initialization segment - cache it
                temp_init_segment.extend_from_slice(&box_data);

                if box_type == "moov" {
                  // Complete init segment - cache it globally AND in static
                  let mut init = self.init_segment.write().await;
                  if init.is_none() {
                    *init = Some(temp_init_segment.clone());
                    // Also store in global static for all clients
                    let _ = INIT_SEGMENT.set(temp_init_segment.clone());
                    log::info!(
                      "Cached initialization segment globally: {} bytes",
                      temp_init_segment.len()
                    );

                    // Log base64 for easy copy-paste to client code
                    let base64 = base64::engine::general_purpose::STANDARD
                      .encode(&temp_init_segment);
                    log::info!("╔════════════════════════════════════════════════════════════════");
                    log::info!("║ INIT SEGMENT BASE64 - Copy this to client INIT_SEGMENT_BASE64:");
                    log::info!("╠════════════════════════════════════════════════════════════════");
                    log::info!("║ {}", base64);
                    log::info!("╚════════════════════════════════════════════════════════════════");
                  }
                  // DON'T broadcast init segment - handlers send it separately!
                  // fragments.push(temp_init_segment.clone());
                  temp_init_segment.clear();
                }
              }
              "moof" => {
                // Start of media fragment
                fragment_buffer.clear();
                fragment_buffer.extend_from_slice(&box_data);
                in_fragment = true;
              }
              "mdat" if in_fragment => {
                // End of media fragment
                fragment_buffer.extend_from_slice(&box_data);
                in_fragment = false;
                fragments.push(fragment_buffer.clone());
                fragment_buffer.clear();
              }
              _ => {
                // Other boxes
                if in_fragment {
                  fragment_buffer.extend_from_slice(&box_data);
                } else {
                  log::warn!("Unexpected box '{}' outside fragment", box_type);
                }
              }
            }
          }
        }
        None => break,
      }
    }

    Ok(fragments)
  }
}

/// Spawn a task that continuously converts PCM to fMP4 fragments
/// This task bridges the PCM broadcast channel to the fMP4 broadcast channel
pub fn spawn_encoder_task(
  sample_rate: u32,
  channels: u16,
  mut pcm_rx: broadcast::Receiver<Vec<f32>>,
  fmp4_tx: broadcast::Sender<Vec<u8>>,
) -> tokio::task::JoinHandle<()> {
  tokio::spawn(async move {
    log::info!(
      "Global AAC encoder task starting ({}Hz, {} ch)",
      sample_rate,
      channels
    );

    let encoder = match GlobalEncoder::new(sample_rate, channels) {
      Ok(enc) => enc,
      Err(e) => {
        log::error!("Failed to create global AAC encoder: {}", e);
        return;
      }
    };

    if let Err(e) = encoder.start() {
      log::error!("Failed to start global AAC encoder: {}", e);
      return;
    }

    let mut chunk_count = 0;
    let start_time = std::time::Instant::now();
    let mut warned_no_data = false;

    loop {
      // Check if we haven't received any data after 5 seconds
      if !warned_no_data
        && chunk_count == 0
        && start_time.elapsed().as_secs() >= 5
      {
        log::error!("Global AAC encoder has been running for 5 seconds but received NO PCM data!");
        log::error!("This means the microphone is not capturing audio.");
        log::error!(
          "The encoder cannot produce an init segment without audio input."
        );
        log::error!("Check that:");
        log::error!("  1. A microphone is connected and enabled");
        log::error!("  2. Microphone permissions are granted (macOS: System Settings > Privacy & Security > Microphone)");
        log::error!("  3. The audio capture stream started successfully (check logs above)");
        warned_no_data = true;
      }

      match pcm_rx.recv().await {
        Ok(pcm_samples) => {
          chunk_count += 1;

          if chunk_count <= 5 {
            log::info!(
              "Global encoder received PCM chunk {}: {} samples",
              chunk_count,
              pcm_samples.len()
            );
          }

          // Process PCM -> fMP4 fragments
          match encoder.process_pcm(&pcm_samples).await {
            Ok(fragments) => {
              // Broadcast each fragment
              for fragment in fragments {
                if chunk_count <= 5 {
                  log::info!(
                    "Global encoder: fragment {} bytes",
                    fragment.len()
                  );
                }

                // Send fragment to broadcast channel
                // Ignore send errors (no receivers is ok)
                let _ = fmp4_tx.send(fragment);
              }
            }
            Err(e) => {
              log::error!("Global encoder processing error: {}", e);
            }
          }

          if chunk_count % 100 == 0 {
            log::debug!("Global encoder: processed {} PCM chunks", chunk_count);
          }
        }
        Err(broadcast::error::RecvError::Lagged(skipped)) => {
          log::warn!("Global encoder lagged, skipped {} PCM chunks", skipped);
          continue;
        }
        Err(broadcast::error::RecvError::Closed) => {
          log::info!("Global encoder: PCM channel closed, shutting down");
          break;
        }
      }
    }

    encoder.stop();
    log::info!("Global AAC encoder task finished");
  })
}
