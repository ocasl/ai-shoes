export default {
    extends: [
      "stylelint-config-standard",
      "stylelint-config-recommended-vue"
    ],
    overrides: [
      {
        files: ["*.vue", "**/*.vue"],
        customSyntax: "postcss-html"
      }
    ],
    rules: {
      "selector-no-duplicate": true,
      "declaration-block-no-duplicate-properties": true
    }
  }