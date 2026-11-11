import { ROLES } from './data';
import { clamp, round } from './random';
import type { GameState } from './types';

export const dealerStock = (s: GameState) =>
  s.dealers.reduce((v, d) => v + d.lots.reduce((n, l) => n + l.bottles, 0), 0);
export const baseStock = (s: GameState) =>
  round(
    s.batches.reduce((v, b) => v + b.tons, 0),
    3,
  );
export const finishedStock = (s: GameState) => s.products.reduce((v, p) => v + p.stock, 0);
export const receivables = (s: GameState) =>
  round(s.dealers.reduce((v, d) => v + d.receivables.reduce((n, r) => n + r.amount, 0), 0));
export const payroll = (s: GameState) =>
  round(ROLES.reduce((v, r) => v + s.staff[r.name] * r.salary, 0));
export const staffCount = (s: GameState) => Object.values(s.staff).reduce((v, n) => v + n, 0);
export const inventoryValue = (s: GameState) =>
  round(
    s.batches.reduce((v, b) => v + b.cost, 0) +
      s.jobs.reduce((v, j) => v + j.cost, 0) +
      s.products.reduce((v, p) => v + (p.stock * p.unitCost) / 10000, 0) +
      s.materials.sorghum * 0.5 +
      s.materials.wheat * 0.32,
  );
export const assets = (s: GameState) =>
  round(s.finance.cash + inventoryValue(s) + s.finance.fixedAssets + receivables(s));
export const channelHealth = (s: GameState) =>
  round(s.dealers.reduce((v, d) => v + d.health, 0) / Math.max(1, s.dealers.length));
export const averageQuality = (s: GameState) =>
  round(s.products.reduce((v, p) => v + p.quality, 0) / Math.max(1, s.products.length), 1);
export const monthsCoverage = (s: GameState) =>
  round(
    dealerStock(s) /
      Math.max(
        1,
        s.dealers.reduce((v, d) => v + d.soldLast, 0),
      ),
    1,
  );
export const productionCapacity = (s: GameState) =>
  round(
    s.capacity.production *
      (1 + Math.min(5, s.staff['生产工程师']) * 0.04 + s.capacity.automation * 0.08),
    1,
  );
export const bottlingCapacity = (s: GameState) =>
  Math.floor(
    s.capacity.bottling * (s.research.some((r) => r.id === 'bottling' && r.applied) ? 1.5 : 1),
  );
export const technologyLevel = (s: GameState) =>
  round((s.research.reduce((v, r) => v + r.stage + (r.applied ? 1 : 0), 0) / 50) * 100);
export function scoreCompany(s: GameState) {
  const last = s.history.slice(-6);
  const survival = clamp(50 + (s.finance.cash - s.finance.debt * 0.4) / 8);
  const retail = clamp(last.reduce((v, h) => v + h.retail, 0) / Math.max(1, last.length) / 100);
  const dimensions = [
    { name: '生存能力', value: survival },
    { name: '真实动销', value: retail },
    { name: '技术积累', value: technologyLevel(s) },
    { name: '产品品质', value: averageQuality(s) },
    { name: '品牌信誉', value: s.reputation },
    { name: '渠道健康', value: channelHealth(s) },
  ];
  return {
    dimensions,
    total: round(dimensions.reduce((v, d) => v + d.value, 0) / dimensions.length),
    title:
      s.reputation < 35
        ? '故事很大，信任很薄'
        : technologyLevel(s) > 35
          ? '把技术酿进时间的人'
          : channelHealth(s) > 75 && s.finance.cash > 100
            ? '稳稳经营，慢慢成香'
            : '仍在寻找自己的配方',
  };
}
