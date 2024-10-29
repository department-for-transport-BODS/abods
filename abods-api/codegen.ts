import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  schema: "./src/schema.graphql",
  generates: {
    "src/types/generated.ts": {
      plugins: ["typescript", "typescript-resolvers"],
      config:{
        useIndexSignature: true,
        contextType: "./extra#RequestContext",
        avoidOptionals: false,
        maybeValue: 'T | undefined | null'
      }
    }
  },

};

export default config;
