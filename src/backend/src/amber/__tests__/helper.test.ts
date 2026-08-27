import { describe, expect, it } from 'vitest';
import { errorMessage, isString } from '../helper';

describe('isString', () => {
  it('returns true for string primitives and String objects', () => {
    expect(isString('hello')).toBe(true);
    expect(isString(new String('hello'))).toBe(true);
  });

  it('returns false for non-strings', () => {
    expect(isString(42)).toBe(false);
    expect(isString(null)).toBe(false);
  });
});

describe('errorMessage', () => {
  it('extracts the message from an Error instance', () => {
    expect(errorMessage(new Error('boom'))).toBe('boom');
  });

  it('stringifies non-Error values', () => {
    expect(errorMessage('plain string')).toBe('plain string');
  });
});
