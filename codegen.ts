import type { CodegenConfig } from '@graphql-codegen/cli';
import { DateResolver, DateTimeResolver, TimeResolver } from 'graphql-scalars';

const config: CodegenConfig = {
  overwrite: true,
  schema: 'abods-api/schema.graphql',
  documents: 'frontend/**/*.graphql',
  generates: {
    'frontend/src/generated/graphql.ts': {
      plugins: ['typescript', 'typescript-operations', 'typescript-apollo-angular']
    },
    'frontend/graphql.schema.json': {
      plugins: ['introspection']
    },
    'abods-api/src/types/generated.ts': {
      plugins: ['typescript', 'typescript-resolvers'],
      config: {
        useIndexSignature: true,
        contextType: './extra#RequestContext',
        defaultMapper: 'Partial<{T}>',
        scalars: {
          Date: DateResolver.extensions.codegenScalarType,
          DateTime: DateTimeResolver.extensions.codegenScalarType,
          Time: TimeResolver.extensions.codegenScalarType
        }
      }
    }
  },
  config: {
    scalars: {
      Date: "string",
      DateTime: "string",
      Time: "string"
    }
  }
};

export default config;
