#!/usr/bin/env bash

bunx http-server src/web -p 8080 &
USE_WEB=false WEB_PORT=8080 WEB_URL=http://localhost:8080 bun --tsconfig-override tsconfig.debug.json src/ps/games/debug.ts &
bunx http-server scripts/debug-games/live -p 8081 -o page.html
