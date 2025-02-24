#!/usr/bin/env bash

for file in src/web/configs/*; do
  sed "s#{{PWD}}#$PWD#g;s#{{PORT}}#${PORT:-8800}#g" "$file" > "${file//.base/}"
done
