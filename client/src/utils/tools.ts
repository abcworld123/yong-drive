import convert from 'convert-units';

export function convUnit(size: number) {
  const { val, unit } = convert(size).from('B').toBest();
  const res = `${parseFloat(val.toFixed(val < 10 ? 2 : 1))}${unit}`;
  return res;
}

export function formatTime(ms: number) {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

export function fileExt(name: string) {
  return name.split('.').pop()?.toLowerCase() ?? '';
}

export function sleep(ms: number) {
  return new Promise<void>((resolve, reject) => {
    setTimeout(resolve, ms);
  });
}
