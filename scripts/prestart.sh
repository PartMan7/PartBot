#!/usr/bin/env bash

set -a && source .env && set +a
if [[ "$USE_WEB" = 'true' ]]
then
  echo 'Running web setup in the background...'
  npm run webpack -- --watch &
  npm run tailwind &
else
  echo 'Skipping web setup...'
fi
