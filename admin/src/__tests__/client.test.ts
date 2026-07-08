import { describe, it, expect } from 'vitest';
import { AxiosError } from 'axios';
import { apiErrorMessage } from '../api/client';

describe('apiErrorMessage', () => {
  it('uses the backend error envelope message', () => {
    const err = new AxiosError('Request failed');
    // @ts-expect-error minimal response shape for the test
    err.response = { data: { error: { message: 'Route not found' } } };
    expect(apiErrorMessage(err)).toBe('Route not found');
  });

  it('appends the first validation detail when present', () => {
    const err = new AxiosError('Request failed');
    // @ts-expect-error minimal response shape for the test
    err.response = {
      data: {
        error: { message: 'Validation failed', details: [{ message: 'rating too high' }] },
      },
    };
    expect(apiErrorMessage(err)).toBe('Validation failed: rating too high');
  });

  it('maps a network error to a friendly message', () => {
    const err = new AxiosError('Network Error');
    expect(apiErrorMessage(err)).toBe('Cannot reach the API server.');
  });

  it('falls back for a non-axios error', () => {
    expect(apiErrorMessage(new Error('boom'))).toBe('Something went wrong');
    expect(apiErrorMessage('nope', 'custom fallback')).toBe('custom fallback');
  });
});
