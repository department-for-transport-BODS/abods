#!/usr/bin/env bash
set -euo pipefail

: "${ENVIRONMENT:?ENVIRONMENT is required}"
: "${PROJECT_NAME:?PROJECT_NAME is required}"
: "${MAPBOX_TOKEN:?MAPBOX_TOKEN is required}"
: "${MAPBOX_STYLE:?MAPBOX_STYLE is required}"
: "${MAPBOX_SATELLITE_STYLE:?MAPBOX_SATELLITE_STYLE is required}"
: "${ANALYTICS_ID:?ANALYTICS_ID is required}"

domain_name=$(aws ssm get-parameter --name "/${PROJECT_NAME}/${ENVIRONMENT}/route53/hostedzone/name" \
  | jq -r '.Parameter.Value')
bods_param_base_url=$(aws ssm get-parameter --name "/${PROJECT_NAME}/${ENVIRONMENT}/bods_base_url" \
  | jq -r '.Parameter.Value')
bods_url="https://${bods_param_base_url}"
data_bods_base_url="https://data.${bods_param_base_url}"
publish_bods_base_url="https://publish.${bods_param_base_url}"
graphql_api_url="/api/graphql"
support_email=$(aws ssm get-parameter --name "/${PROJECT_NAME}/${ENVIRONMENT}/support_email" --with-decryption \
  | jq -r '.Parameter.Value')

jq -n \
  --arg api_url "$graphql_api_url" \
  --arg bods_base_url "$bods_url" \
  --arg data_bods_base_url "$data_bods_base_url" \
  --arg publish_bods_base_url "$publish_bods_base_url" \
  --arg env_name "$ENVIRONMENT" \
  --arg analytics_id "$ANALYTICS_ID" \
  --arg mapbox_token "$MAPBOX_TOKEN" \
  --arg mapbox_style "$MAPBOX_STYLE" \
  --arg mapbox_satellite_style "$MAPBOX_SATELLITE_STYLE" \
  --arg support_email "$support_email" \
  '{
    apiUrl: $api_url,
    bodsBaseUrl: $bods_base_url,
    bodsPublishBaseUrl: $publish_bods_base_url,
    bodsDataBaseUrl: $data_bods_base_url,
    envName: $env_name,
    analyticsId: $analytics_id,
    mapboxToken: $mapbox_token,
    mapboxStyle: $mapbox_style,
    mapboxSatelliteStyle: $mapbox_satellite_style,
    supportEmail: $support_email,
    vehicleJourneys: { validDateRange: { offsetISO: "PT0H", durationISO: "P6M" } },
    otp: { early: 1, late: 6 },
    defaultCookiePolicy: { analyticsEnabled: false, version: 1, userSubmitted: false },
    freshdesk: {
      apiUrl: "/freshdesk",
      folders: {
        dashboard: "43000590095",
        feedMonitoring: "43000590096",
        otp: "43000590097",
        vehicleJourneys: "43000590098",
        corridors: "43000590099",
        organisation: "43000590100",
        dataMonitoring: "43000590101",
        serviceMonitoring: "43000590102",
        stopAnalysis: "43000590103",
        distances: "43000590104"
      }
    }
  }' > public/config.json