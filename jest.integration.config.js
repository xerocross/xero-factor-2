/* global module */
module.exports = {
    moduleFileExtensions : ["js", "jsx", "ts", "tsx", "json", "vue"],
    testEnvironment : "jsdom",
    testEnvironmentOptions : {
        customExportConditions : ["node", "node-addons"]
    },
    transform : {
        "^.+\\.vue$" : "@vue/vue3-jest",
        "^.+\\.tsx?$" : "ts-jest"
    },
    moduleNameMapper : {
        "^@/(.*)$" : "<rootDir>/src/$1"
    },
    testMatch : ["**/tests/integration/*.spec.(js|jsx|ts|tsx)"],
    transformIgnorePatterns : ["/node_modules/"]
};