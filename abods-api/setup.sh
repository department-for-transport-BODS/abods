#!/bin/bash

set -euo pipefail

npm install
npx prisma generate

DB_PASSWORD=$(aws secretsmanager get-secret-value --region eu-west-2 --secret-id abods/sandbox/rds/user/abods_proxy_rw | jq -r '.SecretString | fromjson | .password')
echo 'PROJECT_ENV=local' > .env
echo 'AWS_REGION=eu-west-2' >> .env
echo 'CORS_ORIGIN=http://localhost:4200' >> .env
echo 'DB_HOST=localhost' >> .env
echo 'DB_PORT=15432' >> .env
echo 'DB_USER=abods_proxy_rw' >> .env
echo "DB_PASSWORD=$DB_PASSWORD" >> .env
echo 'DB_NAME=abods' >> .env
echo 'TZ=UTC' >> .env
echo "DATABASE_URL=postgresql://abods_proxy_rw:${DB_PASSWORD//@/%40}@localhost:15432/abods?schema=public&connection_limit=50&gssencmode=disable&sslmode=prefer&ssl=true" >> .env
