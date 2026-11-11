import { addNews } from './actions';
import { eligibleEvents } from './events';
import { settleFinance } from './finance';
import { settleMarket } from './market';
import { settleProduction, settleStorage } from './production';
import { clamp, random, round } from './random';
import { settleResearch } from './research';
import { averageQuality, dealerStock } from './selectors';
import { cloneGame, emptyFinance } from './state';
import type { ActionResult, GameState } from './types';

export function advanceMonth(original: GameState): ActionResult {
  if (original.gameOver)
    return { state: original, ok: false, message: '企业已停止经营，请读取存档或重新开始' };
  if (original.events.length)
    return { state: original, ok: false, message: '请先处理待决策事件，再推进月份' };
  const s = cloneGame(original);
  settleResearch(s);
  settleStorage(s);
  settleProduction(s);
  const [cycle, seed] = random(s.seed);
  s.seed = seed;
  // 供给扩张在第 18 月后形成压力，五年周期继续运行，不会在 60 月停止。
  s.industry = clamp(
    1.08 - Math.max(0, s.month - 9) * 0.014 + Math.sin(s.month / 6) * 0.09,
    0.62,
    1.2,
  );
  settleMarket(s);
  if (s.complianceRisk > 8 && cycle < s.complianceRisk / 240) {
    const fine = 8 + s.complianceRisk * 0.6;
    s.finance.cash -= fine;
    s.finance.expenses += fine;
    s.reputation = clamp(s.reputation - 12);
    s.awareness = clamp(s.awareness - 3);
    s.complianceRisk *= 0.7;
    s.hype *= 0.3;
    s.dealers.forEach((d) => {
      d.health = clamp(d.health - 8);
    });
    addNews(
      s,
      '预警',
      '概念的账单，终于寄到了',
      `夸大宣传引发调查、退单与整改，损失 ${round(fine)} 万元，信誉下降 12。风险不会随发布会结束而消失。`,
    );
  }
  settleFinance(s);
  s.insolventMonths = s.finance.cash < 0 ? s.insolventMonths + 1 : 0;
  if (s.finance.cash < 0)
    addNews(
      s,
      '预警',
      '现金流已转负',
      `连续 ${s.insolventMonths} 个月现金不足。若连续 3 个月未恢复，企业将停止经营。可融资、借款或减少支出。`,
    );
  if (s.insolventMonths >= 3) {
    s.gameOver = true;
    addNews(
      s,
      '预警',
      '企业进入清算',
      '现金连续三个月为负，经营已停止。你可以读取之前的存档，重新做出决定。',
    );
  }
  const retail = s.products.reduce((v, p) => v + p.lastSold, 0);
  const repeats = s.products.reduce((v, p) => v + p.lastRepeat, 0);
  s.history.push({
    month: s.month,
    cash: round(s.finance.cash),
    revenue: round(s.finance.revenue),
    profit: s.finance.netProfit,
    receipts: round(s.finance.receipts),
    shipped: s.shippedThisMonth,
    retail: s.retailThisMonth,
    dealerStock: dealerStock(s),
    quality: averageQuality(s),
    reputation: round(s.reputation, 1),
    debt: round(s.finance.debt),
    rd: round(s.finance.rd),
    expenses: round(s.finance.expenses),
    priceIndex: round(
      s.dealers.reduce((v, d) => v + d.priceFactor, 0) / Math.max(1, s.dealers.length),
      3,
    ),
    repeatRate: retail ? round((repeats / retail) * 100, 1) : 0,
  });
  addNews(
    s,
    '经营',
    `第 ${s.month} 月结算完成`,
    `营收 ${round(s.finance.revenue)} 万，利润 ${s.finance.netProfit} 万，终端售出 ${s.retailThisMonth.toLocaleString()} 瓶。回款 ${round(s.finance.receipts)} 万，出货并不等于动销。`,
  );
  // 月报保留已结算损益，新月份只承接资产、负债与累计留存收益。
  // 否则上月收入和费用会被重复计入后续月份，现金与利润逐渐背离。
  s.finance = emptyFinance(
    s.finance.cash,
    s.finance.debt,
    s.finance.fixedAssets,
    s.finance.retained,
    s.finance.equity,
  );
  s.hype *= 0.82;
  s.demandBoost = 0;
  s.pendingMarketing = 0;
  s.priceIndex = clamp(s.priceIndex + 0.008, 0.65, 1.05);
  s.month++;
  s.actions = s.actionLimit;
  s.bottledThisMonth = 0;
  s.shippedThisMonth = 0;
  s.retailThisMonth = 0;
  s.dealers.forEach((d) => {
    d.shippedLast = 0;
    d.paidLast = 0;
  });
  if (!s.gameOver) {
    const eligible = eligibleEvents(s);
    if (eligible.length) {
      s.events.push({ id: eligible[0], triggered: s.month });
      addNews(s, '预警', '新的经营议题等待决策', '请前往新闻与舆情中心处理，再推进下一个月。');
    }
    if (s.month % 6 === 0) {
      const rival = ['赤岭酒业', '云麓酒坊', '远江酿造'][Math.floor(cycle * 3)];
      addNews(
        s,
        '行业',
        `${rival}发布经营动态`,
        s.industry < 0.9
          ? '同行启动终端促销。市场需求增速放缓，行业进入库存消化期。'
          : '同行扩建项目投产，渠道招商竞争升温；供给的增长会在未来传导到成交价。',
      );
    }
  }
  return { state: s, ok: true, message: `第 ${s.month - 1} 月已结算，进入第 ${s.month} 月` };
}
