#!/bin/bash

set -e
set -u
set -o pipefail

INSTANCE=$(aws ec2 describe-instances --region=eu-west-2 --filters Name=tag:Type,Values=Bastion Name=instance-state-name,Values=running | jq -r '.Reservations[0].Instances[0]')
INSTANCE_ID=`echo ${INSTANCE} | jq -r '.InstanceId'`
DATABASE_ENDPOINT=$(aws rds describe-db-clusters | jq -r '.DBClusters[0].Endpoint')
AZ=`echo ${INSTANCE} | jq -r '.Placement.AvailabilityZone'`
LOCAL_PORT=15432
REGION="eu-west-2"

echo "starting ssh database tunnel"
echo "bastion instance: ${INSTANCE_ID}"
echo "database: ${DATABASE_ENDPOINT}"
echo "local port: ${LOCAL_PORT}"
echo "region: ${REGION}"

aws ssm start-session \
    --region $REGION \
    --target $INSTANCE_ID \
    --document-name AWS-StartPortForwardingSessionToRemoteHost \
    --parameters host=$DATABASE_ENDPOINT,portNumber="5432",localPortNumber=$LOCAL_PORT