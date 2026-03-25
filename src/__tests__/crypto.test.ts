import { describe, it, expect } from 'vitest';
import { generateTransferCode, parseTransferCode, encrypt, decrypt } from '../crypto.js';

describe('transfer code', () => {
  it('generates a code and parses back to same key + gistId', () => {
    const gistId = 'abc123def456';
    const { code, key } = generateTransferCode(gistId);

    expect(code).toMatch(/^[a-z]+-[a-z]+-[a-z]+-[a-z0-9]+$/);

    const parsed = parseTransferCode(code);
    expect(parsed.key).toEqual(key);
    expect(parsed.gistId).toBe(gistId);
  });

  it('different calls produce different codes', () => {
    const { code: code1 } = generateTransferCode('gist1');
    const { code: code2 } = generateTransferCode('gist2');
    expect(code1).not.toBe(code2);
  });

  it('accepts an existing key', () => {
    const key = Buffer.alloc(32, 0xab);
    const { code, key: returnedKey } = generateTransferCode('mygist', key);
    expect(returnedKey).toEqual(key);
    const parsed = parseTransferCode(code);
    expect(parsed.key).toEqual(key);
    expect(parsed.gistId).toBe('mygist');
  });
});

describe('encrypt/decrypt', () => {
  it('round-trips data correctly', () => {
    const key = Buffer.alloc(32, 0xab);
    const data = Buffer.from('hello world this is session data');

    const encrypted = encrypt(data, key);
    expect(encrypted).not.toEqual(data);

    const decrypted = decrypt(encrypted, key);
    expect(decrypted).toEqual(data);
  });

  it('fails with wrong key', () => {
    const key1 = Buffer.alloc(32, 0xab);
    const key2 = Buffer.alloc(32, 0xcd);
    const data = Buffer.from('secret');

    const encrypted = encrypt(data, key1);
    expect(() => decrypt(encrypted, key2)).toThrow();
  });

  it('handles empty data', () => {
    const key = Buffer.alloc(32, 0x01);
    const data = Buffer.from('');
    const encrypted = encrypt(data, key);
    const decrypted = decrypt(encrypted, key);
    expect(decrypted).toEqual(data);
  });
});
