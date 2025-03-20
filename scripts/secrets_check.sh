#!/usr/bin/env sh

cd src/secrets || :
REF=$(git rev-parse --abbrev-ref '@{u}')
git fetch $(echo "$REF" | sed 's#/# #') --quiet
REV=$(git rev-parse "$REF")

if git merge-base --is-ancestor "$REV" HEAD
then
  echo 'Secrets branch up-to-date.'
else
  echo "Your secrets repo is out-of-date with $REF. Please update it."
  exit 1
fi
