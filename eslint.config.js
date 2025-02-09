import js from "@eslint/js";
import ts from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import prettier from "eslint-config-prettier";

export default [
  js.configs.recommended,
  {
    files: ["**/*.ts"],
    ignores: ["node_modules/", "dist/"],
    languageOptions: {
      parser: tsParser, 
      sourceType: "module",
      globals: {
        console: "readonly",
        module: "readonly",
        require: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": ts, 
    },
    rules: {
      ...ts.configs.recommended.rules, 
    },
  },
  prettier, 
];
