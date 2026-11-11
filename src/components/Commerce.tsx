import { useState } from 'react';
import { ArrowRight, Megaphone, Package, Plus, Store, TrendingUp } from 'lucide-react';
import { CAMPAIGNS, REGIONS } from '../game/data';
import {
  channelHealth,
  dealerStock,
  finishedStock,
  monthsCoverage,
  receivables,
} from '../game/selectors';
import type { Product } from '../game/types';
import { OperatingChart } from './Charts';
import {
  Badge,
  Field,
  Metric,
  money,
  num,
  PageTitle,
  Panel,
  ProductSetupPrompt,
  Progress,
  Tip,
} from './shared';
import type { PanelProps } from './shared';
import WineBottle from './WineBottle';

function ProductCard({ p, act, navigate, s }: PanelProps & { p: Product }) {
  const [price, setPrice] = useState(String(p.recipe.price));
  return (
    <Panel className="product-card">
      <div className={`product-visual packaging-${p.recipe.packaging}`}>
        <div className="product-scene-caption" aria-hidden="true">
          <span>{p.recipe.brand}</span>
          <small>JIANGXIANG COLLECTION</small>
        </div>
        <WineBottle
          className="product-bottle"
          brand={p.recipe.brand}
          product={p.recipe.name}
          company={s.company.name}
          logo={s.company.logo}
          packaging={p.recipe.packaging}
        />
        <span className="product-watermark">酿</span>
        <Badge tone="gray">{p.recipe.packaging}包装</Badge>
        <span className="product-volume">酱香型白酒 · 500 mL</span>
      </div>
      <div className="product-details">
        <div className="eyebrow">
          {p.recipe.brand} / {p.recipe.segment}
        </div>
        <h2>{p.recipe.name}</h2>
        <div className="product-facts">
          <span>
            品质 <b>{p.quality.toFixed(1)}</b>
          </span>
          <span>
            口碑 <b>{p.feedback.toFixed(1)}</b>
          </span>
          <span>
            基酒 <b>{p.lastAge} 月</b>
          </span>
        </div>
        <div className="fact-row">
          <span>可售成品</span>
          <strong>{num(p.stock)} 瓶</strong>
        </div>
        <div className="fact-row">
          <span>累计终端售出</span>
          <strong>{num(p.sold)} 瓶</strong>
        </div>
        <div className="fact-row">
          <span>实际单瓶成本</span>
          <strong>¥ {money(p.unitCost)}</strong>
        </div>
        <form
          className="inline-form price-form"
          onSubmit={(e) => {
            e.preventDefault();
            act({ type: 'price', productId: p.id, price: Number(price) });
          }}
        >
          <Field label="建议零售价 / 元">
            <input
              aria-label={`${p.recipe.name}零售价`}
              type="number"
              min={39}
              max={1999}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </Field>
          <button className="secondary" type="submit">
            更新定价
          </button>
        </form>
        <div className="button-row">
          <button className="primary" onClick={() => navigate('dealers')}>
            安排渠道发货
            <ArrowRight size={14} />
          </button>
          <button
            className="secondary"
            disabled={s.actions < 1}
            onClick={() => navigate('storage')}
          >
            继续勾调
          </button>
        </div>
      </div>
    </Panel>
  );
}
export function Products(props: PanelProps) {
  return (
    <>
      <PageTitle
        eyebrow="BRANDS & PRODUCTS / 产品与品牌管理"
        title="给风味一个名字，也给市场一个理由"
        description="每个配方保留独立品牌与市场定位，使用不同品牌名即可建立产品系列。"
        extra={
          <button className="primary" onClick={() => props.navigate('lab')}>
            <Plus size={15} />
            {props.s.recipes.length ? '设计新产品' : '创立品牌与首款配方'}
          </button>
        }
      />
      <Tip>
        企业成品库存会在月末自动参与电商直销，平台费用为直销收入的
        8%。向经销商发货需主动安排，进货价为建议零售价的 66%。
      </Tip>
      {!props.s.recipes.length && (
        <Panel>
          <ProductSetupPrompt onStart={() => props.navigate('lab')} />
        </Panel>
      )}
      {props.s.recipes.some((r) => !props.s.products.some((p) => p.recipe.id === r.id)) && (
        <Panel
          title="已归档的产品方案"
          extra={<Badge tone="amber">配方已建立 · 尚未形成成品</Badge>}
        >
          {props.s.recipes
            .filter((r) => !props.s.products.some((p) => p.recipe.id === r.id))
            .map((r) => (
              <div className="unbottled-recipe" key={r.id}>
                <div>
                  <small>
                    {r.brand} / {r.segment}
                  </small>
                  <h3>{r.name}</h3>
                  <p>确定工艺只是开始，实际勾调灌装后才会进入成品库。</p>
                </div>
                <div className="button-row">
                  <button className="secondary" onClick={() => props.navigate('production')}>
                    组织生产
                  </button>
                  <button className="primary" onClick={() => props.navigate('storage')}>
                    勾调灌装
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ))}
        </Panel>
      )}
      <div className="products-grid">
        {props.s.products.map((p) => (
          <ProductCard key={p.id} p={p} {...props} />
        ))}
      </div>
    </>
  );
}

export function Dealers({ s, act, navigate }: PanelProps) {
  const [dealer, setDealer] = useState(s.dealers[0].id);
  const [product, setProduct] = useState(s.products[0]?.id ?? '');
  const [bottles, setBottles] = useState(1000);
  const [credit, setCredit] = useState(false);
  const [region, setRegion] = useState('华东');
  return (
    <>
      <PageTitle
        eyebrow="DISTRIBUTION NETWORK / 经销商管理"
        title="别让经销商，成为报表的蓄水池"
        description="出货、回款、库存与终端购买分别计算。缺乏消费者支撑的增长，最终会回到你的现金流里。"
      />
      <div className="metrics-grid">
        <Metric
          label="渠道库存"
          value={num(dealerStock(s))}
          unit="瓶"
          detail={`${s.dealers.length} 家合作经销商`}
        />
        <Metric
          label="库存覆盖"
          value={num(monthsCoverage(s), 1)}
          unit="个月"
          detail="按最近一个月实际终端销售计算"
        />
        <Metric
          label="应收账款"
          value={money(receivables(s))}
          unit="万元"
          detail="赊销余额受经销商现金与健康度约束"
        />
        <Metric
          label="渠道健康"
          value={num(channelHealth(s))}
          unit="/ 100"
          detail="库存越高，价格与经销商资金越承压"
        />
      </div>
      <Panel title="区域渠道经营台账" extra={<Badge tone="amber">库存覆盖超过 4 月需警惕</Badge>}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>经销商 / 区域</th>
                <th>终端库存</th>
                <th>上月动销</th>
                <th>本月出货</th>
                <th>本月回款</th>
                <th>应收账款</th>
                <th>成交 / 建议价</th>
                <th>健康度</th>
                <th>服务</th>
              </tr>
            </thead>
            <tbody>
              {s.dealers.map((d) => (
                <tr key={d.id}>
                  <td>
                    <strong>{d.name}</strong>
                    <small>
                      <Store size={11} />
                      {d.region} · 可用资金 {money(d.cash, 1)} 万
                    </small>
                  </td>
                  <td>{num(d.lots.reduce((v, l) => v + l.bottles, 0))} 瓶</td>
                  <td>{num(d.soldLast)} 瓶</td>
                  <td>{num(d.shippedLast)} 瓶</td>
                  <td>{money(d.paidLast)} 万</td>
                  <td>{money(d.receivables.reduce((v, r) => v + r.amount, 0))} 万</td>
                  <td>
                    <Badge
                      tone={d.priceFactor < 0.66 ? 'red' : d.priceFactor < 0.85 ? 'amber' : 'green'}
                    >
                      {num(d.priceFactor * 100)}%{d.priceFactor < 0.66 ? ' · 倒挂' : ''}
                    </Badge>
                  </td>
                  <td>
                    <div className="tiny-health">
                      <Progress value={d.health} tone={d.health < 50 ? 'warning' : ''} />
                      <b>{num(d.health)}</b>
                    </div>
                  </td>
                  <td>
                    <button
                      className="text-button"
                      disabled={s.actions < 1}
                      onClick={() => act({ type: 'supportDealer', dealerId: d.id })}
                    >
                      渠道支持 · 4 万
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <div className="two-columns">
        <Panel title="向经销商发货" extra={<Package size={18} />}>
          {s.products.length ? (
            <>
              <div className="form-grid">
                <Field label="合作经销商">
                  <select value={dealer} onChange={(e) => setDealer(e.target.value)}>
                    {s.dealers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="出货产品">
                  <select value={product} onChange={(e) => setProduct(e.target.value)}>
                    {s.products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.recipe.name} · 余 {p.stock} 瓶
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="出货数量 / 瓶">
                <input
                  type="number"
                  min={100}
                  step={100}
                  value={bottles}
                  onChange={(e) => setBottles(Number(e.target.value))}
                />
              </Field>
              <label className="checkbox-line">
                <input
                  type="checkbox"
                  checked={credit}
                  onChange={(e) => setCredit(e.target.checked)}
                />
                <span>允许赊销：首付 40%，余款两月后到期</span>
              </label>
              <Tip>
                现款交易消耗经销商流动资金；赊销能够提前确认收入，但不保证按期收回现金。经销商库存过高会拒收新货。
              </Tip>
              <button
                className="primary full"
                disabled={s.actions < 1 || finishedStock(s) === 0}
                onClick={() =>
                  act({ type: 'ship', dealerId: dealer, productId: product, bottles, credit })
                }
              >
                确认发货
                <ArrowRight size={15} />
              </button>
            </>
          ) : (
            <ProductSetupPrompt
              onStart={() => navigate(s.recipes.length ? 'storage' : 'lab')}
              title="渠道已就绪，等待首款成品"
              description="目前没有可售产品。先完成品牌和配方设计，再用实际基酒勾调灌装；发货之后才会产生渠道库存与回款。"
              label={s.recipes.length ? '安排首批勾调' : '设计首款产品'}
            />
          )}
        </Panel>
        <Panel title="拓展区域渠道" extra={<Plus size={18} />}>
          <div className="region-grid">
            {REGIONS.map((r) => (
              <button
                key={r}
                className={region === r ? 'selected' : ''}
                onClick={() => setRegion(r)}
              >
                <span className="dot" />
                {r}
                <small>{s.dealers.filter((d) => d.region === r).length} 家合作</small>
              </button>
            ))}
          </div>
          <div className="fact-row">
            <span>新渠道开发费</span>
            <strong>8 万元</strong>
          </div>
          <p className="subtle">新经销商不会自动进货。先备好产品，再评估区域消费承载力。</p>
          <button
            className="secondary full"
            disabled={s.actions < 1}
            onClick={() => act({ type: 'dealer', region })}
          >
            签约 {region} 新经销商
          </button>
        </Panel>
      </div>
      <Panel title="出货与动销对照">
        <OperatingChart history={s.history} kind="channel" />
      </Panel>
    </>
  );
}

export function Marketing({ s, act }: PanelProps) {
  return (
    <>
      <PageTitle
        eyebrow="MARKETING / 市场营销中心"
        title="让人看见，也让人愿意再喝一次"
        description="曝光可以买来，复购要靠产品。流量会衰退，品质和信誉持续影响需求。"
      />
      <div className="metrics-grid three">
        <Metric
          label={s.company.brand ? '品牌知名度' : '企业知名度'}
          value={num(s.awareness)}
          unit="/ 100"
          detail="影响触达与高端定位的品牌支撑"
        />
        <Metric
          label={s.company.brand ? '品牌信誉' : '企业信誉'}
          value={num(s.reputation)}
          unit="/ 100"
          detail="产品体验与真实宣传积累的信任"
        />
        <Metric
          label="短期话题热度"
          value={num(s.hype)}
          unit="/ 100"
          detail="每月衰减 18%，不等于真实复购"
        />
      </div>
      <div className="campaigns-grid">
        {CAMPAIGNS.map((c) => (
          <Panel key={c.id}>
            <div className="campaign-icon">
              <Megaphone size={23} />
            </div>
            <h2>{c.name}</h2>
            <p>{c.description}</p>
            <div className="campaign-effects">
              <Badge>知名度 +{c.awareness}</Badge>
              <Badge tone="amber">本月需求 +{Math.round(c.demand * 100)}%</Badge>
            </div>
            <div className="tech-footer">
              <strong>
                {c.cost}
                <small> 万元</small>
              </strong>
              <button
                className="primary"
                disabled={s.actions < 1}
                onClick={() => act({ type: 'marketing', campaign: c.id })}
              >
                安排活动
                <TrendingUp size={14} />
              </button>
            </div>
          </Panel>
        ))}
      </div>
      <Tip>
        营销经理每人可提升活动转化；效果存在上限。直播降价会影响成交价格，夸大宣传带来的监管、舆论和退单损失将在后续月份兑现。
      </Tip>
      <Panel title="消费者口碑观察">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>产品</th>
                <th>消费群体</th>
                <th>产品品质</th>
                <th>消费者反馈</th>
                <th>上月复购率</th>
                <th>累计实际购买</th>
              </tr>
            </thead>
            <tbody>
              {s.products.map((p) => (
                <tr key={p.id}>
                  <td>{p.recipe.name}</td>
                  <td>{p.recipe.segment}</td>
                  <td>{p.quality.toFixed(1)}</td>
                  <td>
                    <Badge tone={p.feedback >= 70 ? 'green' : 'amber'}>
                      {p.feedback.toFixed(1)} / 100
                    </Badge>
                  </td>
                  <td>{p.repeatRate.toFixed(1)}%</td>
                  <td>{num(p.sold)} 瓶</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
