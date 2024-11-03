#!/usr/bin/env sh
set -x

husky install

if ! [ -d src/secrets ]
then
  git clone https://github.com/PartMan7/PartBot-spoof.git src/secrets
fi

cd src/secrets && npm install && cd ../..

if ! [ -f .env ]
then
  cp .env.example .env
fi
