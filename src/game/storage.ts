import { ROLES, TECHS } from './data';
import { validRecipe } from './actions';
import { EVENTS } from './events';
import type { GameState } from './types';

const PREFIX = 'jiangxiang-era-v1';
export const AUTO_KEY = `${PREFIX}:auto`;
export const slotKey = (slot: number) => `${PREFIX}:slot-${slot}`;
type SaveEnvelope = {
  format: 'jiangxiang-era';
  version: 1;
  savedAt: string;
  checksum: string;
  state: GameState;
};
export function checksum(text: string) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
  return (hash >>> 0).toString(16);
}
export function serializeGame(state: GameState): string {
  return JSON.stringify({
    format: 'jiangxiang-era',
    version: 1,
    savedAt: new Date().toISOString(),
    checksum: checksum(JSON.stringify(state)),
    state,
  } satisfies SaveEnvelope);
}
// 导入文件是不可信输入：校验结构、数值和标识关系后才交给界面及模拟器。
export function validateState(value: unknown): asserts value is GameState {
  if (!value || typeof value !== 'object') throw new Error('存档状态缺失');
  const s = value as GameState;
  const finiteTree = (v: unknown, depth = 0): boolean => {
    if (depth > 14) return false;
    if (typeof v === 'number') return Number.isFinite(v) && Math.abs(v) < 1e12;
    if (typeof v === 'string') return v.length < 300000;
    if (v === null || typeof v === 'boolean') return true;
    if (typeof v === 'object') return Object.values(v).every((n) => finiteTree(n, depth + 1));
    return false;
  };
  if (!finiteTree(s)) throw new Error('存档包含无效或超出范围的数据');
  const nums = (o: unknown, keys: string[]) =>
    !!o &&
    typeof o === 'object' &&
    keys.every((k) => typeof (o as Record<string, unknown>)[k] === 'number');
  const strs = (o: unknown, keys: string[]) =>
    !!o &&
    typeof o === 'object' &&
    keys.every((k) => typeof (o as Record<string, unknown>)[k] === 'string');
  const array = (v: unknown, max: number) => Array.isArray(v) && v.length <= max;
  const bools = (o: unknown, keys: string[]) =>
    !!o &&
    typeof o === 'object' &&
    keys.every((k) => typeof (o as Record<string, unknown>)[k] === 'boolean');
  const flavor = (f: unknown) =>
    nums(f, ['酱香', '粮香', '焦香', '果香', '甜感', '醇厚度', '回味', '协调性', '稳定性']);
  if (
    s.version !== 1 ||
    !nums(s, [
      'month',
      'seed',
      'initialSeed',
      'actions',
      'actionLimit',
      'awareness',
      'reputation',
      'hype',
      'complianceRisk',
      'demandBoost',
      'industry',
      'priceIndex',
      'experimentCount',
      'pendingMarketing',
      'bottledThisMonth',
      'shippedThisMonth',
      'retailThisMonth',
      'qualityControl',
      'insolventMonths',
    ]) ||
    !Number.isInteger(s.month) ||
    s.month < 1 ||
    s.month > 120000 ||
    !Number.isInteger(s.seed)
  )
    throw new Error('存档版本或时间数据不兼容');
  if (
    !bools(s, ['traceability', 'gameOver', 'milestoneSeen']) ||
    s.actions < 0 ||
    s.actions > s.actionLimit ||
    s.actionLimit !== 5
  )
    throw new Error('管理状态无效');
  if (
    !strs(s.company, ['name', 'brand', 'product', 'logo', 'direction']) ||
    !['科技研发', '品牌营销', '规模扩张', '资本运作', '稳健经营'].includes(s.company.direction) ||
    s.company.logo.length > 300000
  )
    throw new Error('企业档案不完整');
  if (
    !nums(s.finance, [
      'cash',
      'debt',
      'fixedAssets',
      'equity',
      'retained',
      'revenue',
      'netProfit',
      'receipts',
      'expenses',
      'cogs',
      'interest',
      'rd',
      'marketing',
      'payroll',
      'storage',
      'depreciation',
      'tax',
      'badDebt',
      'investment',
      'cashStart',
    ]) ||
    s.finance.debt < 0
  )
    throw new Error('财务数据无效');
  if (
    !nums(s.materials, ['sorghum', 'wheat']) ||
    s.materials.sorghum < 0 ||
    s.materials.wheat < 0 ||
    !nums(s.capacity, ['production', 'storage', 'bottling', 'automation']) ||
    Object.values(s.capacity).some((n) => n < 0) ||
    !nums(
      s.staff,
      ROLES.map((r) => r.name),
    ) ||
    Object.values(s.staff).some((n) => !Number.isInteger(n) || n < 0 || n > 12)
  )
    throw new Error('资产或人员数据无效');
  if (
    !array(s.recipes, 20) ||
    !array(s.products, 20) ||
    !array(s.batches, 5000) ||
    !array(s.jobs, 500) ||
    !array(s.dealers, 12) ||
    !array(s.research, 10) ||
    !array(s.history, 120000) ||
    !array(s.news, 120) ||
    !array(s.experiments, 30) ||
    !array(s.events, 10) ||
    !array(s.eventHistory, 10)
  )
    throw new Error('存档记录集合无效');
  if (!s.recipes.length || !s.products.length || !s.dealers.length)
    throw new Error('核心经营档案为空');
  s.recipes.forEach((r) => {
    if (!strs(r, ['id'])) throw new Error('配方标识缺失');
    validRecipe(r);
  });
  s.products.forEach((p) => {
    validRecipe(p.recipe);
    if (
      !strs(p, ['id']) ||
      !nums(p, [
        'quality',
        'stock',
        'unitCost',
        'sold',
        'feedback',
        'lastAge',
        'lastSold',
        'lastRepeat',
        'repeatRate',
      ]) ||
      !flavor(p.flavor) ||
      !Number.isInteger(p.stock) ||
      p.stock < 0 ||
      p.unitCost < 0
    )
      throw new Error('成品档案无效');
  });
  s.batches.forEach((b) => {
    if (
      !strs(b, ['id', 'name', 'process', 'recipeId']) ||
      !nums(b, ['created', 'age', 'tons', 'cost', 'quality']) ||
      !bools(b, ['traceable', 'inspected']) ||
      !flavor(b.flavor) ||
      b.age < 0 ||
      b.tons < 0 ||
      b.cost < 0
    )
      throw new Error('基酒档案无效');
  });
  s.jobs.forEach((j) => {
    validRecipe(j.recipe);
    if (
      !strs(j, ['id', 'process']) ||
      !nums(j, ['tons', 'remaining', 'total', 'cost', 'quality']) ||
      !flavor(j.flavor) ||
      j.tons <= 0 ||
      j.remaining <= 0 ||
      j.remaining > j.total
    )
      throw new Error('生产计划无效');
  });
  if (
    s.research.length !== TECHS.length ||
    new Set(s.research.map((r) => r.id)).size !== TECHS.length
  )
    throw new Error('研发档案缺失');
  s.research.forEach((r) => {
    if (
      !TECHS.some((t) => t.id === r.id) ||
      !nums(r, ['stage', 'progress', 'attempts', 'instability']) ||
      !bools(r, ['active', 'applied']) ||
      !Number.isInteger(r.stage) ||
      r.stage < 0 ||
      r.stage > 4
    )
      throw new Error('研发进度无效');
  });
  s.dealers.forEach((d) => {
    if (
      !strs(d, ['id', 'name', 'region']) ||
      !nums(d, ['reach', 'health', 'cash', 'soldLast', 'shippedLast', 'paidLast', 'priceFactor']) ||
      !array(d.lots, 10000) ||
      !array(d.receivables, 10000)
    )
      throw new Error('渠道数据无效');
    d.lots.forEach((l) => {
      if (
        !strs(l, ['productId']) ||
        !nums(l, ['bottles', 'unitCost', 'price', 'quality']) ||
        l.bottles < 0 ||
        !s.products.some((p) => p.id === l.productId)
      )
        throw new Error('渠道库存无效');
    });
    d.receivables.forEach((r) => {
      if (!nums(r, ['amount', 'due']) || r.amount < 0) throw new Error('应收账款无效');
    });
  });
  s.history.forEach((h) => {
    if (
      !nums(h, [
        'month',
        'cash',
        'revenue',
        'profit',
        'receipts',
        'shipped',
        'retail',
        'dealerStock',
        'quality',
        'reputation',
        'debt',
        'rd',
        'expenses',
        'priceIndex',
        'repeatRate',
      ])
    )
      throw new Error('经营历史无效');
  });
  s.news.forEach((n) => {
    if (!strs(n, ['id', 'title', 'detail', 'type']) || !nums(n, ['month']))
      throw new Error('新闻记录无效');
  });
  s.experiments.forEach((e) => {
    if (e.recipe) validRecipe(e.recipe);
    if (e.predicted && !flavor(e.predicted)) throw new Error('实验预测档案无效');
    if (!strs(e, ['name']) || !nums(e, ['month', 'quality']) || !flavor(e.flavor))
      throw new Error('实验记录无效');
  });
  s.events.forEach((e) => {
    if (!EVENTS.some((d) => d.id === e.id) || !nums(e, ['triggered']))
      throw new Error('事件数据无效');
  });
  s.eventHistory.forEach((e) => {
    if (!EVENTS.some((d) => d.id === e.id) || !strs(e, ['choice']) || !nums(e, ['month']))
      throw new Error('事件历史无效');
  });
  for (const list of [s.products, s.recipes, s.batches, s.jobs, s.dealers])
    if (new Set(list.map((x) => x.id)).size !== list.length)
      throw new Error('存档存在重复档案标识');
}
export function deserializeGame(raw: string): { state: GameState; savedAt: string } {
  if (raw.length > 10_000_000) throw new Error('存档超过 10 MB 上限');
  let parsed: SaveEnvelope;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('存档不是有效的 JSON 文件');
  }
  if (
    !parsed ||
    parsed.format !== 'jiangxiang-era' ||
    parsed.version !== 1 ||
    typeof parsed.savedAt !== 'string'
  )
    throw new Error('无法识别的存档格式或版本');
  if (checksum(JSON.stringify(parsed.state)) !== parsed.checksum)
    throw new Error('存档校验失败，文件可能已损坏');
  validateState(parsed.state);
  return { state: parsed.state, savedAt: parsed.savedAt };
}
export function saveTo(storage: Pick<Storage, 'setItem'>, key: string, state: GameState) {
  storage.setItem(key, serializeGame(state));
}
export function loadFrom(storage: Pick<Storage, 'getItem'>, key: string) {
  const raw = storage.getItem(key);
  return raw ? deserializeGame(raw) : null;
}
