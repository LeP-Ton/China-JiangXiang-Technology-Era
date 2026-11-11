import { Component, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  ArrowRight,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  Check,
  ChevronRight,
  CircleHelp,
  FlaskConical,
  HardDrive,
  LayoutDashboard,
  Menu,
  Newspaper,
  Package,
  Save,
  Settings2,
  ShieldCheck,
  Store,
  TrendingUp,
  Users,
  Warehouse,
  X,
} from 'lucide-react';
import { performAction } from './game/actions';
import { advanceMonth } from './game/engine';
import { scoreCompany } from './game/selectors';
import { createGame } from './game/state';
import { AUTO_KEY, loadFrom, saveTo } from './game/storage';
import type { Action, ActionResult, GameState, MonthRecord } from './game/types';
import Archives from './components/Archives';
import { Dealers, Marketing, Products } from './components/Commerce';
import Dashboard from './components/Dashboard';
import Laboratory from './components/Laboratory';
import { Finance, News, People } from './components/Management';
import { Production, StorageCenter } from './components/Operations';
import Research from './components/Research';
import Setup from './components/Setup';
import { CompanyIdentity, CompanyMark } from './components/BrandIdentity';
import { Badge, money, num, Progress } from './components/shared';
import type { NavigationSelection } from './components/shared';

const NAV = [
  { id: 'dashboard', name: 'CEO 经营驾驶舱', icon: LayoutDashboard, group: '经营决策' },
  { id: 'research', name: '科技研发中心', icon: FlaskConical },
  { id: 'lab', name: '白酒配方实验室', icon: Settings2 },
  { id: 'production', name: '生产制造管理', icon: BriefcaseBusiness, group: '产业经营' },
  { id: 'storage', name: '基酒储存中心', icon: Warehouse },
  { id: 'products', name: '产品与品牌管理', icon: Package },
  { id: 'dealers', name: '经销商管理', icon: Store },
  { id: 'marketing', name: '市场营销中心', icon: TrendingUp },
  { id: 'finance', name: '财务管理系统', icon: ChartNoAxesCombined, group: '企业管理' },
  { id: 'people', name: '人力资源管理', icon: Users },
  { id: 'news', name: '新闻与舆情中心', icon: Newspaper },
];

class ErrorBoundary extends Component<{ children: ReactNode }, { error: boolean }> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <div className="fatal-error">
        <h1>界面暂时无法显示</h1>
        <p>最近的有效经营操作已自动保存。请刷新页面恢复；若存档损坏，可在新游戏界面重新开始。</p>
        <button className="primary" onClick={() => location.reload()}>
          刷新并恢复
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}

function GameApp() {
  const startupError = useRef('');
  const [game, setGame] = useState<GameState | null>(() => {
    try {
      return loadFrom(localStorage, AUTO_KEY)?.state ?? null;
    } catch (e) {
      startupError.current = e instanceof Error ? e.message : '无法读取自动存档';
      return null;
    }
  });
  const [page, setPage] = useState('dashboard');
  const [selection, setSelection] = useState<NavigationSelection>({});
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);
  const [summary, setSummary] = useState<MonthRecord | null>(null);
  const [help, setHelp] = useState(false);
  const [menu, setMenu] = useState(false);
  const [saved, setSaved] = useState(true);
  const main = useRef<HTMLElement>(null);
  const notify = (text: string, ok = true) => setToast({ text, ok });
  useEffect(() => {
    if (startupError.current)
      notify(`自动存档未载入：${startupError.current}。可创建企业后从档案室导入备份。`, false);
  }, []);
  useEffect(() => {
    if (!game) return;
    try {
      saveTo(localStorage, AUTO_KEY, game);
      setSaved(true);
    } catch {
      setSaved(false);
      notify('自动保存失败，请到经营档案室导出存档', false);
    }
  }, [game]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
    if (!dialog) return;
    const previous = document.activeElement as HTMLElement | null;
    const focusable = () =>
      Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex="0"]',
        ),
      );
    focusable()[0]?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && (help || summary)) {
        setHelp(false);
        setSummary(null);
        return;
      }
      if (event.key !== 'Tab') return;
      const list = focusable();
      const first = list[0];
      const last = list.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      if (previous?.isConnected) previous.focus();
    };
  }, [summary, help, game?.gameOver, game?.milestoneSeen, page]);
  const navigate = (id: string, target: NavigationSelection = {}) => {
    setPage(id);
    setSelection(target);
    setMenu(false);
    main.current?.scrollTo({ top: 0 });
  };
  const act = (action: Action): ActionResult => {
    if (!game) return { state: game as unknown as GameState, ok: false, message: '请先创建企业' };
    const result = performAction(game, action);
    if (result.ok) setGame(result.state);
    notify(result.message, result.ok);
    return result;
  };
  const load = (s: GameState) => {
    setGame(structuredClone(s));
    setSummary(null);
    navigate('dashboard');
  };
  const next = () => {
    if (!game) return;
    if (game.events.length) {
      navigate('news');
      notify('请先处理待决策议题', false);
      return;
    }
    const result = advanceMonth(game);
    if (result.ok) {
      setGame(result.state);
      setSummary(result.state.history.at(-1)!);
    } else notify(result.message, false);
  };
  const score = game ? scoreCompany(game) : null;
  const props = game ? { s: game, act, navigate, selection } : null;
  const pages: Record<string, ReactNode> = props
    ? {
        dashboard: <Dashboard {...props} />,
        research: <Research {...props} />,
        lab: <Laboratory {...props} />,
        production: <Production {...props} />,
        storage: <StorageCenter {...props} />,
        products: <Products {...props} />,
        dealers: <Dealers {...props} />,
        marketing: <Marketing {...props} />,
        finance: <Finance {...props} />,
        people: <People {...props} />,
        news: <News {...props} />,
        archives: (
          <Archives s={props.s} onLoad={load} notify={notify} onNew={() => setCreating(true)} />
        ),
      }
    : {};
  return (
    <>
      {!game || creating ? (
        <Setup
          onCancel={game ? () => setCreating(false) : undefined}
          onCreate={(c, seed) => {
            setGame(createGame(c, seed));
            setCreating(false);
            setSummary(null);
            setPage('dashboard');
            notify('酒厂已创立。接下来建立品牌、设计首款产品，再安排生产与销售。');
          }}
        />
      ) : (
        <div className="app-shell">
          <aside className={`sidebar ${menu ? 'open' : ''}`}>
            <div className="sidebar-brand">
              <CompanyIdentity
                name={game.company.name}
                logo={game.company.logo}
                variant="sidebar"
              />
              <button className="mobile-only" aria-label="关闭菜单" onClick={() => setMenu(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="enterprise-card">
              <CompanyMark logo={game.company.logo} name={game.company.name} />
              <div>
                <strong>{game.company.name}</strong>
                <small>{game.company.direction} · 地方酒厂起步</small>
              </div>
              <span className="company-status" />
            </div>
            <nav>
              {NAV.map((n) => (
                <div key={n.id}>
                  {n.group && <div className="nav-group">{n.group}</div>}
                  <button
                    className={`nav-item ${page === n.id ? 'active' : ''}`}
                    onClick={() => navigate(n.id)}
                  >
                    <n.icon size={17} />
                    <span>{n.name}</span>
                    {n.id === 'news' && game.events.length > 0 ? (
                      <b className="nav-count">{game.events.length}</b>
                    ) : page === n.id ? (
                      <ChevronRight size={13} />
                    ) : null}
                  </button>
                </div>
              ))}
            </nav>
            <div className="sidebar-bottom">
              <div className="journey">
                <div>
                  <span>企业成长之旅</span>
                  <small>{Math.min(60, game.month)} / 60 月</small>
                </div>
                <Progress value={(game.month / 60) * 100} />
                <p>
                  {game.month > 60 ? '自由经营 · 故事仍在继续' : '把眼光放长，把每个月经营好。'}
                </p>
              </div>
              <button
                className={`nav-item ${page === 'archives' ? 'active' : ''}`}
                onClick={() => navigate('archives')}
              >
                <HardDrive size={17} />
                <span>经营档案室</span>
              </button>
              <button className="nav-item" onClick={() => setHelp(true)}>
                <CircleHelp size={17} />
                <span>经营手册</span>
                <BookOpen size={13} />
              </button>
              <div className="sidebar-version">
                <span className="dot" />
                酱香型白酒企业管理系统<span>v0.1</span>
              </div>
            </div>
          </aside>
          {menu && <div className="sidebar-scrim" onClick={() => setMenu(false)} />}
          <div className="workspace">
            <header className="topbar">
              <div className="breadcrumb">
                <button className="mobile-only" aria-label="打开菜单" onClick={() => setMenu(true)}>
                  <Menu size={21} />
                </button>
                <span>企业管理系统</span>
                <ChevronRight size={13} />
                <strong>
                  {page === 'archives' ? '经营档案室' : NAV.find((n) => n.id === page)?.name}
                </strong>
                <span className="system-status">
                  <span className="dot" />
                  经营中
                </span>
              </div>
              <div className="topbar-actions">
                <span className={`autosave-status ${!saved ? 'negative' : ''}`}>
                  {saved ? <Check size={12} /> : <X size={12} />}
                  {saved ? '已自动保存' : '保存失败'}
                </span>
                <button
                  className="icon-button"
                  aria-label="经营档案与手动保存"
                  title="存档管理"
                  onClick={() => navigate('archives')}
                >
                  <Save size={17} />
                </button>
                <button
                  className="icon-button notification-button"
                  aria-label="查看待决策事件"
                  onClick={() => navigate('news')}
                >
                  <Bell size={18} />
                  {game.events.length > 0 && <i />}
                </button>
                <div className="topbar-divider" />
                <div className="month-label">
                  <span>创业第 {Math.floor((game.month - 1) / 12) + 1} 年</span>
                  <strong>{String(((game.month - 1) % 12) + 1).padStart(2, '0')} 月</strong>
                </div>
                <button
                  className={`primary next-month ${game.events.length ? 'has-events' : ''}`}
                  disabled={game.gameOver}
                  onClick={next}
                >
                  {game.events.length ? `处理 ${game.events.length} 项议题` : '推进下个月'}
                  <ArrowRight size={16} />
                </button>
              </div>
            </header>
            <main className="main-content" ref={main} key={page}>
              <div className="page-content">
                {pages[page]}
                <footer className="main-footer">
                  <span>
                    中国酱香科技时代 <i>/</i> 企业的一切，从你的选择开始。
                  </span>
                  <span>
                    <ShieldCheck size={12} />
                    原创虚构 · 离线模拟
                  </span>
                </footer>
              </div>
            </main>
            <div className="action-status">
              <span>
                <span className="dot" />
                本月管理行动 <strong>{game.actions}</strong> / {game.actionLimit}
              </span>
              <div className="action-dots">
                {Array.from({ length: game.actionLimit }, (_, i) => (
                  <i key={i} className={i < game.actions ? 'available' : ''} />
                ))}
              </div>
              <span className="action-status-hint">
                {game.actions > 0 ? '每项投入消耗行动，月末结算后恢复' : '行动已用完，可以推进月份'}
              </span>
              <button onClick={() => setHelp(true)}>
                经营规则
                <CircleHelp size={12} />
              </button>
            </div>
          </div>
        </div>
      )}
      {toast && (
        <div className={`toast ${toast.ok ? '' : 'error'}`} role="status">
          {toast.ok ? <Check size={18} /> : <Bell size={18} />}
          <span>{toast.text}</span>
          <button aria-label="关闭通知" onClick={() => setToast(null)}>
            <X size={15} />
          </button>
        </div>
      )}
      {summary && game && (
        <div className="modal-backdrop">
          <section
            className="modal month-summary"
            role="dialog"
            aria-modal="true"
            aria-labelledby="summary-title"
          >
            <div className="summary-mark">
              <ChartNoAxesCombined size={25} />
            </div>
            <div className="eyebrow">MONTHLY REPORT / 经营月报</div>
            <h2 id="summary-title">第 {summary.month} 个月，已酿入时间</h2>
            <p className="muted">一张报表，几种真相。再看一眼，带着判断进入下个月。</p>
            <div className="summary-metrics">
              <div>
                <span>营业收入</span>
                <strong>
                  {money(summary.revenue)}
                  <small>万</small>
                </strong>
              </div>
              <div>
                <span>实际回款</span>
                <strong>
                  {money(summary.receipts)}
                  <small>万</small>
                </strong>
              </div>
              <div>
                <span>本月净利润</span>
                <strong className={summary.profit < 0 ? 'negative' : 'positive'}>
                  {money(summary.profit)}
                  <small>万</small>
                </strong>
              </div>
              <div>
                <span>真实终端动销</span>
                <strong>
                  {num(summary.retail)}
                  <small>瓶</small>
                </strong>
              </div>
            </div>
            <div className="summary-foot">
              <span>
                期末现金 <b>{money(summary.cash)} 万</b>
              </span>
              <span>
                渠道库存 <b>{num(summary.dealerStock)} 瓶</b>
              </span>
            </div>
            {game.events.length > 0 && (
              <div className="summary-alert">
                <Bell size={15} />
                新的经营议题已送达，请在下月结算前作出决定。
              </div>
            )}
            <button
              className="primary full"
              onClick={() => {
                setSummary(null);
                if (game.events.length) navigate('news');
              }}
            >
              {game.events.length ? '查看待决策议题' : `开始第 ${game.month} 月经营`}
              <ArrowRight size={16} />
            </button>
          </section>
        </div>
      )}
      {!summary &&
        game &&
        !creating &&
        page !== 'archives' &&
        ((game.month > 60 && !game.milestoneSeen) || game.gameOver) &&
        score && (
          <div className="modal-backdrop">
            <section
              className="modal result-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="result-title"
            >
              <div className="eyebrow">
                {game.gameOver ? '经营终止 / 清算记录' : '60 MONTHS / 五年经营答卷'}
              </div>
              <h2 id="result-title">{game.gameOver ? '先让企业活着，再谈远方。' : score.title}</h2>
              <div className="result-score">
                {score.total}
                <small>综合经营评分</small>
              </div>
              <div className="health-bars">
                {score.dimensions.map((d) => (
                  <div key={d.name}>
                    <span>
                      {d.name}
                      <b>{num(d.value)}</b>
                    </span>
                    <Progress value={d.value} />
                  </div>
                ))}
              </div>
              <p className="muted">
                评价综合生存、动销、技术、品质、信誉与渠道，收入不是唯一答案。
              </p>
              {game.gameOver ? (
                <div className="button-row">
                  <button className="primary" onClick={() => navigate('archives')}>
                    读取存档
                  </button>
                  <button className="secondary" onClick={() => setCreating(true)}>
                    重新创立企业
                  </button>
                </div>
              ) : (
                <button className="primary full" onClick={() => act({ type: 'continue' })}>
                  继续自由经营
                  <ArrowRight size={15} />
                </button>
              )}
            </section>
          </div>
        )}
      {help && (
        <div className="modal-backdrop" onClick={() => setHelp(false)}>
          <section
            className="modal help-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              aria-label="关闭经营手册"
              onClick={() => setHelp(false)}
            >
              <X size={20} />
            </button>
            <div className="eyebrow">FIELD MANUAL / 经营手册</div>
            <h2 id="help-title">先酿好酒，再看懂增长。</h2>
            <ol>
              <li>
                <strong>先创立企业，再设计产品。</strong>
                新酒厂没有预设品牌和成品。先在配方实验室命名品牌与首款产品、归档工艺，再安排盲品、生产和勾调。每月五次行动，需要在研发与渠道发货之间安排节奏。
              </li>
              <li>
                <strong>时间不能跳过。</strong>制曲、发酵与蒸馏需要数月，新基酒入库酒龄为
                0。消费定位决定最低酒龄，短于配方目标会损失协调性。
              </li>
              <li>
                <strong>研发不只是点亮图标。</strong>
                四阶段分别投入资金，成功后手动部署；新批次出酒率、风味、原料效率等才会改善。
              </li>
              <li>
                <strong>看懂两份报表。</strong>出货时确认收入，赊销只收到 40%
                现金。经销商售出的是自己的货，只有还款时才增加企业现金。
              </li>
              <li>
                <strong>渠道不是无限的。</strong>
                库存积压导致降价、倒挂和拒绝进货；支持经销商与终端推广有助于改善周转。
              </li>
              <li>
                <strong>为长期留一份底稿。</strong>
                每次操作自动保存；重要决策前使用手动槽位，支持文件备份。连续三个月现金为负将停止经营。
              </li>
            </ol>
            <p className="subtle">
              模型使用万元、吨、500mL 瓶作为游戏单位，1 吨折算约 2,000
              瓶。税费与工艺参数是玩法抽象；所有企业和事件均为虚构。
            </p>
            <button className="primary full" onClick={() => setHelp(false)}>
              回到经营现场
              <ArrowRight size={15} />
            </button>
          </section>
        </div>
      )}
    </>
  );
}
export default function App() {
  return (
    <ErrorBoundary>
      <GameApp />
    </ErrorBoundary>
  );
}
