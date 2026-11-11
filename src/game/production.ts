import { addNews } from './actions';
import { hasTech } from './flavor';
import { clamp, random, round } from './random';
import { baseStock } from './selectors';
import type { GameState } from './types';

export function settleStorage(s: GameState) {
  for (const b of s.batches) {
    b.age++;
    const loss = hasTech(s, 'aging') ? 0.0009 : 0.0015;
    b.tons *= 1 - loss;
  }
  s.finance.storage = baseStock(s) * 0.035 + s.capacity.storage * 0.006;
}
export function settleProduction(s: GameState) {
  for (const job of s.jobs) {
    job.remaining--;
    if (job.remaining > 0) continue;
    const [draw, next] = random(s.seed);
    s.seed = next;
    const variation = (draw - 0.5) * Math.max(1, 9 - s.staff['酿酒师'] - s.capacity.automation);
    const yieldBonus = (hasTech(s, 'fermentation') ? 0.12 : 0) + (hasTech(s, 'distill') ? 0.08 : 0);
    const tons = round(job.tons * (1 + yieldBonus), 5);
    const free = Math.max(0, s.capacity.storage - baseStock(s));
    const received = Math.min(tons, free);
    if (received < tons) {
      s.finance.cogs += job.cost * (1 - received / tons);
      addNews(
        s,
        '预警',
        '仓容溢出造成基酒损失',
        '车间完成出酒，但储酒空间不足。未能入库部分按损失计入成本。',
      );
    }
    if (received > 0)
      s.batches.push({
        id: `batch-${job.id}`,
        name: `${job.recipe.name}·第${s.month}月批次`,
        created: s.month,
        age: 0,
        tons: received,
        cost: (job.cost * received) / tons,
        flavor: { ...job.flavor, 稳定性: clamp(job.flavor['稳定性'] + variation) },
        quality: clamp(job.quality + variation),
        process: job.process,
        recipeId: job.recipe.id,
        traceable: s.traceability,
        inspected: hasTech(s, 'quality'),
      });
    addNews(
      s,
      '经营',
      `${round(received, 2)} 吨新基酒已入库`,
      `${job.process}完成。新酒酒龄为 0，须达到产品定位最低酒龄后才可勾调。`,
    );
  }
  s.jobs = s.jobs.filter((j) => j.remaining > 0);
}
