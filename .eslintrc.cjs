/* eslint-env node */
require("@rushstack/eslint-patch/modern-module-resolution")

module.exports = {
    root : true,
    "plugins" : [
        "jest"
    ],
    "extends" : [
        "plugin:vue/vue3-essential",
        "eslint:recommended",
        "@vue/eslint-config-prettier/skip-formatting",
        "plugin:jest/recommended"
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
        "vue/html-self-closing" : [0],
        "space-before-function-paren" : ["error", "always"],
        "arrow-spacing" : ["error", { before : true, after : true }],
        "no-case-declarations" : 0,
        "no-prototype-builtins" : 0,
        "quotes" : ["error", "double", { "allowTemplateLiterals" : true }],
        "semi" : ["error", "always"],
        "jest/no-done-callback" : "off",
        "jest/no-conditional-expect" : "off"
    },
    globals : {
        "env" : false,
        "importScripts" : false,
        "jest" : false
    }
};
