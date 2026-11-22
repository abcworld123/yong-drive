import { describe, expect, it } from 'vitest';
import { convUnit, fileExt, formatTime } from 'utils/tools';

describe('convUnit', () => {
  it('uses 1024-based units, two decimals below 10 and one above', () => {
    expect(convUnit(0)).toBe('0B');
    expect(convUnit(1536)).toBe('1.5KB');
    expect(convUnit(1234567)).toBe('1.18MB');
    expect(convUnit(15.5 * 1024 ** 3)).toBe('15.5GB');
    expect(convUnit(123.45 * 1024 ** 2)).toBe('123.5MB');
  });
});

describe('fileExt', () => {
  it('is the lowercased part after the last dot', () => {
    expect(fileExt('Photo.JPG')).toBe('jpg');
    expect(fileExt('archive.tar.gz')).toBe('gz');
  });

  it('is the whole name when there is no dot', () => {
    // Callers only look extensions up in fixed tables, so this never matches by accident.
    expect(fileExt('README')).toBe('readme');
  });
});

describe('formatTime', () => {
  it('pads date and time in local time', () => {
    const ms = new Date(2026, 0, 5, 7, 3).getTime();
    expect(formatTime(ms)).toEqual({ date: '2026-01-05', time: '07:03' });
  });
});
