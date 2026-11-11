import { SEGMENTS } from './data';
import { addNews } from './actions';
import { segmentFit } from './flavor';
import { clamp, random, round } from './random';
import type { GameState, Product } from './types';

function appeal(s: GameState, p: Product, price: number) {
  const target = SEGMENTS[p.recipe.segment];
  const fit = segmentFit(p.flavor, p.recipe.segment) / 100;
  const brandFit = (0.4 + (s.awareness / 100) * 0.6) ** (1 + target.brand);
  const trust = 0.35 + (s.reputation / 100) * 0.65;
  const priceFit = clamp(target.price / Math.max(1, price), 0.12, 1.8);
  const hype = 1 + (s.hype / 100) * 0.8;
  const wordOfMouth = 0.75 + p.feedback / 200;
  return fit * brandFit * trust * priceFit * hype * wordOfMouth * s.industry * (1 + s.demandBoost);
}
export function settleMarket(s: GameState) {
  let totalRetail = 0;
  let priceSum = 0;
  const repeatPool = new Map(s.products.map((p) => [p.id, Math.floor(p.sold * 0.16)]));
  for (const p of s.products) {
    p.lastSold = 0;
    p.lastRepeat = 0;
  }
  const recordSales = (p: Product, sold: number, price: number) => {
    const target = SEGMENTS[p.recipe.segment];
    const loyalty = clamp(
      0.1 +
        (p.feedback - 50) * 0.006 +
        (s.reputation - 50) * 0.002 -
        Math.max(0, price / target.price - 1) * 0.12,
      0.03,
      0.6,
    );
    const repeat = Math.min(repeatPool.get(p.id) ?? 0, Math.floor(sold * loyalty));
    repeatPool.set(p.id, (repeatPool.get(p.id) ?? 0) - repeat);
    p.sold += sold;
    p.lastSold += sold;
    p.lastRepeat += repeat;
  };
  const season = [0.95, 0.85, 0.85, 0.9, 1.05, 0.9, 0.85, 1, 1.25, 1.1, 1.05, 1.35][
    (s.month - 1) % 12
  ];
  for (const d of s.dealers) {
    const [draw, seed] = random(s.seed);
    s.seed = seed;
    const stock = d.lots.reduce((v, l) => v + l.bottles, 0);
    const coverage = stock / Math.max(d.soldLast, d.reach * 0.25, 200);
    d.priceFactor = clamp(1 - Math.max(0, coverage - 1.4) * 0.065, 0.48, 1) * s.priceIndex;
    const inverted = d.priceFactor < 0.66;
    d.health = clamp(
      d.health + (coverage < 2.5 ? 1.5 : -Math.min(14, (coverage - 2.5) * 2)) - (inverted ? 4 : 0),
    );
    d.soldLast = 0;
    const lots = d.lots.filter((l) => l.bottles > 0);
    const sharedReach = d.reach / Math.sqrt(Math.max(1, lots.length));
    for (const lot of lots) {
      const p = s.products.find((p) => p.id === lot.productId);
      if (!p) continue;
      const actualPrice = lot.price * d.priceFactor;
      const want =
        sharedReach *
        (0.7 + s.awareness / 100) *
        appeal(s, p, actualPrice) *
        season *
        (0.85 + draw * 0.3) *
        (0.6 + lot.quality / 200);
      const sold = Math.min(lot.bottles, Math.max(0, Math.floor(want)));
      lot.bottles -= sold;
      d.soldLast += sold;
      totalRetail += sold;
      d.cash += ((sold * actualPrice) / 10000) * 0.9;
      recordSales(p, sold, actualPrice);
      p.feedback = round(
        clamp(
          p.feedback * 0.85 +
            (p.quality * 0.65 + segmentFit(p.flavor, p.recipe.segment) * 0.35) * 0.15,
        ),
        1,
      );
    }
    d.lots = d.lots.filter((l) => l.bottles > 0);
    // 到期回款取决于经销商真实现金与健康度，未收到的款项不计入现金。
    for (const r of d.receivables) {
      if (r.due > s.month) continue;
      const paid = Math.min(r.amount, Math.max(0, d.cash) * clamp(d.health / 90, 0.1, 0.9));
      r.amount -= paid;
      d.cash -= paid;
      d.paidLast += paid;
      s.finance.cash += paid;
      s.finance.receipts += paid;
      if (s.month - r.due >= 5 && r.amount > 0.05) {
        s.finance.badDebt += r.amount;
        s.finance.expenses += r.amount;
        addNews(
          s,
          '预警',
          `${d.name}应收账款减值`,
          `${round(r.amount)} 万元长期逾期，计提坏账损失。`,
        );
        r.amount = 0;
      }
    }
    d.receivables = d.receivables.filter((r) => r.amount > 0.00001);
    d.cash = round(Math.max(0, d.cash - 0.8), 5);
    priceSum += d.priceFactor;
    if (inverted)
      addNews(
        s,
        '预警',
        `${d.name}终端价格倒挂`,
        '实际成交价已低于经销商进货价。继续压货会伤害渠道现金与企业信誉。',
      );
  }
  // 直销与经销渠道竞争同一批有限消费者，产品越多，单款流量越分散。
  const traffic = (1100 + s.staff['销售经理'] * 350) / Math.sqrt(Math.max(1, s.products.length));
  for (const p of s.products) {
    const price = p.recipe.price * Math.max(0.6, s.priceIndex);
    const [draw, seed] = random(s.seed);
    s.seed = seed;
    const demand = Math.floor(traffic * appeal(s, p, price) * season * (0.85 + draw * 0.3));
    const sold = Math.min(p.stock, demand);
    p.stock -= sold;
    recordSales(p, sold, price);
    totalRetail += sold;
    const value = (sold * price) / 10000;
    s.finance.revenue += value;
    s.finance.cash += value;
    s.finance.receipts += value;
    s.finance.cogs += (sold * p.unitCost) / 10000;
    const platform = value * 0.08;
    s.finance.expenses += platform;
    s.finance.cash -= platform;
    if (sold > 0)
      p.feedback = round(
        clamp(
          p.feedback * 0.9 +
            (p.quality * 0.65 + segmentFit(p.flavor, p.recipe.segment) * 0.35) * 0.1,
        ),
        1,
      );
  }
  for (const p of s.products)
    p.repeatRate = p.lastSold > 0 ? round((p.lastRepeat / p.lastSold) * 100, 1) : 0;
  s.retailThisMonth += totalRetail;
  const meanPrice = priceSum / Math.max(1, s.dealers.length);
  if (meanPrice < 0.72) s.reputation = clamp(s.reputation - (0.72 - meanPrice) * 10);
  s.awareness = clamp(s.awareness * 0.992 + Math.min(0.8, totalRetail / 6000));
  const quality = s.products.reduce((v, p) => v + p.quality, 0) / Math.max(1, s.products.length);
  s.reputation = clamp(
    s.reputation + (s.products.length ? (quality - 70) * 0.025 : 0) - s.complianceRisk * 0.003,
  );
}
