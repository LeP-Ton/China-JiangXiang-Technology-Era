import { useRef, useState } from 'react';
import { Download, FolderOpen, HardDrive, Save, Upload } from 'lucide-react';
import {
  AUTO_KEY,
  deserializeGame,
  loadFrom,
  saveTo,
  serializeGame,
  slotKey,
} from '../game/storage';
import type { GameState } from '../game/types';
import { Badge, money, PageTitle, Panel, Tip } from './shared';

export default function Archives({
  s,
  onLoad,
  notify,
  onNew,
}: {
  s: GameState;
  onLoad: (s: GameState) => void;
  notify: (text: string, ok?: boolean) => void;
  onNew: () => void;
}) {
  const [revision, setRevision] = useState(0);
  const upload = useRef<HTMLInputElement>(null);
  const get = (key: string) => {
    try {
      return loadFrom(localStorage, key);
    } catch {
      return 'corrupt' as const;
    }
  };
  const autosave = get(AUTO_KEY);
  const exportSave = () => {
    const blob = new Blob([serializeGame(s)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `酱香时代-${s.company.name.replace(/[\\/:*?"<>|]/g, '')}-第${s.month}月.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify('经营档案已导出，请保管好 JSON 文件');
  };
  return (
    <>
      <PageTitle
        eyebrow="ARCHIVE / 经营档案室"
        title="把每一种可能，都留一份底稿"
        description="自动保存跟随每次有效操作。手动档案独立保留，适合在重要决策前留下分岔。"
        extra={
          <Badge>
            <HardDrive size={12} />
            当前浏览器本地存储
          </Badge>
        }
      />
      <Tip>
        存档不跨浏览器同步。清理浏览器数据可能删除本地档案；重要进度请导出文件。读档会替换当前自动存档，手动槽位不受影响。
      </Tip>
      <div className="save-grid" data-revision={revision}>
        {[1, 2, 3].map((slot) => {
          const saved = get(slotKey(slot));
          const value = saved && saved !== 'corrupt' ? saved : null;
          return (
            <Panel
              key={slot}
              className="save-slot"
              title={`经营档案 0${slot}`}
              extra={<Save size={18} />}
            >
              {value ? (
                <>
                  <h2>{value.state.company.name}</h2>
                  <div className="save-meta">
                    第 {value.state.month} 月 · {value.state.company.direction}
                  </div>
                  <div className="fact-row">
                    <span>现金</span>
                    <strong>{money(value.state.finance.cash)} 万</strong>
                  </div>
                  <p className="subtle">
                    {new Date(value.savedAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
                  </p>
                </>
              ) : (
                <div className="empty">
                  <HardDrive size={26} />
                  <p>
                    {saved === 'corrupt'
                      ? '该槽位损坏，可重新保存覆盖'
                      : '此处还有一段故事，等待记录'}
                  </p>
                </div>
              )}
              <div className="button-row">
                <button
                  className="primary"
                  onClick={() => {
                    try {
                      saveTo(localStorage, slotKey(slot), s);
                      setRevision((r) => r + 1);
                      notify(`已保存至经营档案 0${slot}`);
                    } catch {
                      notify('保存失败，浏览器存储空间不足，请导出文件', false);
                    }
                  }}
                >
                  <Save size={14} />
                  {value ? '覆盖保存' : '保存当前'}
                </button>
                <button
                  className="secondary"
                  disabled={!value}
                  onClick={() => {
                    if (value) {
                      onLoad(value.state);
                      notify(`已读取第 ${value.state.month} 月的经营档案`);
                    }
                  }}
                >
                  <FolderOpen size={14} />
                  读取
                </button>
              </div>
            </Panel>
          );
        })}
      </div>
      <div className="two-columns">
        <Panel title="档案文件管理">
          <p className="body-copy">
            保存一份可迁移的经营底稿。文件包含随机种子、历史、事件与全部批次，不含任何外部账户信息。
          </p>
          <div className="button-row">
            <button className="secondary" onClick={exportSave}>
              <Download size={15} />
              导出存档文件
            </button>
            <button className="secondary" onClick={() => upload.current?.click()}>
              <Upload size={15} />
              导入存档文件
            </button>
            <input
              ref={upload}
              type="file"
              accept=".json,application/json"
              hidden
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                if (f.size > 10_000_000) {
                  notify('存档超过 10 MB 上限', false);
                  e.target.value = '';
                  return;
                }
                try {
                  const loaded = deserializeGame(await f.text());
                  onLoad(loaded.state);
                  notify('存档校验通过，已恢复企业经营');
                } catch (err) {
                  notify(err instanceof Error ? err.message : '无法读取文件', false);
                }
                e.target.value = '';
              }}
            />
          </div>
          <div className="fact-row">
            <span>自动存档状态</span>
            <strong>
              {autosave === 'corrupt' ? '读取失败' : autosave ? '已保存' : '尚未建立'}
            </strong>
          </div>
          <div className="fact-row">
            <span>当前经营种子</span>
            <strong>{s.initialSeed}</strong>
          </div>
        </Panel>
        <Panel title="新的企业，新的选择">
          <p className="body-copy">
            重新命名企业、选择经营初心，以一个新的种子重新出发。创建新企业会覆盖自动存档，请先把当前进度保存到上方手动槽位。
          </p>
          <button className="secondary" onClick={onNew}>
            创建新游戏
            <FolderOpen size={15} />
          </button>
        </Panel>
      </div>
    </>
  );
}
