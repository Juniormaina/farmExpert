// Turn a failed request into a sentence a farmer can act on. Validation
// messages from the server (4xx with their own wording) stay as written.
export function userFacingError(err: unknown, fallback: string): string {
  if (err instanceof Error && /^Something went wrong\. Reference: FE-[0-9A-F]{6}$/.test(err.message)) {
    return err.message;
  }
  if (err instanceof Error && "status" in err) {
    const status = (err as Error & { status?: unknown }).status;
    if (typeof status === "number" && status >= 400 && status < 500 && err.message && !/^Request failed/i.test(err.message)) {
      return err.message;
    }
  }
  return fallback;
}
