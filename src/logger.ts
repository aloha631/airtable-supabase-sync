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

  error: (message: string, error?: any) => {
    console.error(`[${new Date().toISOString()}] [ERROR] ${message}`);
    if (error) {
      if (error.stack) {
        console.error(error.stack);
      } else if (typeof error === 'object') {
        console.error(JSON.stringify(error, null, 2));
      } else {
        console.error(error);
      }
    }
  },
};
