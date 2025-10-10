# Getting started

You can use https://mise.jdx.dev/ as a tool manager and task runner.
If that is installed and on your PATH, you should be able to run `mise install` to install required tools.

> [!NOTE]
> If you don't wish to use mise, check the versions of tools in [mise.toml](../mise.toml)/[.nvmrc](../.nvmrc) and install matching versions.
> `.nvmrc` is used to provide compatiblity with NVM.
>
> The rest of the guide will assume usage of that tool, but you can check [mise.toml](../mise.toml) to find the commands to run.

Run `mise tasks` to get a list of tasks you can run.
Many tasks use [Granted](https://docs.commonfate.io/granted/getting-started), and its `assume` command for convenience when working across multiple AWS accounts.
You may also wish to manage this differently.

You can run `npm i` to install dependencies on each subproject, and perform code generation.
It can be helpful to repeat this whenever changing Prisma or GraphQL code.

Run `mise r setup` to perform additional local setup.

## Manual config

Currently, you need to manually set some values in `frontend/src/config.json` in order to work with mapbox.
Ask someone to give you a token you can use locally.

> [!IMPORTANT]  
> Don't commit the token. Consider finding a way to prevent doing that accidentally.

## Running site locally

Run `mise r start` to start a connection to the sandbox database, the API, and front end.
It will give you a link to open the UI in your browser after an initial build.

### Run front end against deployed APIs

To run the front end in a dev server, connected to the Sandbox API, then run `mise r app:sandbox` to start the app.

There is a corresponding task for the UAT API, but your .env file will need to be updated.
That is left as an exercise for the reader

## Feature flags

You might want to your changes to be switched off in the deployed version of the code, while still integrating your changes into the sandbox branch regularly.
You can add a feature flag to do this.

To start, Add the flag to the `FeatureFlag` enum in [schema.graphql](../abods-api/schema.graphql).

Flag values are passed to the result of the `user` query, and so are available wherever you can inject `AuthenticatedUserService`.

By default, `true` is passed to the front end for all flags when running locally, but in the deployed code, it will need to be switched on.

Set `ABODS_FLAG_$name-of-flag` as an environment variable on the deployed lambda, with the value `true` to turn on.
If you do this on a running lambda, it will be switched off on the next deployment, so add any long-lived flags to [template.yaml](../abods-api/template.yaml)
