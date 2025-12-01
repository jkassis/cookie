use axum::{http::header, response::IntoResponse, routing::get, Router};
use axum_server::tls_rustls::RustlsConfig;
use hyper_util::rt::TokioIo;
use hyper_util::server::conn::auto::Builder as AutoBuilder;
use hyper_util::service::TowerToHyperService;
use prometheus::{Encoder, TextEncoder};
use std::env;
use std::sync::Arc;
use tokio::net::TcpListener;

pub async fn start(service_app: Router) {
  // Logger is now initialized in main() before Service::new() is called
  // This ensures encoder task logs are visible from startup

  // Create metrics and ping routes
  let base_routes = Router::new()
    .route("/metrics", get(metrics_handler))
    .route("/ping", get(ping_handler));

  // Compose all routes
  let routes = base_routes.merge(service_app);

  // HTTP and HTTPS ports configurable via env vars
  let http_port: u16 = std::env::var("HTTP_PORT")
    .ok()
    .and_then(|s| s.parse().ok())
    .unwrap_or(3030);
  let https_port: u16 = std::env::var("HTTPS_PORT")
    .ok()
    .and_then(|s| s.parse().ok())
    .unwrap_or(3443);
  log::info!("HTTP port: {}, HTTPS port: {}", http_port, https_port);

  let http_addr = format!("0.0.0.0:{}", http_port);
  log::info!("🚀 HTTP Server starting on http://{}", http_addr);

  // Check if we should run HTTPS
  let enable_https =
    env::var("ENABLE_HTTPS").unwrap_or_else(|_| "true".to_string()) == "true";

  if enable_https {
    log::info!("Starting servers with HTTPS support");

    // Get certificate directory from env var, default to current directory
    let cert_dir =
      env::var("CERT_DIR").unwrap_or_else(|_| "./conf/tls".to_string());
    std::fs::create_dir_all(&cert_dir).unwrap_or_else(|e| {
      log::warn!("Failed to create cert directory '{}': {}", cert_dir, e);
    });

    // Create self-signed certificate for development
    let cert_path = format!("{}/server_crt.pem", cert_dir);
    let key_path = format!("{}/server_key.pem", cert_dir);

    // Check if certificates exist, if not create them
    if !std::path::Path::new(&cert_path).exists()
      || !std::path::Path::new(&key_path).exists()
    {
      log::info!("Generating self-signed certificate for HTTPS...");
      create_self_signed_cert(&cert_path, &key_path).await;
    } else {
      log::info!("Using found certificates for HTTPS...");
    }

    println!("Server running on:");
    println!("  HTTP:  http://0.0.0.0:{}", http_port);
    println!("  HTTPS: https://0.0.0.0:{} (TLS 1.2+)", https_port);
    println!("For AudioWorklet support in Chrome, use the HTTPS URL");

    let https_addr = format!("0.0.0.0:{}", https_port);
    log::info!("🔒 HTTPS Server starting on https://{}", https_addr);

    // Clone the app for HTTPS server
    let https_app = routes.clone();

    // Start HTTPS server in a separate task
    let https_task = tokio::spawn(async move {
      // Check if CA cert exists and build config accordingly
      let ca_cert_path = format!("{}/ca_crt.pem", cert_dir);
      let has_ca_cert = std::path::Path::new(&ca_cert_path).exists();

      let config_result = if has_ca_cert {
        log::info!("Loading certificate chain with CA cert");
        RustlsConfig::from_pem_chain_file(cert_path.clone(), key_path.clone())
          .await
      } else {
        log::info!("Loading certificate without CA chain");
        RustlsConfig::from_pem_file(cert_path, key_path).await
      };

      match config_result {
        Ok(config) => {
          // Get the underlying ServerConfig to modify ALPN
          let old_config = config.get_inner();
          let mut server_config = (*old_config).clone();

          // Configure ALPN to advertise HTTP/2 and HTTP/1.1
          server_config.alpn_protocols = vec![
            b"h2".to_vec(),       // HTTP/2
            b"http/1.1".to_vec(), // HTTP/1.1
          ];

          // Note: rustls 0.23 with aws-lc-rs and tls12 feature enabled
          // Supports TLS 1.3 (preferred) and TLS 1.2 (fallback for compatibility)
          // TLS 1.0 and 1.1 are not supported (deprecated and insecure)

          // Create new config with modified ServerConfig
          let new_config = RustlsConfig::from_config(Arc::new(server_config));

          match https_addr.parse() {
            Ok(addr) => {
              log::info!("HTTPS server binding to {} with TLS 1.2+, HTTP/2 support (ALPN: h2, http/1.1)", addr);
              if let Err(e) = axum_server::bind_rustls(addr, new_config)
                .serve(https_app.into_make_service())
                .await
              {
                log::error!("HTTPS server failed: {}", e);
              }
            }
            Err(e) => {
              log::error!(
                "Failed to parse HTTPS address '{}': {}",
                https_addr,
                e
              );
            }
          }
        }
        Err(e) => {
          log::error!("Failed to build Rustls config: {}", e);
        }
      }
    });

    // Start HTTP server in a separate task (with HTTP/1.1 and HTTP/2 support)
    let http_routes = routes.clone();
    let http_task = tokio::spawn(async move {
      match TcpListener::bind(&http_addr).await {
        Ok(listener) => {
          log::info!(
            "HTTP server binding to {} with HTTP/1.1 and HTTP/2 support",
            http_addr
          );
          loop {
            match listener.accept().await {
              Ok((stream, _)) => {
                let service = http_routes.clone();
                tokio::spawn(async move {
                  let io = TokioIo::new(stream);
                  let hyper_service = TowerToHyperService::new(service);
                  // Use auto builder to support both HTTP/1.1 and HTTP/2
                  if let Err(e) =
                    AutoBuilder::new(hyper_util::rt::TokioExecutor::new())
                      .serve_connection(io, hyper_service)
                      .await
                  {
                    // Ignore connection errors (common when clients disconnect)
                    log::debug!("HTTP connection error: {}", e);
                  }
                });
              }
              Err(e) => {
                log::error!("Failed to accept connection: {}", e);
              }
            }
          }
        }
        Err(e) => {
          log::error!("Failed to bind HTTP server to '{}': {}", http_addr, e);
        }
      }
    });

    // Run both servers concurrently
    tokio::select! {
        _ = http_task => log::info!("HTTP server task ended"),
        _ = https_task => log::info!("HTTPS server task ended"),
    }
  } else {
    println!(
      "Server running on http://0.0.0.0:{} with HTTP/1.1 and HTTP/2 support",
      http_port
    );

    // Start HTTP server with HTTP/1.1 and HTTP/2 support (blocking)
    match TcpListener::bind(&http_addr).await {
      Ok(listener) => {
        log::info!(
          "HTTP server binding to {} with HTTP/1.1 and HTTP/2 support",
          http_addr
        );
        loop {
          match listener.accept().await {
            Ok((stream, _)) => {
              let service = routes.clone();
              tokio::spawn(async move {
                let io = TokioIo::new(stream);
                let hyper_service = TowerToHyperService::new(service);
                if let Err(e) =
                  AutoBuilder::new(hyper_util::rt::TokioExecutor::new())
                    .serve_connection(io, hyper_service)
                    .await
                {
                  // Ignore connection errors (common when clients disconnect)
                  log::debug!("HTTP connection error: {}", e);
                }
              });
            }
            Err(e) => {
              log::error!("Failed to accept connection: {}", e);
            }
          }
        }
      }
      Err(e) => {
        log::error!("Failed to bind HTTP server to '{}': {}", http_addr, e);
      }
    }
  }
}

/// Creates a self-signed certificate for HTTPS development
async fn create_self_signed_cert(cert_path: &str, key_path: &str) {
  use rcgen::{Certificate, CertificateParams, DistinguishedName};
  use std::net::IpAddr;

  log::info!("Generating self-signed certificate for HTTPS...");

  // Create certificate parameters
  let mut params = CertificateParams::default();

  // Set certificate details
  let mut distinguished_name = DistinguishedName::new();
  distinguished_name.push(rcgen::DnType::CommonName, "localhost");
  distinguished_name
    .push(rcgen::DnType::OrganizationName, "Katseye Development");
  distinguished_name.push(rcgen::DnType::CountryName, "US");
  params.distinguished_name = distinguished_name;

  // Add subject alternative names for localhost
  params.subject_alt_names = vec![
    rcgen::SanType::DnsName("localhost".to_string()),
    rcgen::SanType::DnsName("127.0.0.1".to_string()),
    rcgen::SanType::IpAddress(IpAddr::V4(std::net::Ipv4Addr::new(
      127, 0, 0, 1,
    ))),
    rcgen::SanType::IpAddress(IpAddr::V6(std::net::Ipv6Addr::new(
      0, 0, 0, 0, 0, 0, 0, 1,
    ))),
  ];

  // Set validity period (365 days)
  let not_before = time::OffsetDateTime::now_utc();
  let not_after = not_before + time::Duration::days(365);
  params.not_before = not_before;
  params.not_after = not_after;

  // Generate certificate
  match Certificate::from_params(params) {
    Ok(cert) => {
      // Write certificate file
      if let Err(e) = std::fs::write(cert_path, cert.serialize_pem().unwrap()) {
        log::error!("Failed to write certificate file: {}", e);
        return;
      }

      // Write private key file
      if let Err(e) = std::fs::write(key_path, cert.serialize_private_key_pem())
      {
        log::error!("Failed to write key file: {}", e);
        return;
      }

      log::info!("Self-signed certificate created successfully");
      log::info!("Certificate: {}", cert_path);
      log::info!("Private key: {}", key_path);
    }
    Err(e) => {
      log::error!("Failed to generate certificate: {}", e);
    }
  }
}

// Handler functions for Axum
async fn metrics_handler() -> impl IntoResponse {
  let encoder = TextEncoder::new();
  let metric_families = prometheus::gather();
  let mut buffer = Vec::new();
  encoder.encode(&metric_families, &mut buffer).unwrap();
  let body = String::from_utf8(buffer).unwrap();
  let content_type = encoder.format_type().to_string();

  ([(header::CONTENT_TYPE, content_type)], body)
}

async fn ping_handler() -> impl IntoResponse {
  "pong"
}
