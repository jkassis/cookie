use axum::http::{HeaderName, HeaderValue, Request};
use axum::{
  body::Body,
  extract::Path,
  http::{header, HeaderMap, Method, StatusCode},
  middleware,
  response::{IntoResponse, Response},
  routing::{get, post},
  Router,
};
use std::sync::Arc;
use tower_http::services::ServeDir;

use crate::rustie::db::kv::KvStore;
use crate::rustie::db::kv_redb::RedbStore;
use crate::rustie::db::kv_tikv::TiKvTransactionalStore;

// Custom rejection for unauthorized
#[allow(dead_code)]
#[derive(Debug)]
struct Unauthorized;

pub struct Service {
  db: Arc<dyn KvStore>,
}

impl Service {
  pub async fn new() -> Self {
    let app_mode =
      std::env::var("APP_MODE").unwrap_or_else(|_| "dev".to_string());

    let db: Arc<dyn KvStore> = if app_mode == "prod" {
      // Production: use TiKV
      let pd_endpoints = std::env::var("TIKV_PD_ENDPOINTS")
        .unwrap_or_else(|_| "127.0.0.1:2379".to_string())
        .split(',')
        .map(|s| s.to_string())
        .collect();

      let store = TiKvTransactionalStore::new(pd_endpoints)
        .await
        .expect("Failed to connect to TiKV");

      Arc::new(store)
    } else {
      // Development: use embedded redb
      let db_path = std::env::var("REDB_PATH")
        .unwrap_or_else(|_| "./data/redb.db".to_string());

      let store = RedbStore::new(&db_path).expect("Failed to initialize redb");

      Arc::new(store)
    };

    Self { db }
  }

  pub fn routes(self: Arc<Self>) -> Router {
    // build router
    let _service = self.clone();

    // Get assets directory from env var, default to "../client/assets"
    let assets_dir = std::env::var("ASSETS_DIR")
      .unwrap_or_else(|_| "../client/assets".to_string());

    let router = Router::new()
      .nest_service("/assets", ServeDir::new(assets_dir))
      .route("/{file}", get(static_file_handler))
      .route("/tx/do", post(tx_do_handler))
      .fallback(spa_fallback_handler);

    // Use custom CORS middleware instead of tower-http CorsLayer so we can
    // mirror the Origin header and allow credentials reliably across
    // tower-http versions.
    let cors_layer = middleware::from_fn(cors_middleware);

    router.layer(cors_layer)
  }
}

// TxDo handler - reads POST body
async fn tx_do_handler(body: String) -> impl IntoResponse {
  let req = body;
  // Process req here
  (StatusCode::OK, format!("Received: {}", req))
}

// Static file handler for Axum
async fn static_file_handler(
  Path(filename): Path<String>,
) -> impl IntoResponse {
  let app_mode =
    std::env::var("APP_MODE").unwrap_or_else(|_| "dev".to_string());
  let is_prod = app_mode == "prod";
  let is_ts_or_map = filename.ends_with(".map") || filename.ends_with(".ts");
  if is_prod && is_ts_or_map {
    return (StatusCode::NOT_FOUND, "Not Found").into_response();
  }
  let serve_from_src = is_ts_or_map;
  let dir = if serve_from_src {
    "src".to_string()
  } else {
    std::env::var("BUNDLE_DIR")
      .unwrap_or_else(|_| "../client/bundle".to_string())
  };
  let path = format!("{}/{}", dir, filename);
  match std::fs::read_to_string(&path) {
    Ok(content) => {
      let content_type = if filename.ends_with(".js") {
        "application/javascript"
      } else if filename.ends_with(".ts") {
        "application/typescript"
      } else if filename.ends_with(".map") {
        "application/json"
      } else if filename.ends_with(".html") {
        "text/html"
      } else if filename.ends_with(".css") {
        "text/css"
      } else {
        "application/octet-stream"
      };
      let mut headers = HeaderMap::new();
      headers.insert(header::CONTENT_TYPE, content_type.parse().unwrap());
      (headers, content).into_response()
    }
    Err(_) => spa_fallback_handler().await.into_response(),
  }
}

async fn spa_fallback_handler() -> impl IntoResponse {
  let bundle_dir = std::env::var("BUNDLE_DIR")
    .unwrap_or_else(|_| "../client/bundle".to_string());
  let main_html_path = format!("{}/Main.html", bundle_dir);
  let content = std::fs::read_to_string(&main_html_path)
    .unwrap_or_else(|_| "<h1>Main.html not found</h1>".to_string());
  let mut headers = HeaderMap::new();
  headers.insert(header::CONTENT_TYPE, "text/html".parse().unwrap());
  (headers, content)
}

// Simple CORS middleware: mirrors Origin and sets necessary CORS headers.
async fn cors_middleware(
  req: Request<Body>,
  next: axum::middleware::Next,
) -> Response {
  let origin = req.headers().get(header::ORIGIN).cloned();

  // Handle preflight requests immediately
  if req.method() == Method::OPTIONS {
    let mut resp = Response::new(Body::empty());
    let headers = resp.headers_mut();

    if let Some(o) = origin {
      headers.insert(HeaderName::from_static("access-control-allow-origin"), o);
    }
    headers.insert(
      HeaderName::from_static("cross-origin-resource-policy"),
      HeaderValue::from_static("cross-origin"),
    );
    headers.insert(
      axum::http::HeaderName::from_static("cross-origin-embedder-policy"),
      "require-corp".parse().unwrap(),
    );
    headers.insert(
      axum::http::HeaderName::from_static("cross-origin-opener-policy"),
      "same-origin".parse().unwrap(),
    );

    headers.insert(
      HeaderName::from_static("access-control-allow-credentials"),
      HeaderValue::from_static("true"),
    );
    headers.insert(
      HeaderName::from_static("access-control-allow-methods"),
      HeaderValue::from_static("GET,POST,PUT,DELETE,OPTIONS,HEAD,PATCH"),
    );
    headers.insert(
      HeaderName::from_static("access-control-allow-headers"),
      HeaderValue::from_static("Authorization,Content-Type"),
    );

    *resp.status_mut() = StatusCode::NO_CONTENT;
    return resp;
  }

  // Normal request: run inner service and then add CORS headers to response
  let mut resp = next.run(req).await;
  let headers = resp.headers_mut();
  if let Some(o) = origin {
    headers.insert(HeaderName::from_static("access-control-allow-origin"), o);
  }
  headers.insert(
    HeaderName::from_static("access-control-allow-credentials"),
    HeaderValue::from_static("true"),
  );
  headers.insert(
    HeaderName::from_static("access-control-allow-methods"),
    HeaderValue::from_static("GET,POST,PUT,DELETE,OPTIONS,HEAD,PATCH"),
  );
  headers.insert(
    HeaderName::from_static("access-control-allow-headers"),
    HeaderValue::from_static("Authorization,Content-Type"),
  );
  resp
}
