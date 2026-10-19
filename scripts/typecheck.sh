#!/usr/bin/env bash
set -euo pipefail

IFS=. read -r major minor patch _ <<<"$(bun --version | tr -d '\n')"
patch="${patch%%[^0-9]*}"

if [ "$major" -gt 1 ] || [ "$minor" -gt 4 ] || { [ "$minor" -eq 4 ] && [ "${patch:-0}" -ge 3 ]; }; then
	exec bun check "$@"
fi

exec bunx --bun bun@1.4.3 check "$@"
