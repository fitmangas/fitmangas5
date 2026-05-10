import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

describe('email sender audit', () => {
  it('aucun fichier source ne contient l’ancien expéditeur Gmail', () => {
    let result = '';
    const legacySender = ['ale.mangas5', 'gmail.com'].join('@');
    try {
      result = execFileSync('git', ['grep', '-n', legacySender, '--', '.'], {
        cwd: process.cwd(),
        encoding: 'utf8',
        stdio: 'pipe',
      });
    } catch {
      result = '';
    }

    expect(result.trim()).toBe('');
  });
});
