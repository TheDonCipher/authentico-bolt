#!/usr/bin/env sh
# wait-for-it.sh
set -e

echo "Starting wait-for-it.sh script..."

host="$1"
shift
cmd="$@"

echo "Waiting for host: $host on port 5432..."

until nc -z "$host" 5432; do
  >&2 echo "Postgres is unavailable - sleeping"
  sleep 1
done

>&2 echo "Postgres is up - executing command"
exec $cmd