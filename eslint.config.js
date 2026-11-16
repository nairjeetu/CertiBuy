import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default [
  {
    ignores: ["**/node_modules/**", "**/dist/**", "**/.next/**", "**/coverage/**"],
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
    },
  },
  {
    files: [
      "packages/domain/**/*.ts",
      "packages/application/**/*.ts",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@supabase/*"],
              message:
                "domain/ and application/ must not import @supabase/*. Only packages/integrations/supabase/ and packages/db/supabase/ may know Supabase exists.",
            },
            {
              group: ["next", "next/*"],
              message:
                "domain/ and application/ must not import Next.js. Keep business logic framework-free.",
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      "packages/domain/src/**/*.ts",
      "packages/application/src/**/*.ts",
    ],
    ignores: [
      "**/*.test.ts",
      "**/business-date.ts",
    ],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "NewExpression[callee.name='Date']",
          message: "Domain code must not call new Date(). Inject the business date or timestamp as a parameter.",
        },
        {
          selector: "MemberExpression[object.name='Date'][property.name='now']",
          message: "Domain code must not call Date.now(). Inject the timestamp as a parameter.",
        },
      ],
    },
  },
];
