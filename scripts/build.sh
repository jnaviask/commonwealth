#! /bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# build
if [ "$SL_BUILD" = true ]; then
  yarn workspace snapshot-listener build
elif [ "$DL_BUILD" = true ]; then
  yarn workspace discord-bot build
else
  yarn workspace commonwealth build
  yarn workspace scripts build # builds sitemap
  if [ -z "$NO_WEBPACK" ]; then
    NODE_OPTIONS=--max_old_space_size=4096 yarn workspace commonwealth bundle
  fi
fi
