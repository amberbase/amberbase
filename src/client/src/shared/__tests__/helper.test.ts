import { describe, expect, it } from 'vitest';
import { CompletablePromise, sleep } from '../helper';

describe('CompletablePromise', () => {
  it('resolves its promise with the set value and prepares a new one for the next round', async () => {
    const completable = new CompletablePromise<number>();
    const firstRound = completable.promise;
    completable.set(42);
    await expect(firstRound).resolves.toBe(42);
    expect(completable.value).toBe(42);
    expect(completable.promise).not.toBe(firstRound);
  });
});

describe('sleep', () => {
  it('resolves after roughly the requested duration', async () => {
    const start = Date.now();
    await sleep(10);
    expect(Date.now() - start).toBeGreaterThanOrEqual(9);
  });
});
