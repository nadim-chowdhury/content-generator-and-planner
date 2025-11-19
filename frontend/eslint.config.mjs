import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  // ...nextVitals,
  // ...nextTs,

  // You can place the rules here to override or add to the imported configs.
  {
    // These rules will apply globally, overriding any conflicting rules
    // from nextVitals or nextTs if they are defined before this object.
    // It's often best to put overrides last.
    rules: {
      // Example rule: enforce double quotes for strings
      quotes: ["error", "double"],

      // Example rule: require semicolons
      semi: ["error", "always"],

      // Example rule: disable a rule from the imported configs
      "@next/next/no-img-element": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-floating-promises": "warn",
      "@typescript-eslint/no-unsafe-argument": "warn",
      "@typescript-eslint/no-unsafe-assignment": "warn",
      "@typescript-eslint/no-unsafe-call": "warn",
      "@typescript-eslint/no-unsafe-member-access": "warn",
      "@typescript-eslint/no-unsafe-return": "warn",
      "@typescript-eslint/no-unsafe-enum-comparison": "warn",
    },
  },

  ...nextVitals,
  ...nextTs,

  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
