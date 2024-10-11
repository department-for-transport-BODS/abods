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

### Manual config

Currently, you need to manually set some values in `frontend/src/config.json` in order to work with mapbox.
Ask for help setting these values.

### Run front end against Sandbox API

To run the front end in a dev server, connected to the Sandbox API, follow these steps:

In `frontend/`, run `npm install`.
Then run `npm start -- --proxy-config src/proxy.sandbox.conf.json` to start the app.

Using the [mise](https://mise.jdx.dev/) task runner, run `mise install` once, then `mise r app:sandbox` to start the app

### Run front end against local API connected to Sandbox DB

If you would also like to test the API, you can follow these sections in order.

#### Run a proxy to the Sandbox database

To connect a proxy server to the Sandbox DB using AWS SSM, follow these steps:

First, install the AWS CLI, and
the [session manager plugin](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-working-with-install-plugin.html)

Then assume an AWS profile that can access the Sandbox account and run `./scripts/db_connect.sh`.

If using [mise](https://mise.jdx.dev/) as a task runner, run `mise install` once, then `mise r db` to start the app.
You will be prompted to choose an AWS profile that has access to the Sandbox account.

Be aware that the db connection will time out after a period of inactivity.

#### Run API against Sandbox database

To run the API in a dev server, connected to the Sandbox DB, start by completing the above section, then in another
terminal follow these steps:

First, install the AWS CLI, and the
[session manager plugin](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-working-with-install-plugin.html)

In `abods-api`, run `setup.sh` after assuming an AWS role for the sandbox environment.
Then run `serverless offline` to start the API.

If using [mise](https://mise.jdx.dev/) as a task runner, run `mise install` once, then `mise r api` to start the app.
You will be prompted to choose an AWS profile that has access to the Sandbox account.

### Run front end against Sandbox API

To run the front end in a dev server, connected to the Sandbox API, follow these steps:

To run the front end in a dev server, connected to the local API server, start by completing the above section, then in
another terminal follow these steps:

In `frontend/`, run `npm install`.
Then run `npm start` to start the app.

Using the [mise](https://mise.jdx.dev/) task runner, run `mise install` once, then `mise r app` to start the app
