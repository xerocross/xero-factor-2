/* eslint-env node */
require("@rushstack/eslint-patch/modern-module-resolution");

module.exports = {
    root : true,
    "plugins" : [
        "jest",
        "@typescript-eslint"
    ],
    "extends" : [
        "plugin:vue/vue3-essential",
        "eslint:recommended",
        "@vue/eslint-config-prettier/skip-formatting",
        "plugin:jest/recommended",
        "plugin:@typescript-eslint/eslint-recommended",
        "plugin:@typescript-eslint/recommended"
    ],
    "overrides" : [
        {
            "files" : ["*.ts"],
            "parser" : "@typescript-eslint/parser",
            "plugins" : ["@typescript-eslint"]
        },
        {
            "files" : ["*.vue"],
            "parser" : "vue-eslint-parser",
            "parserOptions" : {
                "parser" : "@typescript-eslint/parser"
            }
        }
    ],
    parserOptions : {
        ecmaVersion : "latest"
    },
    rules : {
        "vue/prop-name-casing" : 1,
        "no-debugger" : process.env.NODE_ENV === "production" ? 2 : 0,
        "indent" : ["error", 4, { "SwitchCase" : 1 }],
        "comma-dangle" : ["error", "never"],
        "vue/html-indent" : ["error", 4, {
            "attribute" : 1,
            "closeBracket" : 0,
            "alignAttributesVertically" : true,
            "ignores" : []
        }],
        "key-spacing" : ["error", {
            "beforeColon" : true,
            "afterColon" : true,
            "mode" : "strict"
        }],
        "vue/html-self-closing" : "off",
        "space-before-function-paren" : ["error", "always"],
        "arrow-spacing" : ["error", { before : true, after : true }],
        "no-case-declarations" : 0,
        "no-prototype-builtins" : 0,
        "quotes" : ["error", "double", { "allowTemplateLiterals" : true }],
        "semi" : ["error", "always"],
        "jest/no-done-callback" : "off",
        "jest/no-conditional-expect" : "off",
        "@typescript-eslint/no-explicit-any" : "off",
        "@typescript-eslint/no-empty-function" : "off",
        "comma-spacing" : ["error", { "after" : true }],
        "@typescript-eslint/type-annotation-spacing" : ["error", {
            "before" : true,
            "after" : true
        }]
    },
    globals : {
        "env" : false,
        "importScripts" : false,
        "jest" : false
    }
};
