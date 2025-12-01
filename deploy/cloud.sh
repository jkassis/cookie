#!/bin/zsh
set -euo pipefail

export IMG_REGISTRY_HOST=807125168235.dkr.ecr.us-west-2.amazonaws.com
export IMG_PATH=fg/cookie
export IMG_VERSION_PATH=./build/VERSION
export IMG_PLATFORM=linux/amd64

export GITOPS_REPO_DIR=../gitops

export HELM_VALUES_FILE_PATH=apps/cookie/values.yaml
export HELM_CHART_FILE_PATH=apps/cookie/Chart.yaml

run() {
  local COMMAND="$1"
  case "$COMMAND" in
  "build")
    pushd client
    yarn bundle
    popd
    go run ./deploy/ build
    ;;
  "push")
    go run ./deploy/ push
    ;;
  "release")
    go run ./deploy/ release
    ;;
  *)
    pushd client
    yarn bundle
    popd
    go run ./deploy/ build
    go run ./deploy/ push
    go run ./deploy/ release
    ;;
  esac
}

run "$1"
