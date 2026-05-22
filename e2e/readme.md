# Development Playwright

This folder exists to provide a utility to guide migration between the Angular (frontend) and Next.JS (frontend-two) services.

The tests should be extended as we go along.

## Setup (Local)

Please run the following commands to set your environment for local running

```bash

export PLAYWRIGHT_BASE_URL=http://localhost:4200
export TEST_USERNAME=<YOUR_ABODS_EMAIL>
export TEST_PASSWORD=<YOUR_ABODS_PASSWORD>

```

(This service assumes that you have a login to use the service)

### GitHub

The GitHub repository should be configured in line with the above with user agnostic credentials for the repo.

### Running

The test suit can be ran with the command
`npx playwright test` to run the entire suite headless. To run a specific test you can specify an option of `-g <text from test name> `.

By default the utility will run in headless mode - this can be reverted with `-headed` as an option.
