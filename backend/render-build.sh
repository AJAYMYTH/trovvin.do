#!/usr/bin/env bash
set -e
sudo apt-get update -y
sudo apt-get install -y python3 python3-pip
pip3 install --upgrade yt-dlp
# Create symlink for python to python3 if needed
if ! command -v python &> /dev/null; then
    sudo ln -s /usr/bin/python3 /usr/bin/python
fi