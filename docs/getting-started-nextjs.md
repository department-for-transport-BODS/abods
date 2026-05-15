# Getting started

This is an updated getting started guide for the new Next.js version of the front end.

You can use https://mise.jdx.dev/ as a tool manager and task runner.
If that is installed and on your PATH, you should be able to run `mise install` to install required tools.

> [!NOTE]
> If you don't wish to use mise, check the versions of tools in [mise.toml](../mise.toml)/[.nvmrc](../.nvmrc) and install matching versions.
> `.nvmrc` is used to provide compatiblity with NVM.
>
> The rest of the guide will assume usage of that tool, but you can check [mise.toml](../mise.toml) to find the commands to run.

Run `mise tasks` to get a list of tasks you can run. Make sure your AWS credentials are configured and you are authenticated against the sandbox environment before running the application locally.

You can run `npm i` to install dependencies on each subproject, and perform code generation.
It can be helpful to repeat this whenever changing Prisma or GraphQL code.

Run `mise r setup` to perform additional local setup.

## Prerequisites

- **AWS Session Manager Plugin**: Required for database proxy and SSM tasks. For mac users using brew this can be installed by running:
  
  ```sh
  brew install --cask session-manager-plugin
  ``` 
  
 Otherwise, follow the [official AWS instructions](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-working-with-install-plugin.html).


## Manual config

Some configuration values (such as the Mapbox token) must be set manually for local development.

A template file is provided at `frontend-two/public/config.example.json`. To set up your local config:

1. Copy `frontend-two/public/config.example.json` to `frontend-two/public/config.json`.
2. Fill in the required values, such as your Mapbox token. You may need to ask a team member for a token you can use locally.

> [!IMPORTANT]
> Don't commit the token. The example file is safe to commit, but your actual `config.json` should be kept out of source control. Consider finding a way to prevent doing that accidentally.

## Running site locally

Run `mise r start-next` to start a connection to the sandbox database, the API, and the new Next.js front end.
It will give you a link to open the UI in your browser after an initial build.

### Run front end against deployed APIs

With the old Angular front end it was possible to run it in a dev server, connected to the Sandbox API. 

Further investigation is needed to determine if this is possible with the new Next.js front end.

