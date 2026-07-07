import { Response } from 'express';

/**
 * Standard success envelope: { data: <payload> }. Pairs with the error
 * envelope { error: { code, message } } so clients can branch on the key.
 */
export function sendData<T>(res: Response, data: T, status = 200): void {
  res.status(status).json({ data });
}
