import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // You can place the rules here to override or add to the imported configs.
  {
    // These rules will apply globally, overriding any conflicting rules
    // from nextVitals or nextTs. Rules are applied after configs are spread.
    rules: {
      // Example rule: enforce double quotes for strings
      quotes: ["error", "double"],

      // Example rule: require semicolons
      semi: ["error", "always"],

      // Example rule: disable a rule from the imported configs
      "@next/next/no-img-element": "off",
      "@typescript-eslint/no-explicit-any": "off",
      // Disable type-aware rules that require parserOptions configuration
      // These can be re-enabled if parserOptions are properly configured
      "@typescript-eslint/no-floating-promises": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unsafe-enum-comparison": "off",
      // Disable unescaped entities rule (mostly stylistic, can be handled by prettier)
      "react/no-unescaped-entities": "off",
    },
  },

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
