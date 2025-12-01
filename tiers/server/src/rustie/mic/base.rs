use cpal::{
  traits::{DeviceTrait, HostTrait},
  BufferSize, StreamConfig,
};
use std::sync::Arc;
use std::sync::Mutex as SyncMutex;
use std::sync::OnceLock;
use std::time::{SystemTime, UNIX_EPOCH};
use tokio::sync::broadcast;

// **Intelligent Audio Processing Toggle Flags**
//
// WARNING: These features use a simple O(n²) FFT implementation that causes severe performance issues.
// They are DISABLED by default to prevent USB microphone stream errors (POLLERR from ALSA).
//
// To enable any feature, change its value to `true` (enable ONE at a time for testing):
// - ENABLE_VAD: Voice Activity Detection - distinguishes speech from background noise (lightweight)
// - ENABLE_SPECTRAL_NOISE_SUB: Learns noise profile and subtracts it from speech (HEAVY - causes USB errors)
// - ENABLE_HARMONIC_ENHANCEMENT: Boosts harmonic frequencies to improve speech clarity (HEAVY - causes USB errors)
//
// NOTE: For production use, these would need to be replaced with optimized FFT libraries like rustfft.
//
const ENABLE_VAD: bool = false; // Voice Activity Detection - DISABLED due to performance issues
const ENABLE_SPECTRAL_NOISE_SUB: bool = false; // Spectral Noise Subtraction - DISABLED due to performance issues
const ENABLE_HARMONIC_ENHANCEMENT: bool = false; // Harmonic Enhancement for Speech - DISABLED due to performance issues

// **WAV Configuration Constants**
pub static SAMPLE_RATE: OnceLock<u32> = OnceLock::new();
pub static CHANNEL_COUNT: OnceLock<u16> = OnceLock::new();

pub const ENABLE_AUDIO_CAPTURE: bool = true; // Set to false to disable audio capture completely
pub const ENABLE_AUDIO_RECORDING: bool = true; // ENABLED for Phase 2 testing with memory-only storage
pub const USE_MEMORY_ONLY_STORAGE: bool = false; // ENABLED to test memory-only storage (no disk I/O)

pub fn capture(
  tx: broadcast::Sender<Vec<f32>>,
) -> Result<cpal::Stream, String> {
  log::info!("Starting microphone capture initialization...");

  // **Log which intelligent audio features are enabled**
  log::info!("Intelligent Audio Features - VAD: {}, Spectral Noise Subtraction: {}, Harmonic Enhancement: {}",
               ENABLE_VAD, ENABLE_SPECTRAL_NOISE_SUB, ENABLE_HARMONIC_ENHANCEMENT);

  // First check if any audio devices are available at all
  let host = cpal::default_host();

  // Check if we have any input devices before proceeding
  match host.input_devices() {
    Ok(mut devices) => {
      if devices.next().is_none() {
        log::warn!("No audio input devices found on system");
        return Err("No audio input devices available".to_string());
      }
    }
    Err(e) => {
      log::error!("Failed to enumerate audio devices: {}", e);
      return Err(format!("Failed to enumerate audio devices: {}", e));
    }
  }

  log::info!("Audio devices found, proceeding with microphone setup...");

  // List all available audio devices for debugging
  log::info!("Listing available audio devices...");
  if let Ok(input_devices) = host.input_devices() {
    for (i, device) in input_devices.enumerate() {
      let name = device.name().unwrap_or("Unknown".to_string());
      log::info!("Input device {}: {}", i, name);

      // Try to get supported configs for each device
      if let Ok(configs) = device.supported_input_configs() {
        for config in configs {
          log::debug!("  - Supported config: {:?}", config);
        }
      } else {
        log::warn!("  - Failed to get supported configs for {}", name);
      }
    }
  } else {
    log::error!("Failed to enumerate input devices");
  }

  // Check if there's an input device available
  let input_device = {
    // Try default device first (works best for most systems including Raspberry Pi)
    if let Some(default_device) = host.default_input_device() {
      let device_name = default_device.name().unwrap_or("Unknown".to_string());
      log::info!("Using default input device: {}", device_name);
      default_device
    } else if let Ok(devices) = host.input_devices() {
      // If no default device, try to find any available device
      // On macOS/development machines, prefer AirPods > built-in > any other device
      let mut airpods_device = None;
      let mut builtin_device = None;
      let mut any_device = None;

      for device in devices {
        if let Ok(name) = device.name() {
          log::info!("Found audio device: {}", name);

          // Store the first device as fallback
          if any_device.is_none() {
            any_device = Some(device.clone());
          }

          // macOS/development priorities
          if name.contains("AirPods") {
            log::info!("Prioritizing AirPods device: {}", name);
            airpods_device = Some(device);
            break; // Use AirPods immediately if found
          } else if name.contains("MacBook") && name.contains("Microphone") {
            log::info!("Found built-in microphone: {}", name);
            builtin_device = Some(device);
          }
        }
      }

      // Priority order: AirPods > built-in > any available device
      let selected_device = airpods_device.or(builtin_device).or(any_device);

      if let Some(device) = selected_device {
        let device_name = device.name().unwrap_or("Unknown".to_string());
        log::info!("Selected input device: {}", device_name);
        device
      } else {
        log::error!("No input devices available");
        return Err("No input device available".to_string());
      }
    } else {
      log::error!("Failed to enumerate input devices");
      return Err("Failed to enumerate input devices".to_string());
    }
  };

  // First try to find a working device and config
  let (working_device, working_config, sample_format) = {
    // Try default device first
    match input_device.default_input_config() {
      Ok(config) => {
        log::info!(
          "Default input config: channels={}, sample_rate={}, format={:?}",
          config.channels(),
          config.sample_rate().0,
          config.sample_format()
        );
        let format = config.sample_format();
        (input_device, config.into(), format)
      }
      Err(e) => {
        log::error!("Failed to get default input config: {:?}", e);
        log::info!(
          "Trying to get any supported input config from default device..."
        );

        // Try to get any supported config from current device
        if let Ok(mut configs) = input_device.supported_input_configs() {
          if let Some(config) = configs.next() {
            log::info!(
              "Using first supported config from default device: {:?}",
              config
            );
            let format = config.sample_format();
            (input_device, config.with_max_sample_rate().into(), format)
          } else {
            log::error!("No supported input configs found on default device");

            // Try to find a working USB microphone device
            log::info!("Searching for working USB microphone device...");

            let mut found_device_config: Option<(
              cpal::Device,
              cpal::StreamConfig,
              cpal::SampleFormat,
            )> = None;

            if let Ok(devices) = host.input_devices() {
              for device in devices {
                if let Ok(name) = device.name() {
                  // Look for USB microphone patterns - try dsnoop and plughw first
                  if name.contains("dsnoop:CARD=Device")
                    || name.contains("plughw:CARD=Device")
                    || name.contains("front:CARD=Device")
                  {
                    log::info!("Trying USB device: {}", name);

                    if let Ok(device_configs) = device.supported_input_configs()
                    {
                      for usb_config in device_configs {
                        if usb_config.channels() <= 2
                          && usb_config.sample_format()
                            == cpal::SampleFormat::I16
                        {
                          log::info!("Found working USB microphone: {} with config: {:?}", name, usb_config);
                          let format = usb_config.sample_format();
                          let final_config = usb_config
                            .with_sample_rate(cpal::SampleRate(44100));
                          log::info!(
                            "Using USB microphone config: {:?}",
                            final_config
                          );
                          found_device_config =
                            Some((device, final_config.into(), format));
                          break;
                        }
                      }
                      if found_device_config.is_some() {
                        break;
                      }
                    }
                  }
                }
              }
            }

            if let Some((device, config, format)) = found_device_config {
              (device, config, format)
            } else {
              return Err("No working microphone device found".to_string());
            }
          }
        } else {
          log::error!(
            "Failed to get supported input configs from default device"
          );

          // Default device completely failed, try to find a working USB microphone device
          log::info!("Searching for working USB microphone device...");

          let mut found_device_config: Option<(
            cpal::Device,
            cpal::StreamConfig,
            cpal::SampleFormat,
          )> = None;

          if let Ok(devices) = host.input_devices() {
            for device in devices {
              if let Ok(name) = device.name() {
                log::info!("Checking device: {}", name);

                // Look for USB microphone patterns - prioritize known working formats
                if name.contains("front:CARD=Device")
                  || name.contains("dsnoop:CARD=Device")
                {
                  log::info!("Found USB microphone device: {}", name);

                  if let Ok(device_configs) = device.supported_input_configs() {
                    for usb_config in device_configs {
                      log::info!("  USB config: channels={}, format={:?}, sample_rate_range={}..{}",
                                                      usb_config.channels(), usb_config.sample_format(),
                                                      usb_config.min_sample_rate().0, usb_config.max_sample_rate().0);

                      // Prioritize I16 format at standard sample rates for USB mics
                      if usb_config.channels() <= 2
                        && usb_config.sample_format() == cpal::SampleFormat::I16
                        && (usb_config.min_sample_rate().0 <= 44100
                          && usb_config.max_sample_rate().0 >= 44100)
                      {
                        log::info!("Found compatible USB microphone: {} with config: {:?}", name, usb_config);
                        let format = usb_config.sample_format();
                        // Try to find the best supported sample rate
                        let target_rate = if usb_config.min_sample_rate().0
                          <= 44100
                          && usb_config.max_sample_rate().0 >= 44100
                        {
                          44100 // Prefer 44.1kHz if supported
                        } else if usb_config.max_sample_rate().0 >= 48000 {
                          48000 // Next choice is 48kHz
                        } else {
                          usb_config.max_sample_rate().0
                          // Use the highest supported rate
                        };

                        let final_config = usb_config
                          .with_sample_rate(cpal::SampleRate(target_rate));
                        log::info!(
                                                    "Using USB microphone config: {:?} with sample rate: {}",
                                                    final_config, target_rate
                                                );
                        found_device_config =
                          Some((device, final_config.into(), format));
                        break;
                      }
                    }
                    if found_device_config.is_some() {
                      break;
                    }
                  }
                }
                // Also check for other potential USB audio devices - try non-hw devices first
                else if name.contains("plughw:")
                  || name.contains("dsnoop:")
                  || name.contains("front:")
                  || name.contains("USB")
                  || name.contains("hw:")
                {
                  // Skip hw: devices initially as they often fail in containers
                  if name.contains("hw:") && !name.contains("plughw:") {
                    log::info!("Skipping hw: device {} for now (will try later if needed)", name);
                    continue;
                  }

                  log::info!("Trying potential USB audio device: {}", name);

                  if let Ok(device_configs) = device.supported_input_configs() {
                    for config in device_configs {
                      log::info!("  Fallback config: channels={}, format={:?}, sample_rate_range={}..{}",
                                                      config.channels(), config.sample_format(),
                                                      config.min_sample_rate().0, config.max_sample_rate().0);

                      if config.channels() <= 2
                        && config.sample_format() == cpal::SampleFormat::I16
                        && config.min_sample_rate().0 <= 44100
                        && config.max_sample_rate().0 >= 44100
                      {
                        log::info!("Found fallback USB audio device: {} with config: {:?}", name, config);
                        let format = config.sample_format();

                        // Try to find the best supported sample rate for fallback devices
                        let target_rate = if config.min_sample_rate().0 <= 44100
                          && config.max_sample_rate().0 >= 44100
                        {
                          44100 // Prefer 44.1kHz if supported
                        } else if config.max_sample_rate().0 >= 48000 {
                          48000 // Next choice is 48kHz
                        } else {
                          config.max_sample_rate().0 // Use the highest supported rate
                        };

                        let final_config = config
                          .with_sample_rate(cpal::SampleRate(target_rate));
                        log::info!(
                          "Using fallback sample rate: {}",
                          target_rate
                        );
                        found_device_config =
                          Some((device, final_config.into(), format));
                        break;
                      }
                    }
                  }
                }
              }
            }
          }
          if let Some((device, config, format)) = found_device_config {
            (device, config, format)
          } else {
            return Err("No working microphone device found".to_string());
          }
        }
      }
    }
  };

  let sample_rate = working_config.sample_rate.0;

  // capture sample rate and channel count - only set if not already set
  if SAMPLE_RATE.get().is_none() {
    SAMPLE_RATE
      .set(sample_rate)
      .expect("failed to set global sample rate");
    log::info!("Set global sample rate to: {} Hz", sample_rate);
  } else {
    log::debug!(
      "Global sample rate already set to: {} Hz",
      SAMPLE_RATE.get().unwrap()
    );
  }

  if CHANNEL_COUNT.get().is_none() {
    CHANNEL_COUNT
      .set(working_config.channels)
      .expect("failed to set global channel count");
    log::info!(
      "Set global channel count to: {} channels",
      working_config.channels
    );
  } else {
    log::debug!(
      "Global channel count already set to: {} channels",
      CHANNEL_COUNT.get().unwrap()
    );
  }

  // Log the final device and format we're going to use
  log::info!(
    "Final device: {}",
    working_device.name().unwrap_or("Unknown".to_string())
  );
  log::info!(
    "Final config - Sample rate: {}, Channels: {}, Format: {:?}",
    working_config.sample_rate.0,
    working_config.channels,
    sample_format
  );

  // Check for potential channel mismatch issues
  if working_config.channels > 1 {
    log::warn!("USB microphone has {} channels, but WAV header is set to mono. This may cause audio issues!", working_config.channels);
  }

  // **Smaller buffer sizes for better real-time performance**
  // Use only larger buffer sizes for more stability on Pi/USB mics
  let buffer_sizes_to_try = vec![
    BufferSize::Fixed(1024), // Stable, moderate latency
    BufferSize::Fixed(2048), // More stable, higher latency
    BufferSize::Fixed(4096), // Maximum stability
    BufferSize::Default,     // Let ALSA choose
  ];

  for buffer_size in buffer_sizes_to_try {
    let config = StreamConfig {
      channels: working_config.channels, // Use detected channels from USB microphone
      sample_rate: cpal::SampleRate(sample_rate),
      buffer_size,
    };

    log::info!(
      "Trying sample rate: {} Hz, Channels: {}, Buffer Size: {:?}",
      sample_rate,
      config.channels,
      buffer_size
    );

    // **Log capture start time**
    let capture_start = SystemTime::now();
    log::info!(
      "Capture started at {:?}",
      capture_start
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs_f32()
    );

    // **Shared buffer for thread safety - create new buffer for each attempt**
    let buffer = Arc::new(SyncMutex::new(Vec::<f32>::new()));

    // Add a longer delay to let USB device stabilize before creating stream
    std::thread::sleep(std::time::Duration::from_millis(500)); // Increased from 100ms

    // Build stream based on the sample format that the device actually supports
    log::info!("Attempting to build stream with format: {:?}, sample_rate: {}, channels: {}, buffer_size: {:?}",
                   sample_format, sample_rate, working_config.channels, buffer_size);

    let stream_result = match sample_format {
      cpal::SampleFormat::I16 => {
        log::info!("Building I16 input stream for USB microphone");
        working_device.build_input_stream(
                    &config,
                    {
                        let tx = tx.clone();
                        let buffer = buffer.clone();
                        let channels = working_config.channels; // Capture for use in closure
                        move |data: &[i16], _: &cpal::InputCallbackInfo| {
                            // FIRST LOG: Check if callback is ever called at all
                            static mut CALLBACK_CALL_COUNT: u32 = 0;
                            unsafe {
                                CALLBACK_CALL_COUNT += 1;
                                // Log first 50 callbacks, then every 10 to debug silence issues
                                if CALLBACK_CALL_COUNT <= 50 || CALLBACK_CALL_COUNT % 10 == 0 {
                                    log::info!("I16 audio callback called #{}: received {} raw samples",
                                              CALLBACK_CALL_COUNT, data.len());
                                }
                            }

                            // Convert I16 to F32 data for processing - use standard audio conversion
                            let mut f32_data: Vec<f32> = data.iter()
                                .map(|&sample| {
                                    if sample == i16::MIN {
                                        -1.0  // Handle the special case of i16::MIN
                                    } else {
                                        sample as f32 / 32767.0  // Standard I16 to F32 conversion
                                    }
                                })
                                .collect();

                            // Handle stereo to mono conversion if needed
                            if channels == 2 && f32_data.len() % 2 == 0 {
                                // Convert stereo to mono by averaging left and right channels
                                f32_data = f32_data.chunks_exact(2)
                                    .map(|stereo_pair| (stereo_pair[0] + stereo_pair[1]) / 2.0)
                                    .collect();
                            }

                            // Debug logging for first few chunks to check data quality
                            static mut DEBUG_COUNTER: u32 = 0;
                            static mut LAST_CALLBACK_TIME: Option<std::time::Instant> = None;

                            unsafe {
                                let now = std::time::Instant::now();

                                // Check for callback silence (no callbacks for >2 seconds)
                                if let Some(last_time) = LAST_CALLBACK_TIME {
                                    let silence_duration = now.duration_since(last_time);
                                    if silence_duration.as_secs() > 2 {
                                        log::error!("USB microphone callbacks stopped for {:.1}s! Hardware may be frozen.",
                                                   silence_duration.as_secs_f32());
                                    }
                                }
                                LAST_CALLBACK_TIME = Some(now);

                                DEBUG_COUNTER += 1;
                                if DEBUG_COUNTER <= 20 {
                                    // Log raw I16 samples first
                                    let i16_stats = if !data.is_empty() {
                                        let min_val = data.iter().fold(i16::MAX, |a, &b| a.min(b));
                                        let max_val = data.iter().fold(i16::MIN, |a, &b| a.max(b));
                                        let avg_val = data.iter().map(|&x| x as i64).sum::<i64>() / data.len() as i64;
                                        format!("I16 raw: min={}, max={}, avg={}", min_val, max_val, avg_val)
                                    } else {
                                        "I16 raw: empty".to_string()
                                    };

                                    let f32_stats = if !f32_data.is_empty() {
                                        let min_val = f32_data.iter().fold(f32::INFINITY, |a, &b| a.min(b));
                                        let max_val = f32_data.iter().fold(f32::NEG_INFINITY, |a, &b| a.max(b));
                                        let avg_val = f32_data.iter().sum::<f32>() / f32_data.len() as f32;
                                        format!("F32 converted: min={:.6}, max={:.6}, avg={:.6}", min_val, max_val, avg_val)
                                    } else {
                                        "F32 converted: empty".to_string()
                                    };

                                    log::info!("I16 callback #{}: {} samples | {} | {}",
                                              DEBUG_COUNTER, f32_data.len(), i16_stats, f32_stats);

                                    // Test conversion with known values
                                    if DEBUG_COUNTER == 1 {
                                        let test_i16 = [0i16, i16::MAX, i16::MIN, 16384, -16384];
                                        let test_f32: Vec<f32> = test_i16.iter()
                                            .map(|&sample| {
                                                if sample == i16::MIN {
                                                    -1.0
                                                } else {
                                                    sample as f32 / 32767.0
                                                }
                                            })
                                            .collect();
                                        log::info!("Conversion test: {:?} -> {:?}", test_i16, test_f32);
                                    }
                                }
                            }

                            let mut buf = buffer.lock().unwrap();
                            buf.extend_from_slice(&f32_data);

                            // AAC encoder requires exactly 1024 samples per frame
                            const AAC_FRAME_SIZE: usize = 1024;

                            if buf.len() >= AAC_FRAME_SIZE {
                                let chunk = buf.drain(..AAC_FRAME_SIZE).collect::<Vec<f32>>();

                                static mut PCM_SEND_COUNT: u32 = 0;
                                unsafe {
                                    PCM_SEND_COUNT += 1;
                                    if PCM_SEND_COUNT <= 10 {
                                        log::info!("I16 callback: sending PCM chunk #{} to broadcast ({} samples)",
                                                  PCM_SEND_COUNT, chunk.len());
                                    }
                                }

                                match tx.send(chunk) {
                                    Ok(receiver_count) => {
                                        unsafe {
                                            if PCM_SEND_COUNT <= 10 {
                                                log::info!("I16 callback: PCM chunk #{} sent successfully to {} receivers",
                                                          PCM_SEND_COUNT, receiver_count);
                                            }
                                        }
                                    }
                                    Err(_) => {
                                        static mut ERROR_COUNT: u32 = 0;
                                        unsafe {
                                            ERROR_COUNT += 1;
                                            if ERROR_COUNT % 100 == 1 {
                                                log::error!("Audio broadcast channel full - {} errors", ERROR_COUNT);
                                            }
                                        }
                                    }
                                }
                            } else {
                                static mut BUFFER_LOG_COUNT: u32 = 0;
                                unsafe {
                                    BUFFER_LOG_COUNT += 1;
                                    if BUFFER_LOG_COUNT <= 5 {
                                        log::info!("I16 callback: buffering {} samples (need {}, have {})",
                                                  f32_data.len(), AAC_FRAME_SIZE, buf.len());
                                    }
                                }
                            }
                        }
                    },
                    |err| {
                        static ERROR_COUNT: std::sync::atomic::AtomicU32 =
                            std::sync::atomic::AtomicU32::new(0);
                        static mut LAST_ERROR_TIME: Option<std::time::Instant> = None;

                        let count = ERROR_COUNT.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
                        let now = std::time::Instant::now();

                        unsafe {
                            let should_log = match LAST_ERROR_TIME {
                                None => {
                                    LAST_ERROR_TIME = Some(now);
                                    true
                                }
                                Some(last_time) => {
                                    if now.duration_since(last_time).as_secs() >= 10 {
                                        LAST_ERROR_TIME = Some(now);
                                        true
                                    } else {
                                        false
                                    }
                                }
                            };

                            if should_log || count == 1 {
                                if count > 1 {
                                    log::error!("Audio stream error (count: {}): {}", count, err);
                                } else {
                                    log::error!("Audio stream error: {}", err);
                                }

                                if count > 100 {
                                    log::error!(
                                        "USB microphone errors detected ({}), this may be normal for some USB devices", count
                                    );
                                    if count > 1000 {
                                        log::error!("Microphone disabled due to excessive errors - USB device may need reconnection");
                                        return;
                                    }
                                }
                            }
                        }
                    },
                    None,
                )
      }
      cpal::SampleFormat::F32 => {
        log::info!("Building F32 input stream for high-end audio device");
        working_device.build_input_stream(
                    &config,
                    {
                        let tx = tx.clone();
                        let buffer = buffer.clone();
                        let channels = working_config.channels; // Capture for use in closure
                        move |data: &[f32], _: &cpal::InputCallbackInfo| {
                            // CRITICAL: Log every F32 callback to debug AirPods silence
                            static mut F32_CALLBACK_COUNT: u32 = 0;
                            unsafe {
                                F32_CALLBACK_COUNT += 1;
                                if F32_CALLBACK_COUNT <= 20 || F32_CALLBACK_COUNT % 50 == 0 {
                                    log::info!("F32 audio callback #{}: received {} samples", F32_CALLBACK_COUNT, data.len());
                                }
                            }

                            // Direct F32 data - no conversion needed
                            let mut f32_data = data.to_vec();

                            // Handle stereo to mono conversion if needed
                            if channels == 2 && f32_data.len() % 2 == 0 {
                                // Convert stereo to mono by averaging left and right channels
                                f32_data = f32_data.chunks_exact(2)
                                    .map(|stereo_pair| (stereo_pair[0] + stereo_pair[1]) / 2.0)
                                    .collect();
                            }

                            // Debug logging for first few chunks to check data quality
                            static mut DEBUG_COUNTER: u32 = 0;
                            unsafe {
                                DEBUG_COUNTER += 1;
                                // Log first 20 callbacks then every 50th like I16
                                if DEBUG_COUNTER <= 20 || DEBUG_COUNTER % 50 == 0 {
                                    let sample_stats = if !f32_data.is_empty() {
                                        let min_val = f32_data.iter().fold(f32::INFINITY, |a, &b| a.min(b));
                                        let max_val = f32_data.iter().fold(f32::NEG_INFINITY, |a, &b| a.max(b));
                                        let avg_val = f32_data.iter().sum::<f32>() / f32_data.len() as f32;
                                        let non_zero_count = f32_data.iter().filter(|&&x| x.abs() > 0.0001).count();
                                        format!("min={:.6}, max={:.6}, avg={:.6}, non_zero={}/{}",
                                               min_val, max_val, avg_val, non_zero_count, f32_data.len())
                                    } else {
                                        "empty".to_string()
                                    };
                                    log::info!("F32 callback #{}: {} samples, stats: {}", DEBUG_COUNTER, f32_data.len(), sample_stats);

                                    // Check for silence like in I16
                                    if f32_data.iter().all(|&x| x.abs() < 0.0001) {
                                        log::warn!("F32 callback #{}: ALL SAMPLES ARE ZERO - CHECK MICROPHONE PERMISSIONS!", DEBUG_COUNTER);
                                    }
                                }
                            }

                            let mut buf = buffer.lock().unwrap();
                            buf.extend_from_slice(&f32_data);

                            // AAC encoder requires exactly 1024 samples per frame
                            const AAC_FRAME_SIZE: usize = 1024;

                            if buf.len() >= AAC_FRAME_SIZE {
                                let chunk = buf.drain(..AAC_FRAME_SIZE).collect::<Vec<f32>>();
                                if let Err(_) = tx.send(chunk) {
                                    static mut ERROR_COUNT: u32 = 0;
                                    unsafe {
                                        ERROR_COUNT += 1;
                                        if ERROR_COUNT % 100 == 1 {
                                            log::error!("Audio broadcast channel full - {} errors", ERROR_COUNT);
                                        }
                                    }
                                }
                            }
                        }
                    },
                    |err| {
                        static ERROR_COUNT: std::sync::atomic::AtomicU32 =
                            std::sync::atomic::AtomicU32::new(0);
                        static mut LAST_ERROR_TIME: Option<std::time::Instant> = None;

                        let count = ERROR_COUNT.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
                        let now = std::time::Instant::now();

                        unsafe {
                            let should_log = match LAST_ERROR_TIME {
                                None => {
                                    LAST_ERROR_TIME = Some(now);
                                    true
                                }
                                Some(last_time) => {
                                    if now.duration_since(last_time).as_secs() >= 10 {
                                        LAST_ERROR_TIME = Some(now);
                                        true
                                    } else {
                                        false
                                    }
                                }
                            };

                            if should_log || count == 1 {
                                if count > 1 {
                                    log::error!("Audio stream error (count: {}): {}", count, err);
                                } else {
                                    log::error!("Audio stream error: {}", err);
                                }

                                if count > 100 {
                                    log::error!(
                                        "USB microphone errors detected ({}), this may be normal for some USB devices", count
                                    );
                                    if count > 1000 {
                                        log::error!("Microphone disabled due to excessive errors - USB device may need reconnection");
                                        return;
                                    }
                                }
                            }
                        }
                    },
                    None,
                )
      }
      _ => {
        log::warn!(
          "Unsupported sample format: {:?}, skipping buffer size: {:?}",
          sample_format,
          buffer_size
        );
        continue;
      }
    };

    match stream_result {
      Ok(stream) => {
        log::info!(
          "Successfully created input stream with buffer size: {:?}",
          buffer_size
        );
        return Ok(stream);
      }
      Err(e) => {
        log::warn!(
          "Failed to build input stream with buffer size {:?}: {}",
          buffer_size,
          e
        );
        continue;
      }
    }
  }

  Err("Failed to create input stream with any buffer size".to_string())
}
