/* global module */
module.exports = {
    moduleFileExtensions : ["js", "jsx", "ts", "tsx", "json", "vue"],
    transform : {
        "^.+\\.vue$" : "@vue/vue3-jest",
        ".+\\.(css|styl|less|sass|scss|png|jpg|jpeg|svg|ttf|woff|woff2)$" : "jest-transform-stub",
        "^.+\\.tsx?$" : "ts-jest"
    },
    moduleNameMapper : {
        "^@/(.*)$" : "<rootDir>/src/$1"
    },
    snapshotSerializers : ["jest-serializer-vue"],
    testMatch : ["**/*.spec.(js|jsx|ts|tsx)"],
    transformIgnorePatterns : ["/node_modules/"],
    collectCoverageFrom : ["src/**/*.{js,jsx,ts,tsx,vue}", "!src/main.ts"],
    coverageReporters : ["html", "text-summary"],
    setupFilesAfterEnv : ["./jest.setup.js"]
};