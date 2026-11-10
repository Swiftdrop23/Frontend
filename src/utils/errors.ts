export const errMessage = (err: unknown): string =>
  err instanceof Error ? err.message : "Something went wrong. Please try again.";
