import { BaseStore } from './BaseStore';
import { ToolId, ToolRelation, ALL_TOOL_IDS } from '../../shared/types/tools';
import { BehaviorSnapshot } from '../../shared/types/behavior';
import { clamp } from '../../shared/utils/math';

export class RelationStore extends BaseStore<ToolRelation> {
  async initializeIfEmpty(): Promise<void> {
    const existing = await this.getAll();
    if (existing.length > 0) return;

    for (const toolId of ALL_TOOL_IDS) {
      await this.put({
        toolId,
        temperament: 0,
        resentment: 0,
        sessionsSeen: 0,
        timesAsBoss: 0,
        timesReconciled: 0,
        timesDestroyed: 0,
      });
    }
  }

  async getRelation(toolId: ToolId): Promise<ToolRelation> {
    const rel = await this.get(toolId);
    if (rel) return rel;
    const defaultRel: ToolRelation = {
      toolId,
      temperament: 0,
      resentment: 0,
      sessionsSeen: 0,
      timesAsBoss: 0,
      timesReconciled: 0,
      timesDestroyed: 0,
    };
    await this.put(defaultRel);
    return defaultRel;
  }

  async applySessionBehavior(snapshot: BehaviorSnapshot): Promise<void> {
    const totalMs = Object.values(snapshot.toolUsage).reduce((acc, t) => acc + t.strokeMs, 0);
    const avgUsage = totalMs / 7;

    for (const toolId of ALL_TOOL_IDS) {
      const relation = await this.getRelation(toolId);
      const usage = snapshot.toolUsage[toolId];
      const strokeMs = usage?.strokeMs || 0;

      const deviation = (strokeMs - avgUsage) / Math.max(avgUsage, 1);

      // excesso → temperament sobe; negligência → resentment sobe
      const newTemperament = clamp(
        relation.temperament + (deviation > 0 ? deviation * 0.35 : -0.05),
        -1,
        1
      );
      const newResentment = clamp(
        relation.resentment + (deviation < 0 ? Math.abs(deviation) * 0.35 : -0.1),
        -1,
        1
      );

      await this.put({
        ...relation,
        temperament: newTemperament,
        resentment: newResentment,
        sessionsSeen: relation.sessionsSeen + 1,
      });
    }
  }
}
