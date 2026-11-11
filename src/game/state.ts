import { DEFAULT_RECIPE, ROLES, TECHS } from './data';
import { predictFlavor, qualityScore } from './flavor';
import type { CompanySetup, Finance, GameState, Role } from './types';

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
export function createGame(company: CompanySetup, seed = 20261111): GameState {
  // 交接的是酒厂及原酒，品牌、配方和可售产品由玩家在经营阶段建立。
  const f = predictFlavor(DEFAULT_RECIPE);
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
      brand: '',
      product: '',
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
    recipes: [],
    products: [],
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
        recipeId: 'initial-process',
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
        recipeId: 'initial-process',
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
        recipeId: 'initial-process',
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
        lots: [],
        receivables: [],
        soldLast: 0,
        shippedLast: 0,
        paidLast: 0,
        priceFactor: 1,
      },
      {
        id: 'dealer-2',
        name: '禾丰商贸',
        region: '华中',
        reach: 900,
        health: 78,
        cash: 30,
        lots: [],
        receivables: [],
        soldLast: 0,
        shippedLast: 0,
        paidLast: 0,
        priceFactor: 1,
      },
    ],
    history: [],
    news: [
      {
        id: 'welcome',
        month: 1,
        type: '经营',
        title: '第一坛酒，第一张报表',
        detail: '地方酒厂已交接。先创立品牌、设计首款配方，再组织生产、勾调和销售。',
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
  s.news[0].detail = `地方酒厂已交接：${s.finance.cash} 万启动资金、${s.batches.reduce((v, b) => v + b.tons, 0)} 吨基酒和两个待供货渠道。品牌、配方和成品尚未建立，请先设计首款产品。`;
  return s;
}
export const cloneGame = (s: GameState): GameState => structuredClone(s);
