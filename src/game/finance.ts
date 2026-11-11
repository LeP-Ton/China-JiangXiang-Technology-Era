import { round } from './random';
import { payroll } from './selectors';
import type { GameState } from './types';

export function settleFinance(s: GameState) {
  const f = s.finance;
  f.payroll = payroll(s);
  f.interest = f.debt * Math.max(0.003, 0.006 - s.staff['财务经理'] * 0.0004);
  f.depreciation = f.fixedAssets * 0.004;
  const maintenance = f.fixedAssets * 0.002 + 1.8 + s.capacity.automation * 0.3;
  const bills = f.payroll + f.interest + f.storage + maintenance;
  f.cash -= bills;
  f.expenses += bills + f.depreciation;
  f.fixedAssets = Math.max(0, f.fixedAssets - f.depreciation);
  const pretax = f.revenue - f.cogs - f.expenses;
  f.tax = Math.max(0, pretax) * 0.18;
  f.cash -= f.tax;
  f.expenses += f.tax;
  f.netProfit = round(f.revenue - f.cogs - f.expenses);
  f.retained += f.netProfit;
  f.cash = round(f.cash, 5);
}
