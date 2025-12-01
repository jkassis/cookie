use imageproc::drawing::draw_hollow_rect_mut;
use imageproc::image::{ImageBuffer, Rgb, RgbImage};
use imageproc::rect::Rect;
use ndarray::{s, Array, Axis, IxDyn};
// use rusttype::{Font, Scale};

use ort::execution_providers::CUDAExecutionProvider;
use ort::execution_providers::CoreMLExecutionProvider;
use ort::session::{builder::GraphOptimizationLevel, Session, SessionOutputs};

pub fn load_yolo_model(model_path: &str) -> Session {
  log::info!("Attempting to load YOLO model from: {}", model_path);

  // Try with CoreML first (Apple Silicon)
  if let Ok(session) = Session::builder()
    .unwrap()
    .with_optimization_level(GraphOptimizationLevel::Level3)
    .unwrap()
    .with_execution_providers([CoreMLExecutionProvider::default().build()])
    .and_then(|builder| builder.with_intra_threads(4))
    .and_then(|builder| {
      log::info!("Trying CoreML provider with path: {}", model_path);
      builder.commit_from_file(model_path)
    })
  {
    log::info!("Successfully loaded YOLO model with CoreML execution provider");
    return session;
  } else {
    log::warn!("Failed to load YOLO model with CoreML provider");
  }

  // Try with CUDA (NVIDIA GPUs)
  if let Ok(session) = Session::builder()
    .unwrap()
    .with_optimization_level(GraphOptimizationLevel::Level3)
    .unwrap()
    .with_execution_providers([CUDAExecutionProvider::default().build()])
    .and_then(|builder| builder.with_intra_threads(4))
    .and_then(|builder| {
      log::info!("Trying CUDA provider with path: {}", model_path);
      builder.commit_from_file(model_path)
    })
  {
    log::info!("Successfully loaded YOLO model with CUDA execution provider");
    return session;
  } else {
    log::warn!("Failed to load YOLO model with CUDA provider");
  }

  // Fall back to CPU only
  log::info!("Falling back to CPU execution provider (hardware acceleration not available)");
  log::info!("Loading with CPU provider, path: {}", model_path);
  Session::builder()
    .unwrap()
    .with_optimization_level(GraphOptimizationLevel::Level3)
    .unwrap()
    .with_intra_threads(4)
    .unwrap()
    .commit_from_file(model_path)
    .unwrap()
}

pub fn process_frame_with_yolo(
  model: &mut Session,
  raw_data: &[u8],
) -> Vec<u8> {
  let start_time = std::time::Instant::now();

  // Calculate actual image dimensions from data size
  // RGB format has 3 bytes per pixel
  let (actual_width, actual_height) = match raw_data.len() {
    921600 => (640, 480),    // 640x480 RGB
    1228800 => (640, 640),   // 640x640 RGB
    2073600 => (800, 864),   // ~800x864 RGB
    6220800 => (1280, 1620), // Large resolution - need to figure out actual aspect ratio
    _ => {
      // Try to determine from common resolutions
      let common_resolutions = [
        (640, 480),
        (800, 600),
        (1024, 768),
        (1280, 720),
        (1280, 960),
        (1920, 1080),
      ];
      let found = common_resolutions
        .iter()
        .find(|&&(w, h)| w * h * 3 == raw_data.len() as u32);
      if let Some(&(w, h)) = found {
        log::info!("Detected resolution: {}x{}", w, h);
        (w, h)
      } else {
        // Calculate square-ish dimensions as fallback
        let total_pixels = raw_data.len() / 3;
        let width = (total_pixels as f64).sqrt() as u32;
        let height = total_pixels as u32 / width;
        log::warn!(
          "Unknown frame size {}, using calculated {}x{}",
          raw_data.len(),
          width,
          height
        );
        (width, height)
      }
    }
  };

  if actual_width * actual_height > 640 * 480 {
    log::debug!(
      "Processing large frame: {}x{} ({} bytes)",
      actual_width,
      actual_height,
      raw_data.len()
    );
  }

  // Create an RgbImage with the actual dimensions
  let mut rgb_image: RgbImage =
    ImageBuffer::from_raw(actual_width, actual_height, raw_data.to_vec())
      .ok_or("Failed to create ImageBuffer from raw data")
      .unwrap();

  // if env::var("USE_AI").is_ok() {
  if false {
    // Temporarily disable AI processing to test video feed
    // Use smaller model size for better performance on Raspberry Pi
    let (model_width, model_height) = (320u32, 240u32); // Reduced from 640x480
    let resized_image =
      if actual_width != model_width || actual_height != model_height {
        log::debug!(
          "Resizing from {}x{} to {}x{} for AI processing",
          actual_width,
          actual_height,
          model_width,
          model_height
        );
        image::imageops::resize(
          &rgb_image,
          model_width,
          model_height,
          image::imageops::FilterType::Triangle, // Faster than Lanczos3
        )
      } else {
        rgb_image.clone()
      };

    let inference_start = std::time::Instant::now();

    // Normalize the image data to [0, 1] and convert to f32
    let normalized_data: Vec<f32> =
      resized_image.iter().map(|&x| x as f32 / 255.0).collect();
    let input_shape = vec![1, 3, model_width as i64, model_height as i64];

    // Create proper ONNX tensor
    let input_tensor =
      ort::value::Tensor::from_array((input_shape.clone(), normalized_data))
        .unwrap();

    // Run the YOLO model
    let outputs: SessionOutputs = model
      .run(ort::inputs!["input" => input_tensor])
      .unwrap();
    let output = outputs["output"].try_extract_tensor::<f32>().unwrap();

    // Convert to ndarray - rc.10 format
    let (shape, data) = output;
    let output_array = Array::from_shape_vec(
      IxDyn(&shape.iter().map(|&x| x as usize).collect::<Vec<_>>()),
      data.to_vec(),
    )
    .unwrap()
    .t()
    .to_owned();

    let inference_time = inference_start.elapsed();
    let total_time = start_time.elapsed();

    if total_time.as_millis() > 100 {
      log::debug!(
        "AI processing took {}ms (inference: {}ms) for {}x{} frame",
        total_time.as_millis(),
        inference_time.as_millis(),
        actual_width,
        actual_height
      );
    }

    // Extract bounding boxes, confidence, and class labels
    // Use actual image dimensions for proper bounding box scaling
    let detection_vecs =
      process_output(output_array, actual_width, actual_height);

    // Color for the bounding box (red)
    let color = Rgb([255, 0, 0]);

    for detection in detection_vecs {
      draw_bounding_box(&mut rgb_image, &detection, color);
    }
  }

  rgb_image.to_vec()
}

// Function used to convert RAW output from YOLOv8 to an array
// of detected objects. Each object contain the bounding box of
// this object, the type of object and the probability
// Returns array of detected objects in a format [(x1,y1,x2,y2,object_type,probability),..]
fn process_output(
  output: Array<f32, IxDyn>,
  img_width: u32,
  img_height: u32,
) -> Vec<Detection> {
  let mut detections = Vec::new();
  let output = output.slice(s![.., .., 0]);
  for row in output.axis_iter(Axis(0)) {
    let row: Vec<_> = row.iter().copied().collect();
    let (class_id, confidence) = row
      .iter()
      .skip(4)
      .enumerate()
      .map(|(index, value)| (index, *value))
      .reduce(|accum, row| if row.1 > accum.1 { row } else { accum })
      .unwrap();
    if confidence < 0.9 {
      continue;
    }

    let xc = row[0] / 320.0 * (img_width as f32); // Changed from 640.0 to 320.0
    let yc = row[1] / 240.0 * (img_height as f32); // Changed from 640.0 to 240.0
    let w = row[2] / 320.0 * (img_width as f32); // Changed from 640.0 to 320.0
    let h = row[3] / 240.0 * (img_height as f32); // Changed from 640.0 to 240.0

    let detection = Detection {
      confidence,
      class_id,
      w: row[2] / 320.0 * (img_width as f32), // Changed from 640.0 to 320.0
      h: row[3] / 240.0 * (img_height as f32), // Changed from 640.0 to 240.0
      x1: xc - w / 2.0,
      x2: xc + w / 2.0,
      y1: yc - h / 2.0,
      y2: yc + h / 2.0,
    };
    detections.push(detection);
  }

  detections.sort_by(|d1, d2| d2.confidence.total_cmp(&d1.confidence));
  let mut result = Vec::<Detection>::new();
  while !detections.is_empty() {
    result.push(detections[0].clone());
    detections = detections
      .iter()
      .filter(|detection| iou(&detections[0], detection) < 0.2)
      .map(|x| x.clone())
      .collect()
  }
  result
}

// Function calculates "Intersection-over-union" coefficient for specified two boxes
// https://pyimagesearch.com/2016/11/07/intersection-over-union-iou-for-object-detection/.
// Returns Intersection over union ratio as a float number
fn iou(d1: &Detection, d2: &Detection) -> f32 {
  intersection(d1, d2) / union(d1, d2)
}

// Function calculates union area of two boxes
// Returns Area of the boxes union as a float number
fn union(d1: &Detection, d2: &Detection) -> f32 {
  let box1_area = (d1.x2 - d1.x1) * (d1.y2 - d1.y1);
  let box2_area = (d2.x2 - d2.x1) * (d2.y2 - d2.y1);
  box1_area + box2_area - intersection(d1, d2)
}

// Function calculates intersection area of two boxes
// Returns Area of intersection of the boxes as a float number
fn intersection(d1: &Detection, d2: &Detection) -> f32 {
  let x1 = d1.x1.max(d2.x1);
  let y1 = d1.y1.max(d2.y1);
  let x2 = d1.x2.min(d2.x2);
  let y2 = d1.y2.min(d2.y2);
  (x2 - x1) * (y2 - y1)
}

pub fn draw_bounding_box(
  image: &mut RgbImage,  // Mutable reference to the image
  detection: &Detection, // Detection object containing bounding box info
  color: Rgb<u8>,        // Color for the bounding box
) {
  // Convert to integers for drawing
  let rect = Rect::at(detection.x1 as i32, detection.y1 as i32)
    .of_size(detection.w as u32, detection.h as u32);

  // Draw the rectangle on the image
  draw_hollow_rect_mut(image, rect, color);
}

#[derive(Debug, Clone)]
#[allow(dead_code)]
pub struct Detection {
  pub x1: f32,
  pub y1: f32,
  pub x2: f32,
  pub y2: f32,
  pub w: f32,
  pub h: f32,
  pub confidence: f32,
  pub class_id: usize,
}

// Array of YOLOv8 class labels
#[allow(dead_code)]
const YOLO_CLASSES: [&str; 80] = [
  "person",
  "bicycle",
  "car",
  "motorcycle",
  "airplane",
  "bus",
  "train",
  "truck",
  "boat",
  "traffic light",
  "fire hydrant",
  "stop sign",
  "parking meter",
  "bench",
  "bird",
  "cat",
  "dog",
  "horse",
  "sheep",
  "cow",
  "elephant",
  "bear",
  "zebra",
  "giraffe",
  "backpack",
  "umbrella",
  "handbag",
  "tie",
  "suitcase",
  "frisbee",
  "skis",
  "snowboard",
  "sports ball",
  "kite",
  "baseball bat",
  "baseball glove",
  "skateboard",
  "surfboard",
  "tennis racket",
  "bottle",
  "wine glass",
  "cup",
  "fork",
  "knife",
  "spoon",
  "bowl",
  "banana",
  "apple",
  "sandwich",
  "orange",
  "broccoli",
  "carrot",
  "hot dog",
  "pizza",
  "donut",
  "cake",
  "chair",
  "couch",
  "potted plant",
  "bed",
  "dining table",
  "toilet",
  "tv",
  "laptop",
  "mouse",
  "remote",
  "keyboard",
  "cell phone",
  "microwave",
  "oven",
  "toaster",
  "sink",
  "refrigerator",
  "book",
  "clock",
  "vase",
  "scissors",
  "teddy bear",
  "hair drier",
  "toothbrush",
];
