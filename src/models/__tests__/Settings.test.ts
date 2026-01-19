import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createDefaultSettings,
  generateAccountId,
  generateExportDisplayName,
  createAccount
} from '../Settings';

describe('Settings Model', () => {
  describe('createDefaultSettings', () => {
    it('returns valid default settings structure', () => {
      const settings = createDefaultSettings();

      expect(settings.version).toBeDefined();
      expect(settings.accounts).toEqual([]);
      expect(settings.preferences.masterDataPath).toBe('');
    });

    it('creates new object on each call', () => {
      const settings1 = createDefaultSettings();
      const settings2 = createDefaultSettings();

      expect(settings1).not.toBe(settings2);
    });
  });

  describe('generateAccountId', () => {
    it('generates unique IDs', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(generateAccountId());
      }

      expect(ids.size).toBe(100);
    });
  });

  describe('generateExportDisplayName', () => {
    it('combines institution and account name', () => {
      expect(generateExportDisplayName('TD Bank', 'Checking')).toBe('TD Bank - Checking');
      expect(generateExportDisplayName('First National', 'Savings')).toBe('First National - Savings');
    });
  });

  describe('createAccount', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-15T10:30:00.000Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('creates account with auto-generated display name and timestamps', () => {
      const account = createAccount('Chase', 'Checking');

      expect(account.id).toMatch(/^acc_/);
      expect(account.institutionName).toBe('Chase');
      expect(account.accountName).toBe('Checking');
      expect(account.exportDisplayName).toBe('Chase - Checking');
      expect(account.createdAt).toBe('2024-01-15T10:30:00.000Z');
      expect(account.updatedAt).toBe(account.createdAt);
    });

    it('uses custom export display name when provided', () => {
      const account = createAccount('Chase', 'Checking', undefined, 'My Custom Name');

      expect(account.exportDisplayName).toBe('My Custom Name');
    });

    it('sets account type when provided', () => {
      const savings = createAccount('Bank', 'Acc', 'savings');
      const noType = createAccount('Bank', 'Acc');

      expect(savings.accountType).toBe('savings');
      expect(noType.accountType).toBeUndefined();
    });
  });
});
