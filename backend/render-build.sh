#!/usr/bin/env bash
set -e
sudo apt-get update -y
sudo apt-get install -y python3 python3-pip
pip3 install --upgrade yt-dlp
