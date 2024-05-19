#!/usr/bin/env bash
set -x

husky install

ts-patch install -s
cp -r src/typescript/language-service-plugin node_modules/partbot-language-service-plugin

git clone https://github.com/PartMan7/PartBot-spoof.git src/secrets

cd src/secrets && npm install && cd ../..

test -f .env || cp .env.example .env
