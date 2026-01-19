#!/bin/sh
# Wait for Ganache to be ready

echo "Waiting for Ganache to be ready..."
until nc -z ganache 8545 2>/dev/null; do
  echo "Ganache not ready, waiting..."
  sleep 2
done
echo "Ganache is ready!"
