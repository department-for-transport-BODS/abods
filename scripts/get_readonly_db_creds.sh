#!/bin/bash

set -euo pipefail

DB_PASSWORD=$(aws secretsmanager get-secret-value --region eu-west-2 --secret-id abods/sandbox/rds/user/abods_proxy_ro | jq -r '.SecretString | fromjson | .password')
echo 'DB_HOST=localhost'
echo 'DB_PORT=15432'
echo 'DB_USER=abods_proxy_ro'
echo "DB_PASSWORD=$DB_PASSWORD"
echo 'DB_NAME=abods'
