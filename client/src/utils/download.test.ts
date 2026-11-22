import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { downloadEach, downloadObjects } from 'utils/download';

interface Submitted {
  action: string;
  target: string;
  fields: [string, string][];
}

let submitted: Submitted[];

beforeEach(() => {
  submitted = [];
  // jsdom doesn't implement form submission; record what would have been sent instead.
  vi.spyOn(HTMLFormElement.prototype, 'submit').mockImplementation(function (this: HTMLFormElement) {
    const fields = Array.from(this.querySelectorAll('input'), (input): [string, string] => [input.name, input.value]);
    submitted.push({ action: this.action, target: this.target, fields });
  });
});

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = '';
});

describe('downloadObjects', () => {
  it('submits one hidden form POST with repeated filenames and removes it', () => {
    downloadObjects('b', 'docs/', ['a.txt', 'dir/']);
    expect(submitted).toHaveLength(1);
    const [form] = submitted;
    expect(form.action).toMatch(/\/object\/download\?dl=/);
    expect(form.target).toBe('');
    expect(form.fields).toEqual([
      ['bucket', 'b'],
      ['path', 'docs/'],
      ['filenames', 'a.txt'],
      ['filenames', 'dir/'],
    ]);
    expect(document.querySelector('form')).toBeNull();
  });

  it('gives every submit a different URL so download managers keep them apart', () => {
    downloadObjects('b', '', ['a.txt']);
    downloadObjects('b', '', ['a.txt']);
    expect(submitted[0].action).not.toBe(submitted[1].action);
  });
});

describe('downloadEach', () => {
  it('submits each item into its own iframe, staggered, and cleans the iframes up later', () => {
    vi.useFakeTimers();
    downloadEach('b', 'docs/', ['a.txt', 'b.txt', 'dir/']);
    expect(submitted).toHaveLength(0);

    vi.advanceTimersByTime(0);
    expect(submitted).toHaveLength(1);
    vi.advanceTimersByTime(300);
    expect(submitted).toHaveLength(2);
    vi.advanceTimersByTime(300);
    expect(submitted).toHaveLength(3);

    expect(submitted.map(s => s.fields.find(([k]) => k === 'filenames')[1])).toEqual(['a.txt', 'b.txt', 'dir/']);
    const targets = submitted.map(s => s.target);
    expect(new Set(targets).size).toBe(3);
    expect(document.querySelectorAll('iframe')).toHaveLength(3);
    for (const target of targets) {
      expect(document.querySelector(`iframe[name="${target}"]`)).not.toBeNull();
    }

    vi.advanceTimersByTime(60_000);
    expect(document.querySelectorAll('iframe')).toHaveLength(0);
  });
});
