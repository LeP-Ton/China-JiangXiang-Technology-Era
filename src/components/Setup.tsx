import { useRef, useState } from 'react';
import { ArrowRight, Check, FlaskConical, Mountain, ShieldCheck, Upload, Wine } from 'lucide-react';
import { DIRECTIONS } from '../game/data';
import type { Company, Direction } from '../game/types';
import { Field } from './shared';

export default function Setup({
  onCreate,
  onCancel,
}: {
  onCreate: (company: Company, seed: number) => void;
  onCancel?: () => void;
}) {
  const [name, setName] = useState('观山酒业');
  const [brand, setBrand] = useState('观山');
  const [product, setProduct] = useState('初酿·经典');
  const [logo, setLogo] = useState('山');
  const [direction, setDirection] = useState<Direction>('科技研发');
  const [seed, setSeed] = useState('20261111');
  const [error, setError] = useState('');
  const upload = useRef<HTMLInputElement>(null);
  return (
    <div className="setup-page">
      <div className="setup-story">
        <div className="wordmark">
          <span className="brand-seal">酱</span>
          <div>
            中国酱香科技时代<small>CHINA JIANGXIANG TECHNOLOGY ERA</small>
          </div>
        </div>
        <div className="setup-story-content">
          <span className="setup-kicker">一家酒厂，无数种未来</span>
          <h1>
            把时间酿成酒，
            <br />
            把选择变成时代。
          </h1>
          <p>
            从一座地方酒厂开始。
            <br />
            做技术的长期主义者，或商业浪潮里的弄潮人。
            <br />
            每一张漂亮报表背后，都有一笔真实的代价。
          </p>
          <div className="bottle-scene">
            <div className="scene-ring ring-one" />
            <div className="scene-ring ring-two" />
            <div className="scene-mountain">
              <Mountain size={210} strokeWidth={0.5} />
            </div>
            <div className="wine-bottle">
              <div className="bottle-cap" />
              <div className="bottle-neck" />
              <div className="bottle-body">
                <span>
                  观<br />山
                </span>
                <small>酱香 · 时间之作</small>
                <i>始于选择　成于坚守</i>
              </div>
            </div>
            <div className="bottle-caption">以科技见风味 · 以时间见真章</div>
          </div>
        </div>
        <div className="setup-footer">
          原创虚构商业世界 <span>经营模拟 · 60 个月 / 自由经营</span>
        </div>
      </div>
      <div className="setup-form-wrap">
        <form
          className="setup-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim() || !brand.trim() || !product.trim())
              return setError('请完整填写企业、品牌与产品名称');
            const n = Number(seed);
            if (!Number.isInteger(n) || n < 0 || n > 4294967295)
              return setError('经营种子需为 0～4294967295 之间的整数');
            onCreate({ name, brand, product, logo, direction }, n);
          }}
        >
          <div className="eyebrow">新的经营档案 / NEW VENTURE</div>
          <h2>创立你的酱酒企业</h2>
          <p className="muted">第一步，从一个值得被记住的名字开始。</p>
          <div className="setup-logo-row">
            <div className="company-logo large">
              {logo.startsWith('data:') ? <img src={logo} alt="企业标识" /> : logo}
            </div>
            <div>
              <span className="field-label">企业标识</span>
              <div className="logo-options">
                {['山', '酱', '谷', '醴'].map((l) => (
                  <button
                    type="button"
                    key={l}
                    className={logo === l ? 'selected' : ''}
                    onClick={() => setLogo(l)}
                  >
                    {l}
                  </button>
                ))}
                <button type="button" onClick={() => upload.current?.click()} title="上传企业标识">
                  <Upload size={14} />
                </button>
              </div>
              <input
                ref={upload}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (
                    !['image/png', 'image/jpeg', 'image/webp'].includes(file.type) ||
                    file.size > 200000
                  )
                    return setError('请上传不超过 200 KB 的 PNG、JPEG 或 WebP 图片');
                  const reader = new FileReader();
                  reader.onload = () => setLogo(String(reader.result));
                  reader.readAsDataURL(file);
                }}
              />
            </div>
          </div>
          <Field label="企业名称">
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={30} required />
          </Field>
          <div className="form-grid">
            <Field label="白酒品牌">
              <input
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                maxLength={30}
                required
              />
            </Field>
            <Field label="核心产品">
              <input
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                maxLength={30}
                required
              />
            </Field>
          </div>
          <div className="field-label">
            你的经营初心 <span className="muted">后续可自由交叉发展</span>
          </div>
          <div className="direction-list">
            {DIRECTIONS.map((d) => (
              <button
                type="button"
                key={d.name}
                className={`direction-option ${direction === d.name ? 'selected' : ''}`}
                onClick={() => setDirection(d.name)}
              >
                <span className="radio-dot">{direction === d.name && <Check size={11} />}</span>
                <span>
                  <strong>{d.name}</strong>
                  <small>{d.benefit}</small>
                </span>
              </button>
            ))}
          </div>
          <Field label="经营种子" hint="相同种子与操作产生相同结果，可用于复盘与挑战。">
            <input
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              inputMode="numeric"
              required
            />
          </Field>
          {error && (
            <div role="alert" className="form-error">
              {error}
            </div>
          )}
          <button className="primary setup-submit" type="submit">
            开启经营之旅
            <ArrowRight size={17} />
          </button>
          {onCancel && (
            <button type="button" className="text-button cancel-setup" onClick={onCancel}>
              返回当前企业
            </button>
          )}
          <div className="setup-promises">
            <span>
              <FlaskConical size={13} />
              真实经营取舍
            </span>
            <span>
              <ShieldCheck size={13} />
              本地自动保存
            </span>
            <span>
              <Wine size={13} />
              原创虚构设定
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}
