#!/bin/bash

set -euo pipefail

environment="${1:-sandbox}"
REGION="eu-west-2"
INSTANCE_ID=$(aws ec2 describe-instances --region=$REGION --filters Name=tag:Name,Values=abods-$environment-bastion Name=instance-state-name,Values=running | jq -r '.Reservations[0].Instances[0].InstanceId')
DATABASE_ENDPOINT=$(aws rds describe-db-clusters | jq -r ".DBClusters[] | select(.DBClusterIdentifier | startswith(\"abods-$environment\")) | .Endpoint")
LOCAL_PORT=15432

echo "starting ssh database tunnel"
echo "bastion instance: ${INSTANCE_ID}"
echo "database: ${DATABASE_ENDPOINT}"
echo "local port: ${LOCAL_PORT}"
echo "region: ${REGION}"

aws ssm start-session \
    --region "$REGION" \
    --target "$INSTANCE_ID" \
    --document-name AWS-StartPortForwardingSessionToRemoteHost \
    --parameters host=$DATABASE_ENDPOINT,portNumber="5432",localPortNumber=$LOCAL_PORT