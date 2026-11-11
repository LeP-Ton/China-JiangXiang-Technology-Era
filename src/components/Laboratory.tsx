import { useState } from 'react';
import { Beaker, FlaskConical, Plus, Save } from 'lucide-react';
import { DEFAULT_RECIPE, FLAVORS, SEGMENTS } from '../game/data';
import { forecast } from '../game/flavor';
import type { Recipe, Segment } from '../game/types';
import { FlavorChart } from './Charts';
import { Badge, Field, money, PageTitle, Panel, Progress, Tip } from './shared';
import type { PanelProps } from './shared';
import WineBottle from './WineBottle';

export default function Laboratory({ s, act }: PanelProps) {
  const [r, setR] = useState<Recipe>(
    s.recipes[0] ? { ...s.recipes[0] } : { ...DEFAULT_RECIPE, id: 'new', name: '', brand: '' },
  );
  const [preview, setPreview] = useState<'flavor' | 'bottle'>(
    s.recipes.length ? 'flavor' : 'bottle',
  );
  const prediction = forecast(r, s);
  const update = (key: keyof Recipe, value: string | number) =>
    setR((old) => ({ ...old, [key]: value }));
  const sliders: {
    key: 'sorghum' | 'roast' | 'fermentation' | 'cut' | 'aging';
    name: string;
    min: number;
    max: number;
    unit: string;
    description: string;
  }[] = [
    {
      key: 'sorghum',
      name: '高粱占比',
      min: 50,
      max: 85,
      unit: '%',
      description: '增加酱香与醇厚，粮香与甜感让位。',
    },
    {
      key: 'roast',
      name: '高温制曲强度',
      min: 15,
      max: 90,
      unit: '',
      description: '强化焦香，削弱果香，过高会损害协调。',
    },
    {
      key: 'fermentation',
      name: '发酵周期',
      min: 2,
      max: 6,
      unit: '个月',
      description: '提升醇厚与回味，但占用更长生产周期。',
    },
    {
      key: 'cut',
      name: '精细摘酒程度',
      min: 20,
      max: 85,
      unit: '',
      description: '提高洁净度与稳定性，同时降低出酒效率。',
    },
    {
      key: 'aging',
      name: '目标储存酒龄',
      min: 3,
      max: 60,
      unit: '个月',
      description: '成熟效果递减，陈酿不会让所有风味无限增长。',
    },
  ];
  return (
    <>
      <PageTitle
        eyebrow="PRODUCT LAB / 白酒配方实验室"
        title="好风味，从一个有取舍的配方开始"
        description="内部模拟算法预测风味；实验数据越多，不确定性越小。预测不会替你酿出一瓶酒。"
        extra={
          <button
            className="secondary"
            onClick={() =>
              setR({
                ...DEFAULT_RECIPE,
                id: 'new',
                brand: s.company.brand,
                name: '',
              })
            }
          >
            <Plus size={15} />
            新建配方
          </button>
        }
      />
      {!s.recipes.length && (
        <Tip>
          酒厂已经成立，现在决定首款产品叫什么、服务哪类消费者，再用工艺与风味支撑定位。保存配方后，还需实际生产或使用开局基酒勾调，才会形成成品。
        </Tip>
      )}
      <div className="lab-grid">
        <Panel
          title="工艺设计"
          extra={
            <select
              aria-label="选择已存配方"
              value={r.id}
              onChange={(e) => {
                const found = s.recipes.find((r) => r.id === e.target.value);
                if (found) setR({ ...found });
              }}
            >
              <option value="new" disabled>
                新配方
              </option>
              {s.recipes.map((x) => (
                <option value={x.id} key={x.id}>
                  {x.name}
                </option>
              ))}
            </select>
          }
        >
          <div className="form-grid">
            <Field label="产品名称">
              <input
                value={r.name}
                placeholder="为首款产品命名"
                maxLength={30}
                onChange={(e) => update('name', e.target.value)}
              />
            </Field>
            <Field label="所属品牌">
              <input
                value={r.brand}
                placeholder="创立你的白酒品牌"
                maxLength={30}
                onChange={(e) => update('brand', e.target.value)}
              />
            </Field>
            <Field label="目标消费者">
              <select
                value={r.segment}
                onChange={(e) => update('segment', e.target.value as Segment)}
              >
                {Object.keys(SEGMENTS).map((k) => (
                  <option key={k}>{k}</option>
                ))}
              </select>
            </Field>
            <Field label="包装定位">
              <select value={r.packaging} onChange={(e) => update('packaging', e.target.value)}>
                {['简装', '雅致', '典藏'].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </Field>
          </div>
          <div className="sliders">
            {sliders.map((x) => (
              <label className="slider-field" key={x.key}>
                <span>
                  {x.name}
                  <strong>
                    {r[x.key]} <small>{x.unit}</small>
                  </strong>
                </span>
                <input
                  type="range"
                  min={x.min}
                  max={x.max}
                  step={1}
                  value={r[x.key]}
                  onChange={(e) => update(x.key, Number(e.target.value))}
                />
                <small>{x.description}</small>
              </label>
            ))}
          </div>
          <Field label="建议零售价（元 / 瓶）">
            <input
              type="number"
              min={39}
              max={1999}
              value={r.price}
              onChange={(e) => update('price', Number(e.target.value))}
            />
          </Field>
          <div className="button-row">
            <button
              className="primary"
              disabled={s.actions < 1}
              onClick={() => {
                const result = act({ type: 'recipe', recipe: r });
                if (result.ok)
                  setR({
                    ...result.state.recipes.find((x) => x.name === r.name && x.brand === r.brand)!,
                  });
              }}
            >
              <Save size={15} />
              保存配方 · 1.5 万
            </button>
            <button
              className="secondary"
              disabled={s.actions < 1}
              onClick={() => act({ type: 'experiment', recipe: r })}
            >
              <FlaskConical size={15} />
              盲品实验 · 2.5 万
            </button>
          </div>
        </Panel>
        <div className="stack">
          <Panel
            title="风味与产品预览"
            eyebrow="不靠概念，靠参数"
            extra={
              <div className="filter-tabs" aria-label="产品预览方式">
                <button
                  className={preview === 'flavor' ? 'active' : ''}
                  onClick={() => setPreview('flavor')}
                >
                  风味雷达
                </button>
                <button
                  className={preview === 'bottle' ? 'active' : ''}
                  onClick={() => setPreview('bottle')}
                >
                  包装预览
                </button>
              </div>
            }
          >
            {preview === 'flavor' ? (
              <FlavorChart
                flavor={prediction.flavor}
                comparison={s.experiments[0]?.name === r.name ? s.experiments[0].flavor : undefined}
              />
            ) : (
              <div className={`lab-packaging-preview packaging-${r.packaging}`}>
                <WineBottle
                  className="lab-bottle"
                  brand={r.brand}
                  product={r.name}
                  company={s.company.name}
                  logo={s.company.logo}
                  packaging={r.packaging}
                />
                <small>设计效果预览 · 尚未生产</small>
              </div>
            )}
            <div className="lab-scores">
              <div>
                <small>预测品质</small>
                <strong>
                  {prediction.quality}
                  <i>/100</i>
                </strong>
              </div>
              <div>
                <small>客群适配</small>
                <strong>
                  {prediction.fit}
                  <i>%</i>
                </strong>
              </div>
              <div>
                <small>预测误差</small>
                <strong>±{prediction.uncertainty.toFixed(1)}</strong>
              </div>
            </div>
            <div className="flavor-values">
              {FLAVORS.map((k) => (
                <div key={k}>
                  <span>{k}</span>
                  <Progress value={prediction.flavor[k]} />
                  <b>{prediction.flavor[k]}</b>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="商业可行性">
            <div className="fact-row">
              <span>预测单瓶完整成本</span>
              <strong>¥ {money(prediction.unitCost)}</strong>
            </div>
            <div className="fact-row">
              <span>建议零售价</span>
              <strong>¥ {r.price}</strong>
            </div>
            <div className="fact-row">
              <span>经销商进货价</span>
              <strong>¥ {money(r.price * 0.66)}</strong>
            </div>
            <div className="fact-row">
              <span>客群最低基酒酒龄</span>
              <strong>{SEGMENTS[r.segment].minAge} 个月</strong>
            </div>
            <Tip>{SEGMENTS[r.segment].description} 实际成本以所选基酒和灌装方案为准。</Tip>
          </Panel>
        </div>
      </div>
      <Panel
        title="历史实验记录"
        extra={<Badge tone="gray">累计数据 {s.experimentCount} 组</Badge>}
      >
        {s.experiments.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>实验时间</th>
                  <th>配方</th>
                  <th>实测品质</th>
                  <th>协调性</th>
                  <th>稳定性</th>
                </tr>
              </thead>
              <tbody>
                {s.experiments.slice(0, 8).map((e, i) => (
                  <tr key={i}>
                    <td>第 {e.month} 月</td>
                    <td>{e.name}</td>
                    <td>{e.quality}</td>
                    <td>{e.flavor['协调性'].toFixed(1)}</td>
                    <td>{e.flavor['稳定性'].toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty">
            <Beaker size={24} />
            <p>还没有盲品实验。第一次预测，也需要真实数据的校准。</p>
          </div>
        )}
      </Panel>
    </>
  );
}
