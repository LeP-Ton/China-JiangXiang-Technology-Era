import { RESEARCH_STAGES, TECHS } from './data';
import { addNews } from './actions';
import { random } from './random';
import type { GameState } from './types';

export function settleResearch(s: GameState) {
  const scientists = s.staff['风味研究员'] + s.staff['微生物研究员'];
  for (const r of s.research) {
    if (!r.active || r.stage >= 4) continue;
    const t = TECHS.find((t) => t.id === r.id)!;
    r.progress++;
    if (r.progress < t.duration[r.stage]) continue;
    const [draw, seed] = random(s.seed);
    s.seed = seed;
    const failure = Math.max(
      0.025,
      0.13 + r.stage * 0.025 - scientists * 0.018 - s.experimentCount * 0.003 - r.attempts * 0.01,
    );
    r.active = false;
    r.progress = 0;
    if (draw < failure) {
      r.instability++;
      addNews(
        s,
        '预警',
        `${t.name}：验证未通过`,
        `${RESEARCH_STAGES[r.stage]}出现实验不稳定。阶段保留，需重新投入；已有实验数据与重试经验将提高下次成功率。`,
      );
    } else {
      addNews(
        s,
        '研发',
        `${t.name}：${RESEARCH_STAGES[r.stage]}完成`,
        r.stage === 3
          ? '工业化验证通过。请在研究院完成技术部署，才能影响生产。'
          : '阶段成果已记录，下一阶段需重新安排经费与管理行动。',
      );
      r.stage++;
      r.instability = 0;
    }
  }
}
