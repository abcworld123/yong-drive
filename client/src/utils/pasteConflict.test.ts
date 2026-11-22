import Swal, { type SweetAlertOptions, type SweetAlertResult } from 'sweetalert2';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveConflicts } from 'utils/pasteConflict';
import type { ConflictResolution, ObjectInfo, PasteConflict } from 'types/apis';

vi.mock('sweetalert2', () => ({ default: { fire: vi.fn() } }));

const fire = vi.mocked(Swal.fire) as unknown as ReturnType<typeof vi.fn>;

interface Answer {
  pick?: ConflictResolution;
  applyAll?: boolean;
  cancel?: boolean;
}

const shown: { title: string; html: HTMLElement }[] = [];

/** Answers each modal in order: clicks the requested radio and checkbox in the real DOM, then confirms. */
function answer(...answers: Answer[]) {
  const queue = [...answers];
  fire.mockImplementation(async (options: SweetAlertOptions) => {
    const html = options.html as HTMLElement;
    shown.push({ title: options.titleText, html });
    const next = queue.shift();
    if (!next) throw new Error('more modals than expected');
    if (next.cancel) return { isConfirmed: false } as SweetAlertResult;
    if (next.pick) html.querySelector<HTMLInputElement>(`input[type=radio][value=${next.pick}]`).checked = true;
    if (next.applyAll) html.querySelector<HTMLInputElement>('input[type=checkbox]').checked = true;
    const value = await (options.preConfirm as () => unknown)();
    return { isConfirmed: true, value } as SweetAlertResult;
  });
}

function file(size: number): ObjectInfo {
  return { type: 'file', name: 'x', size, mtime: 0 };
}

function conflict(name: string, src: ObjectInfo = file(1), dst: ObjectInfo = file(2)): PasteConflict {
  return { name, src, dst };
}

beforeEach(() => {
  shown.length = 0;
});

describe('resolveConflicts', () => {
  it('asks nothing when there are no conflicts', async () => {
    expect(await resolveConflicts([])).toEqual({});
    expect(fire).not.toHaveBeenCalled();
  });

  it('defaults to rename', async () => {
    answer({});
    expect(await resolveConflicts([conflict('a.txt')])).toEqual({ 'a.txt': 'rename' });
  });

  it('asks about each conflict in turn and keeps each choice', async () => {
    answer({ pick: 'overwrite' }, { pick: 'skip' });
    const result = await resolveConflicts([conflict('a.txt'), conflict('b.txt')]);
    expect(result).toEqual({ 'a.txt': 'overwrite', 'b.txt': 'skip' });
    expect(shown.map(s => s.title)).toEqual(['이름이 같은 항목이 있습니다 (1/2)', '이름이 같은 항목이 있습니다 (2/2)']);
  });

  it('applies the choice to the remaining conflicts when asked to', async () => {
    answer({ pick: 'skip' }, { pick: 'overwrite', applyAll: true });
    const result = await resolveConflicts([conflict('a'), conflict('b'), conflict('c'), conflict('d')]);
    expect(result).toEqual({ a: 'skip', b: 'overwrite', c: 'overwrite', d: 'overwrite' });
    expect(fire).toHaveBeenCalledTimes(2);
  });

  it('returns null on cancel so the whole paste is aborted', async () => {
    answer({ pick: 'skip' }, { cancel: true });
    expect(await resolveConflicts([conflict('a'), conflict('b'), conflict('c')])).toBeNull();
  });

  it('only offers apply-to-all while conflicts remain', async () => {
    answer({}, {});
    await resolveConflicts([conflict('a'), conflict('b')]);
    expect(shown[0].html.querySelector('input[type=checkbox]')).not.toBeNull();
    expect(shown[0].html.textContent).toContain('(남은 1개)');
    expect(shown[1].html.querySelector('input[type=checkbox]')).toBeNull();
  });

  it('shows the rename example the server will produce', async () => {
    answer({}, {}, {});
    const folder: ObjectInfo = { type: 'folder', name: 'x/', size: 0, fileCount: 0 };
    await resolveConflicts([conflict('photo.v2.jpg'), conflict('.env'), conflict('my.dir/', folder, folder)]);
    expect(shown[0].html.textContent).toContain('"photo.v2 (1).jpg"');
    expect(shown[1].html.textContent).toContain('".env (1)"');
    expect(shown[2].html.textContent).toContain('"my.dir (1)"');
  });

  it('warns that overwriting a folder deletes its contents', async () => {
    answer({});
    const folder: ObjectInfo = { type: 'folder', name: 'x/', size: 10, fileCount: 3 };
    await resolveConflicts([conflict('dir/', folder, folder)]);
    const text = shown[0].html.textContent;
    expect(text).toContain('dir 폴더이(가) 붙여넣을 위치에 이미 있습니다.');
    expect(text).toContain('기존 폴더와 그 안의 내용이 모두 삭제');
    expect(text).toContain('폴더 · 3개 · 10B');
  });

  it('puts the file name in as text, not HTML', async () => {
    answer({});
    await resolveConflicts([conflict('<img src=x onerror=alert(1)>.txt')]);
    expect(shown[0].html.querySelector('img')).toBeNull();
    expect(shown[0].html.textContent).toContain('<img src=x onerror=alert(1)>.txt');
  });
});
