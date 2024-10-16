# ABODS Sandbox

Repository relating to the Analyse Bus Registration Data service that is offered by DfT (Department for Transport).
Specifically this contains code relating to the Frontend UI and GraphQL API components.

## Category

Supporting application frontend microservices.

## Tech Stack

- AngularJS
- ExpressJS
- TypeScript
- AWS SAM (Serverless Application Model)

## Documentation

[Link to Confluence Page](https://kpmgengineering.atlassian.net/wiki/spaces/BODS/pages/643596338/ABODS)

## Useful Links

- [Reusable Actions](https://github.com/KPMG-UK/pcoe-eng-github-actions-library)
- [DPP Engineering Documentation](https://kpmgengineering.atlassian.net/wiki/spaces/DPPENG/overview?homepageId=352288946)
- [Raise a request(CE/PE Portal)](https://kpmgengineering.atlassian.net/servicedesk/customer/portal/1/group/-1)

## Getting started

Many instructions below reference tasks defined in `.mise.toml`. If you prefer running tasks
without [mise](https://mise.jdx.dev/about.html), then you can reference the file to find the commands to run.
You will also need to install the tooling defined in the same config.

Some tasks use [granted](https://docs.commonfate.io/granted/introduction) to prompt for AWS profiles to assume. If you
prefer to assume roles another way, then just ignore those parts.

If you would like to use `mise` as a task runner, then start by running `mise install` to install some necessary tooling.
Then run `mise tasks` to see the available tasks

### Manual config

Currently, you need to manually set some values in `frontend/src/config.json` in order to work with mapbox.
Ask for help setting these values.

### Run front end against Sandbox API

To run the front end in a dev server, connected to the Sandbox API, then run `mise r app:sandbox` to start the app.

### Connect to database as read-only user

To check the current state of the Sandbox database, begin by starting the DB proxy as stated above, then in another
terminal run `mise r db-creds`

This will print the necessary details to the terminal, which can be used to connect using your preferred client.

### Run front end against local API connected to Sandbox DB

If you would also like to test the API, you can follow these sections in order.

#### Run a proxy to the Sandbox database

To connect a proxy server to the Sandbox DB using AWS SSM, follow these steps:

First, install the AWS CLI, and
the [session manager plugin](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-working-with-install-plugin.html)

The run `mise r db` to start the proxy.

**Be aware that the db connection will time out after a period of inactivity.**

#### Run API against Sandbox database

To run the API in a dev server, connected to the Sandbox DB, begin by starting the DB proxy as stated above, then in
another terminal run `mise r api` to start the server.

### Run front end against Sandbox API

To run the front end in a dev server, connected to the local API server, begin by starting the API as stated above, then
in another terminal run `mise r app` to start the dev server.

## Versions

All changes to the API and Frontend will be deployed after a merge to the sandbox branch.
When you are ready to push to the next environment, merge another change to update the version number in `VERSION`