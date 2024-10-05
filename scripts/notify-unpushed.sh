#!/usr/bin/env sh

echo "Checking for pending changes..."
if [ -n "$1" ]; then cd "$1" || :; fi

if git status --porcelain | grep '.*'
then
  echo "\nPending changes found."
  if ! [ -z "$FAIL_ON_PENDING" ]; then exit 1; fi
else
  echo "No pending changes found."
fi
