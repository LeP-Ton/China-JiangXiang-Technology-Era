import { DEFAULT_RECIPE, ROLES, TECHS } from './data';
import { agedFlavor, predictFlavor, qualityScore } from './flavor';
import type { Company, Finance, GameState, Role } from './types';

export function emptyFinance(
  cash: number,
  debt: number,
  fixedAssets: number,
  retained = 0,
  equity = 100,
): Finance {
  return {
    cash,
    debt,
    fixedAssets,
    equity,
    retained,
    revenue: 0,
    netProfit: 0,
    receipts: 0,
    expenses: 0,
    cogs: 0,
    interest: 0,
    rd: 0,
    marketing: 0,
    payroll: 0,
    storage: 0,
    depreciation: 0,
    tax: 0,
    badDebt: 0,
    investment: 0,
    cashStart: cash,
  };
}
export function createGame(company: Company, seed = 20261111): GameState {
  const recipe = {
    ...DEFAULT_RECIPE,
    name: company.product.trim() || '初酿·经典',
    brand: company.brand.trim() || '观山',
  };
  const f = predictFlavor(recipe);
  const staff = Object.fromEntries(
    ROLES.map((r) => [
      r.name,
      ['酿酒师', '风味研究员', '生产工程师', '销售经理'].includes(r.name) ? 1 : 0,
    ]),
  ) as Record<Role, number>;
  const s: GameState = {
    version: 1,
    company: {
      ...company,
      name: company.name.trim() || '观山酒业',
      brand: recipe.brand,
      product: recipe.name,
    },
    month: 1,
    seed: seed >>> 0,
    initialSeed: seed >>> 0,
    actions: 5,
    actionLimit: 5,
    finance: emptyFinance(320, 0, 180),
    awareness: 22,
    reputation: 72,
    hype: 0,
    complianceRisk: 0,
    demandBoost: 0,
    industry: 1,
    priceIndex: 1,
    materials: { sorghum: 18, wheat: 8 },
    staff,
    capacity: { production: 8, storage: 50, bottling: 6000, automation: 0 },
    recipes: [recipe],
    products: [
      {
        id: 'product-1',
        recipe: { ...recipe },
        flavor: agedFlavor(f, 12),
        quality: qualityScore(agedFlavor(f, 12)),
        stock: 3200,
        unitCost: 58,
        sold: 0,
        feedback: 72,
        lastAge: 12,
        lastSold: 0,
        lastRepeat: 0,
        repeatRate: 0,
      },
    ],
    batches: [
      {
        id: 'batch-1',
        name: '创始窖藏·甲批',
        created: -23,
        age: 24,
        tons: 4,
        cost: 21.6,
        flavor: f,
        quality: qualityScore(f),
        process: '传统固态发酵',
        recipeId: recipe.id,
        traceable: true,
        inspected: true,
      },
      {
        id: 'batch-2',
        name: '创始基酒·乙批',
        created: -11,
        age: 12,
        tons: 6,
        cost: 28.8,
        flavor: f,
        quality: qualityScore(f),
        process: '传统固态发酵',
        recipeId: recipe.id,
        traceable: true,
        inspected: true,
      },
      {
        id: 'batch-3',
        name: '新酿基酒·丙批',
        created: -2,
        age: 3,
        tons: 4,
        cost: 17.6,
        flavor: f,
        quality: qualityScore(f),
        process: '传统固态发酵',
        recipeId: recipe.id,
        traceable: true,
        inspected: false,
      },
    ],
    jobs: [],
    research: TECHS.map((t) => ({
      id: t.id,
      stage: 0,
      active: false,
      progress: 0,
      attempts: 0,
      applied: false,
      instability: 0,
    })),
    dealers: [
      {
        id: 'dealer-1',
        name: '山河酒类商行',
        region: '川渝',
        reach: 1400,
        health: 86,
        cash: 45,
        lots: [
          { productId: 'product-1', bottles: 1000, unitCost: 110.88, price: 168, quality: 72 },
        ],
        receivables: [],
        soldLast: 620,
        shippedLast: 0,
        paidLast: 0,
        priceFactor: 0.98,
      },
      {
        id: 'dealer-2',
        name: '禾丰商贸',
        region: '华中',
        reach: 900,
        health: 78,
        cash: 30,
        lots: [{ productId: 'product-1', bottles: 600, unitCost: 110.88, price: 168, quality: 72 }],
        receivables: [],
        soldLast: 380,
        shippedLast: 0,
        paidLast: 0,
        priceFactor: 0.98,
      },
    ],
    history: [],
    news: [
      {
        id: 'welcome',
        month: 1,
        type: '经营',
        title: '第一坛酒，第一张报表',
        detail:
          '地方酒厂已交接。320 万启动资金、14 吨基酒和两个经销商。先试着勾调一批，再关注终端是否真的卖得动。',
      },
    ],
    events: [],
    eventHistory: [],
    experimentCount: 0,
    experiments: [],
    pendingMarketing: 0,
    bottledThisMonth: 0,
    shippedThisMonth: 0,
    retailThisMonth: 0,
    traceability: false,
    qualityControl: 0,
    insolventMonths: 0,
    gameOver: false,
    milestoneSeen: false,
  };
  switch (company.direction) {
    case '科技研发':
      s.staff['风味研究员']++;
      break;
    case '品牌营销':
      s.awareness += 12;
      s.staff['品牌营销经理']++;
      break;
    case '规模扩张':
      s.capacity.production += 2;
      s.finance.cash -= 25;
      s.finance.fixedAssets += 25;
      break;
    case '资本运作':
      s.finance.cash += 80;
      s.finance.debt += 80;
      break;
    case '稳健经营':
      s.batches[0].tons += 3;
      s.batches[0].cost += 12;
      s.finance.cash -= 12;
      break;
  }
  s.finance.cashStart = s.finance.cash;
  s.news[0].detail = `地方酒厂已交接。${s.finance.cash} 万启动资金、${s.batches.reduce((v, b) => v + b.tons, 0)} 吨基酒和两个经销商。先试着勾调一批，再关注终端是否真的卖得动。`;
  return s;
}
export const cloneGame = (s: GameState): GameState => structuredClone(s);
