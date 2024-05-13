#!/usr/bin/env bash
set -x

husky install

ts-patch install -s
cp -r src/typescript/language-service-plugin node_modules/partbot-language-service-plugin

git config -f .gitmodules submodule.src/secrets.branch main

test -f .env || cp .env.example .env
test -f .gitmodules || cp .gitmodules.example .gitmodules
