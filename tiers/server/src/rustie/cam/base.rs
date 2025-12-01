use super::super::img::jpeg;
use super::super::time_series;
use super::super::time_series::base::Store;
use super::ai;
use gstreamer::parse;
use gstreamer::prelude::*; // Bring necessary traits into scope
use gstreamer_app::AppSink;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::{broadcast, RwLock};
use tokio::task::spawn_blocking;
const ENABLE_VIDEO_CAPTURE: bool = false; // Set to false to disable video capture completely
const ENABLE_VIDEO_RECORDING: bool = false; // Set to false to disable video recording to disk
const USE_MEMORY_ONLY_STORAGE: bool = false; // ENABLED to test memory-only storage (no disk I/O)

pub fn init(
  timeseries_time_limit_ms: u64,
  timeseries_path: PathBuf,
) -> (
  broadcast::Receiver<Vec<u8>>,
  Arc<RwLock<Box<dyn Store<Vec<u8>> + Send + Sync>>>,
) {
  println!("PRINT: About to log feature flags");
  log::info!(
        "Feature Flags - Video Capture: {}, Video Recording: {}, Memory-Only Storage: {}",
        ENABLE_VIDEO_CAPTURE,
        ENABLE_VIDEO_RECORDING,
        USE_MEMORY_ONLY_STORAGE
    );
  println!("PRINT: Finished logging feature flags");

  let (cam_tx, cam_rx) = broadcast::channel::<Vec<u8>>(50);
  let cam_store: Arc<RwLock<Box<dyn Store<Vec<u8>> + Send + Sync>>> =
    if ENABLE_VIDEO_CAPTURE {
      let _cam_rx_timeseries = cam_tx.subscribe();
      std::env::set_var("GST_GL_API", "opengl");
      std::env::set_var("GST_DEBUG", "3");
      spawn_blocking(|| capture(cam_tx));
      if ENABLE_VIDEO_RECORDING {
        let store: Box<dyn Store<Vec<u8>> + Send + Sync> =
          Box::new(time_series::disk::Store::<Vec<u8>>::new(
            &timeseries_path.join("cam"),
            10_000_000_000,
            Some(timeseries_time_limit_ms),
            0.8,
            0.8,
          ));
        Arc::new(RwLock::new(store))
      } else {
        let store: Box<dyn Store<Vec<u8>> + Send + Sync> =
          Box::new(time_series::disk::Store::<Vec<u8>>::new(
            &timeseries_path.join("cam_disabled"),
            0,
            None,
            0.0,
            0.0,
          ));
        Arc::new(RwLock::new(store))
      }
    } else {
      let store: Box<dyn Store<Vec<u8>> + Send + Sync> =
        Box::new(time_series::disk::Store::<Vec<u8>>::new(
          &timeseries_path.join("cam_disabled"),
          0,
          None,
          0.0,
          0.0,
        ));
      Arc::new(RwLock::new(store))
    };

  (cam_rx, cam_store)
}

pub fn capture(tx: broadcast::Sender<Vec<u8>>) {
  log::info!("Starting camera capture...");

  // Main retry loop for handling hardware disconnections
  loop {
    log::info!("Initializing camera capture session...");

    // Call the actual capture implementation
    if let Err(e) = capture_impl(tx.clone()) {
      log::error!("Camera capture session failed: {:?}", e);
      log::info!("Restarting camera capture in 5 seconds...");
      std::thread::sleep(std::time::Duration::from_secs(5));
      continue;
    }

    // If capture_impl returns normally (not an error), restart after a delay
    log::warn!(
      "Camera capture session ended unexpectedly, restarting in 5 seconds..."
    );
    std::thread::sleep(std::time::Duration::from_secs(5));
  }
}

fn capture_impl(
  tx: broadcast::Sender<Vec<u8>>,
) -> Result<(), Box<dyn std::error::Error>> {
  log::info!("Starting camera capture implementation...");
  gstreamer::init().unwrap();
  log::info!("GStreamer initialized successfully");

  // Check for available video devices (USB cameras)
  log::info!("Checking for available video devices...");
  let mut available_cameras = Vec::new();
  for i in 0..20 {
    // Check more devices
    let device_path = format!("/dev/video{}", i);
    if std::path::Path::new(&device_path).exists() {
      log::info!("Found video device: {}", device_path);

      // Try to determine if this is a camera (not just a codec device)
      // Typically, camera devices have lower numbers (0-10) and codec devices higher (10+)
      if i < 10 {
        available_cameras.push(i);
        log::info!("Potential camera device: /dev/video{}", i);
      } else {
        log::info!("Likely codec/decoder device: /dev/video{}", i);
      }
    }
  }

  if available_cameras.is_empty() {
    log::warn!("No camera devices found, only codec devices available");
  } else {
    log::info!(
      "Found {} potential camera devices: {:?}",
      available_cameras.len(),
      available_cameras
    );

    // Try to probe camera capabilities
    for &device_num in &available_cameras {
      let device_path = format!("/dev/video{}", device_num);
      log::info!("Probing capabilities for {}", device_path);

      // Try to create a simple v4l2src to see what caps it supports
      if let Ok(probe_pipeline) = gstreamer::parse::launch(&format!(
        "v4l2src device={} ! fakesink",
        device_path
      )) {
        if let Ok(pipeline_bin) =
          probe_pipeline.dynamic_cast::<gstreamer::Pipeline>()
        {
          if let Some(v4l2src) = pipeline_bin.by_name("v4l2src0") {
            if let Some(src_pad) = v4l2src.static_pad("src") {
              let caps = src_pad.query_caps(None);
              log::info!("Camera {} supports caps: {}", device_path, caps);
            }
          }
        }
      }
    }
  }

  // // println!("Successfully loaded ONNX Runtime dynamically!");
  // ort::init_from("/Users/jkassis/Code/katseye/server/lib/libonnxruntime.dylib")
  //     .commit()
  //     .unwrap();

  // Load YOLO model
  let model_path = std::env::var("YOLO_MODEL_PATH")
    .unwrap_or_else(|_| "yolov8m-obb-quant.onnx".to_string());
  log::info!("Loading YOLO model from path: {}", model_path);
  let mut session = ai::load_yolo_model(&model_path);
  log::info!("YOLO model loaded successfully");

  // let pipeline = parse::launch("autovideosrc ! videoconvert ! jpegenc ! appsink name=appsink max-buffers=1 drop=true")
  //     .expect("Failed to create pipeline");

  // let pipeline =
  //     parse::launch("autovideosrc ! videoconvert ! appsink name=appsink max-buffers=1 drop=true")
  //         .expect("Failed to create pipeline");

  // WAS Working
  // let pipeline = parse::launch(
  //     "autovideosrc ! queue ! video/x-raw,framerate=15/1 ! videoconvert ! video/x-raw,width=640,height=480,format=RGB ! queue ! appsink name=appsink max-buffers=1 drop=true",
  // )

  // Try multiple pipeline configurations for USB camera
  log::info!("Creating GStreamer pipeline for USB camera...");

  // Create pipeline configurations for each available camera device
  let mut pipeline_configs = Vec::new();

  // Try available camera devices first
  for device_num in &available_cameras {
    let device_path = format!("/dev/video{}", device_num);
    pipeline_configs.extend(vec![
            // Start with YUY2 format (most common for USB cameras) - based on your working pipeline
            (format!("v4l2src device={} ! video/x-raw,format=YUY2,width=640,height=480,framerate=15/1 ! videoconvert ! video/x-raw,format=RGB ! appsink name=appsink max-buffers=3 drop=false", device_path), format!("v4l2src {} YUY2 640x480@15fps (known working)", device_path)),
            (format!("v4l2src device={} ! video/x-raw,format=YUY2,width=640,height=480 ! videoconvert ! video/x-raw,format=RGB ! appsink name=appsink max-buffers=3 drop=false", device_path), format!("v4l2src {} YUY2 640x480 (no framerate)", device_path)),
            (format!("v4l2src device={} ! video/x-raw,format=YUY2 ! videoconvert ! video/x-raw,format=RGB ! appsink name=appsink max-buffers=3 drop=false", device_path), format!("v4l2src {} YUY2 auto resolution", device_path)),
            // Try MJPEG second (also common for USB cameras)
            (format!("v4l2src device={} ! image/jpeg,width=640,height=480 ! jpegdec ! videoconvert ! video/x-raw,format=RGB ! appsink name=appsink max-buffers=3 drop=false", device_path), format!("v4l2src {} MJPEG 640x480", device_path)),
            (format!("v4l2src device={} ! image/jpeg ! jpegdec ! videoconvert ! video/x-raw,format=RGB ! appsink name=appsink max-buffers=3 drop=false", device_path), format!("v4l2src {} MJPEG auto", device_path)),
            // Then try more flexible caps
            (format!("v4l2src device={} ! videoconvert ! video/x-raw,format=RGB ! appsink name=appsink max-buffers=3 drop=false", device_path), format!("v4l2src {} auto caps (flexible)", device_path)),
            // Try with explicit common resolutions
            (format!("v4l2src device={} ! video/x-raw,width=640,height=480 ! videoconvert ! video/x-raw,format=RGB ! appsink name=appsink max-buffers=3 drop=false", device_path), format!("v4l2src {} 640x480", device_path)),
            (format!("v4l2src device={} ! video/x-raw,width=320,height=240 ! videoconvert ! video/x-raw,format=RGB ! appsink name=appsink max-buffers=3 drop=false", device_path), format!("v4l2src {} 320x240", device_path)),
        ]);
  }

  // Fallback to default video0 and autovideosrc if no cameras detected
  if available_cameras.is_empty() {
    pipeline_configs.extend(vec![
            ("v4l2src device=/dev/video0 ! video/x-raw,format=YUY2,width=640,height=480 ! videoconvert ! video/x-raw,format=RGB ! appsink name=appsink max-buffers=2 drop=true".to_string(), "v4l2src /dev/video0 YUY2 640x480".to_string()),
            ("v4l2src device=/dev/video0 ! video/x-raw,format=YUY2 ! videoconvert ! video/x-raw,format=RGB ! appsink name=appsink max-buffers=2 drop=true".to_string(), "v4l2src /dev/video0 YUY2 auto".to_string()),
            ("v4l2src device=/dev/video0 ! image/jpeg ! jpegdec ! videoconvert ! video/x-raw,format=RGB ! appsink name=appsink max-buffers=2 drop=true".to_string(), "MJPEG format /dev/video0".to_string()),
            ("v4l2src device=/dev/video0 ! videoconvert ! video/x-raw,format=RGB ! appsink name=appsink max-buffers=2 drop=true".to_string(), "Simple v4l2src /dev/video0 with auto-negotiation".to_string()),
        ]);
  }

  // Always try autovideosrc as final fallback
  pipeline_configs.push(("autovideosrc ! videoconvert ! video/x-raw,format=RGB ! appsink name=appsink max-buffers=2 drop=true".to_string(), "autovideosrc fallback".to_string()));

  log::info!(
    "Will try {} different pipeline configurations",
    pipeline_configs.len()
  );

  let mut pipeline = None;
  let mut working_pipeline_description = String::new();

  // Try each pipeline configuration until we find one that works
  'pipeline_loop: for (pipeline_str, description) in pipeline_configs {
    log::info!("Trying pipeline: {} - {}", description, pipeline_str);

    let test_pipeline = match parse::launch(&pipeline_str) {
      Ok(p) => {
        log::info!("Successfully created pipeline: {}", description);
        p
      }
      Err(e) => {
        log::warn!("Failed to create pipeline '{}': {:?}", description, e);
        continue 'pipeline_loop;
      }
    };

    // Test if this pipeline can start and reach PLAYING state
    log::info!("Testing pipeline startup for: {}", description);

    // Get the bus for monitoring
    let test_bus = test_pipeline.bus().unwrap();

    // Try to start the pipeline
    match test_pipeline.set_state(gstreamer::State::Playing) {
      Ok(_) => {
        log::info!("Test pipeline started successfully: {}", description);

        // Wait a bit and check for errors
        std::thread::sleep(std::time::Duration::from_millis(500));

        let mut startup_failed = false;
        let mut message_count = 0;

        // Check for startup errors
        while let Some(msg) = test_bus.pop_filtered(&[
          gstreamer::MessageType::Error,
          gstreamer::MessageType::Warning,
        ]) {
          message_count += 1;
          if message_count > 10 {
            break;
          }

          if let gstreamer::MessageView::Error(err) = msg.view() {
            let error_message = format!("{}", err.error());
            log::warn!("Test pipeline error: {}", error_message);

            if error_message.contains("not-negotiated")
              || error_message.contains("caps")
              || error_message.contains("negotiation")
            {
              log::warn!(
                "Test pipeline failed caps negotiation: {}",
                description
              );
              startup_failed = true;
              break;
            }
          }
        }

        // Check final state
        let (_, current_state, _) =
          test_pipeline.state(gstreamer::ClockTime::from_seconds(1));
        if current_state != gstreamer::State::Playing {
          log::warn!(
            "Test pipeline failed to reach PLAYING state: {:?}",
            current_state
          );
          startup_failed = true;
        }

        // Cleanup test pipeline
        if let Err(e) = test_pipeline.set_state(gstreamer::State::Null) {
          log::warn!("Failed to cleanup test pipeline: {}", e);
        }
        std::thread::sleep(std::time::Duration::from_millis(100));

        if startup_failed {
          log::warn!(
            "Test pipeline '{}' failed startup validation",
            description
          );
          continue 'pipeline_loop;
        }

        log::info!(
          "Pipeline '{}' passed testing! Using it for capture",
          description
        );
        working_pipeline_description = description.clone();

        // Create the actual pipeline for use
        match parse::launch(&pipeline_str) {
          Ok(p) => {
            pipeline = Some(p);
            break 'pipeline_loop;
          }
          Err(e) => {
            log::error!("Failed to recreate working pipeline: {:?}", e);
            continue 'pipeline_loop;
          }
        }
      }
      Err(e) => {
        log::warn!("Failed to start test pipeline '{}': {:?}", description, e);
        // Cleanup
        let _ = test_pipeline.set_state(gstreamer::State::Null);
        continue 'pipeline_loop;
      }
    }
  }

  let pipeline = match pipeline {
    Some(p) => p,
    None => {
      log::error!(
        "Failed to create any working pipeline - no camera available"
      );
      return Err("No working camera pipeline found".into());
    }
  };

  // Try to get the AppSink from the pipeline
  let appsink = match pipeline
    .dynamic_cast_ref::<gstreamer::Pipeline>()
    .and_then(|p| p.by_name("appsink"))
    .and_then(|element| element.dynamic_cast::<AppSink>().ok())
  {
    Some(sink) => sink,
    None => {
      log::error!("Failed to get AppSink from pipeline - camera not available");
      return Err("AppSink not found in pipeline".into());
    }
  };

  // Let GStreamer negotiate caps automatically for now
  appsink.set_caps(None);
  appsink.set_property("emit-signals", true);

  // Add pipeline message monitoring
  let bus = pipeline.bus().unwrap();

  // Start the pipeline (it should work since we tested it)
  log::info!(
    "Starting verified GStreamer pipeline: {}",
    working_pipeline_description
  );
  match pipeline.set_state(gstreamer::State::Playing) {
    Ok(_) => {
      log::info!(
        "Verified pipeline started successfully: {}",
        working_pipeline_description
      );
    }
    Err(err) => {
      log::error!("Failed to start verified pipeline: {:?}", err);
      return Err(format!("Failed to start pipeline: {:?}", err).into());
    }
  }

  // We'll create the JPEG encoder once we know the actual frame dimensions
  let mut jpeg_encoder: Option<jpeg::JpegEncoder> = None;
  log::info!("Starting main capture loop...");

  let mut frame_count = 0;
  let mut consecutive_failures = 0;
  let max_consecutive_failures = 10;
  let ai_process_every_n_frames = 10; // Increased from 5 to 10 for less AI processing
  let mut last_caps_check = std::time::Instant::now();
  let caps_check_interval = std::time::Duration::from_secs(5); // Check caps every 5 seconds

  // Main loop to fetch frames
  loop {
    // Check for GStreamer messages periodically
    let now = std::time::Instant::now();
    if now.duration_since(last_caps_check) >= caps_check_interval {
      // Check for any accumulated error messages
      while let Some(msg) = bus.pop_filtered(&[
        gstreamer::MessageType::Error,
        gstreamer::MessageType::Warning,
        gstreamer::MessageType::StateChanged,
      ]) {
        match msg.view() {
          gstreamer::MessageView::Error(err) => {
            let error_message = format!("{}", err.error());
            log::error!(
              "GStreamer error in pipeline {}: {}",
              working_pipeline_description,
              error_message
            );

            // Check for caps negotiation errors specifically
            if error_message.contains("not-negotiated")
              || error_message.contains("caps")
              || error_message.contains("negotiation")
              || error_message.contains("streaming stopped")
            {
              log::warn!(
                "Caps negotiation failure detected in pipeline: {}",
                working_pipeline_description
              );
              log::info!("Attempting pipeline recovery...");

              // Try to recover by stopping and restarting the pipeline
              if let Err(e) = pipeline.set_state(gstreamer::State::Null) {
                log::error!("Failed to stop pipeline for recovery: {}", e);
                return Err("Failed to stop pipeline for caps recovery".into());
                // Exit the main loop to restart
              }

              // Wait a moment for cleanup
              std::thread::sleep(std::time::Duration::from_millis(500));

              // Restart the pipeline
              if let Err(e) = pipeline.set_state(gstreamer::State::Playing) {
                log::error!("Failed to restart pipeline after recovery: {}", e);
                return Err(
                  "Failed to restart pipeline after caps recovery".into(),
                );
                // Exit the main loop to restart
              }

              log::info!(
                "Pipeline recovery attempted for: {}",
                working_pipeline_description
              );
              // Reset frame counter after recovery
              frame_count = 0;
              consecutive_failures = 0;
            } else if error_message.contains("No such device")
              || error_message.contains("Connection timed out")
              || error_message.contains("Could not read from resource")
              || error_message.contains("Failed to allocate a buffer")
              || error_message.contains("poll error")
            {
              log::error!(
                "USB hardware error detected in pipeline {}: {}",
                working_pipeline_description,
                error_message
              );
              log::warn!(
                "Camera hardware issue detected - may need device rediscovery"
              );

              // For hardware errors, exit immediately to restart capture function
              log::info!("Exiting capture loop to restart device discovery");
              return Err(
                "Hardware error detected - restarting for device rediscovery"
                  .into(),
              );
            } else {
              // For other errors, log and potentially break
              log::error!(
                "Non-negotiation error in pipeline {}: {}",
                working_pipeline_description,
                error_message
              );
              consecutive_failures += 1;
              if consecutive_failures >= max_consecutive_failures {
                log::error!(
                  "Too many consecutive errors, exiting capture loop"
                );
                return Err("Too many consecutive non-hardware errors".into());
              }
            }
          }
          gstreamer::MessageView::Warning(warn) => {
            log::warn!(
              "GStreamer warning in pipeline {}: {}",
              working_pipeline_description,
              warn.error()
            );
          }
          gstreamer::MessageView::StateChanged(state_changed) => {
            if let Some(source) = msg.src() {
              // Check if this is a pipeline-level state change
              if source.name() == pipeline.name() {
                log::debug!(
                  "Pipeline {} state changed: {:?} -> {:?}",
                  working_pipeline_description,
                  state_changed.old(),
                  state_changed.current()
                );

                // Monitor for unexpected state changes
                if state_changed.current() == gstreamer::State::Null
                  && state_changed.old() == gstreamer::State::Playing
                {
                  log::warn!(
                    "Pipeline {} unexpectedly stopped - attempting restart",
                    working_pipeline_description
                  );
                  // Try to restart
                  if let Err(e) = pipeline.set_state(gstreamer::State::Playing)
                  {
                    log::error!(
                      "Failed to restart pipeline after unexpected stop: {}",
                      e
                    );
                    return Err("Failed to restart pipeline after unexpected state change".into());
                  }
                }
              }
            }
          }
          _ => {}
        }
      }
      last_caps_check = now;
    }
    // Use a shorter timeout and handle failures better
    if let Some(sample) =
      appsink.try_pull_sample(gstreamer::ClockTime::from_seconds(1))
    {
      frame_count += 1;
      consecutive_failures = 0; // Reset failure counter on success

      // Validate sample and caps periodically to catch caps issues early
      if frame_count % 100 == 1 {
        if let Some(caps) = sample.caps() {
          log::debug!("Frame #{} caps validation: {}", frame_count, caps);

          // Check if caps are properly negotiated
          if caps.is_empty() {
            log::warn!(
              "Empty caps detected at frame #{} - potential negotiation issue",
              frame_count
            );
          }
        } else {
          log::warn!(
            "No caps available for frame #{} - potential issue",
            frame_count
          );
        }
      }

      if frame_count % 10 == 1 {
        // Log every 10th frame to see if we're getting frames
        log::info!(
          "Received frame #{} (size: {} bytes)",
          frame_count,
          sample.buffer().map(|b| b.size()).unwrap_or(0)
        );

        // Log caps for the first few frames to understand format
        if frame_count <= 3 {
          if let Some(caps) = sample.caps() {
            log::info!("Frame #{} caps: {}", frame_count, caps);
          }
        }
      }

      let buffer = match sample.buffer() {
        Some(b) => b,
        None => {
          log::warn!("Frame sample has no buffer, skipping");
          continue;
        }
      };
      let map = match buffer.map_readable() {
        Ok(m) => m,
        Err(e) => {
          log::warn!("Failed to map buffer: {:?}, skipping frame", e);
          continue;
        }
      };
      let frame_data = map.as_slice();

      // Initialize JPEG encoder with actual frame dimensions on first frame
      if jpeg_encoder.is_none() {
        // Get the actual caps from the sample to determine format
        let sample_caps = sample.caps();
        log::info!("Sample caps: {:?}", sample_caps);

        // Calculate dimensions from frame data (RGB = 3 bytes per pixel)
        let total_pixels = frame_data.len() / 3;
        let (width, height) = match frame_data.len() {
          921600 => (640, 480),    // 640x480 RGB
          307200 => (320, 240),    // 320x240 RGB (added this common size)
          1228800 => (640, 640),   // 640x640 RGB
          2073600 => (800, 864),   // ~800x864 RGB
          6220800 => (1280, 1620), // Large resolution
          _ => {
            // Try common aspect ratios first
            let common_resolutions = [
              (320, 240),   // 4:3
              (640, 480),   // 4:3
              (800, 600),   // 4:3
              (1024, 768),  // 4:3
              (1280, 720),  // 16:9
              (1280, 960),  // 4:3
              (1920, 1080), // 16:9
            ];
            let found = common_resolutions
              .iter()
              .find(|&&(w, h)| w * h * 3 == frame_data.len() as u32);
            if let Some(&(w, h)) = found {
              log::info!("Detected common resolution: {}x{}", w, h);
              (w, h)
            } else {
              // Calculate dimensions trying different aspect ratios
              let pixel_count = total_pixels as f64;

              // Try 4:3 aspect ratio first (most common for USB cameras)
              let width_43 = (pixel_count * 4.0 / 3.0).sqrt();
              let height_43 = width_43 * 3.0 / 4.0;
              if (width_43 as u32 * height_43 as u32) == total_pixels as u32 {
                log::info!(
                  "Using 4:3 aspect ratio: {}x{}",
                  width_43 as u32,
                  height_43 as u32
                );
                (width_43 as u32, height_43 as u32)
              } else {
                // Fallback to square-ish
                let width = pixel_count.sqrt() as u32;
                let height = total_pixels as u32 / width;
                log::warn!(
                                    "Unknown frame size {}, using calculated {}x{} (may be incorrect)",
                                    frame_data.len(),
                                    width,
                                    height
                                );
                (width, height)
              }
            }
          }
        };
        log::info!(
          "Creating JPEG encoder for {}x{} frames (data size: {} bytes)",
          width,
          height,
          frame_data.len()
        );
        jpeg_encoder = match jpeg::JpegEncoder::new(width, height, 70) {
          Ok(encoder) => {
            log::info!(
              "Successfully created JPEG encoder for {}x{}",
              width,
              height
            );

            // Validate that our dimensions make sense by checking frame data
            let expected_size = (width * height * 3) as usize;
            if frame_data.len() != expected_size {
              log::warn!("Frame data size mismatch! Expected {} bytes for {}x{} RGB, got {} bytes",
                                expected_size, width, height, frame_data.len());
            }

            Some(encoder)
          }
          Err(e) => {
            log::error!("Failed to create JPEG encoder: {:?}", e);
            continue;
          }
        };
      }

      // Process every Nth frame with AI for performance optimization
      let processed_frame = if frame_count % ai_process_every_n_frames == 0 {
        // Run YOLO inference and annotate the frame
        ai::process_frame_with_yolo(&mut session, frame_data)
      } else {
        // Skip AI processing and just pass through the frame
        frame_data.to_vec()
      };

      let encoded_frame =
        match jpeg_encoder.as_ref().unwrap().encode_frame(processed_frame) {
          Ok(frame) => frame,
          Err(e) => {
            log::warn!("Failed to encode frame: {:?}, skipping", e);
            continue;
          }
        };

      // Only send if there are receivers to reduce backpressure
      if tx.receiver_count() > 0 {
        if let Err(e) = tx.send(encoded_frame) {
          log::debug!("Failed to send frame (no receivers): {:?}", e);
        }
      } else {
        log::debug!("No receivers for camera frames, skipping send");
      }
    } else {
      consecutive_failures += 1;
      if consecutive_failures <= max_consecutive_failures {
        // Only log every 50th failure to significantly reduce spam
        if consecutive_failures % 50 == 1 {
          log::warn!(
                        "Camera frame timeout (failures: {}) for pipeline {}. Still retrying...",
                        consecutive_failures,
                        working_pipeline_description
                    );
        }
      } else {
        log::error!("Too many consecutive failures ({}) receiving frames from camera. Pipeline {} may be broken.", consecutive_failures, working_pipeline_description);

        // Check for caps negotiation errors before attempting restart
        let mut caps_error_detected = false;
        let mut usb_hardware_error = false;

        while let Some(msg) = bus.pop_filtered(&[gstreamer::MessageType::Error])
        {
          if let gstreamer::MessageView::Error(err) = msg.view() {
            let error_message = format!("{}", err.error());
            log::error!("Pipeline error during failures: {}", error_message);

            if error_message.contains("not-negotiated")
              || error_message.contains("caps")
              || error_message.contains("negotiation")
              || error_message.contains("streaming stopped")
            {
              caps_error_detected = true;
              log::warn!("Caps negotiation failure detected - this may require pipeline reconfiguration");
            } else if error_message.contains("No such device")
              || error_message.contains("Connection timed out")
              || error_message.contains("Could not read from resource")
              || error_message.contains("Failed to allocate a buffer")
              || error_message.contains("poll error")
            {
              usb_hardware_error = true;
              log::warn!(
                "USB hardware error detected - camera may have disconnected"
              );
            }
          }
        }

        if usb_hardware_error {
          log::error!(
                        "USB camera hardware error detected. Camera may have been disconnected."
                    );
          log::info!("Checking if camera device still exists...");

          // Extract device path from pipeline description for checking
          let device_still_exists =
            if working_pipeline_description.contains("/dev/video0") {
              std::path::Path::new("/dev/video0").exists()
            } else if working_pipeline_description.contains("/dev/video1") {
              std::path::Path::new("/dev/video1").exists()
            } else {
              // For other configurations, assume device might be reconnectable
              true
            };

          if !device_still_exists {
            log::error!(
                            "Camera device no longer exists - hardware disconnection confirmed"
                        );
            log::info!("Waiting for camera to be reconnected...");

            // Wait and check for device reconnection
            for retry in 1..=30 {
              // Wait up to 30 seconds
              std::thread::sleep(std::time::Duration::from_secs(1));

              // Check if any video devices are available again
              let mut devices_available = false;
              for i in 0..10 {
                if std::path::Path::new(&format!("/dev/video{}", i)).exists() {
                  devices_available = true;
                  log::info!("Found video device /dev/video{} - camera may be reconnected", i);
                  break;
                }
              }

              if devices_available {
                log::info!("Camera device detected after {} seconds - attempting to restart", retry);
                break;
              }

              if retry % 5 == 0 {
                log::info!(
                  "Still waiting for camera reconnection... ({}/30 seconds)",
                  retry
                );
              }
            }

            // If no device found after 30 seconds, return to restart the whole capture function
            if !std::path::Path::new("/dev/video0").exists()
              && !std::path::Path::new("/dev/video1").exists()
            {
              log::error!("Camera not reconnected after 30 seconds - restarting camera capture function");
              return Err(
                "Camera hardware disconnected and not reconnected".into(),
              );
              // This will restart the entire capture function
            }
          }

          log::info!(
            "Attempting to restart pipeline after USB hardware error..."
          );
        } else {
          log::info!(
                        "Non-hardware error detected - attempting standard pipeline restart..."
                    );
        }

        // Let's try to restart the pipeline after too many failures
        log::info!(
          "Attempting to restart pipeline {}...",
          working_pipeline_description
        );
        if let Err(err) = pipeline.set_state(gstreamer::State::Null) {
          log::error!("Failed to stop pipeline: {:?}", err);
        }
        std::thread::sleep(std::time::Duration::from_secs(1));

        // If caps error was detected, wait a bit longer before restart
        if caps_error_detected {
          log::info!("Waiting extra time due to caps negotiation issue...");
          std::thread::sleep(std::time::Duration::from_secs(2));
        } else if usb_hardware_error {
          log::info!("Waiting extra time due to USB hardware issue...");
          std::thread::sleep(std::time::Duration::from_secs(3));
        }

        if let Err(err) = pipeline.set_state(gstreamer::State::Playing) {
          log::error!("Failed to restart pipeline: {:?}", err);
          if caps_error_detected {
            log::error!("Pipeline restart failed after caps negotiation issue - may need different configuration");
          } else if usb_hardware_error {
            log::error!("Pipeline restart failed after USB hardware issue - camera may need reconnection");
            log::info!(
                            "Restarting entire camera capture function to rediscover devices..."
                        );
            return Err(
              "USB hardware error - restarting for device rediscovery".into(),
            );
            // Return to restart the entire capture function and rediscover devices
          }
          return Err("Pipeline restart failed".into());
        }
        log::info!(
          "Pipeline {} restarted successfully",
          working_pipeline_description
        );
        consecutive_failures = 0;
        frame_count = 0; // Reset frame count after restart
      }
    }
  }
}
