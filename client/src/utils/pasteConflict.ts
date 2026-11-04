import Swal from 'sweetalert2';
import { convUnit, formatTime } from 'utils/tools';
import type { ConflictResolution, ObjectInfo, PasteConflict } from 'types/apis';

interface ConflictChoice {
  resolution: ConflictResolution;
  applyAll: boolean;
}

const RADIO_NAME = 'paste-conflict';
const DEFAULT_RESOLUTION: ConflictResolution = 'rename';

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string) {
  const node = document.createElement(tag);
  node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function describe(info: ObjectInfo) {
  const parts: string[] = [];
  if (info.type === 'folder') {
    parts.push(info.fileCount === 0 ? '빈 폴더' : `폴더 · ${(info.fileCount ?? 0).toLocaleString()}개 · ${convUnit(info.size ?? 0)}`);
  } else {
    parts.push(`파일 · ${convUnit(info.size ?? 0)}`);
  }
  if (info.mtime != null) {
    const { date, time } = formatTime(info.mtime);
    parts.push(`${date} ${time}`);
  }
  return parts.join(' · ');
}

// Mirrors PasteService.numberedName on the server; only used for the example shown in the modal.
function numberedName(name: string, isFolder: boolean) {
  const dot = name.lastIndexOf('.');
  if (isFolder || dot <= 0) return `${name} (1)`;
  return `${name.slice(0, dot)} (1)${name.slice(dot)}`;
}

function buildContent(conflict: PasteConflict, remaining: number) {
  const name = conflict.name.replace(/\/$/, '');
  const isFolder = conflict.src.type === 'folder';
  const dstIsFolder = conflict.dst.type === 'folder';

  const container = el('div', 'text-left text-[15px] text-neutral-700');

  const head = el('p', 'mb-3');
  head.append(el('b', 'break-all text-neutral-900', name), `${dstIsFolder ? ' 폴더' : ' 파일'}이(가) 붙여넣을 위치에 이미 있습니다.`);
  container.appendChild(head);

  const compare = el('div', 'mb-4 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 rounded-md bg-neutral-100 px-3 py-2 text-sm');
  compare.append(
    el('span', 'text-neutral-500', '기존 항목'), el('span', '', describe(conflict.dst)),
    el('span', 'text-neutral-500', '새 항목'), el('span', '', describe(conflict.src)),
  );
  container.appendChild(compare);

  const options: { value: ConflictResolution; label: string; hint: string; danger?: boolean }[] = [
    {
      value: 'overwrite',
      label: '덮어쓰기',
      hint: dstIsFolder ? '기존 폴더와 그 안의 내용이 모두 삭제되고 새 항목으로 바뀝니다.' : '기존 항목을 지우고 새 항목으로 바꿉니다.',
      danger: dstIsFolder,
    },
    { value: 'skip', label: '건너뛰기', hint: '이 항목은 붙여넣지 않고 그대로 둡니다.' },
    { value: 'rename', label: '이름 바꾸기', hint: `"${numberedName(name, isFolder)}"처럼 번호를 붙여서 둘 다 보관합니다.` },
  ];
  const list = el('div', 'flex flex-col gap-2');
  for (const option of options) {
    const label = el('label', 'flex cursor-pointer items-start gap-2.5 rounded-md border border-neutral-200 px-3 py-2 hover:bg-neutral-50');
    const radio = el('input', 'mt-1 accent-[#13a829]');
    radio.type = 'radio';
    radio.name = RADIO_NAME;
    radio.value = option.value;
    radio.checked = option.value === DEFAULT_RESOLUTION;
    const text = el('span', 'flex flex-col');
    text.append(
      el('span', 'font-medium text-neutral-900', option.label),
      el('span', `text-xs ${option.danger ? 'text-red-600' : 'text-neutral-500'}`, option.hint),
    );
    label.append(radio, text);
    list.appendChild(label);
  }
  container.appendChild(list);

  let applyAll: HTMLInputElement = null;
  if (remaining > 0) {
    const label = el('label', 'mt-4 flex cursor-pointer items-center gap-2 text-sm');
    applyAll = el('input', 'accent-[#13a829]');
    applyAll.type = 'checkbox';
    label.append(applyAll, '이후 모든 요청에 대해 동일하게 수행', el('span', 'text-neutral-400', `(남은 ${remaining}개)`));
    container.appendChild(label);
  }

  return { container, applyAll };
}

async function askConflict(conflict: PasteConflict, index: number, total: number): Promise<ConflictChoice | null> {
  const { container, applyAll } = buildContent(conflict, total - index - 1);
  const result = await Swal.fire<ConflictChoice>({
    icon: 'warning',
    titleText: total > 1 ? `이름이 같은 항목이 있습니다 (${index + 1}/${total})` : '이름이 같은 항목이 있습니다',
    html: container,
    width: '34rem',
    showCancelButton: true,
    confirmButtonText: '확인',
    cancelButtonText: '취소',
    confirmButtonColor: '#13a829',
    cancelButtonColor: '#cc2121',
    preConfirm: () => {
      const checked = container.querySelector<HTMLInputElement>(`input[name="${RADIO_NAME}"]:checked`);
      return {
        resolution: (checked?.value ?? DEFAULT_RESOLUTION) as ConflictResolution,
        applyAll: applyAll?.checked ?? false,
      };
    },
  });
  return result.isConfirmed ? result.value : null;
}

/** Asks about each conflict in turn. Resolves to null when the user cancels, which aborts the whole paste. */
export async function resolveConflicts(conflicts: PasteConflict[]) {
  const resolutions: Record<string, ConflictResolution> = {};
  let forAll: ConflictResolution = null;
  for (let i = 0; i < conflicts.length; i++) {
    const { name } = conflicts[i];
    if (forAll) {
      resolutions[name] = forAll;
      continue;
    }
    const choice = await askConflict(conflicts[i], i, conflicts.length);
    if (!choice) return null;
    resolutions[name] = choice.resolution;
    if (choice.applyAll) forAll = choice.resolution;
  }
  return resolutions;
}
