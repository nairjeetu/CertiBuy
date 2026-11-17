// eslint-disable-next-line no-restricted-syntax -- constructing Date from ISO string, not reading wall clock
export const toDate = (iso: string) => new Date(iso);
