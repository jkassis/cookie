use gstreamer::parse;
use gstreamer::prelude::*;
use gstreamer::Buffer;
use gstreamer::Caps;
use gstreamer_app::AppSink;
use gstreamer_app::AppSrc;

pub struct JpegEncoder {
  pipeline: gstreamer::Pipeline,
  appsrc: AppSrc,
  appsink: AppSink,
}

impl JpegEncoder {
  /// Initialize the JPEG encoder pipeline
  pub fn new(
    width: u32,
    height: u32,
    quality: u32,
  ) -> Result<Self, Box<dyn std::error::Error>> {
    // // Create GStreamer elements
    // let pipeline = gstreamer::Pipeline::new();
    // let appsrc = gstreamer::ElementFactory::make("appsrc").build().unwrap();
    // let videoconvert = gstreamer::ElementFactory::make("videoconvert")
    //     .build()
    //     .unwrap();
    // let jpegenc = gstreamer::ElementFactory::make("jpegenc").build().unwrap();
    // let appsink = gstreamer::ElementFactory::make("appsink").build().unwrap();

    // // Set JPEG quality
    // jpegenc.set_property("quality", quality as i32);

    // // Create the pipeline
    // pipeline.add_many(&[&appsrc, &videoconvert, &jpegenc, &appsink])?;
    // gstreamer::Element::link_many(&[&appsrc, &videoconvert, &jpegenc, &appsink])?;

    // // Configure appsrc
    // let caps = Caps::builder("video/x-raw")
    //     .field("format", &"RGB")
    //     .field("width", &(width as i32))
    //     .field("height", &(height as i32))
    //     .field("framerate", &gstreamer::Fraction::new(0, 1)) // Single-frame input
    //     .build();
    // appsrc.set_property("caps", &caps);
    // appsrc.set_property_from_str("format", "time");

    // // Cast appsrc and appsink to their respective types
    // let appsrc = appsrc
    //     .dynamic_cast::<AppSrc>()
    //     .expect("Failed to cast appsrc");
    // let appsink = appsink
    //     .dynamic_cast::<AppSink>()
    //     .expect("Failed to cast appsink");

    // Build the pipeline description
    let pipeline_description = format!(
            "appsrc name=appsrc caps=video/x-raw,format=RGB,width={},height={},framerate=0/1 ! \
         videoconvert ! jpegenc quality={} ! appsink name=appsink",
            width, height, quality
        );

    // Parse the pipeline description
    let pipeline = parse::launch(&pipeline_description)?
      .dynamic_cast::<gstreamer::Pipeline>()
      .expect("Failed to cast to Pipeline");

    // Retrieve appsrc and appsink for further configuration
    let appsrc = pipeline
      .by_name("appsrc")
      .expect("Failed to get appsrc")
      .dynamic_cast::<AppSrc>()
      .expect("Failed to cast to AppSrc");
    let caps = Caps::builder("video/x-raw")
      .field("format", "RGB")
      .field("width", width as i32)
      .field("height", height as i32)
      .field("framerate", gstreamer::Fraction::new(0, 1)) // Single-frame input
      .build();
    appsrc.set_property("caps", &caps);
    appsrc.set_property_from_str("format", "time");

    let appsink = pipeline
      .by_name("appsink")
      .expect("Failed to get appsink")
      .dynamic_cast::<AppSink>()
      .expect("Failed to cast to AppSink");
    appsink.set_caps(Some(&gstreamer::Caps::builder("image/jpeg").build()));

    // Start the pipeline
    pipeline.set_state(gstreamer::State::Playing)?;

    Ok(Self {
      pipeline,
      appsrc,
      appsink,
    })
  }

  /// Encode a single frame
  pub fn encode_frame(
    &self,
    rgb_data: Vec<u8>,
  ) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
    // Push raw RGB data into appsrc
    let buffer = Buffer::from_slice(rgb_data);
    self.appsrc.push_buffer(buffer)?;

    // Wait for output from appsink
    let sample = self.appsink.pull_sample().map_err(|err| {
      eprintln!("Failed to pull sample: {:?}", err);
      err
    })?;

    // Get the encoded JPEG frame from appsink
    let buffer = sample.buffer().expect("Failed to get buffer");
    let map = buffer.map_readable().expect("Failed to map buffer");

    // Copy JPEG data to Vec<u8>
    let jpeg_data = map.as_slice().to_vec();

    Ok(jpeg_data)
  }

  /// Shut down the encoder pipeline
  pub fn shutdown(&self) {
    self.pipeline.set_state(gstreamer::State::Null).ok();
  }
}
