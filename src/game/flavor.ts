import { FLAVORS, PACKAGING, SEGMENTS } from './data';
import { clamp, round } from './random';
import type { Batch, Flavor, GameState, Recipe } from './types';

export const hasTech = (s: GameState, id: string) =>
  s.research.some((r) => r.id === id && r.applied);
export function predictFlavor(recipe: Recipe, s?: GameState): Flavor {
  const grain = (recipe.sorghum - 50) / 35;
  const roast = recipe.roast / 100;
  const time = recipe.fermentation;
  const cut = recipe.cut / 100;
  const tech = (id: string) => (s && hasTech(s, id) ? 1 : 0);
  const brewers = s ? Math.min(s.staff['酿酒师'], 5) : 1;
  const flavor: Flavor = {
    酱香: 40 + grain * 19 + roast * 15 + time * 2.6 + tech('fermentation') * 8,
    粮香: 75 - grain * 10 - roast * 12 + tech('koji') * 5,
    焦香: 18 + roast * 65 + time * 1.1,
    果香: 77 - roast * 38 - time * 2 + (1 - grain) * 6,
    甜感: 78 - roast * 21 - grain * 12 + cut * 7,
    醇厚度: 44 + time * 5 + grain * 10 - cut * 9,
    回味: 35 + time * 5 + grain * 12 + roast * 7,
    协调性:
      75 -
      Math.abs(roast - 0.5) * 25 -
      Math.abs(grain - 0.5) * 10 +
      cut * 9 +
      tech('fermentation') * 7 +
      tech('blend') * 7 +
      tech('distill') * 5,
    稳定性:
      61 +
      cut * 12 +
      brewers * 1.5 +
      tech('microbes') * 8 +
      tech('quality') * 5 +
      tech('flavor') * 6 +
      tech('control') * 4 +
      (s?.capacity.automation ?? 0) * 1.5,
  };
  return Object.fromEntries(FLAVORS.map((k) => [k, round(clamp(flavor[k], 15, 96), 1)])) as Flavor;
}
export function agedFlavor(flavor: Flavor, age: number, advanced = false): Flavor {
  const maturity = 1 - Math.exp(-Math.min(age, 60) / 18);
  const aged = { ...flavor };
  aged['协调性'] += maturity * (advanced ? 15 : 10);
  aged['醇厚度'] += maturity * 9;
  aged['回味'] += maturity * 8;
  aged['果香'] -= Math.max(0, age - 24) * 0.12;
  aged['焦香'] -= maturity * 4;
  return Object.fromEntries(FLAVORS.map((k) => [k, round(clamp(aged[k], 10, 98), 1)])) as Flavor;
}
export function qualityScore(f: Flavor): number {
  return round(
    f['协调性'] * 0.3 +
      f['稳定性'] * 0.3 +
      f['醇厚度'] * 0.15 +
      f['回味'] * 0.15 +
      Math.max(f['酱香'], f['果香']) * 0.1,
    1,
  );
}
export function segmentFit(f: Flavor, segment: Recipe['segment']): number {
  const target = SEGMENTS[segment].target;
  return round(
    clamp(
      100 -
        (FLAVORS.reduce((sum, key, i) => sum + Math.abs(f[key] - target[i]), 0) / FLAVORS.length) *
          1.45,
    ),
    1,
  );
}
export function matureBatch(b: Batch, s: GameState): Flavor {
  return agedFlavor(b.flavor, b.age, hasTech(s, 'aging'));
}
export function forecast(recipe: Recipe, s: GameState) {
  const f = agedFlavor(predictFlavor(recipe, s), recipe.aging, hasTech(s, 'aging'));
  // 用相近工艺的实测残差校准模型；远离当前参数的历史实验不应强行套用。
  const samples = s.experiments
    .filter((e) => e.recipe && e.predicted)
    .map((e) => {
      const r = e.recipe!;
      const distance =
        Math.abs(r.sorghum - recipe.sorghum) / 35 +
        Math.abs(r.roast - recipe.roast) / 75 +
        Math.abs(r.fermentation - recipe.fermentation) / 4 +
        Math.abs(r.cut - recipe.cut) / 65 +
        Math.abs(r.aging - recipe.aging) / 57;
      return { experiment: e, weight: Math.exp(-distance * 2) };
    });
  const weight = samples.reduce((v, e) => v + e.weight, 0);
  if (weight > 0)
    for (const key of FLAVORS) {
      const residual =
        samples.reduce(
          (v, e) => v + (e.experiment.flavor[key] - e.experiment.predicted![key]) * e.weight,
          0,
        ) / weight;
      f[key] = round(clamp(f[key] + clamp(residual * 0.3, -3, 3), 10, 98), 1);
    }
  const packaging = PACKAGING[recipe.packaging].cost;
  const raw = 25 + recipe.cut * 0.22 + recipe.fermentation * 2 + recipe.aging * 0.18;
  const unitCost = round(raw + packaging + 5);
  const uncertainty = Math.max(
    2,
    12 - s.experimentCount * 0.5 - (hasTech(s, 'flavor') ? 5 : 0) - s.staff['风味研究员'],
  );
  return {
    flavor: f,
    quality: qualityScore(f),
    fit: segmentFit(f, recipe.segment),
    unitCost,
    uncertainty,
  };
}
