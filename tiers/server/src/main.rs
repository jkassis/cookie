mod rustie {
  pub mod db;
  pub mod http;
}
mod service;

use std::sync::Arc;

use log::warn;

#[tokio::main]
async fn main() {
  // Initialize logger
  env_logger::init();

  println!("Main called, PID: {}", std::process::id());

  // Create service instance wrapped in Arc for sharing
  let service = Arc::new(service::Service::new().await);

  // Use original service for web routes
  let service_routes = service.routes();
  rustie::http::base::start(service_routes).await;
  warn!("service exiting normally")
}
