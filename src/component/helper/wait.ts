// Utility that repeatedly checks for a library on the global window object
// and resolves once the library becomes available.
export const waitForLibrary = (
  library: string,
  interval: number = 100,
  timeout: number = 10000
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const check = () => {
      // Success: the library is now present on window → resolve the promise
      if (typeof window[library as keyof Window] !== 'undefined') {
        resolve();
      } else if (Date.now() - startTime > timeout) {
        // Failure: we have waited longer than the allowed timeout → reject
        reject(`${library} not found`);
      } else {
        // Retry: schedule another check after the specified interval
        setTimeout(check, interval);
      }
    };

    // Start polling immediately on the next microtask tick
    check();
  });
};
