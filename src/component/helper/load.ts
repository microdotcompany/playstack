/**
 * Configuration object mapping library names to their script sources.
 * Each entry contains the CDN URL and optional loading attributes.
 */
const scripts = {
  YT: 'https://www.youtube.com/iframe_api',
  playerjs: 'https://assets.mediadelivery.net/playerjs/player-0.1.0.min.js',
  Vimeo: 'https://player.vimeo.com/api/player.js',
  Hls: 'https://cdn.jsdelivr.net/npm/hls.js@1',
  dashjs: 'https://cdn.dashjs.org/latest/modern/umd/dash.all.min.js'
};

/**
 * Dynamically loads an external JavaScript library and waits for it to become available
 * on the global window object. If the script is already loaded, it will skip loading
 * and immediately check for availability.
 *
 * @param library - The name of the library to load (must match a key in the scripts object)
 * @param interval - Polling interval in milliseconds to check for library availability (default: 100ms)
 * @param timeout - Maximum time to wait for the library to load in milliseconds (default: 10000ms)
 * @returns A Promise that resolves when the library is available on window, or rejects if timeout is exceeded
 * @throws Rejects with an error message if the library fails to load within the timeout period
 */
export const loadLibrary = (
  library: string,
  interval: number = 100,
  timeout: number = 10000
): Promise<void> => {
  return new Promise((resolve, reject) => {
    // get the source of the library
    const source = scripts[library as keyof typeof scripts];

    // Check if script tag already exists in the document head to avoid duplicate loading
    if (!document.head.querySelector(`script[src="${source}"]`)) {
      const script = document.createElement('script');
      script.src = source;
      script.type = 'text/javascript';
      // Set async attribute
      script.async = true;
      document.head.appendChild(script);
    }

    const startTime = Date.now();

    /**
     * Recursive polling function that checks for library availability on the window object.
     * Continues checking at specified intervals until the library is found or timeout is reached.
     */
    const check = () => {
      // Success: the library is now present on window → resolve the promise
      if (typeof window[library as keyof Window] !== 'undefined') {
        console.log(`${library} loaded`);
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
