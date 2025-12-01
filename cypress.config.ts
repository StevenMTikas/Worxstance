import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    supportFile: false,
    defaultCommandTimeout: 10000, // Increase global timeout
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
