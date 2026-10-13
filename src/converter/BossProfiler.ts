import { BehaviorSnapshot } from '../shared/types/behavior';
import { ToolRelation, ToolUsageRecord } from '../shared/types/tools';
import { BossProfile } from '../shared/types/arena';

export class BossProfiler {
  async identify(
    snapshot: BehaviorSnapshot,
    relations: ToolRelation[]
  ): Promise<BossProfile> {
    const scores = relations
      .filter(r => r.timesDestroyed === 0) // Destroyed tools are permanently gone
      .map(r => {
        const usage = snapshot.toolUsage[r.toolId] || {
          toolId: r.toolId,
          useCount: 0,
          strokeMs: 0,
          area: 0,
          lastUsedAt: 0,
        };

        const deviation = this.deviationScore(usage, snapshot);
        const historical = Math.abs(r.temperament) + Math.abs(r.resentment);

        // Boss = combined highest imbalance (60% current session + 40% history)
        const score = deviation * 0.6 + historical * 0.4;
        return { toolId: r.toolId, score, relation: r, usage };
      })
      .sort((a, b) => b.score - a.score);

    // Fallback if all destroyed
    const top = scores[0] || {
      toolId: 'brush' as const,
      score: 1.0,
      relation: { timesAsBoss: 0, timesReconciled: 0 } as ToolRelation,
      usage: { strokeMs: 0 } as ToolUsageRecord,
    };

    const avgMsVal = this.avgMs(snapshot);
    const deviationType = top.usage.strokeMs >= avgMsVal ? 'excess' : 'neglect';

    return {
      toolId: top.toolId,
      deviationType,
      intensityLevel: this.intensityLevel(top.score),
      dialogueTier: top.relation.timesAsBoss,
      wasReconciled: top.relation.timesReconciled > 0,
      score: top.score,
    };
  }

  private deviationScore(
    usage: ToolUsageRecord,
    snapshot: BehaviorSnapshot
  ): number {
    const avg = this.avgMs(snapshot);
    return Math.abs(usage.strokeMs - avg) / Math.max(avg, 1);
  }

  private avgMs(snapshot: BehaviorSnapshot): number {
    const total = Object.values(snapshot.toolUsage).reduce(
      (acc, u) => acc + u.strokeMs,
      0
    );
    return Math.max(1, total / 7);
  }

  private intensityLevel(score: number): 1 | 2 | 3 {
    if (score > 1.4) return 3;
    if (score > 0.7) return 2;
    return 1;
  }
}
