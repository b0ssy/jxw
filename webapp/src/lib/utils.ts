export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export const ONE_SECOND_IN_MILLISECONDS = 1000;
export const ONE_MINUTE_IN_MILLISECONDS = ONE_SECOND_IN_MILLISECONDS * 60;
export const ONE_HOUR_IN_MILLISECONDS = ONE_MINUTE_IN_MILLISECONDS * 60;
export const ONE_DAY_IN_MILLISECONDS = ONE_HOUR_IN_MILLISECONDS * 24;
export const ONE_WEEK_IN_MILLISECONDS = ONE_DAY_IN_MILLISECONDS * 7;
export const ONE_MONTH_IN_MILLISECONDS = ONE_DAY_IN_MILLISECONDS * 31;
export const ONE_YEAR_IN_MILLISECONDS = ONE_DAY_IN_MILLISECONDS * 365;

export const ONE_KILOBYTE_IN_BYTES = 1024;
export const ONE_MEGABYTE_IN_BYTES = ONE_KILOBYTE_IN_BYTES * 1024;
export const ONE_GIGABYTE_IN_BYTES = ONE_MEGABYTE_IN_BYTES * 1024;
export const ONE_TERABYTE_IN_BYTES = ONE_GIGABYTE_IN_BYTES * 1024;
export const ONE_PETABYTE_IN_BYTES = ONE_TERABYTE_IN_BYTES * 1024;

export const sleep = async (milliseconds: number) => {
  if (milliseconds > 0) {
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, milliseconds);
    });
  }
};

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

// Provide some convenient methods
export const sleepFn500ms = async <T>(fn: Promise<T>) => sleepFn(fn, 500);
export const sleepFn1000ms = async <T>(fn: Promise<T>) => sleepFn(fn, 1000);

export const capitalize = (str: string) => {
  return str.length > 0
    ? `${str.charAt(0).toUpperCase()}${str.substring(1)}`
    : "";
};

export const formatNumber = (value: number) => {
  const str = `${value}`;
  const chunks = [];
  let i = str.length - 3;
  for (; i >= 0; i -= 3) {
    chunks.unshift(str.substring(i, i + 3));
  }
  if (i < 0 && i > -3) {
    chunks.unshift(str.substring(0, 3 + i));
  }
  return chunks.join(",");
};

export const formatTime = (totalInMilliseconds: number, maxParts?: number) => {
  maxParts = maxParts ?? 999;

  const parts: string[] = [];

  let remainder = totalInMilliseconds;

  const days = Math.floor(remainder / ONE_DAY_IN_MILLISECONDS);
  if (days > 0 && parts.length < maxParts) {
    parts.push(`${days}d`);
    remainder = remainder - days * ONE_DAY_IN_MILLISECONDS;
  }

  const hours = Math.floor(remainder / ONE_HOUR_IN_MILLISECONDS);
  if (hours > 0 && parts.length < maxParts) {
    parts.push(`${hours}h`);
    remainder = remainder - hours * ONE_HOUR_IN_MILLISECONDS;
  }

  const minutes = Math.floor(remainder / ONE_MINUTE_IN_MILLISECONDS);
  if (minutes > 0 && parts.length < maxParts) {
    parts.push(`${minutes}m`);
    remainder = remainder - minutes * ONE_MINUTE_IN_MILLISECONDS;
  }

  const seconds = Math.floor(remainder / ONE_SECOND_IN_MILLISECONDS);
  if (seconds > 0 && parts.length < maxParts) {
    parts.push(`${seconds}s`);
    remainder = remainder - minutes * ONE_SECOND_IN_MILLISECONDS;
  }

  return parts.join(" ");
};

export const formatBytes = (totalInBytes: number, decimalPlaces?: number) => {
  decimalPlaces = decimalPlaces ?? 1;

  if (totalInBytes >= ONE_PETABYTE_IN_BYTES) {
    return `${(totalInBytes / ONE_PETABYTE_IN_BYTES).toFixed(
      decimalPlaces
    )} PB`;
  } else if (totalInBytes >= ONE_TERABYTE_IN_BYTES) {
    return `${(totalInBytes / ONE_TERABYTE_IN_BYTES).toFixed(
      decimalPlaces
    )} TB`;
  } else if (totalInBytes >= ONE_GIGABYTE_IN_BYTES) {
    return `${(totalInBytes / ONE_GIGABYTE_IN_BYTES).toFixed(
      decimalPlaces
    )} GB`;
  } else if (totalInBytes >= ONE_MEGABYTE_IN_BYTES) {
    return `${(totalInBytes / ONE_MEGABYTE_IN_BYTES).toFixed(
      decimalPlaces
    )} MB`;
  } else if (totalInBytes >= ONE_KILOBYTE_IN_BYTES) {
    return `${(totalInBytes / ONE_KILOBYTE_IN_BYTES).toFixed(
      decimalPlaces
    )} KB`;
  } else {
    return `${totalInBytes.toFixed(decimalPlaces)} B`;
  }
};

// RFC2822
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
