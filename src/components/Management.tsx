import { useState } from 'react';
import {
  Banknote,
  Building2,
  ChevronDown,
  FileCheck2,
  HandCoins,
  Landmark,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';
import { ROLES } from '../game/data';
import { EVENTS, eventById } from '../game/events';
import { assets, inventoryValue, payroll, receivables, staffCount } from '../game/selectors';
import { Badge, Field, Metric, money, num, PageTitle, Panel, Tip } from './shared';
import type { PanelProps } from './shared';

export function Finance({ s, act }: PanelProps) {
  const [amount, setAmount] = useState(50);
  const totalAssets = assets(s);
  const last = s.history.at(-1);
  return (
    <>
      <PageTitle
        eyebrow="FINANCE / 财务管理系统"
        title="利润写在报表上，生存留在现金里"
        description="库存不是现金，出货不是回款，借来的钱也不是收入。所有经营行动会进入对应账目。"
      />
      <div className="metrics-grid">
        <Metric
          label="现金与银行存款"
          value={money(s.finance.cash)}
          unit="万元"
          detail={`本月期初 ${money(s.finance.cashStart)} 万`}
        />
        <Metric
          label="负债本金"
          value={money(s.finance.debt)}
          unit="万元"
          detail={`月利率 ${num(Math.max(0.003, 0.006 - s.staff['财务经理'] * 0.0004) * 100, 2)}%`}
        />
        <Metric
          label="库存资产"
          value={money(inventoryValue(s))}
          unit="万元"
          detail="原料、在制、基酒和企业成品按成本计价"
        />
        <Metric
          label="总资产"
          value={money(totalAssets)}
          unit="万元"
          detail={`负债率 ${num((s.finance.debt / Math.max(1, totalAssets)) * 100, 1)}%`}
        />
      </div>
      <div className="two-columns">
        <Panel title="财务报表视角" eyebrow="看得见的增长" extra={<Building2 size={18} />}>
          <div className="fact-row">
            <span>本月已确认营业收入</span>
            <strong>{money(s.finance.revenue)} 万</strong>
          </div>
          <div className="fact-row">
            <span>本月实际回款</span>
            <strong>{money(s.finance.receipts)} 万</strong>
          </div>
          <div className="fact-row">
            <span>本月已结转产品成本</span>
            <strong>{money(s.finance.cogs)} 万</strong>
          </div>
          <div className="fact-row">
            <span>本月已发生研发投入</span>
            <strong>{money(s.finance.rd)} 万</strong>
          </div>
          <div className="fact-row">
            <span>本月已发生销售费用</span>
            <strong>{money(s.finance.marketing)} 万</strong>
          </div>
          <div className="fact-row">
            <span>上月已结算净利润</span>
            <strong className={(last?.profit ?? 0) < 0 ? 'negative' : 'positive'}>
              {money(last?.profit ?? 0)} 万
            </strong>
          </div>
          <Tip>
            人工、仓储、利息、维护、折旧和模拟税费在月末统一入账。原料采购与在制加工先形成库存资产，销售时再结转成本。
          </Tip>
        </Panel>
        <Panel title="真实经营视角" eyebrow="增长背后的承载力" extra={<FileCheck2 size={18} />}>
          <div className="fact-row">
            <span>上月终端实际购买</span>
            <strong>{num(last?.retail ?? 0)} 瓶</strong>
          </div>
          <div className="fact-row">
            <span>渠道库存</span>
            <strong>
              {num(s.dealers.reduce((v, d) => v + d.lots.reduce((n, l) => n + l.bottles, 0), 0))} 瓶
            </strong>
          </div>
          <div className="fact-row">
            <span>未收回的渠道货款</span>
            <strong>{money(receivables(s))} 万</strong>
          </div>
          <div className="fact-row">
            <span>上月消费者复购率</span>
            <strong>{num(last?.repeatRate ?? 0, 1)}%</strong>
          </div>
          <div className="fact-row">
            <span>预计每月固定薪资</span>
            <strong>{money(payroll(s))} 万</strong>
          </div>
          <div className="fact-row">
            <span>固定资产账面净值</span>
            <strong>{money(s.finance.fixedAssets)} 万</strong>
          </div>
          <div className="fact-row">
            <span>创始人持股</span>
            <strong>{num(s.finance.equity, 1)}%</strong>
          </div>
          <Tip>
            经销商逾期超过五个月的剩余货款计提坏账。持续三个月现金为负会触发企业清算，融资只能争取时间，不能创造终端需求。
          </Tip>
        </Panel>
      </div>
      <div className="two-columns">
        <Panel title="银行融资" extra={<Landmark size={20} />}>
          <Field label="操作金额 / 万元">
            <input
              type="number"
              min={10}
              max={300}
              step={10}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
          </Field>
          <div className="fact-row">
            <span>剩余授信额度</span>
            <strong>
              {money(Math.max(0, 300 + s.finance.fixedAssets * 0.8 - s.finance.debt))} 万
            </strong>
          </div>
          <div className="button-row">
            <button
              className="primary"
              disabled={s.actions < 1}
              onClick={() => act({ type: 'loan', amount })}
            >
              <Banknote size={15} />
              申请贷款
            </button>
            <button
              className="secondary"
              disabled={s.actions < 1 || s.finance.debt <= 0}
              onClick={() => act({ type: 'repay', amount })}
            >
              <HandCoins size={15} />
              偿还本金
            </button>
          </div>
        </Panel>
        <Panel title="股权融资" extra={<Building2 size={20} />}>
          <p className="body-copy">
            虚构投资机构“青禾资本”愿意按当前品牌和信誉投资，换取 15%
            的投后股权。现金不会计入营业收入，创始人持股会持续稀释。
          </p>
          <div className="fact-row">
            <span>本轮可融资</span>
            <strong>{money(60 + s.awareness * 0.6 + s.reputation * 0.4)} 万</strong>
          </div>
          <div className="fact-row">
            <span>融资后创始人持股</span>
            <strong>{num(s.finance.equity * 0.85, 1)}%</strong>
          </div>
          <button
            className="secondary full"
            disabled={s.actions < 1 || s.finance.equity <= 35}
            onClick={() => act({ type: 'equity' })}
          >
            接受融资方案
          </button>
        </Panel>
      </div>
      <Panel
        title="月度经营历史"
        extra={<Badge tone="gray">已完成 {s.history.length} 次结算</Badge>}
      >
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>月份</th>
                <th>营业收入</th>
                <th>实际回款</th>
                <th>净利润</th>
                <th>费用总额</th>
                <th>研发</th>
                <th>期末现金</th>
                <th>真实动销</th>
              </tr>
            </thead>
            <tbody>
              {s.history
                .slice(-24)
                .reverse()
                .map((h) => (
                  <tr key={h.month}>
                    <td>第 {h.month} 月</td>
                    <td>{money(h.revenue)}</td>
                    <td>{money(h.receipts)}</td>
                    <td className={h.profit < 0 ? 'negative' : 'positive'}>{money(h.profit)}</td>
                    <td>{money(h.expenses)}</td>
                    <td>{money(h.rd)}</td>
                    <td>{money(h.cash)}</td>
                    <td>{num(h.retail)} 瓶</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {!s.history.length && (
          <div className="empty">
            <p>首月结算后，在这里查看完整经营记录。金额单位：万元。</p>
          </div>
        )}
      </Panel>
    </>
  );
}

export function People({ s, act }: PanelProps) {
  return (
    <>
      <PageTitle
        eyebrow="HUMAN RESOURCES / 人力资源管理"
        title="设备可以买，能力需要人"
        description="每位员工提供实际经营收益，也带来每月固定薪资。招聘不是一次性购买数值。"
      />
      <div className="metrics-grid three">
        <Metric
          label="现有团队"
          value={staffCount(s)}
          unit="人"
          detail="七类专业岗位，最多每类 12 人"
        />
        <Metric
          label="每月薪资"
          value={money(payroll(s))}
          unit="万元"
          detail="从入职当月开始结算，招聘费为 1.5 月薪"
        />
        <Metric
          label="科研人员"
          value={s.staff['风味研究员'] + s.staff['微生物研究员']}
          unit="人"
          detail="中试和工业化阶段至少需要 2 人"
        />
      </div>
      <div className="people-grid">
        {ROLES.map((r, i) => (
          <Panel key={r.name}>
            <div className={`person-avatar avatar-${i % 3}`}>{r.name[0]}</div>
            <div className="person-heading">
              <h3>{r.name}</h3>
              <Badge tone="gray">已聘 {s.staff[r.name]} 人</Badge>
            </div>
            <p>{r.description}</p>
            <div className="fact-row">
              <span>月薪 / 招聘费用</span>
              <strong>
                {r.salary} / {num(r.salary * 1.5, 2)} 万
              </strong>
            </div>
            <button
              className="secondary full"
              disabled={s.actions < 1 || s.staff[r.name] >= 12}
              onClick={() => act({ type: 'hire', role: r.name })}
            >
              <UserPlus size={14} />
              招聘一名{r.name}
            </button>
          </Panel>
        ))}
      </div>
    </>
  );
}

export function News({ s, act }: PanelProps) {
  const [filter, setFilter] = useState('全部');
  return (
    <>
      <PageTitle
        eyebrow="NEWS & REPUTATION / 新闻与舆情中心"
        title="有些决策，无法只看一张报表"
        description="事件由经营状态触发。你可以选择短期利益，但代价不会因为翻到下个月而消失。"
        extra={<Badge tone={s.events.length ? 'red' : 'green'}>{s.events.length} 项待决策</Badge>}
      />
      {s.events.map((pending) => {
        const e = eventById(pending.id);
        return (
          <Panel
            key={e.id}
            className="event-card"
            eyebrow={`${e.department} · 第 ${pending.triggered} 月提交`}
            title={e.title}
            extra={<Badge tone="amber">需 CEO 决策</Badge>}
          >
            <div className="event-subtitle">{e.subtitle}</div>
            <p className="event-body">{e.body}</p>
            <div className="event-choices">
              {e.choices.map((c, i) => (
                <button
                  key={c.label}
                  disabled={c.cost > 0 && s.finance.cash < c.cost}
                  onClick={() => act({ type: 'event', id: e.id, choice: i })}
                >
                  <span className="choice-index">0{i + 1}</span>
                  <div>
                    <strong>{c.label}</strong>
                    <p>{c.description}</p>
                  </div>
                  <ChevronDown size={17} className="choice-arrow" />
                </button>
              ))}
            </div>
          </Panel>
        );
      })}
      <Panel title="质量与信任管理" extra={<ShieldCheck size={19} />}>
        <div className="quality-row">
          <div>
            <h4>批次追溯 {s.traceability ? '已开启' : '尚未系统化'}</h4>
            <p>
              品质控制等级 {s.qualityControl} · 当前宣传风险{' '}
              <b className={s.complianceRisk > 20 ? 'negative' : ''}>
                {num(s.complianceRisk)} / 100
              </b>
              。整改降低风险，不能抹去历史后果。
            </p>
          </div>
          <button
            className="secondary"
            disabled={s.actions < 1}
            onClick={() => act({ type: 'quality' })}
          >
            质量整改 · 8 万
          </button>
        </div>
      </Panel>
      <Panel
        title="企业动态与行业内参"
        extra={
          <div className="filter-tabs">
            {['全部', '预警', '研发', '行业', '经营'].map((f) => (
              <button key={f} className={filter === f ? 'active' : ''} onClick={() => setFilter(f)}>
                {f}
              </button>
            ))}
          </div>
        }
      >
        <div className="news-feed">
          {s.news
            .filter((n) => filter === '全部' || n.type === filter)
            .slice(0, 40)
            .map((n) => (
              <article key={n.id}>
                <div className="news-date">
                  M{String(n.month).padStart(2, '0')}
                  <Badge tone={n.type === '预警' ? 'red' : n.type === '研发' ? 'blue' : 'gray'}>
                    {n.type}
                  </Badge>
                </div>
                <div>
                  <h4>{n.title}</h4>
                  <p>{n.detail}</p>
                </div>
              </article>
            ))}
        </div>
      </Panel>
      {s.eventHistory.length > 0 && (
        <Panel title="已决策议题">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>时间</th>
                  <th>议题</th>
                  <th>CEO 决定</th>
                </tr>
              </thead>
              <tbody>
                {s.eventHistory
                  .slice()
                  .reverse()
                  .map((e) => (
                    <tr key={`${e.id}-${e.month}`}>
                      <td>第 {e.month} 月</td>
                      <td>{EVENTS.find((x) => x.id === e.id)?.title}</td>
                      <td>{e.choice}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
    </>
  );
}
