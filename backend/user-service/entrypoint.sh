#!/bin/sh
# Wait for the database to be ready
wait-for-it.sh db:5432 -- echo "Postgres is up - executing command"

# Run Prisma migrations
npx prisma migrate deploy

# Seed the database
npx prisma db seed

# Start the application
exec "$@"