import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { fetchObject as FetchObject } from 'utils/download';

vi.mock('utils/download', () => ({ fetchObject: vi.fn() }));

// The module keeps its cache and queue in module state, so each test loads a fresh copy.
async function load() {
  vi.resetModules();
  const download = await import('utils/download');
  const preview = await import('utils/preview');
  return { fetchObject: vi.mocked(download.fetchObject as typeof FetchObject), ...preview };
}

let urlSeq: number;

beforeEach(() => {
  urlSeq = 0;
  vi.spyOn(console, 'error').mockImplementation(() => {});
  // jsdom has no object URLs.
  URL.createObjectURL = vi.fn(() => `blob:${urlSeq++}`);
  URL.revokeObjectURL = vi.fn();
});

function deferred() {
  let resolve: () => void;
  const promise = new Promise<void>((r) => { resolve = r; });
  return { promise, resolve };
}

describe('isPreviewable', () => {
  it('accepts browser image formats up to 20MB', async () => {
    const { isPreviewable } = await load();
    expect(isPreviewable('a.JPG', 100)).toBe(true);
    expect(isPreviewable('a.svg', 100)).toBe(true);
    expect(isPreviewable('a.heic', 100)).toBe(false);
    expect(isPreviewable('a.png', 20 * 1024 * 1024)).toBe(true);
    expect(isPreviewable('a.png', 20 * 1024 * 1024 + 1)).toBe(false);
  });
});

describe('loadPreview', () => {
  it('fetches once and serves the cached URL afterwards', async () => {
    const { fetchObject, loadPreview } = await load();
    fetchObject.mockResolvedValue({ data: new Blob(['x']) } as never);
    const first = await loadPreview('b', 'p/', 'a.png', 1);
    const second = await loadPreview('b', 'p/', 'a.png', 1);
    expect(first).toBe('blob:0');
    expect(second).toBe('blob:0');
    expect(fetchObject).toHaveBeenCalledTimes(1);
  });

  it('shares one request between concurrent callers', async () => {
    const { fetchObject, loadPreview } = await load();
    fetchObject.mockResolvedValue({ data: new Blob(['x']) } as never);
    const [a, b] = await Promise.all([loadPreview('b', '', 'a.png', 1), loadPreview('b', '', 'a.png', 1)]);
    expect(a).toBe(b);
    expect(fetchObject).toHaveBeenCalledTimes(1);
  });

  it('tags the blob with the MIME type of the extension', async () => {
    const { fetchObject, loadPreview } = await load();
    fetchObject.mockResolvedValue({ data: new Blob(['x']) } as never);
    await loadPreview('b', '', 'a.svg', 1);
    const blob = vi.mocked(URL.createObjectURL).mock.calls[0][0] as Blob;
    expect(blob.type).toBe('image/svg+xml');
  });

  it('treats a size change as a different file', async () => {
    const { fetchObject, loadPreview } = await load();
    fetchObject.mockResolvedValue({ data: new Blob(['x']) } as never);
    await loadPreview('b', '', 'a.png', 1);
    await loadPreview('b', '', 'a.png', 2);
    expect(fetchObject).toHaveBeenCalledTimes(2);
  });

  it('resolves to null on failure and retries next time', async () => {
    const { fetchObject, loadPreview } = await load();
    fetchObject.mockRejectedValueOnce(new Error('boom'));
    fetchObject.mockResolvedValue({ data: new Blob(['x']) } as never);
    expect(await loadPreview('b', '', 'a.png', 1)).toBeNull();
    expect(await loadPreview('b', '', 'a.png', 1)).toBe('blob:0');
  });

  it('runs at most 4 requests at a time', async () => {
    const { fetchObject, loadPreview } = await load();
    let active = 0;
    let peak = 0;
    const gates: ReturnType<typeof deferred>[] = [];
    fetchObject.mockImplementation(async () => {
      active += 1;
      peak = Math.max(peak, active);
      const gate = deferred();
      gates.push(gate);
      await gate.promise;
      active -= 1;
      return { data: new Blob(['x']) } as never;
    });

    const all = Promise.all(Array.from({ length: 10 }, (_, i) => loadPreview('b', '', `${i}.png`, 1)));
    await vi.waitFor(() => expect(gates).toHaveLength(4));
    while (gates.some(Boolean)) {
      const open = gates.splice(0, gates.length);
      open.forEach(g => g.resolve());
      await new Promise(r => setTimeout(r, 0));
    }
    const urls = await all;
    expect(peak).toBe(4);
    expect(new Set(urls).size).toBe(10);
  });

  it('evicts the least recently used URL past 120 entries', async () => {
    const { fetchObject, loadPreview } = await load();
    fetchObject.mockResolvedValue({ data: new Blob(['x']) } as never);
    for (let i = 0; i < 120; i++) await loadPreview('b', '', `${i}.png`, 1);
    await loadPreview('b', '', '0.png', 1);  // touch 0 so 1 becomes the oldest
    await loadPreview('b', '', 'new.png', 1);
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:1');
  });

  it('dropPreview revokes and forgets the URL', async () => {
    const { fetchObject, loadPreview, dropPreview } = await load();
    fetchObject.mockResolvedValue({ data: new Blob(['x']) } as never);
    await loadPreview('b', '', 'a.png', 1);
    dropPreview('b', '', 'a.png', 1);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:0');
    await loadPreview('b', '', 'a.png', 1);
    expect(fetchObject).toHaveBeenCalledTimes(2);
  });
});
