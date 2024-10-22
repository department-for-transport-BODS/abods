import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  schema: "./src/schema.graphql",
  generates: {
    "src/generated/graphql.ts": {
      plugins: ["typescript", "typescript-resolvers"],
      config:{
        useIndexSignature: true,
        contextType: "../requestContext#RequestContext"
      }
    }
  },

};

export default config;
