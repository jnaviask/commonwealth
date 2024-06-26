#!/bin/bash

# Function to execute tsx+mocha with the provided path and additional arguments
execute_tsx_mocha() {
  path=$1
  shift # Shift to skip the first argument (path) and get additional arguments

  # Construct the full command
  full_command="NODE_OPTIONS='--import tsx/esm' NODE_ENV=test mocha \"$path\" $*"

  # Log the full command
  echo "Executing: $full_command"

  # Execute the command
  eval $full_command
}

# Check if the first argument is 'cosmos', 'evm', or neither
case $1 in
cosmos)
  execute_tsx_mocha './test/devnet/cosmos/**/*.spec.ts' "${@:2}"
  ;;
evm)
  execute_tsx_mocha './test/devnet/evm/**/*.spec.ts' "${@:2}"
  ;;
*)
  # If the first argument is not 'cosmos' or 'evm', use the default path
  # and treat all arguments as additional parameters for mocha
  execute_tsx_mocha './test/devnet/**/*.spec.ts' "$@"
  ;;
esac
