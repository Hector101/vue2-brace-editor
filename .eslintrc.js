module.exports = {
    extends: "plugin:vue/strongly-recommended",
    "parserOptions": {
      "ecmaVersion": 2017
    },
    plugins: [
      "promise",
      "async-await"
    ],
    rules: {
      "async-await/space-after-async": 2,
      "async-await/space-after-await": 2
    }
  }