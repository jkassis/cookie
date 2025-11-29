use axum::http::{HeaderName, HeaderValue, Request};
use axum::{
  body::Body,
  extract::{Path, State},
  http::{header, HeaderMap, Method, StatusCode},
  middleware,
  response::{IntoResponse, Response},
  routing::get,
  Router,
};
use base64::{engine::general_purpose::STANDARD, Engine};
use std::sync::Arc;
use tower::ServiceBuilder;
use tower_http::services::ServeDir;

// Custom rejection for unauthorized
#[allow(dead_code)]
#[derive(Debug)]
struct Unauthorized;

#[derive(Debug)]
pub struct Service {}

impl Service {
  pub fn new() -> Self {
    Self {}
  }

  pub fn routes(self: Arc<Self>) -> Router {
    // --- auth ---
    let app_mode =
      std::env::var("APP_MODE").unwrap_or_else(|_| "dev".to_string());
    let require_auth = app_mode == "prod";
    log::info!(
      "APP_MODE: {}, Basic Auth: {}",
      app_mode,
      if require_auth { "ENABLED" } else { "DISABLED" }
    );
    // Use tower-http's ServeDir for assets

    let admin_user =
      std::env::var("ADMIN_USER").unwrap_or_else(|_| "admin".to_string());
    let admin_pass =
      std::env::var("ADMIN_PASS").unwrap_or_else(|_| "password".to_string());

    // build router
    let _service = self.clone();
    let router = Router::new()
      .nest_service("/assets", ServeDir::new("client/assets"))
      .route("/{file}", get(static_file_handler))
      .fallback(spa_fallback_handler);

    // Use custom CORS middleware instead of tower-http CorsLayer so we can
    // mirror the Origin header and allow credentials reliably across
    // tower-http versions.
    let cors_layer = middleware::from_fn(cors_middleware);

    if require_auth {
      router.layer(
        ServiceBuilder::new()
          .layer(middleware::from_fn_with_state(
            (admin_user, admin_pass),
            basic_auth_middleware,
          ))
          .layer(cors_layer.clone()),
      )
    } else {
      router.layer(cors_layer)
    }
  }
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
    "src"
  } else {
    "client/bundle"
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
  let content = std::fs::read_to_string("./client/bundle/Main.html")
    .unwrap_or_else(|_| "<h1>Main.html not found</h1>".to_string());
  let mut headers = HeaderMap::new();
  headers.insert(header::CONTENT_TYPE, "text/html".parse().unwrap());
  (headers, content)
}

// Basic auth middleware for Axum
async fn basic_auth_middleware(
  State((admin_user, admin_pass)): State<(String, String)>,
  headers: HeaderMap,
  req: axum::http::Request<axum::body::Body>,
  next: axum::middleware::Next,
) -> Result<Response, StatusCode> {
  if let Some(auth_header) = headers.get(header::AUTHORIZATION) {
    if let Ok(auth_str) = auth_header.to_str() {
      if let Some(basic) = auth_str.strip_prefix("Basic ") {
        if let Ok(decoded) = STANDARD.decode(basic) {
          if let Ok(cred) = String::from_utf8(decoded) {
            let mut parts = cred.splitn(2, ':');
            if let (Some(user), Some(pass)) = (parts.next(), parts.next()) {
              if user == admin_user && pass == admin_pass {
                return Ok(next.run(req).await);
              }
            }
          }
        }
      }
    }
  }

  let resp = Response::builder()
    .status(StatusCode::UNAUTHORIZED)
    .header("WWW-Authenticate", "Basic realm=admin")
    .body(Body::from("Unauthorized"))
    .unwrap();
  Ok(resp)
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
