#!/bin/sh
set -eux
/bin/sh -c "cd /workspace/front && npm ci"
echo "front requirements installed"
/bin/sh -c "cd /workspace/back && pip install -r requirements.txt"
echo "back requirements installed"
/bin/sh -c "sudo apt update && sudo apt install -y graphviz"
echo "graphviz installed"
