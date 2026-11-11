import { Check, FlaskConical, LockKeyhole, Microscope, Rocket } from 'lucide-react';
import { RESEARCH_COST, RESEARCH_STAGES, TECHS } from '../game/data';
import { hasTech } from '../game/flavor';
import { Badge, money, PageTitle, Panel, Progress, Tip } from './shared';
import type { PanelProps } from './shared';

export default function Research({ s, act, navigate }: PanelProps) {
  const scientists = s.staff['风味研究员'] + s.staff['微生物研究员'];
  return (
    <>
      <PageTitle
        eyebrow="RESEARCH INSTITUTE / 科技研发中心"
        title="让护城河，来自实验室"
        description="从基础研究到工业化验证，技术要经过时间、资金与不确定性的共同检验。"
        extra={
          <button className="secondary" onClick={() => navigate('people')}>
            <Microscope size={15} />
            科研团队 · {scientists} 人
          </button>
        }
      />
      <div className="research-summary">
        <Panel>
          <FlaskConical size={25} />
          <div>
            <span>在研项目</span>
            <strong>
              {s.research.filter((r) => r.active).length}
              <small> / {scientists} 个可并行</small>
            </strong>
          </div>
        </Panel>
        <Panel>
          <Rocket size={25} />
          <div>
            <span>已应用技术</span>
            <strong>
              {s.research.filter((r) => r.applied).length}
              <small> / 10 项</small>
            </strong>
          </div>
        </Panel>
        <Panel>
          <Microscope size={25} />
          <div>
            <span>实验数据积累</span>
            <strong>
              {s.experimentCount}
              <small> 组有效记录</small>
            </strong>
          </div>
        </Panel>
      </div>
      <Tip>
        研发完成不会自动升级生产。四阶段全部通过后，还需投入 6
        万元部署；已在制批次保留原工艺，新批次开始享受技术收益。
      </Tip>
      <div className="research-grid">
        {TECHS.map((t) => {
          const r = s.research.find((r) => r.id === t.id)!;
          const locked = !!t.prerequisite && !hasTech(s, t.prerequisite);
          return (
            <Panel
              key={t.id}
              className={t.id === 'fermentation' ? 'core-tech' : ''}
              title={t.name}
              eyebrow={t.group}
              extra={
                <Badge tone={r.applied ? 'green' : r.active ? 'blue' : locked ? 'gray' : 'amber'}>
                  {r.applied
                    ? '已投入生产'
                    : r.active
                      ? '研发进行中'
                      : locked
                        ? '前置未满足'
                        : r.stage === 4
                          ? '待部署'
                          : '待投入'}
                </Badge>
              }
            >
              <p className="tech-description">{t.description}</p>
              <div className="research-stages">
                {RESEARCH_STAGES.map((stage, i) => (
                  <div
                    key={stage}
                    className={r.stage > i ? 'complete' : r.stage === i ? 'current' : ''}
                  >
                    <span>{r.stage > i ? <Check size={12} /> : `0${i + 1}`}</span>
                    <small>{stage}</small>
                  </div>
                ))}
              </div>
              {r.active && (
                <div className="research-progress">
                  <span>
                    阶段进度 {r.progress} / {t.duration[r.stage]} 月
                  </span>
                  <Progress value={(r.progress / t.duration[r.stage]) * 100} />
                </div>
              )}
              <div className="tech-effect">
                <span className="dot" />
                {t.effect}
              </div>
              {locked && (
                <p className="subtle">
                  <LockKeyhole size={12} />
                  前置技术：{TECHS.find((x) => x.id === t.prerequisite)?.name}
                </p>
              )}
              <div className="tech-footer">
                <span>
                  {r.stage < 4 ? (
                    <>
                      <b>{money(RESEARCH_COST[r.stage] * t.cost, 1)}</b> 万 / 本阶段
                      <small>预计 {t.duration[r.stage]} 月 · 存在失败风险</small>
                    </>
                  ) : r.applied ? (
                    '已通过生产部署'
                  ) : (
                    '部署费用 6 万元'
                  )}
                </span>
                <button
                  className={t.id === 'fermentation' ? 'primary' : 'secondary'}
                  disabled={locked || r.active || r.applied || s.actions < 1}
                  onClick={() =>
                    act({ type: r.stage === 4 ? 'applyResearch' : 'research', id: t.id })
                  }
                >
                  {r.applied
                    ? '应用中'
                    : r.active
                      ? '研究进行中'
                      : r.stage === 4
                        ? '部署到生产'
                        : `投入${RESEARCH_STAGES[r.stage]}`}
                </button>
              </div>
            </Panel>
          );
        })}
      </div>
    </>
  );
}
