/* global module */
module.exports = {
    moduleFileExtensions : ["js", "jsx", "ts", "tsx", "json", "vue"],
    preset : "ts-jest",
    testEnvironment : "jsdom",
    transform : {
        "^.+\\.vue$" : "@vue/vue3-jest",
        "^.+\\.tsx?$" : "ts-jest"
    },
    moduleNameMapper : {
        "^@/(.*)$" : "<rootDir>/src/$1"
    },
    testMatch : ["**/*.spec.(js|jsx|ts|tsx)"],
    transformIgnorePatterns : ["/node_modules/"],
    collectCoverageFrom : ["src/**/*.{js,jsx,ts,tsx,vue}", "!src/main.ts"],
    coverageReporters : ["html", "text-summary"],
    testPathIgnorePatterns : [
        "/tests/integration/"
    ]
};