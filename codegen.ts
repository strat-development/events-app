import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  schema: "https://eu-west-2.cdn.hygraph.com/content/cm41894k5006507w6f1191dj1/master",
  documents: "./src/**/*.graphql",
  generates: {
    "src/types/graphQlTypes.ts": {
      plugins: [
        "typescript",
        "typescript-operations",
        "fragment-matcher",
        "named-operations-object",
      ],
      config: {
        apolloClientVersion: 3,
        useExplicitTyping: true,
        scalars: {
          JSON: "string",
        },
      },
    },
    "./graphql.schema.json": {
      plugins: ["introspection"],
    },
    "src/": {
      preset: "near-operation-file",
      presetConfig: {
        extension: ".generated.tsx",
        baseTypesPath: "/types/graphQlTypes.ts",
      },
      plugins: ["typescript-operations", "typescript-react-apollo"],
      config: {
        withHooks: true,
      },
    },
  },
};

export default config;