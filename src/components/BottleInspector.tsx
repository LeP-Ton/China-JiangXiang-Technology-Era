import { useId, useRef } from 'react';
import { X, ZoomIn } from 'lucide-react';
import type { Company, Recipe } from '../game/types';
import WineBottle from './WineBottle';

export default function BottleInspector({
  recipe,
  company,
}: {
  recipe: Pick<Recipe, 'name' | 'brand' | 'packaging'>;
  company: Pick<Company, 'name' | 'logo'>;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const headingId = useId();
  const name = recipe.name.trim() || '待命名产品';
  return (
    <>
      <button
        ref={trigger}
        className="bottle-inspect-button"
        aria-label={`放大查看${name}${recipe.packaging}酒标`}
        aria-haspopup="dialog"
        onClick={() => dialog.current?.showModal()}
      >
        <ZoomIn size={14} />
        放大酒标
      </button>
      {/* 原生对话框负责焦点约束与 Esc 关闭，避免与经营月报的弹窗状态耦合。 */}
      <dialog
        ref={dialog}
        className="bottle-inspector"
        aria-labelledby={headingId}
        onClose={() => trigger.current?.focus()}
        onClick={(event) => {
          if (event.target === event.currentTarget) dialog.current?.close();
        }}
      >
        <div className="bottle-inspector-content">
          <header>
            <div>
              <small>包装与酒标 / 放大预览</small>
              <h2 id={headingId}>{name}</h2>
              <p>
                {recipe.brand.trim() || '待命名品牌'} · {recipe.packaging}包装
              </p>
            </div>
            <button
              className="bottle-inspector-close"
              aria-label="关闭酒标预览"
              onClick={() => dialog.current?.close()}
            >
              <X size={20} />
            </button>
          </header>
          <div className={`bottle-inspector-scene packaging-${recipe.packaging}`}>
            <WineBottle
              brand={recipe.brand}
              product={recipe.name}
              company={company.name}
              logo={company.logo}
              packaging={recipe.packaging}
              className="inspector-bottle"
            />
          </div>
          <p className="bottle-inspector-hint">
            产品名为主酒标，品牌名位于上方。按 Esc 或点击空白处关闭。
          </p>
        </div>
      </dialog>
    </>
  );
}
