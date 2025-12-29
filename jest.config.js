/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/test"],
  testMatch: ["**/*.test.ts"],
  moduleNameMapper: {
    "^obsidian$": "<rootDir>/test/__mocks__/obsidian.ts",
  },
  collectCoverageFrom: ["src/**/*.ts", "!src/main.ts", "!src/views/**"],
};
