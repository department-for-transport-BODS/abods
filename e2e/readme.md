# Development Playwright

This folder exists to provide a utility to guide migration between the Angular (frontend) and Next.JS (frontend-two) services.

The tests should be extended as we go along.

## Setup (Local)

Please run the following commands to set your environment for local running

```bash

npm install
export TEST_USERNAME=<YOUR_ABODS_EMAIL>
export TEST_PASSWORD=<YOUR_ABODS_PASSWORD>
export TEST_NOC_CODE=<EXAMPLE_NOC_CODE> #(Optional for specific noc code related tests)
```

(This service assumes that you have a login to use the service)

The utility assumes a default value of `http://localhost:4200` as the service under test. This can be overridden by specifying `export PLAYWRIGHT_BASE_URL=<SERVICE_URL> `.

The service only needs user credentials for authenticated pages, to run solely on unauthenticated pages these need not be set.

### GitHub

The GitHub repository should be configured in line with the above with user agnostic credentials for the repo.

### Running

The test suit can be ran with the command
`npx playwright test` to run the entire suite headless. To run a specific test you can specify an option of `-g <text from test name> `.

By default the utility will run in headless mode - this can be reverted with `-headed` as an option.
