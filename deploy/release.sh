#!/usr/bin/env bash

set -Eeuo pipefail

if [ "$#" -ne 1 ]; then
  echo "Usage: $0 <image-tag>" >&2
  exit 2
fi

image_tag=$1
release_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
deploy_dir=$(cd -- "$release_dir/../.." && pwd)
compose_file="$release_dir/docker-compose.production.yml"
image_archive="$release_dir/lingweave.tar.gz"
current_tag_file="$deploy_dir/current-tag"
previous_tag=""

if [ -f "$current_tag_file" ]; then
  previous_tag=$(<"$current_tag_file")
fi

rollback() {
  exit_code=$?
  trap - ERR
  echo "Deployment failed; attempting rollback" >&2

  if [ -n "$previous_tag" ] && docker image inspect "lingweave:$previous_tag" >/dev/null 2>&1; then
    APP_IMAGE_TAG="$previous_tag" docker compose \
      -p lingweave \
      -f "$compose_file" \
      up -d --remove-orphans --wait --wait-timeout 60 || true
  else
    APP_IMAGE_TAG="$image_tag" docker compose \
      -p lingweave \
      -f "$compose_file" \
      down || true
  fi

  exit "$exit_code"
}

trap rollback ERR

test -f "$compose_file"
test -f "$image_archive"

gzip -dc "$image_archive" | docker load
docker image inspect "lingweave:$image_tag" >/dev/null
rm -f "$image_archive"

APP_IMAGE_TAG="$image_tag" docker compose \
  -p lingweave \
  -f "$compose_file" \
  up -d --remove-orphans --wait --wait-timeout 60

tmp_tag_file="$current_tag_file.tmp"
printf '%s\n' "$image_tag" > "$tmp_tag_file"
mv "$tmp_tag_file" "$current_tag_file"
ln -sfn "releases/$image_tag" "$deploy_dir/current"

trap - ERR

while read -r repository tag; do
  if [ "$repository" != "lingweave" ] || [ "$tag" = "<none>" ]; then
    continue
  fi
  if [ "$tag" != "$image_tag" ] && [ "$tag" != "$previous_tag" ]; then
    docker image rm "lingweave:$tag" >/dev/null 2>&1 || true
  fi
done < <(docker image ls --format '{{.Repository}} {{.Tag}}')

echo "Deployed lingweave:$image_tag"
