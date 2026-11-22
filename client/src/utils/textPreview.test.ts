import { describe, expect, it } from 'vitest';
import { decodeText, isTextPreviewable } from 'utils/textPreview';

function bytes(...values: number[]) {
  return new Uint8Array(values).buffer;
}

describe('isTextPreviewable', () => {
  it('accepts txt, md and log in any case', () => {
    expect(isTextPreviewable('notes.TXT')).toBe(true);
    expect(isTextPreviewable('README.md')).toBe(true);
    expect(isTextPreviewable('server.log')).toBe(true);
    expect(isTextPreviewable('data.json')).toBe(false);
    expect(isTextPreviewable('txt')).toBe(true);
  });
});

describe('decodeText', () => {
  it('decodes UTF-8', () => {
    expect(decodeText(new TextEncoder().encode('안녕 hello').buffer)).toBe('안녕 hello');
  });

  it('falls back to EUC-KR when the bytes are not valid UTF-8', () => {
    // "안녕" in CP949.
    expect(decodeText(bytes(0xbe, 0xc8, 0xb3, 0xe7))).toBe('안녕');
  });

  it('keeps UTF-8 when the size cap cuts a character in half', () => {
    const full = new TextEncoder().encode('가나');
    const cut = full.slice(0, full.length - 1).buffer;
    expect(decodeText(cut)).toBe('가');
  });
});
