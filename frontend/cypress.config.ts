import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    specPattern: 'cypress/integration/**/*.spec.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.ts',
    viewportWidth: 1280,
    viewportHeight: 800,
    video: false,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 15000, // Increased timeout for slower operations
    pageLoadTimeout: 30000, // Increased page load timeout
    requestTimeout: 15000, // Increased API request timeout
    responseTimeout: 30000, // Increased response timeout
    retries: {
      runMode: 2, // Retry failed tests in run mode
      openMode: 1, // Retry failed tests in open mode
    },
    setupNodeEvents(on, _config) {
      // implement node event listeners here
      on('task', {
        log(message) {
          console.log(message);
          return null;
        },
      });
    },
  },

  component: {
    devServer: {
      framework: 'next',
      bundler: 'webpack',
    },
    specPattern: 'cypress/component/**/*.spec.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/component.ts',
  },
});
