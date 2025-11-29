# Use build arguments for base images
ARG BASE_IMAGE=debian:bookworm-slim
ARG RUNTIME_IMAGE=gcr.io/distroless/cc

FROM ${BASE_IMAGE} AS builder

# Install minimal dependencies for building (cloud-friendly slim image)
RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends \
      ca-certificates \
      curl \
      build-essential \
      pkg-config \
      libssl-dev ; \
    rm -rf /var/lib/apt/lists/*

# Install Rust with minimal profile (explicit PATH used below)
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --profile minimal --default-toolchain stable
ENV PATH="/root/.cargo/bin:${PATH}"

WORKDIR /usr/src/app

# Copy manifests and build.rs
COPY server/Cargo.toml server/Cargo.lock server/build.rs ./

# Create dummy main to cache dependencies
RUN mkdir src && echo "fn main() {}" > src/main.rs

# Use sparse registry for faster dependency downloads
ENV CARGO_REGISTRIES_CRATES_IO_PROTOCOL=sparse

# Build dependencies only
RUN cargo build --release && rm -rf src target/release/deps/cookie*

# Copy real source
COPY server/src ./src

# Build the real application
RUN cargo build --release && strip target/release/cookie

FROM ${RUNTIME_IMAGE}

# Copy CA certs so TLS works in distroless image
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/ca-certificates.crt

# Copy the binary produced in the builder stage
COPY --from=builder /usr/src/app/target/release/cookie /usr/local/bin/cookie

# Copy server configuration into the runtime image
COPY server/conf/ /etc/app/conf/
ENV CERT_DIR "/etc/app/conf/tls"

# Copy static assets
COPY client/bundle/ /usr/local/bin/client/bundle/

# Runtime working directory
WORKDIR /usr/local/bin

EXPOSE 8080

CMD ["/usr/local/bin/cookie"]
