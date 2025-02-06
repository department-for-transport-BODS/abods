// @ts-check
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import graphqlESLint from "@graphql-eslint/eslint-plugin";

export default tseslint.config(
  {
    ignores: [
      "tests/",
      "dist/",
      ".build/",
      "src/types/generated.ts",
      "**/*.config.ts",
      "codegen.ts",
    ],
  },
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: ".",
      },
    },
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
    ],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/ban-tslint-comment": "off",
      "@typescript-eslint/only-throw-error": "warn",
      "@typescript-eslint/prefer-nullish-coalescing": "warn",
      "@typescript-eslint/no-unsafe-enum-comparison": "warn",
    },
  },
  {
    files: ["**/*.graphql"],
    languageOptions: {
      parser: graphqlESLint.parser,
      parserOptions: {
        graphQLConfig: {
          schema: "./schema.graphql",
          documents: "../frontend/**/*.graphql",
        },
      },
    },
    plugins: {
      "@graphql-eslint": graphqlESLint,
    },
    rules: {
      ...graphqlESLint.configs["flat/schema-all"].rules,
      "@graphql-eslint/alphabetize": "off",
      "@graphql-eslint/input-name": "off",
      "@graphql-eslint/naming-convention": "off",
      "@graphql-eslint/no-root-type": "off",
      "@graphql-eslint/no-scalar-result-type-on-mutation": "off",
      "@graphql-eslint/no-typename-prefix": "off",
      "@graphql-eslint/require-description": "off",
      "@graphql-eslint/require-field-of-type-query-in-mutation-result": "off",
      "@graphql-eslint/require-nullable-result-in-root": "off",
      "@graphql-eslint/strict-id-in-types": "off",

      "@graphql-eslint/no-unused-fields": "error",
    },
  },
);
