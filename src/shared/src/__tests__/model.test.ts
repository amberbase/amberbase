import { describe, expect, it } from 'vitest';
import { adminRole, globalTenant } from '../index';

describe('shared model constants', () => {
  it('exposes the admin role and global tenant identifiers', () => {
    expect(adminRole).toBe('admin');
    expect(globalTenant).toBe('*');
  });
});
