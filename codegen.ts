import type { CodegenConfig } from "@graphql-codegen/cli";
import { DateResolver, DateTimeResolver, TimeResolver } from "graphql-scalars";

const config: CodegenConfig = {
  overwrite: true,
  schema: "abods-api/schema.graphql",
  documents: ["frontend/src/graphql/**/*.graphql"],
  generates: {
    "abods-api/src/types/generated.ts": {
      plugins: ["typescript", "typescript-resolvers"],
      config: {
        useIndexSignature: true,
        contextType: "./extra#RequestContext",
        defaultMapper: "Partial<{T}>",
        scalars: {
          Date: DateResolver.extensions.codegenScalarType,
          DateTime: DateTimeResolver.extensions.codegenScalarType,
          Time: TimeResolver.extensions.codegenScalarType,
        },
      },
    },
    "frontend/src/generated/schema.ts": {
      plugins: ["typescript"],
      config: {
        avoidOptionals: {
          field: true,
          inputValue: false,
        },
        defaultScalarType: "unknown",
      },
    },
    "frontend/src/generated/graphql.ts": {
      plugins: [
        { add: { content: 'export * from "./schema";' } },
        "typescript-operations",
        "typed-document-node",
      ],
      config: {
        avoidOptionals: {
          field: true,
          inputValue: false,
        },
        enumValues: "./schema",
        defaultScalarType: "unknown",
        skipTypeNameForRoot: true,
      },
    },
  },
  config: {
    scalars: {
      Date: "string",
      DateTime: "string",
      Time: "string",
    },
  },
};

export default config;
