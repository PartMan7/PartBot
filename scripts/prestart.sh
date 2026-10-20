#!/usr/bin/env bash

set -a && source .env && set +a
if [[ "$USE_WEB" = 'true' ]]
then
  echo 'Running web setup in the background...'
  bun run build:web &
  bun run tailwind &
else
  echo 'Skipping web setup...'
fi
