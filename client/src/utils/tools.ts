import convert from 'convert-units';

export function convUnit(size: number) {
  const { val, unit } = convert(size).from('B').toBest();
  const res = `${parseFloat(val.toFixed(val < 10 ? 2 : 1))}${unit}`;
  return res;
}

export function fileExt(name: string) {
  return name.split('.').pop()?.toLowerCase() ?? '';
}

export function sleep(ms: number) {
  return new Promise<void>((resolve, reject) => {
    setTimeout(resolve, ms);
  });
}
