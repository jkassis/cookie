#!/bin/bash

# Msg Bebop - Complete Build and Test Script
# Builds libraries for all supported languages and runs tests

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Check if bebop compiler is installed
check_bebop() {
    log "Checking Bebop installation..."
    if ! command -v bebopc >/dev/null 2>&1; then
        log "Installing Bebop compiler via npm..."
        yarn global install bebop
        success "Bebop compiler installed"
    else
        success "Bebop compiler already installed"
    fi
}

# Generate and test Rust library
build_rust() {
    log "🦀 Building Rust library..."

    mkdir -p rust/src
    mkdir -p rust/examples

    # Generate Bebop code using project config
    cat > bebop.json << 'EOF'
{
  "include": ["schema/*.bop"],
  "generators": {
    "rust": {
      "outFile": "rust/src/msg.rs"
    }
  }
}
EOF
    bebopc build

    # Files are already in place - no copying needed

    # Test
    cd rust
    if cargo build --release --target-dir ./target; then
        cargo test --target-dir ./target
        cargo run --example basic_usage --target-dir ./target
        success "Rust library built and tested"
    else
        error "Rust build failed"
    fi
    cd ..
}

# Generate and test TypeScript library
build_typescript() {
    log "🟨 Building TypeScript library..."

    mkdir -p typescript/src
    mkdir -p typescript/test

    # Generate Bebop code using project config
    cat > bebop.json << 'EOF'
{
  "include": ["schema/*.bop"],
  "generators": {
    "ts": {
      "outFile": "typescript/src/msg.ts"
    }
  }
}
EOF
    bebopc build

    # Copy templates
    # Files are already in place - no copying needed

    # Test
    cd typescript
    if yarn install; then
        yarn build
        yarn test
        success "TypeScript library built and tested"
    else
        error "TypeScript build failed"
    fi
    cd ..
}

# Performance benchmark
run_benchmarks() {
    log "🏃 Running performance benchmarks..."

    echo "Language | Serialize (ops/sec) | Deserialize (ops/sec) | Size (bytes)"
    echo "---------|--------------------|-----------------------|-------------"

    # This would run actual benchmarks if the libraries were fully built
    # For now, just show the structure
    success "Benchmark framework ready (run after full build)"
}

# Main execution
main() {
    echo "🎵 Msg Bebop - Polyglot Message Library Builder"
    echo "================================================"

    check_bebop

    echo
    log "Building libraries for all languages..."

    build_rust
    echo

    build_typescript
    echo

    run_benchmarks
    echo

    success "🎉 All libraries generated successfully!"
    echo
    echo "📦 Generated Libraries:"
    echo "  🦀 Rust:       rust/"
    echo "  🟨 TypeScript: typescript/"
    echo
    echo "🚀 Ready to publish to package managers!"
}

# Handle script arguments
case "${1:-}" in
    "rust")
        check_bebop && build_rust
        ;;
    "typescript")
        check_bebop && build_typescript
        ;;
    "clean")
        log "🧹 Cleaning all generated files..."
        rm -rf rust typescript go python
        success "Clean complete"
        ;;
    *)
        main
        ;;
esac
