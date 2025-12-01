#!/bin/bash

set -e # Exit on error

# Detect OS
OS="$(uname -s)"
case "$OS" in
Darwin) echo "🖥️ Detected macOS" ;;
Linux) echo "🐧 Detected Linux" ;;
MINGW* | MSYS* | CYGWIN*) echo "🖥️ Detected Windows" ;;
*)
  echo "❌ Unsupported OS: $OS"
  exit 1
  ;;
esac

# Get project name (assumes the script is in the project root)
PROJECT_NAME=$(basename "$(dirname "$PWD")")
DB_NAME=$PROJECT_NAME

install() {
  brew install cockroach
}

setup() {
  cockroach sql --insecure -e "CREATE DATABASE $DB_NAME;"
  get_db_conn
  export RUST_BACKTRACE=1
  cargo test --test db_setup
}

lib_check() {
  otool -L server/target/debug/$PROJECT_NAME
}

get_db_conn() {
  # Get the SQL address of the CockroachDB node
  SQL_ADDRESS=$(cockroach node status --insecure --format=tsv | awk 'NR==2 {print $3}')

  # Check if we successfully retrieved the SQL address
  if [ -z "$SQL_ADDRESS" ]; then
    echo "Error: Could not retrieve CockroachDB SQL address."
    exit 1
  fi

  # Construct the connection URL
  export DATABASE_URL="postgresql://root@$SQL_ADDRESS/$DB_NAME?sslmode=disable"

  # Output the connection URL
  echo "$DATABASE_URL"
}

clean() {
  cargo clean
}

build_release() {
  echo "🚀 Building native version..."
  echo rm -f target/release/$PROJECT_NAME
  rm -f target/release/$PROJECT_NAME
  cargo build --release
}

build_dev() {
  echo "🚀 Building native version..."
  echo rm -f target/debug/$PROJECT_NAME
  rm -f target/debug/$PROJECT_NAME
  cargo build
}

test() {
  get_db_conn
  export RUST_BACKTRACE=1
  cargo test --test db_tests
}

run_dev() {
  cargo run
}

run_release() {
  cargo run --release
}

# Call function based on argument
${1:-build_all}
