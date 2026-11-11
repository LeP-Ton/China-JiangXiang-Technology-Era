export type Segment = '大众消费' | '商务宴请' | '年轻消费者' | '高端收藏';
export type Direction = '科技研发' | '品牌营销' | '规模扩张' | '资本运作' | '稳健经营';
export type FlavorKey =
  '酱香' | '粮香' | '焦香' | '果香' | '甜感' | '醇厚度' | '回味' | '协调性' | '稳定性';
export type Flavor = Record<FlavorKey, number>;
export type Role =
  | '酿酒师'
  | '风味研究员'
  | '微生物研究员'
  | '生产工程师'
  | '品牌营销经理'
  | '销售经理'
  | '财务经理';
export interface Company {
  name: string;
  brand: string;
  product: string;
  logo: string;
  direction: Direction;
}
export type CompanySetup = Pick<Company, 'name' | 'logo' | 'direction'>;
export interface Recipe {
  id: string;
  name: string;
  brand: string;
  segment: Segment;
  sorghum: number;
  roast: number;
  fermentation: number;
  cut: number;
  aging: number;
  packaging: '简装' | '雅致' | '典藏';
  price: number;
}
export interface Product {
  id: string;
  recipe: Recipe;
  flavor: Flavor;
  quality: number;
  stock: number;
  unitCost: number;
  sold: number;
  feedback: number;
  lastAge: number;
  lastSold: number;
  lastRepeat: number;
  repeatRate: number;
}
export interface Batch {
  id: string;
  name: string;
  created: number;
  age: number;
  tons: number;
  cost: number;
  flavor: Flavor;
  quality: number;
  process: string;
  recipeId: string;
  traceable: boolean;
  inspected: boolean;
}
export interface ProductionJob {
  id: string;
  recipe: Recipe;
  tons: number;
  remaining: number;
  total: number;
  cost: number;
  flavor: Flavor;
  quality: number;
  process: string;
}
export interface Research {
  id: string;
  stage: number;
  active: boolean;
  progress: number;
  attempts: number;
  applied: boolean;
  instability: number;
}
export interface DealerLot {
  productId: string;
  bottles: number;
  unitCost: number;
  price: number;
  quality: number;
}
export interface Receivable {
  amount: number;
  due: number;
}
export interface Dealer {
  id: string;
  name: string;
  region: string;
  reach: number;
  health: number;
  cash: number;
  lots: DealerLot[];
  receivables: Receivable[];
  soldLast: number;
  shippedLast: number;
  paidLast: number;
  priceFactor: number;
}
export interface Finance {
  cash: number;
  debt: number;
  fixedAssets: number;
  equity: number;
  revenue: number;
  netProfit: number;
  receipts: number;
  expenses: number;
  cogs: number;
  interest: number;
  rd: number;
  marketing: number;
  payroll: number;
  storage: number;
  depreciation: number;
  tax: number;
  badDebt: number;
  investment: number;
  cashStart: number;
  retained: number;
}
export interface MonthRecord {
  month: number;
  cash: number;
  revenue: number;
  profit: number;
  receipts: number;
  shipped: number;
  retail: number;
  dealerStock: number;
  quality: number;
  reputation: number;
  debt: number;
  rd: number;
  expenses: number;
  priceIndex: number;
  repeatRate: number;
}
export interface NewsItem {
  id: string;
  month: number;
  type: '经营' | '研发' | '预警' | '行业';
  title: string;
  detail: string;
}
export interface GameEvent {
  id: string;
  triggered: number;
}
export interface EventChoice {
  label: string;
  description: string;
  cost: number;
  reputation?: number;
  awareness?: number;
  hype?: number;
  risk?: number;
  demand?: number;
  trace?: boolean;
  qualityFix?: boolean;
  expand?: boolean;
  debt?: number;
  science?: number;
}
export interface EventDefinition {
  id: string;
  title: string;
  subtitle: string;
  body: string;
  department: string;
  choices: EventChoice[];
}
export interface GameState {
  version: 1;
  company: Company;
  month: number;
  seed: number;
  initialSeed: number;
  actions: number;
  actionLimit: number;
  finance: Finance;
  awareness: number;
  reputation: number;
  hype: number;
  complianceRisk: number;
  demandBoost: number;
  industry: number;
  priceIndex: number;
  materials: { sorghum: number; wheat: number };
  staff: Record<Role, number>;
  capacity: { production: number; storage: number; bottling: number; automation: number };
  recipes: Recipe[];
  products: Product[];
  batches: Batch[];
  jobs: ProductionJob[];
  research: Research[];
  dealers: Dealer[];
  history: MonthRecord[];
  news: NewsItem[];
  events: GameEvent[];
  eventHistory: { id: string; month: number; choice: string }[];
  experimentCount: number;
  experiments: {
    month: number;
    name: string;
    quality: number;
    flavor: Flavor;
    predicted?: Flavor;
    recipe?: Recipe;
  }[];
  pendingMarketing: number;
  bottledThisMonth: number;
  shippedThisMonth: number;
  retailThisMonth: number;
  traceability: boolean;
  qualityControl: number;
  insolventMonths: number;
  gameOver: boolean;
  milestoneSeen: boolean;
}
export type Action =
  | { type: 'recipe'; recipe: Recipe }
  | { type: 'experiment'; recipe: Recipe }
  | { type: 'research'; id: string }
  | { type: 'applyResearch'; id: string }
  | { type: 'procure'; tons: number }
  | { type: 'produce'; recipeId: string; tons: number }
  | { type: 'blend'; recipeId: string; batchIds: string[]; bottles: number }
  | { type: 'ship'; dealerId: string; productId: string; bottles: number; credit: boolean }
  | { type: 'price'; productId: string; price: number }
  | { type: 'marketing'; campaign: string }
  | { type: 'dealer'; region: string }
  | { type: 'supportDealer'; dealerId: string }
  | { type: 'hire'; role: Role }
  | { type: 'expand'; facility: 'production' | 'storage' | 'bottling' | 'automation' }
  | { type: 'loan'; amount: number }
  | { type: 'repay'; amount: number }
  | { type: 'equity' }
  | { type: 'inspect'; batchId: string }
  | { type: 'quality' }
  | { type: 'event'; id: string; choice: number }
  | { type: 'continue' };
export interface ActionResult {
  state: GameState;
  ok: boolean;
  message: string;
}
