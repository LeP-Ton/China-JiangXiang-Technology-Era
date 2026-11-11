import assert from 'node:assert/strict';
import test from 'node:test';
import { performAction } from '../src/game/actions';
import { DEFAULT_RECIPE, DIRECTIONS, TECHS } from '../src/game/data';
import { advanceMonth } from '../src/game/engine';
import { agedFlavor, forecast, predictFlavor, qualityScore } from '../src/game/flavor';
import {
  baseStock,
  dealerStock,
  finishedStock,
  inventoryValue,
  receivables,
} from '../src/game/selectors';
import { createGame } from '../src/game/state';
import {
  checksum,
  deserializeGame,
  loadFrom,
  saveTo,
  serializeGame,
  validateState,
} from '../src/game/storage';
import type { Action, GameState } from '../src/game/types';
import { operatingCompany } from './fixtures/operating-company';

const company = {
  name: '测试酒业',
  brand: '测试品牌',
  product: '测试一号',
  logo: '酱',
  direction: '科技研发' as const,
};
const fresh = operatingCompany;
const action = (s: GameState, a: Action) => {
  const result = performAction(s, a);
  assert.ok(result.ok, result.message);
  return result.state;
};
const clearEvents = (s: GameState) => {
  while (s.events.length) {
    const id = s.events[0].id;
    const index =
      id === 'quality-incident' && s.finance.cash >= 18
        ? 0
        : id === 'reservoir' && s.finance.cash >= 10
          ? 0
          : id === 'trust' && s.finance.cash >= 10
            ? 0
            : 2;
    const r = performAction(s, { type: 'event', id, choice: index });
    s = r.ok ? r.state : action(s, { type: 'event', id, choice: 2 });
  }
  return s;
};
const next = (s: GameState) => {
  const r = advanceMonth(clearEvents(s));
  assert.ok(r.ok, r.message);
  return r.state;
};

test('企业创建支持五条路线，状态互不共享', () => {
  for (const d of DIRECTIONS) {
    const s = createGame({ ...company, direction: d.name }, 7);
    validateState(s);
    assert.equal(s.company.name, company.name);
    assert.equal(s.month, 1);
    assert.equal(s.company.brand, '');
    assert.equal(s.company.product, '');
    assert.deepEqual(s.recipes, []);
    assert.deepEqual(s.products, []);
    assert.equal(dealerStock(s), 0);
  }
  const a = fresh();
  const b = fresh();
  a.products[0].stock = 0;
  assert.equal(b.products[0].stock, 3200);
});

test('配方属性有取舍，实验影响模型不确定性', () => {
  const s = fresh();
  const low = predictFlavor({ ...DEFAULT_RECIPE, roast: 20 }, s);
  const high = predictFlavor({ ...DEFAULT_RECIPE, roast: 85 }, s);
  assert.ok(high['焦香'] > low['焦香']);
  assert.ok(high['果香'] < low['果香']);
  const before = forecast(s.recipes[0], s);
  const after = action(s, { type: 'experiment', recipe: s.recipes[0] });
  assert.ok(forecast(after.recipes[0], after).uncertainty < before.uncertainty);
  assert.notDeepEqual(forecast(after.recipes[0], after).flavor, before.flavor);
  assert.equal(after.experimentCount, 1);
  assert.equal(s.experimentCount, 0);
});

test('储存增益递减且老化会损失果香，成本不凭空升值', () => {
  const f = predictFlavor(DEFAULT_RECIPE);
  const a = agedFlavor(f, 12);
  const b = agedFlavor(f, 24);
  const c = agedFlavor(f, 60);
  assert.ok(a['协调性'] > f['协调性']);
  assert.ok(c['果香'] < b['果香']);
  assert.ok((c['协调性'] - b['协调性']) / 36 < (b['协调性'] - a['协调性']) / 12);
  const s = fresh();
  const out = next(s);
  assert.equal(out.batches[0].age, 25);
  assert.ok(out.batches[0].tons < s.batches[0].tons);
  assert.equal(out.batches[0].cost, s.batches[0].cost);
});

test('勾调实际消耗基酒与包装费，守恒成品成本', () => {
  const s = fresh();
  const value = inventoryValue(s);
  const cash = s.finance.cash;
  const out = action(s, {
    type: 'blend',
    recipeId: s.recipes[0].id,
    batchIds: ['batch-2'],
    bottles: 2000,
  });
  assert.equal(out.products[0].stock, 5200);
  assert.ok(Math.abs(baseStock(s) - baseStock(out) - 1.025) < 0.0001);
  assert.ok(Math.abs(inventoryValue(out) - value - (cash - out.finance.cash)) < 0.02);
  assert.equal(out.actions, 4);
  assert.equal(s.products[0].stock, 3200);
});

test('包装改版保留旧成品，新包装独立灌装、发货和存档', () => {
  let s = fresh();
  const original = structuredClone(s.products[0]);
  const recipeId = s.recipes[0].id;
  s = action(s, { type: 'recipe', recipe: { ...s.recipes[0], packaging: '简装' } });
  assert.deepEqual(s.products[0], original);
  const cash = s.finance.cash;
  s = action(s, { type: 'blend', recipeId, batchIds: ['batch-2'], bottles: 2000 });
  assert.equal(s.products.length, 2);
  assert.deepEqual(s.products[0], original);
  const simple = s.products.find((p) => p.recipe.packaging === '简装')!;
  assert.equal(simple.stock, 2000);
  assert.equal(cash - s.finance.cash, 2);
  s = action(s, {
    type: 'ship',
    dealerId: 'dealer-1',
    productId: simple.id,
    bottles: 500,
    credit: false,
  });
  assert.equal(s.products.find((p) => p.id === simple.id)!.stock, 1500);
  assert.ok(s.dealers[0].lots.some((l) => l.productId === simple.id && l.bottles === 500));
  s = action(s, { type: 'recipe', recipe: { ...s.recipes[0], packaging: '雅致' } });
  s = action(s, { type: 'blend', recipeId, batchIds: ['batch-2'], bottles: 1000 });
  assert.equal(s.products.length, 2);
  assert.equal(s.products[0].stock, 4200);
  assert.equal(s.products.find((p) => p.id === simple.id)!.stock, 1500);
  assert.deepEqual(deserializeGame(serializeGame(s)).state, s);
});

test('高端产品不能用年轻基酒制造；灌装、仓容与原料受约束', () => {
  let s = fresh();
  s.recipes[0].segment = '高端收藏';
  const young = performAction(s, {
    type: 'blend',
    recipeId: 'recipe-1',
    batchIds: ['batch-3'],
    bottles: 2000,
  });
  assert.equal(young.ok, false);
  assert.equal(young.state, s);
  assert.equal(
    performAction(s, { type: 'blend', recipeId: 'recipe-1', batchIds: ['batch-1'], bottles: 8000 })
      .ok,
    false,
  );
  s = action(s, { type: 'produce', recipeId: 'recipe-1', tons: 6 });
  assert.equal(performAction(s, { type: 'produce', recipeId: 'recipe-1', tons: 6 }).ok, false);
  s.materials.sorghum = 0;
  assert.equal(performAction(s, { type: 'produce', recipeId: 'recipe-1', tons: 0.5 }).ok, false);
  s = fresh();
  s.capacity.storage = 15;
  assert.equal(performAction(s, { type: 'produce', recipeId: 'recipe-1', tons: 3 }).ok, false);
});

test('生产经过多个月，结束时新基酒酒龄为零且保留工艺记录', () => {
  let s = fresh();
  const originalTons = baseStock(s);
  s = action(s, { type: 'produce', recipeId: s.recipes[0].id, tons: 3 });
  assert.equal(s.jobs.length, 1);
  assert.equal(baseStock(s), originalTons);
  for (let i = 0; i < 4; i++) s = next(s);
  const produced = s.batches.find((b) => b.created === 4)!;
  assert.ok(produced);
  assert.equal(produced.age, 0);
  assert.equal(s.jobs.length, 0);
  assert.equal(produced.tons, 3);
  assert.equal(produced.process, '传统固态发酵');
});

test('四阶段研发需要真实月数、分期投入并部署到生产', () => {
  let s = fresh(100);
  const target = s.research.find((r) => r.id === 'flavor')!;
  assert.equal(target.applied, false);
  let months = 0;
  while (s.research[0].stage < 4 && months < 30) {
    s = clearEvents(s);
    if (!s.research[0].active) s = action(s, { type: 'research', id: 'flavor' });
    s = next(s);
    months++;
  }
  assert.equal(s.research[0].stage, 4);
  assert.ok(months >= 7);
  assert.equal(s.research[0].applied, false);
  const before = predictFlavor(s.recipes[0], s)['稳定性'];
  s = action(s, { type: 'applyResearch', id: 'flavor' });
  assert.equal(s.research[0].applied, true);
  assert.ok(predictFlavor(s.recipes[0], s)['稳定性'] > before);
  assert.equal(performAction(s, { type: 'applyResearch', id: 'flavor' }).ok, false);
});

test('研究前置与科研人员不足会阻止错误投入', () => {
  let s = fresh();
  assert.equal(performAction(s, { type: 'research', id: 'fermentation' }).ok, false);
  s.staff['风味研究员'] = 1;
  s.research[0].stage = 2;
  assert.equal(performAction(s, { type: 'research', id: 'flavor' }).ok, false);
});

test('赊销分别记录收入、回款和应收，渠道动销不重复确认企业收入', () => {
  const s = fresh();
  const out = action(s, {
    type: 'ship',
    dealerId: 'dealer-1',
    productId: 'product-1',
    bottles: 1000,
    credit: true,
  });
  const revenue = (1000 * 168 * 0.66) / 10000;
  assert.ok(Math.abs(out.finance.revenue - revenue) < 1e-8);
  assert.ok(Math.abs(out.finance.cash - s.finance.cash - revenue * 0.4) < 1e-5);
  assert.ok(Math.abs(receivables(out) - revenue * 0.6) < 0.01);
  assert.equal(out.products[0].stock, 2200);
  assert.equal(dealerStock(out), 2600);
  out.products[0].stock = 0;
  const settled = next(out);
  assert.equal(settled.history[0].revenue, Number(revenue.toFixed(2)));
  assert.ok(settled.history[0].retail > 0);
});

test('渠道过度压货会倒挂、健康下降并拒收', () => {
  let s = fresh();
  s.products[0].stock = 15000;
  s.dealers[0].cash = 300;
  s = action(s, {
    type: 'ship',
    dealerId: 'dealer-1',
    productId: 'product-1',
    bottles: 9000,
    credit: true,
  });
  const oldHealth = s.dealers[0].health;
  s = next(s);
  assert.ok(s.dealers[0].health < oldHealth);
  assert.ok(s.dealers[0].priceFactor < 0.66);
  assert.equal(
    performAction(s, {
      type: 'ship',
      dealerId: 'dealer-1',
      productId: 'product-1',
      bottles: 1000,
      credit: true,
    }).ok,
    false,
  );
});

test('融资不是收入；薪资、利息与折旧都会影响结算', () => {
  const s = fresh();
  const loan = action(s, { type: 'loan', amount: 100 });
  assert.equal(loan.finance.cash, 420);
  assert.equal(loan.finance.revenue, 0);
  const equity = action(loan, { type: 'equity' });
  assert.equal(equity.finance.equity, 85);
  assert.equal(equity.finance.revenue, 0);
  const out = next(equity);
  assert.ok(out.history[0].expenses > 8);
  assert.ok(out.finance.fixedAssets < s.finance.fixedAssets);
});

test('事件必须先决策，夸大宣传留下真实风险', () => {
  const s = fresh();
  s.events.push({ id: 'quantum', triggered: 1 });
  assert.equal(advanceMonth(s).ok, false);
  const out = action(s, { type: 'event', id: 'quantum', choice: 2 });
  assert.equal(out.events.length, 0);
  assert.equal(out.actions, 5);
  assert.equal(out.complianceRisk, 22);
  assert.equal(out.eventHistory.length, 1);
  assert.equal(performAction(out, { type: 'event', id: 'quantum', choice: 2 }).ok, false);
});

test('同一随机种子与操作序列可复现，存档恢复后不改变结果', () => {
  const play = (s: GameState) => {
    s = action(s, { type: 'experiment', recipe: s.recipes[0] });
    s = action(s, { type: 'produce', recipeId: 'recipe-1', tons: 2 });
    for (let i = 0; i < 8; i++) s = next(s);
    return s;
  };
  const first = play(fresh(42));
  const second = play(fresh(42));
  assert.deepEqual(first, second);
  assert.notDeepEqual(first, play(fresh(43)));
  assert.deepEqual(next(first), next(deserializeGame(serializeGame(first)).state));
});

test('三槽存档独立，手动档不被自动档覆盖', () => {
  const map = new Map<string, string>();
  const storage = {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => map.set(key, value),
  };
  const s = fresh();
  saveTo(storage, 'slot-1', s);
  saveTo(storage, 'auto', next(s));
  assert.equal(loadFrom(storage, 'slot-1')?.state.month, 1);
  assert.equal(loadFrom(storage, 'auto')?.state.month, 2);
  assert.equal(loadFrom(storage, 'slot-2'), null);
});

test('月末损益清零，第二个月不能重复确认上月收入和费用', () => {
  let s = fresh();
  s.products[0].stock = 0;
  s.finance.revenue = 10;
  s.finance.rd = 2;
  s.finance.expenses = 2;
  const before = structuredClone(s);
  s = next(s);
  assert.equal(s.history[0].revenue, 10);
  assert.equal(s.history[0].rd, 2);
  assert.equal(s.finance.revenue, 0);
  assert.equal(s.finance.expenses, 0);
  assert.equal(s.finance.rd, 0);
  assert.equal(s.finance.receipts, 0);
  assert.equal(s.finance.cashStart, s.finance.cash);
  s = next(s);
  assert.equal(s.history[1].revenue, 0);
  assert.equal(s.history[1].rd, 0);
  assert.equal(before.finance.revenue, 10);
  assert.ok(Math.abs(s.finance.retained - s.history.reduce((v, h) => v + h.profit, 0)) < 0.01);
});

test('研究可能失败，阶段不升级且资金不返还', () => {
  let s = fresh(1972);
  s = action(s, { type: 'research', id: 'flavor' });
  assert.equal(s.finance.rd, 5.6);
  s = next(s);
  assert.equal(s.research[0].stage, 0);
  assert.equal(s.research[0].active, false);
  assert.equal(s.research[0].instability, 1);
  assert.ok(s.news.some((n) => n.title.includes('验证未通过')));
  assert.equal(s.history[0].rd, 5.6);
});

test('复购来自历史客户，口碑和信誉影响持续消费', () => {
  const first = next(fresh());
  assert.equal(first.history[0].repeatRate, 0);
  const second = next(first);
  assert.ok(second.history[1].repeatRate > 0);
  const trusted = fresh();
  trusted.reputation = 95;
  trusted.products[0].feedback = 95;
  trusted.products[0].sold = 10000;
  const distrusted = fresh();
  distrusted.reputation = 20;
  distrusted.products[0].feedback = 30;
  distrusted.products[0].sold = 10000;
  assert.ok(next(trusted).history[0].retail > next(distrusted).history[0].retail);
});

test('损坏、未知版本、异常结构与伪造数值存档均被拒绝', () => {
  assert.throws(() => deserializeGame('{坏了'));
  const parsed = JSON.parse(serializeGame(fresh()));
  parsed.state.month = 9;
  assert.throws(() => deserializeGame(JSON.stringify(parsed)), /校验/);
  parsed.version = 2;
  assert.throws(() => deserializeGame(JSON.stringify(parsed)), /版本/);
  const malformed = JSON.parse(serializeGame(fresh()));
  delete malformed.state.dealers[0].lots;
  malformed.checksum = checksum(JSON.stringify(malformed.state));
  assert.throws(() => deserializeGame(JSON.stringify(malformed)));
  const infinite = fresh();
  infinite.finance.cash = Infinity;
  assert.throws(() => validateState(infinite));
});

test('负数、NaN、超额操作均原子拒绝，不偷偷扣款或耗行动', () => {
  const s = fresh();
  const invalid: Action[] = [
    { type: 'procure', tons: -1 },
    { type: 'loan', amount: NaN },
    { type: 'blend', recipeId: 'recipe-1', batchIds: ['batch-2'], bottles: 200.5 },
    { type: 'ship', dealerId: 'dealer-1', productId: 'product-1', bottles: 1000000, credit: true },
    { type: 'price', productId: 'product-1', price: Infinity },
  ];
  for (const a of invalid) {
    const out = performAction(s, a);
    assert.equal(out.ok, false);
    assert.equal(out.state, s);
    assert.equal(out.state.actions, 5);
  }
  s.actions = 0;
  assert.equal(performAction(s, { type: 'procure', tons: 1 }).ok, false);
  assert.equal(performAction(s, { type: 'price', productId: 'product-1', price: 159 }).ok, true);
});

test('三个月现金不足触发清算，融资可在宽限期救回', () => {
  let s = fresh();
  s.finance.cash = -100;
  s.products[0].stock = 0;
  s = next(s);
  assert.equal(s.insolventMonths, 1);
  assert.equal(s.gameOver, false);
  const rescued = action(s, { type: 'loan', amount: 200 });
  assert.equal(next(rescued).insolventMonths, 0);
  s = next(next(s));
  assert.equal(s.gameOver, true);
  assert.equal(advanceMonth(s).ok, false);
  assert.equal(performAction(s, { type: 'loan', amount: 50 }).ok, false);
});

test('从无品牌酒厂起步可持续经营 72 个月，历史与存档始终有效', () => {
  let s = createGame(company, 9876);
  s = action(s, {
    type: 'recipe',
    recipe: { ...DEFAULT_RECIPE, id: 'new', brand: '测试品牌', name: '测试一号' },
  });
  const recipeId = s.recipes[0].id;
  let manufactured = 0;
  let revenue = 0;
  for (let month = 0; month < 72; month++) {
    s = clearEvents(s);
    if (s.finance.cash < 90 && s.finance.equity > 35) s = action(s, { type: 'equity' });
    if (s.finance.cash < 50 && s.finance.debt < 250) s = action(s, { type: 'loan', amount: 50 });
    if (s.materials.sorghum < 8 && s.actions > 0) s = action(s, { type: 'procure', tons: 5 });
    if (s.jobs.length === 0 && s.actions > 0 && baseStock(s) < 15) {
      s = action(s, { type: 'produce', recipeId, tons: 3 });
      manufactured++;
    }
    const mature = s.batches.filter((b) => b.age >= 3);
    if (finishedStock(s) < 2200 && mature.reduce((v, b) => v + b.tons, 0) > 1.1 && s.actions > 0)
      s = action(s, {
        type: 'blend',
        recipeId,
        batchIds: mature.map((b) => b.id),
        bottles: 2000,
      });
    for (const d of s.dealers)
      if (
        s.actions > 0 &&
        d.lots.reduce((v, l) => v + l.bottles, 0) < 600 &&
        (s.products[0]?.stock ?? 0) >= 500 &&
        d.health > 40 &&
        d.cash > 6
      )
        s = action(s, {
          type: 'ship',
          dealerId: d.id,
          productId: s.products[0].id,
          bottles: 500,
          credit: false,
        });
    const r = s.research[0];
    if (s.actions > 0 && s.finance.cash > 80 && !r.active && r.stage < 4)
      s = action(s, { type: 'research', id: 'flavor' });
    if (s.actions > 0 && r.stage === 4 && !r.applied && s.finance.cash > 30)
      s = action(s, { type: 'applyResearch', id: 'flavor' });
    s = next(s);
    revenue += s.history.at(-1)!.revenue;
    assert.equal(s.gameOver, false, `第 ${month + 1} 月意外清算，现金 ${s.finance.cash}`);
    validateState(s);
    assert.ok(s.materials.sorghum >= 0);
    assert.ok(baseStock(s) >= 0);
    assert.ok(finishedStock(s) >= 0);
  }
  assert.equal(s.month, 73);
  assert.equal(s.history.length, 72);
  assert.ok(manufactured > 8);
  assert.ok(revenue > 400);
  assert.deepEqual(deserializeGame(serializeGame(s)).state, s);
  s = action(s, { type: 'continue' });
  assert.equal(s.milestoneSeen, true);
});

test('企业注册不创建品牌、产品和销售记录，筹备月份仍可保存和结算', () => {
  let s = createGame({ name: '新建酒厂', logo: '谷', direction: '稳健经营' }, 99);
  assert.equal(s.company.brand, '');
  assert.equal(s.company.product, '');
  assert.equal(finishedStock(s), 0);
  assert.equal(dealerStock(s), 0);
  assert.deepEqual(deserializeGame(serializeGame(s)).state, s);
  for (let i = 0; i < 8; i++) s = next(s);
  assert.equal(s.recipes.length, 0);
  assert.equal(s.products.length, 0);
  assert.equal(s.reputation, 72);
  assert.ok(s.history.every((h) => h.revenue === 0 && h.retail === 0));
  assert.ok(
    !s.eventHistory.some((e) => ['aging-claim', 'crossover', 'quality-incident'].includes(e.id)),
  );
  validateState(s);
});

test('企业成立后设计品牌与配方，实际勾调才创建首款成品', () => {
  let s = createGame({ name: '新建酒厂', logo: '谷', direction: '科技研发' }, 99);
  s = action(s, {
    type: 'recipe',
    recipe: { ...DEFAULT_RECIPE, id: 'new', brand: '后创品牌', name: '首款自研酒' },
  });
  assert.equal(s.company.brand, '后创品牌');
  assert.equal(s.company.product, '首款自研酒');
  assert.equal(s.products.length, 0);
  assert.equal(s.recipes.length, 1);
  const r = s.recipes[0];
  const startingBase = baseStock(s);
  s = action(s, { type: 'produce', recipeId: r.id, tons: 2 });
  assert.equal(s.products.length, 0);
  s = action(s, { type: 'blend', recipeId: r.id, batchIds: ['batch-2'], bottles: 2000 });
  assert.equal(s.products[0].recipe.brand, '后创品牌');
  assert.equal(s.products[0].recipe.name, '首款自研酒');
  assert.equal(finishedStock(s), 2000);
  assert.ok(baseStock(s) < startingBase);
  s = action(s, {
    type: 'ship',
    dealerId: 'dealer-1',
    productId: s.products[0].id,
    bottles: 500,
    credit: false,
  });
  assert.equal(dealerStock(s), 500);
  assert.ok(next(s).history[0].revenue > 0);
});

test('已有品牌的旧档继续保留品牌、配方、成品和渠道库存', () => {
  const legacy = fresh();
  const restored = deserializeGame(serializeGame(legacy)).state;
  assert.equal(restored.company.brand, '测试品牌');
  assert.equal(restored.company.product, '测试一号');
  assert.equal(restored.products[0].stock, 3200);
  assert.equal(dealerStock(restored), 1600);
  assert.deepEqual(restored, legacy);
});

test('所有十项技术部署分别产生实际规则收益', () => {
  const s = fresh();
  const original = forecast(s.recipes[0], s);
  const enhanced = fresh();
  enhanced.research.forEach((r) => {
    r.stage = 4;
    r.applied = true;
  });
  const better = forecast(enhanced.recipes[0], enhanced);
  assert.ok(better.quality > original.quality);
  assert.ok(better.uncertainty < original.uncertainty);
  const start = (state: GameState) =>
    action(state, { type: 'produce', recipeId: 'recipe-1', tons: 2 });
  const a = start(s);
  let b = start(enhanced);
  assert.ok(b.materials.sorghum > a.materials.sorghum);
  assert.ok(b.jobs[0].remaining < a.jobs[0].remaining);
  for (let i = 0; i < 3; i++) b = next(b);
  assert.ok(b.batches.some((x) => x.created > 0 && x.tons > 2));
  assert.equal(TECHS.length, 10);
  assert.ok(qualityScore(b.products[0].flavor) > 0);
});
