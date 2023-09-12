// Provide simple utility functions

// Sleep for X milliseconds
export const sleep = async (milliseconds: number) => {
  if (milliseconds > 0) {
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, milliseconds);
    });
  }
};

// Execute Promise with minimum sleep duration in milliseconds
export const sleepFn = async <T>(fn: Promise<T>, milliseconds: number) => {
  const start = Date.now();
  let error: any;
  const result = await fn.catch((err) => {
    error = err;
  });
  const duration = Date.now() - start;
  if (duration < milliseconds) {
    await sleep(milliseconds - duration);
  }
  if (error) {
    throw error;
  }
  return result;
};
export const sleepFn500ms = async <T>(fn: Promise<T>) => sleepFn(fn, 500);
export const sleepFn1000ms = async <T>(fn: Promise<T>) => sleepFn(fn, 1000);

// Check if a string is of valid email format based on RFC2822
// https://regexr.com/2rhq7
export const isValidEmail = (email: string) => {
  return !!email.match(
    // eslint-disable-next-line
    /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/g
  );
};

// Helper function for axios config
export const isJsonMime = (mime: string) => {
  const jsonMime: RegExp = new RegExp(
    // eslint-disable-next-line
    "^(application/json|[^;/ \t]+/[^;/ \t]+[+]json)[ \t]*(;.*)?$",
    "i"
  );
  return (
    mime !== null &&
    (jsonMime.test(mime) ||
      mime.toLowerCase() === "application/json-patch+json")
  );
};
