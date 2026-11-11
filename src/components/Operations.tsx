import { useState } from 'react';
import { ArrowRight, Factory, PackagePlus, Settings2, Warehouse } from 'lucide-react';
import { FACILITIES, SEGMENTS } from '../game/data';
import { matureBatch, qualityScore } from '../game/flavor';
import { baseStock, bottlingCapacity, productionCapacity } from '../game/selectors';
import {
  Badge,
  Empty,
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

export function Production({ s, act, navigate }: PanelProps) {
  const [recipe, setRecipe] = useState(s.recipes[0]?.id ?? '');
  const [tons, setTons] = useState(3);
  const [procurement, setProcurement] = useState(5);
  const occupied = s.jobs.reduce((v, j) => v + j.tons, 0);
  const capacity = productionCapacity(s);
  return (
    <>
      <PageTitle
        eyebrow="MANUFACTURING / 生产制造管理"
        title="每一道工序，都是品质的源头"
        description="原料先于产量，产能先于交付。新生产的基酒需要真实陈酿时间，才能成为可售产品。"
      />
      <div className="metrics-grid three">
        <Metric
          label="有效在制能力"
          value={num(capacity, 1)}
          unit="吨"
          icon={<Factory size={17} />}
          detail={`当前已占用 ${num(occupied, 1)} 吨`}
        />
        <Metric
          label="高粱库存"
          value={num(s.materials.sorghum, 1)}
          unit="吨"
          detail={`小麦 ${num(s.materials.wheat, 1)} 吨 · 标准配比 2 : 0.8`}
        />
        <Metric
          label="灌装能力"
          value={num(bottlingCapacity(s))}
          unit="瓶 / 月"
          detail={`本月已灌装 ${num(s.bottledThisMonth)} 瓶`}
        />
      </div>
      <div className="two-columns">
        <Panel title="下达生产计划" extra={<Badge>消耗 1 次行动</Badge>}>
          {s.recipes.length ? (
            <>
              <Field label="工艺配方">
                <select value={recipe} onChange={(e) => setRecipe(e.target.value)}>
                  {s.recipes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} · {r.fermentation} 个月发酵
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="计划基酒产量（吨）" hint="实际出酒量受工艺与已部署技术影响。">
                <input
                  type="number"
                  min={0.5}
                  max={100}
                  step={0.5}
                  value={tons}
                  onChange={(e) => setTons(Number(e.target.value))}
                />
              </Field>
              <div className="fact-row">
                <span>在制空间利用率</span>
                <strong>{num((occupied / capacity) * 100)}%</strong>
              </div>
              <Progress value={(occupied / capacity) * 100} />
              <Tip>生产消耗原料和加工费；配方的精细摘酒程度越高，单位产出的原料投入越高。</Tip>
              <button
                className="primary full"
                disabled={s.actions < 1}
                onClick={() => act({ type: 'produce', recipeId: recipe, tons })}
              >
                <Factory size={15} />
                启动生产批次
              </button>
            </>
          ) : (
            <ProductSetupPrompt
              onStart={() => navigate('lab')}
              description="车间已就绪，但还没有产品工艺。先在配方实验室确定品牌、首款产品和酿造参数，再下达生产计划。"
            />
          )}
        </Panel>
        <Panel title="原料采购" extra={<PackagePlus size={18} />}>
          <div className="material-illustration">
            <span>粮</span>
            <div>
              <h3>好粮，才有好酒</h3>
              <p>高粱与小麦组合采购，按标准生产规模备料。</p>
            </div>
          </div>
          <Field label="采购可支撑的标准产量（吨）">
            <input
              type="number"
              min={1}
              max={100}
              value={procurement}
              onChange={(e) => setProcurement(Number(e.target.value))}
            />
          </Field>
          <div className="fact-row">
            <span>高粱 / 小麦</span>
            <strong>
              {num(procurement * 2, 1)} / {num(procurement * 0.8, 1)} 吨
            </strong>
          </div>
          <div className="fact-row">
            <span>采购金额</span>
            <strong>{money(procurement * 1.256)} 万元</strong>
          </div>
          <button
            className="secondary full"
            disabled={s.actions < 1}
            onClick={() => act({ type: 'procure', tons: procurement })}
          >
            采购并入原料库
            <ArrowRight size={15} />
          </button>
        </Panel>
      </div>
      <Panel title="在制批次与工序进度" extra={<Badge tone="gray">{s.jobs.length} 个批次</Badge>}>
        {s.jobs.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>产品 / 工艺</th>
                  <th>计划产量</th>
                  <th>当前工序</th>
                  <th>生产进度</th>
                  <th>预计剩余</th>
                  <th>在制成本</th>
                </tr>
              </thead>
              <tbody>
                {s.jobs.map((j) => (
                  <tr key={j.id}>
                    <td>
                      <strong>{j.recipe.name}</strong>
                      <small>{j.process}</small>
                    </td>
                    <td>{num(j.tons, 1)} 吨</td>
                    <td>
                      <Badge tone="blue">
                        {j.remaining === j.total
                          ? '制曲与投料'
                          : j.remaining > 1
                            ? '固态发酵'
                            : '蒸馏取酒'}
                      </Badge>
                    </td>
                    <td className="progress-cell">
                      <Progress value={((j.total - j.remaining) / j.total) * 100} />
                    </td>
                    <td>{j.remaining} 个月</td>
                    <td>{money(j.cost)} 万</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty>车间尚未启动新的生产计划。原料库存充足时，就可以下达第一批任务。</Empty>
        )}
      </Panel>
      <div className="section-heading">
        <h2>生产基地建设</h2>
        <span>扩建会增加维护费和折旧，谨慎匹配真实需求</span>
      </div>
      <div className="facilities-grid">
        {Object.entries(FACILITIES).map(([id, f]) => (
          <Panel key={id}>
            <div className="facility-icon">
              {id === 'storage' ? (
                <Warehouse size={21} />
              ) : id === 'automation' ? (
                <Settings2 size={21} />
              ) : (
                <Factory size={21} />
              )}
            </div>
            <h3>{f.name}</h3>
            <Badge tone="gray">{f.gain}</Badge>
            <p>{f.detail}</p>
            <div className="tech-footer">
              <strong>
                {f.cost} <small>万元</small>
              </strong>
              <button
                className="secondary"
                disabled={s.actions < 1}
                onClick={() => act({ type: 'expand', facility: id as keyof typeof FACILITIES })}
              >
                投资建设
              </button>
            </div>
          </Panel>
        ))}
      </div>
    </>
  );
}

export function StorageCenter({ s, act, navigate }: PanelProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [recipe, setRecipe] = useState(s.recipes[0]?.id ?? '');
  const [bottles, setBottles] = useState(2000);
  const total = baseStock(s);
  const aged = s.batches.filter((b) => b.age >= 12).reduce((v, b) => v + b.tons, 0);
  const picked = s.batches.filter((b) => selected.includes(b.id));
  const pickedTons = picked.reduce((v, b) => v + b.tons, 0);
  const r = s.recipes.find((r) => r.id === recipe);
  return (
    <>
      <PageTitle
        eyebrow="BASE SPIRIT CELLAR / 基酒储存中心"
        title="时间，是最昂贵的原料"
        description="每一坛都有独立的批次、工艺与成本。陈酿有收益，也有仓储、挥发和资金占用。"
      />
      <div className="metrics-grid three">
        <Metric
          label="基酒总库存"
          value={num(total, 2)}
          unit="吨"
          detail={`${s.batches.length} 个独立批次 · 账面 ${money(s.batches.reduce((v, b) => v + b.cost, 0))} 万`}
        />
        <Metric
          label="12 月以上陈酿"
          value={num(aged, 2)}
          unit="吨"
          detail="商务宴请至少 12 月，高端收藏至少 24 月"
        />
        <Metric
          label="储酒库利用率"
          value={num((total / s.capacity.storage) * 100)}
          unit="%"
          detail={`总仓容 ${s.capacity.storage} 吨，月度挥发约 0.09%～0.15%`}
        />
      </div>
      <Panel title="基酒批次台账" extra={<Badge tone="gray">选择批次用于下方勾调</Badge>}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th className="check-cell">选择</th>
                <th>批次 / 工艺</th>
                <th>生产时间</th>
                <th>酒龄</th>
                <th>库存</th>
                <th>成熟品质</th>
                <th>账面成本</th>
                <th>质量追溯</th>
              </tr>
            </thead>
            <tbody>
              {s.batches.map((b) => (
                <tr key={b.id} className={selected.includes(b.id) ? 'selected-row' : ''}>
                  <td>
                    <input
                      aria-label={`选择${b.name}`}
                      type="checkbox"
                      checked={selected.includes(b.id)}
                      onChange={(e) =>
                        setSelected((old) =>
                          e.target.checked ? [...old, b.id] : old.filter((x) => x !== b.id),
                        )
                      }
                    />
                  </td>
                  <td>
                    <strong>{b.name}</strong>
                    <small>{b.process}</small>
                  </td>
                  <td>
                    {b.created <= 0 ? `开局前 ${Math.abs(b.created) + 1} 月` : `第 ${b.created} 月`}
                  </td>
                  <td>
                    <Badge tone={b.age >= 24 ? 'amber' : b.age >= 12 ? 'green' : 'gray'}>
                      {b.age} 个月
                    </Badge>
                  </td>
                  <td>{num(b.tons, 3)} 吨</td>
                  <td>{qualityScore(matureBatch(b, s))}</td>
                  <td>{money(b.cost)} 万</td>
                  <td>
                    {b.inspected ? (
                      <span className="positive">已检测 · {b.traceable ? '可追溯' : '未追溯'}</span>
                    ) : (
                      <button
                        className="text-button"
                        disabled={s.actions < 1}
                        onClick={() => act({ type: 'inspect', batchId: b.id })}
                      >
                        抽样检测 · 1 万
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {s.batches.length === 0 && (
          <Empty>储酒库已经见底，请安排新生产。时间不会自动带来库存。</Empty>
        )}
      </Panel>
      <div className="two-columns">
        <Panel title="基酒勾调与灌装" extra={<Badge>1 吨 ≈ 2,000 瓶</Badge>}>
          {r ? (
            <>
              <div className="form-grid">
                <Field label="产品配方">
                  <select value={recipe} onChange={(e) => setRecipe(e.target.value)}>
                    {s.recipes.map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="灌装数量（瓶）">
                  <input
                    type="number"
                    min={200}
                    step={200}
                    value={bottles}
                    onChange={(e) => setBottles(Number(e.target.value))}
                  />
                </Field>
              </div>
              <div className="fact-row">
                <span>已选 {picked.length} 批基酒</span>
                <strong>{num(pickedTons, 3)} 吨</strong>
              </div>
              <div className="fact-row">
                <span>预计耗酒（含基础损耗）</span>
                <strong>{num((bottles / 2000) * 1.025, 3)} 吨</strong>
              </div>
              <div className="fact-row">
                <span>本月剩余灌装能力</span>
                <strong>{num(bottlingCapacity(s) - s.bottledThisMonth)} 瓶</strong>
              </div>
              <Tip>
                {r.segment}最低酒龄 {SEGMENTS[r.segment].minAge}{' '}
                月。按选中批次的库存比例勾调，实际酒龄低于目标 {r.aging} 月会降低协调性。
              </Tip>
              <button
                className="primary full"
                disabled={!picked.length || s.actions < 1}
                onClick={() => {
                  const result = act({
                    type: 'blend',
                    recipeId: recipe,
                    batchIds: selected,
                    bottles,
                  });
                  if (result.ok) setSelected([]);
                }}
              >
                确认勾调并灌装
                <ArrowRight size={15} />
              </button>
            </>
          ) : (
            <ProductSetupPrompt
              onStart={() => navigate('lab')}
              description="开局基酒已接收入库，但还没有你的产品配方。先确定品牌、风味与消费定位，再选择批次勾调灌装。"
            />
          )}
        </Panel>
        <Panel className="cellar-note">
          <span className="cellar-glyph">藏</span>
          <div className="eyebrow">CELLAR NOTE / 储酒手记</div>
          <h2>
            陈酿不会让现金流
            <br />
            自动变得醇厚。
          </h2>
          <p>
            协调、醇厚与回味的增益逐渐放缓；过长储存还会削弱果香。把所有酒都留给未来，也可能让企业活不到未来。
          </p>
          <div className="fact-row">
            <span>预计月度仓储费</span>
            <strong>{money(total * 0.035 + s.capacity.storage * 0.006)} 万</strong>
          </div>
        </Panel>
      </div>
    </>
  );
}
