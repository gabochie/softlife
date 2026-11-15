#!/bin/sh
set -eu
cd "$(dirname "$0")"
rm -rf public
cp -a ../../app public
rm -f public/assets/audio/intro.mp3
printf 'Built public assets: '
du -sh public | cut -f1
