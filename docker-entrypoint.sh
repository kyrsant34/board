#!/bin/sh
set -e

# Collect static files
echo "Collect static files"
python manage.py collectstatic --noinput

# Download po files
echo "Download po files"
python manage.py download_po_files

# Compile po files
echo "Compile po files"
python manage.py compilemessages

# Apply database migrations
echo "Apply database migrations"
python manage.py migrate

exec "$@"
