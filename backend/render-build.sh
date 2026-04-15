#!/usr/bin/env bash
# exit on error
set -o errexit

# Install project dependencies
npm install --include=optional

# Install Chrome for Puppeteer
npx puppeteer browsers install chrome
