import {
  CAMPAIGNS,
  FACILITIES,
  FLAVORS,
  REGIONS,
  RESEARCH_COST,
  ROLES,
  SEGMENTS,
  TECHS,
} from './data';
import { eventById } from './events';
import { forecast, hasTech, matureBatch, predictFlavor, qualityScore } from './flavor';
import { clamp, random, round } from './random';
import { baseStock, bottlingCapacity, productionCapacity } from './selectors';
import { cloneGame } from './state';
import type { Action, ActionResult, Flavor, GameState, Recipe } from './types';

export const addNews = (
  s: GameState,
  type: GameState['news'][number]['type'],
  title: string,
  detail: string,
) => {
  s.news.unshift({
    id: `n-${s.month}-${s.actions}-${s.news.length}-${title}`,
    month: s.month,
    type,
    title,
    detail,
  });
  s.news = s.news.slice(0, 120);
};
const demandNumber = (n: number, min: number, max: number, label: string, integer = false) => {
  if (!Number.isFinite(n) || n < min || n > max || (integer && !Number.isInteger(n)))
    throw new Error(`${label}须在 ${min}～${max} 之间${integer ? '且为整数' : ''}`);
};
const spend = (
  s: GameState,
  amount: number,
  category: 'expense' | 'rd' | 'marketing' | 'asset' = 'expense',
) => {
  if (!Number.isFinite(amount) || amount < 0 || (amount > 0 && s.finance.cash + 0.000001 < amount))
    throw new Error(`现金不足，需要 ${round(amount)} 万元`);
  s.finance.cash = round(s.finance.cash - amount, 5);
  if (category === 'expense') s.finance.expenses += amount;
  if (category === 'rd') {
    s.finance.rd += amount;
    s.finance.expenses += amount;
  }
  if (category === 'marketing') {
    s.finance.marketing += amount;
    s.finance.expenses += amount;
  }
};
export function validRecipe(r: Recipe) {
  if (!r || !r.name?.trim() || r.name.length > 30 || !r.brand?.trim() || r.brand.length > 30)
    throw new Error('请填写 1～30 字的产品名和品牌名');
  if (!Object.hasOwn(SEGMENTS, r.segment) || !['简装', '雅致', '典藏'].includes(r.packaging))
    throw new Error('产品定位或包装无效');
  demandNumber(r.sorghum, 50, 85, '高粱占比');
  demandNumber(r.roast, 15, 90, '制曲温度强度');
  demandNumber(r.fermentation, 2, 6, '发酵月数', true);
  demandNumber(r.cut, 20, 85, '摘酒精度');
  demandNumber(r.aging, 3, 60, '目标酒龄', true);
  demandNumber(r.price, 39, 1999, '建议零售价');
}
export function performAction(original: GameState, action: Action): ActionResult {
  const s = cloneGame(original);
  try {
    if (s.gameOver) throw new Error('企业已停止经营，请读取存档或创建新企业');
    const free = ['event', 'price', 'continue'].includes(action.type);
    if (!free && s.actions <= 0) throw new Error('本月管理行动已用完，请推进至下个月');
    let message = '';
    switch (action.type) {
      case 'recipe': {
        validRecipe(action.recipe);
        spend(s, 1.5, 'rd');
        const r = {
          ...action.recipe,
          name: action.recipe.name.trim(),
          brand: action.recipe.brand.trim(),
        };
        const old = s.recipes.find((p) => p.id === r.id);
        if (old) Object.assign(old, r);
        else {
          if (s.recipes.length >= 20) throw new Error('最多管理 20 款配方');
          r.id = `recipe-${s.month}-${s.recipes.length + 1}`;
          s.recipes.push(r);
        }
        message = `已归档“${r.name}”，配方设计投入 1.5 万元`;
        break;
      }
      case 'experiment': {
        validRecipe(action.recipe);
        spend(s, 2.5, 'rd');
        const prediction = forecast(action.recipe, s);
        const [draw, next] = random(s.seed);
        s.seed = next;
        const f = Object.fromEntries(
          FLAVORS.map((k, i) => [
            k,
            round(
              clamp(prediction.flavor[k] + Math.sin(draw * 30 + i) * prediction.uncertainty),
              1,
            ),
          ]),
        ) as Flavor;
        s.experimentCount++;
        s.experiments.unshift({
          month: s.month,
          name: action.recipe.name,
          quality: qualityScore(f),
          flavor: f,
          predicted: { ...prediction.flavor },
          recipe: { ...action.recipe },
        });
        s.experiments = s.experiments.slice(0, 30);
        message = `完成盲品实验，实测品质 ${qualityScore(f)}，数据已回流预测模型`;
        break;
      }
      case 'research': {
        const t = TECHS.find((t) => t.id === action.id);
        const r = s.research.find((r) => r.id === action.id);
        if (!t || !r || r.stage >= 4 || r.active) throw new Error('该技术当前无法投入研发');
        if (t.prerequisite && !hasTech(s, t.prerequisite))
          throw new Error(`需先完成并应用“${TECHS.find((x) => x.id === t.prerequisite)?.name}”`);
        const scientists = s.staff['风味研究员'] + s.staff['微生物研究员'];
        if (scientists < 1 + Math.floor(r.stage / 2))
          throw new Error('中试与工业化至少需要 2 名科研人员');
        if (s.research.filter((x) => x.active).length >= scientists)
          throw new Error('科研人员已全部投入在研项目');
        spend(s, RESEARCH_COST[r.stage] * t.cost, 'rd');
        r.active = true;
        r.progress = 0;
        r.attempts++;
        message = `“${t.name}”进入${['基础研究', '实验室小试', '中试验证', '工业化应用'][r.stage]}`;
        break;
      }
      case 'applyResearch': {
        const r = s.research.find((r) => r.id === action.id);
        if (!r || r.stage < 4 || r.applied)
          throw new Error('该技术尚未通过工业化验证，或已投入应用');
        spend(s, 6, 'asset');
        s.finance.fixedAssets += 6;
        r.applied = true;
        if (action.id === 'quality' || action.id === 'microbes') s.qualityControl++;
        message = '技术已接入实际生产；新生产批次和配方预测开始受益';
        break;
      }
      case 'procure': {
        demandNumber(action.tons, 1, 100, '采购规模');
        spend(s, action.tons * 1.256, 'asset');
        s.materials.sorghum = round(s.materials.sorghum + action.tons * 2, 3);
        s.materials.wheat = round(s.materials.wheat + action.tons * 0.8, 3);
        message = `采购高粱 ${action.tons * 2} 吨、小麦 ${round(action.tons * 0.8)} 吨`;
        break;
      }
      case 'produce': {
        const r = s.recipes.find((r) => r.id === action.recipeId);
        if (!r) throw new Error('请先保存有效配方');
        demandNumber(action.tons, 0.5, 100, '计划基酒产量');
        const occupied = s.jobs.reduce((v, j) => v + j.tons, 0);
        if (occupied + action.tons > productionCapacity(s))
          throw new Error('在制容量不足，请等待当前批次完成或扩建');
        if (baseStock(s) + occupied + action.tons * 1.2 > s.capacity.storage)
          throw new Error('储酒库剩余容量不足，需为生产完成后的基酒预留仓容');
        const efficiency = (hasTech(s, 'koji') ? 0.92 : 1) * (1 + (r.cut - 55) / 120);
        const grain = (action.tons * 2 * efficiency * r.sorghum) / 65;
        const wheat = (action.tons * 0.8 * efficiency * (100 - r.sorghum)) / 35;
        if (s.materials.sorghum < grain || s.materials.wheat < wheat)
          throw new Error('原料不足，请先采购高粱和小麦');
        const operating = action.tons * (1.1 + r.fermentation * 0.18);
        spend(s, operating, 'asset');
        s.materials.sorghum = round(s.materials.sorghum - grain, 4);
        s.materials.wheat = round(s.materials.wheat - wheat, 4);
        const flavor = predictFlavor(r, s);
        const total = Math.max(2, r.fermentation + 1 - (hasTech(s, 'control') ? 1 : 0));
        s.jobs.push({
          id: `job-${s.month}-${s.jobs.length}-${s.news.length}`,
          recipe: { ...r },
          tons: action.tons,
          remaining: total,
          total,
          cost: operating + grain * 0.5 + wheat * 0.32,
          flavor,
          quality: qualityScore(flavor),
          process: hasTech(s, 'fermentation') ? '风味导向固态发酵' : '传统固态发酵',
        });
        message = `${action.tons} 吨生产计划已启动，预计 ${total} 个月后入库`;
        break;
      }
      case 'blend': {
        const r = s.recipes.find((r) => r.id === action.recipeId);
        if (!r) throw new Error('配方不存在');
        demandNumber(action.bottles, 200, 1000000, '灌装瓶数', true);
        if (s.bottledThisMonth + action.bottles > bottlingCapacity(s))
          throw new Error('本月灌装能力不足');
        if (!Array.isArray(action.batchIds) || !action.batchIds.length)
          throw new Error('请至少选择一个基酒批次');
        const batches = s.batches.filter((b) => action.batchIds.includes(b.id));
        if (!batches.length || batches.some((b) => b.age < SEGMENTS[r.segment].minAge))
          throw new Error(`该客群要求基酒至少陈酿 ${SEGMENTS[r.segment].minAge} 个月`);
        const loss = hasTech(s, 'blend') ? 1.01 : 1.025;
        const tons = (action.bottles / 2000) * loss;
        const totalTons = batches.reduce((v, b) => v + b.tons, 0);
        if (totalTons + 0.000001 < tons)
          throw new Error(`所选基酒不足，需要含损耗 ${round(tons, 3)} 吨`);
        const packageCost = { 简装: 5, 雅致: 16, 典藏: 48 }[r.packaging];
        const bottling = (hasTech(s, 'bottling') ? 4 : 5) + packageCost;
        spend(s, (action.bottles * bottling) / 10000, 'asset');
        let cost = (action.bottles * bottling) / 10000;
        let avgAge = 0;
        const f = Object.fromEntries(FLAVORS.map((k) => [k, 0])) as Flavor;
        // 按所选批次现有数量比例取酒，库存成本随实际消耗转入成品。
        for (const b of batches) {
          const weight = b.tons / totalTons;
          const take = tons * weight;
          cost += (b.cost * take) / b.tons;
          avgAge += b.age * weight;
          const bf = matureBatch(b, s);
          FLAVORS.forEach((k) => {
            f[k] += bf[k] * weight;
          });
          b.cost = Math.max(0, b.cost * (1 - take / b.tons));
          b.tons = Math.max(0, b.tons - take);
        }
        if (hasTech(s, 'blend')) f['协调性'] = clamp(f['协调性'] + 4);
        const shortfall = Math.max(0, r.aging - avgAge);
        f['协调性'] = clamp(f['协调性'] - shortfall * 0.35);
        const quality = qualityScore(f);
        const existing = s.products.find((p) => p.recipe.id === r.id);
        if (existing) {
          const old = existing.stock;
          const all = old + action.bottles;
          existing.unitCost = (existing.unitCost * old + cost * 10000) / all;
          FLAVORS.forEach((k) => {
            existing.flavor[k] = (existing.flavor[k] * old + f[k] * action.bottles) / all;
          });
          existing.quality = qualityScore(existing.flavor);
          existing.stock = all;
          existing.recipe = { ...r };
          existing.lastAge = round(avgAge, 1);
        } else
          s.products.push({
            id: `product-${r.id}`,
            recipe: { ...r },
            flavor: f,
            quality,
            stock: action.bottles,
            unitCost: (cost * 10000) / action.bottles,
            sold: 0,
            feedback: quality,
            lastAge: round(avgAge, 1),
            lastSold: 0,
            lastRepeat: 0,
            repeatRate: 0,
          });
        s.batches = s.batches.filter((b) => b.tons > 0.00001);
        s.bottledThisMonth += action.bottles;
        message = `${action.bottles.toLocaleString()} 瓶已入成品库，酒龄 ${round(avgAge, 1)} 月，品质 ${quality} 分${shortfall > 0 ? '；未达目标酒龄，协调性受损' : ''}`;
        break;
      }
      case 'ship': {
        const d = s.dealers.find((d) => d.id === action.dealerId);
        const p = s.products.find((p) => p.id === action.productId);
        if (!d || !p) throw new Error('经销商或产品不存在');
        demandNumber(action.bottles, 100, 1000000, '发货数量', true);
        if (p.stock < action.bottles) throw new Error('企业成品库存不足');
        const stock = d.lots.reduce((v, l) => v + l.bottles, 0);
        if (d.health < 22 || stock / Math.max(200, d.soldLast) > 9)
          throw new Error('经销商停止进货：请先帮助终端去库存');
        const value = (action.bottles * p.recipe.price * 0.66) / 10000;
        const paid = action.credit ? value * 0.4 : value;
        if (d.cash < paid) throw new Error('经销商流动资金不足，无法支付本次货款');
        d.cash -= paid;
        s.finance.cash += paid;
        s.finance.receipts += paid;
        s.finance.revenue += value;
        s.finance.cogs += (p.unitCost * action.bottles) / 10000;
        if (action.credit) d.receivables.push({ amount: value - paid, due: s.month + 2 });
        p.stock -= action.bottles;
        d.shippedLast += action.bottles;
        d.paidLast += paid;
        const lot = d.lots.find(
          (l) => l.productId === p.id && Math.abs(l.price - p.recipe.price) < 0.01,
        );
        if (lot) {
          lot.quality =
            (lot.quality * lot.bottles + p.quality * action.bottles) /
            (lot.bottles + action.bottles);
          lot.bottles += action.bottles;
        } else
          d.lots.push({
            productId: p.id,
            bottles: action.bottles,
            unitCost: p.recipe.price * 0.66,
            price: p.recipe.price,
            quality: p.quality,
          });
        s.shippedThisMonth += action.bottles;
        message = `已发货 ${action.bottles.toLocaleString()} 瓶，确认收入 ${round(value)} 万，实际回款 ${round(paid)} 万${action.credit ? '，余款两个月后到期' : ''}`;
        break;
      }
      case 'price': {
        demandNumber(action.price, 39, 1999, '零售价');
        const p = s.products.find((p) => p.id === action.productId);
        if (!p) throw new Error('产品不存在');
        p.recipe.price = action.price;
        const r = s.recipes.find((r) => r.id === p.recipe.id);
        if (r) r.price = action.price;
        message = '建议零售价已更新，影响新出货与直销；经销商旧库存仍按原进价承压';
        break;
      }
      case 'marketing': {
        const c = CAMPAIGNS.find((c) => c.id === action.campaign);
        if (!c) throw new Error('营销活动不存在');
        spend(s, c.cost, 'marketing');
        const bonus = 1 + Math.min(4, s.staff['品牌营销经理']) * 0.12;
        s.awareness = clamp(s.awareness + c.awareness * bonus);
        s.reputation = clamp(s.reputation + c.reputation);
        s.demandBoost = Math.min(2, s.demandBoost + c.demand * bonus);
        if (c.id === 'live') s.priceIndex = Math.max(0.65, s.priceIndex - 0.025);
        message = `“${c.name}”已执行，动销效果在月末结算`;
        break;
      }
      case 'dealer': {
        if (!REGIONS.includes(action.region) || s.dealers.length >= 12)
          throw new Error('该地区无效，或已达到 12 家渠道管理上限');
        spend(s, 8, 'marketing');
        s.dealers.push({
          id: `dealer-${s.month}-${s.dealers.length + 1}`,
          name: `${action.region}·${['远禾', '知味', '行川', '松原'][s.dealers.length % 4]}商贸`,
          region: action.region,
          reach: 800 + s.awareness * 12,
          health: 82,
          cash: 32,
          lots: [],
          receivables: [],
          soldLast: 0,
          shippedLast: 0,
          paidLast: 0,
          priceFactor: 1,
        });
        message = `新经销商已签约，需主动发货后才产生销售`;
        break;
      }
      case 'supportDealer': {
        const d = s.dealers.find((d) => d.id === action.dealerId);
        if (!d) throw new Error('经销商不存在');
        spend(s, 4, 'marketing');
        d.health = clamp(d.health + 12);
        d.cash += 2;
        s.demandBoost = Math.min(2, s.demandBoost + 0.18);
        message = '已投入 4 万渠道支持，其中 2 万用于缓解经销商周转压力';
        break;
      }
      case 'hire': {
        const role = ROLES.find((r) => r.name === action.role);
        if (!role || s.staff[role.name] >= 12) throw new Error('岗位无效或已达到招聘上限');
        spend(s, role.salary * 1.5);
        s.staff[role.name]++;
        message = `${role.name}已入职，每月固定薪资增加 ${role.salary} 万元`;
        break;
      }
      case 'expand': {
        const f = FACILITIES[action.facility];
        if (!f) throw new Error('设施类型无效');
        spend(s, f.cost, 'asset');
        s.finance.fixedAssets += f.cost;
        s.finance.investment += f.cost;
        const gain = { production: 4, storage: 30, bottling: 6000, automation: 1 }[action.facility];
        s.capacity[action.facility] += gain;
        message = `${f.name}已扩建，固定资产和每月维护成本同步增加`;
        break;
      }
      case 'loan': {
        demandNumber(action.amount, 10, 300, '贷款金额');
        if (s.finance.debt + action.amount > 300 + s.finance.fixedAssets * 0.8)
          throw new Error('已超过银行授信上限，请控制杠杆');
        s.finance.debt += action.amount;
        s.finance.cash += action.amount;
        message = `获得 ${action.amount} 万贷款，每月利息随负债结算`;
        break;
      }
      case 'repay': {
        demandNumber(action.amount, 1, s.finance.debt, '还款金额');
        spend(s, action.amount, 'asset');
        s.finance.debt -= action.amount;
        message = `已偿还 ${action.amount} 万贷款本金`;
        break;
      }
      case 'equity': {
        if (s.finance.equity <= 35) throw new Error('创始人持股过低，无法继续简易融资');
        const funding = 60 + s.awareness * 0.6 + s.reputation * 0.4;
        s.finance.cash += funding;
        s.finance.equity *= 0.85;
        message = `股权融资 ${round(funding)} 万，创始人持股降至 ${round(s.finance.equity, 1)}%`;
        break;
      }
      case 'inspect': {
        const b = s.batches.find((b) => b.id === action.batchId);
        if (!b || b.inspected) throw new Error('批次不存在或已完成检测');
        spend(s, 1);
        b.inspected = true;
        b.traceable = true;
        s.reputation = clamp(s.reputation + 0.5);
        message = `“${b.name}”检测完成，追溯档案已补齐`;
        break;
      }
      case 'quality': {
        spend(s, 8);
        s.qualityControl++;
        s.complianceRisk = clamp(s.complianceRisk - 8);
        s.reputation = clamp(s.reputation + 2);
        s.traceability = true;
        message = '质量整改已完成，批次追溯开启；异常风险下降但不会归零';
        break;
      }
      case 'event': {
        const pending = s.events.find((e) => e.id === action.id);
        const e = eventById(action.id);
        if (!pending || !e || !Number.isInteger(action.choice) || !e.choices[action.choice])
          throw new Error('事件已处理或选项无效');
        const c = e.choices[action.choice];
        spend(s, c.cost);
        s.reputation = clamp(s.reputation + (c.reputation ?? 0));
        s.awareness = clamp(s.awareness + (c.awareness ?? 0));
        s.hype = clamp(s.hype + (c.hype ?? 0));
        s.complianceRisk = clamp(s.complianceRisk + (c.risk ?? 0));
        s.demandBoost = Math.min(2, s.demandBoost + (c.demand ?? 0));
        if (c.trace) {
          s.traceability = true;
          s.qualityControl++;
        }
        if (c.science) s.experimentCount += c.science;
        if (c.qualityFix) {
          if (e.id === 'quality-incident') s.qualityControl++;
          s.dealers.forEach((d) => {
            d.health = clamp(d.health + 10);
          });
        }
        if (c.expand) {
          const cost = c.debt ? 120 : 20;
          if (c.debt) {
            s.finance.debt += c.debt;
          }
          s.finance.fixedAssets += cost;
          s.capacity.production += c.debt ? 8 : 2;
        }
        if (e.id === 'quality-incident' && c.qualityFix) {
          // 召回损失进入当期成本，不能只支付整改费却保留全部可售库存。
          for (const p of s.products) {
            const lost = Math.ceil(p.stock * 0.12);
            s.finance.cogs += (lost * p.unitCost) / 10000;
            p.stock -= lost;
          }
          s.dealers.forEach((d) =>
            d.lots.forEach((l) => {
              l.bottles = Math.floor(l.bottles * 0.9);
            }),
          );
        }
        s.events = s.events.filter((x) => x.id !== e.id);
        s.eventHistory.push({ id: e.id, month: s.month, choice: c.label });
        message = `已决定：${c.label}`;
        addNews(s, '经营', e.title, `${c.label}。${c.description}`);
        break;
      }
      case 'continue':
        s.milestoneSeen = true;
        message = '已进入自由经营，未来每个月仍将正常结算';
        break;
      default:
        throw new Error('无法识别的经营行动');
    }
    if (!free) s.actions--;
    s.finance.cash = round(s.finance.cash, 5);
    if (!['event', 'price', 'continue'].includes(action.type))
      addNews(
        s,
        action.type === 'research' || action.type === 'experiment' ? '研发' : '经营',
        message.split('，')[0],
        message,
      );
    return { state: s, ok: true, message };
  } catch (error) {
    return {
      state: original,
      ok: false,
      message: error instanceof Error ? error.message : '操作未完成',
    };
  }
}
