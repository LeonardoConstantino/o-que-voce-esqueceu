import { ToolRelation, TOOL_METADATA } from '../shared/types/tools';

export class ToolMirror {
  static formatRelationStatus(rel: ToolRelation) {
    const meta = TOOL_METADATA[rel.toolId];
    const name = meta ? meta.shortName : rel.toolId;

    let status = 'Em Repouso';
    let statusColor = 'text-[#657A83]';

    if (rel.timesDestroyed > 0) {
      status = 'Destruída (Ausente)';
      statusColor = 'text-[#7A3942] line-through';
    } else if (rel.timesReconciled > 0) {
      status = `Reconciliada (${rel.timesReconciled}x — mais pesada)`;
      statusColor = 'text-[#C79A58]';
    } else if (rel.resentment > 0.4) {
      status = 'Ressentida (Negligenciada)';
      statusColor = 'text-[#7A3942]';
    } else if (rel.temperament > 0.4) {
      status = 'Saturada (Uso Excessivo)';
      statusColor = 'text-[#65705A]';
    }

    return {
      toolId: rel.toolId,
      name,
      status,
      statusColor,
      temperament: Math.round(rel.temperament * 100),
      resentment: Math.round(rel.resentment * 100),
      timesAsBoss: rel.timesAsBoss,
      isDestroyed: rel.timesDestroyed > 0,
      isReconciled: rel.timesReconciled > 0,
    };
  }
}
