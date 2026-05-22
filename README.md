# ABODS Frontend UI and GraphQL API

## 📋 Overview

This repository powers the user interface for the **Analyse Bus Open Data Service** offered by the UK Department for Transport.
It provides the web interface and API layer for interacting with bus service data analytics and insights.

## 🚀 Tech Stack

> [!IMPORTANT]  
> This repo is currently in active development, and we are in the process migrating the front end to Next.js. The source code for the Next.js frontend is in the `frontend-two` directory, while the existing Angular frontend remains in `frontend` until the migration is complete.

- **[Frontend](frontend):** Angular, TypeScript
- **[Frontend V2](frontend-two):** Next.js, TypeScript
- **[API](abods-api):** GraphQL, Apollo Server/Client, TypeScript
- **[Infrastructure](abods-api/template.yaml):** AWS SAM (Serverless Application Model)
- **[CI/CD](.github):** GitHub Actions
- **[E2E Testing](e2e/README.md)** Playwright development tests

## 🛠️ Getting Started

To set up your local development environment to work with the new Next.js stack, follow the [Getting Started Guide](./docs/getting-started-nextjs.md).

If you need to spin up the old Angular stack, follow the old [Getting Started Guide [OLD]](./docs/Getting%20Started.md).

### 📦 Deployment

For instructions on deploying through the path to live, refer to the [Deployment Guide](./docs/Deployment.md).

## 🔗 Useful Links

- [ABODS Documentation](https://kpmgengineering.atlassian.net/wiki/spaces/BODS/pages/643596338/ABODS)
- [Reusable Actions](https://github.com/KPMG-UK/pcoe-eng-github-actions-library)
- [DPP Engineering Documentation](https://kpmgengineering.atlassian.net/wiki/spaces/DPPENG/overview?homepageId=352288946)
- [Raise a request (CE/PE Portal)](https://kpmgengineering.atlassian.net/servicedesk/customer/portal/1/group/-1)
