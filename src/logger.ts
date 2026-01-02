/**
 * Simple logging utility
 */

export const logger = {
  info: (message: string) => {
    console.log(`[${new Date().toISOString()}] [INFO] ${message}`);
  },

  success: (message: string) => {
    console.log(`[${new Date().toISOString()}] [SUCCESS] ${message}`);
  },

  warn: (message: string) => {
    console.warn(`[${new Date().toISOString()}] [WARN] ${message}`);
  },

  error: (message: string, error?: Error) => {
    console.error(`[${new Date().toISOString()}] [ERROR] ${message}`);
    if (error) {
      console.error(error.stack);
    }
  },
};
