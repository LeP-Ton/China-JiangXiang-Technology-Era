// 随机状态随存档推进，同一存档与操作序列产生相同结算。
export function random(seed: number): [number, number] {
  const next = (Math.imul(seed >>> 0, 1664525) + 1013904223) >>> 0;
  return [next / 4294967296, next];
}
export const clamp = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, n));
export const round = (n: number, digits = 2) => Math.round(n * 10 ** digits) / 10 ** digits;
