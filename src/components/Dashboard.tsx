import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Banknote,
  Beaker,
  CheckCircle2,
  Circle,
  Clock3,
  Factory,
  FlaskConical,
  Package,
  ShieldCheck,
  TrendingUp,
  Warehouse,
} from 'lucide-react';
import { TECHS } from '../game/data';
import {
  averageQuality,
  baseStock,
  channelHealth,
  dealerStock,
  finishedStock,
  monthsCoverage,
  receivables,
  technologyLevel,
} from '../game/selectors';
import { OperatingChart } from './Charts';
import { Badge, LinkButton, Metric, money, num, Panel, Progress } from './shared';
import type { PanelProps } from './shared';

export default function Dashboard({ s, navigate }: PanelProps) {
  const last = s.history.at(-1);
  const prev = s.history.at(-2);
  const current = last ?? { revenue: 0, profit: 0, retail: 0, receipts: 0 };
  const health = channelHealth(s);
  const quality = averageQuality(s);
  const tasks = [
    {
      icon: <FlaskConical size={17} />,
      title: '研发第一项酿造技术',
      detail: '让技术真正走出实验室',
      done: s.research.some((r) => r.attempts > 0),
      to: 'research',
    },
    {
      icon: <Beaker size={17} />,
      title: '完成一次配方盲品',
      detail: '用实验校准风味预测',
      done: s.experimentCount > 0,
      to: 'lab',
    },
    {
      icon: <Factory size={17} />,
      title: '启动第一批基酒生产',
      detail: '从原料到时间的投资',
      done: s.jobs.length > 0 || s.batches.some((b) => b.created > 0),
      to: 'production',
    },
    {
      icon: <Package size={17} />,
      title: '勾调并灌装一批产品',
      detail: '选择基酒，兑现风味',
      done: s.bottledThisMonth > 0 || s.news.some((n) => n.title.includes('瓶已入成品库')),
      to: 'storage',
    },
  ];
  return (
    <>
      <div className="dashboard-heading">
        <div>
          <div className="eyebrow">CEO WORKSPACE / 经营总览</div>
          <h1>
            每一滴增长，都有来处<span className="title-dot">。</span>
          </h1>
          <p>早上好，{s.company.name}创始人。今天的决策，将成为未来的风味。</p>
        </div>
        <div className="dashboard-stamp">
          <span>
            经营第 <strong>{String(s.month).padStart(2, '0')}</strong> 个月
          </span>
          <small>标准经营周期 / 60 个月</small>
        </div>
      </div>
      <div className="metrics-grid">
        <Metric
          label="企业可用现金"
          value={money(s.finance.cash)}
          unit="万元"
          icon={<Banknote size={17} />}
          detail={
            <>
              <span className={s.finance.cash >= 100 ? 'positive' : 'negative'}>
                <span className="dot" />
                {s.finance.cash >= 100 ? '资金储备充足' : '关注资金安全'}
              </span>
              <span>负债 {money(s.finance.debt, 0)} 万</span>
            </>
          }
        />
        <Metric
          label="上月营业收入"
          value={money(current.revenue)}
          unit="万元"
          detail={
            <>
              <span className="positive">
                <ArrowUpRight size={12} />
                {prev
                  ? `${money(current.revenue - prev.revenue)} 万`
                  : last
                    ? '首月经营数据'
                    : '等待首月结算'}
              </span>
              <span>实际回款 {money(current.receipts)}</span>
            </>
          }
        />
        <Metric
          label="上月净利润"
          value={money(current.profit)}
          unit="万元"
          detail={
            <>
              <span className={current.profit < 0 ? 'negative' : 'positive'}>
                {current.profit < 0 ? <ArrowDownRight size={12} /> : <ArrowUpRight size={12} />}
                {current.profit < 0 ? '投入期，留意现金' : '稳住经营节奏'}
              </span>
              <span>已扣研发与折旧</span>
            </>
          }
        />
        <Metric
          label="上月终端动销"
          value={num(current.retail)}
          unit="瓶"
          tone="metric-featured"
          icon={<TrendingUp size={17} />}
          detail={
            <>
              <span>
                <span className="dot" />
                真正被消费者买走的酒
              </span>
            </>
          }
        />
      </div>
      <div className="insight-banner">
        <div className="insight-icon">
          <ShieldCheck size={22} />
        </div>
        <div>
          <strong>
            {s.events.length
              ? '有一份经营议题，需要你的判断。'
              : monthsCoverage(s) > 4
                ? '报表涨了，酒却还在经销商的仓库。'
                : '出货是报表的起点，开瓶才是品牌的未来。'}
          </strong>
          <p>
            {s.events.length
              ? '团队已将议题提交至舆情中心，请处理后再进入下个月。'
              : `渠道现有库存 ${num(dealerStock(s))} 瓶，应收账款 ${money(receivables(s))} 万。保持渠道节奏，让增长走得更远。`}
          </p>
        </div>
        <button onClick={() => navigate(s.events.length ? 'news' : 'dealers')}>
          查看{s.events.length ? '议题' : '渠道'}
          <ArrowRight size={15} />
        </button>
      </div>
      <div className="dashboard-middle">
        <Panel
          title="经营趋势"
          eyebrow="把报表与现金放在一起看"
          extra={
            <span className="chart-period">
              最近 {Math.max(1, Math.min(12, s.history.length))} 个月{' '}
              <span className="muted">单位：万元</span>
            </span>
          }
        >
          <OperatingChart history={s.history} />
          <div className="chart-foot">
            <span className="dot" />
            {s.history.length
              ? '收入确认与现金到账可能跨月，关注虚线与实线之间的距离。'
              : '首月尚未结算，完成经营行动后点击右上角“推进下个月”。'}
          </div>
        </Panel>
        <Panel title="企业健康度" eyebrow="增长以外，更值得关注的事" extra={<Badge>实时</Badge>}>
          <div className="health-score">
            <div
              className="score-ring"
              style={{ '--score': `${health * 3.6}deg` } as React.CSSProperties}
            >
              <strong>{num(health)}</strong>
              <small>渠道健康</small>
            </div>
            <div>
              <Badge tone={health > 65 ? 'green' : 'amber'}>
                {health > 65 ? '经营平稳' : '需要关注'}
              </Badge>
              <p>
                健康的渠道，
                <br />
                是长期增长的底气。
              </p>
            </div>
          </div>
          <div className="health-bars">
            {[
              { label: '品牌信誉', value: s.reputation },
              { label: '产品品质', value: quality },
              { label: '技术积累', value: technologyLevel(s) },
            ].map((x) => (
              <div key={x.label}>
                <span>
                  {x.label}
                  <b>
                    {num(x.value)}
                    <small>/ 100</small>
                  </b>
                </span>
                <Progress value={x.value} />
              </div>
            ))}
          </div>
          <div className="health-foot">
            <span className="positive">
              <Circle size={7} fill="currentColor" />
              行业需求指数 {num(s.industry * 100)}
            </span>
            <span>{s.industry < 0.9 ? '供给承压' : '稳中有变'}</span>
          </div>
        </Panel>
      </div>
      <div className="section-heading">
        <h2>从一粒粮，到一杯酒</h2>
        <span>经营链条 / 所有环节真实联动</span>
      </div>
      <div className="chain-grid">
        {[
          {
            step: '01',
            name: '原料与制曲',
            value: num(s.materials.sorghum, 1),
            unit: '吨高粱',
            icon: <Package size={20} />,
            page: 'production',
            hint: `小麦 ${num(s.materials.wheat, 1)} 吨`,
          },
          {
            step: '02',
            name: '固态发酵',
            value: num(
              s.jobs.reduce((v, j) => v + j.tons, 0),
              1,
            ),
            unit: '吨在制',
            icon: <Factory size={20} />,
            page: 'production',
            hint: `${s.jobs.length} 个进行中批次`,
          },
          {
            step: '03',
            name: '基酒陈酿',
            value: num(baseStock(s), 1),
            unit: '吨库存',
            icon: <Warehouse size={20} />,
            page: 'storage',
            hint: `储酒库利用率 ${num((baseStock(s) / s.capacity.storage) * 100)}%`,
          },
          {
            step: '04',
            name: '勾调与灌装',
            value: num(finishedStock(s)),
            unit: '瓶成品',
            icon: <Beaker size={20} />,
            page: 'products',
            hint: `${s.products.length} 款在售产品`,
          },
          {
            step: '05',
            name: '渠道与消费者',
            value: num(dealerStock(s)),
            unit: '瓶渠道库存',
            icon: <TrendingUp size={20} />,
            page: 'dealers',
            hint: `${s.dealers.length} 家合作经销商`,
          },
        ].map((c) => (
          <button className="chain-card" key={c.step} onClick={() => navigate(c.page)}>
            <div className="chain-top">
              <span>{c.icon}</span>
              <small>{c.step}</small>
            </div>
            <h4>{c.name}</h4>
            <strong>
              {c.value}
              <small>{c.unit}</small>
            </strong>
            <p>
              {c.hint}
              <ArrowUpRight size={13} />
            </p>
          </button>
        ))}
      </div>
      <div className="dashboard-bottom">
        <Panel title="本月经营备忘" extra={<span className="muted">剩余 {s.actions} 次行动</span>}>
          <div className="task-list">
            {tasks.map((t) => (
              <button key={t.title} onClick={() => navigate(t.to)} className={t.done ? 'done' : ''}>
                <span className="task-icon">{t.icon}</span>
                <div>
                  <strong>{t.title}</strong>
                  <small>{t.detail}</small>
                </div>
                {t.done ? <CheckCircle2 size={18} /> : <ArrowUpRight size={16} />}
              </button>
            ))}
          </div>
        </Panel>
        <Panel
          title="企业内参"
          extra={<LinkButton onClick={() => navigate('news')}>全部动态</LinkButton>}
        >
          <div className="news-preview">
            {s.news.slice(0, 3).map((n, i) => (
              <button key={n.id} onClick={() => navigate('news')}>
                <span className={`news-mark ${n.type === '预警' ? 'warning' : ''}`}>
                  {n.type === '预警' ? '!' : i + 1}
                </span>
                <div>
                  <strong>{n.title}</strong>
                  <p>{n.detail}</p>
                  <small>
                    <Clock3 size={11} />第 {n.month} 月 · {n.type}动态
                  </small>
                </div>
              </button>
            ))}
          </div>
        </Panel>
      </div>
      <div className="dashboard-quote">
        “有的酒越放越香，有的报表越放越慌。”<span>— 酱香经营手记 · 第 001 条</span>
      </div>
    </>
  );
}
