#!/bin/bash

set -e

echo "Merging master into release-prod..."

git checkout release-prod
git merge master
git push origin release-prod

git checkout master

echo "Done. Production deployment triggered."
