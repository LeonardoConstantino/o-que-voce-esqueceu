import { BehaviorSnapshot } from '../shared/types/behavior';
import { ToolRelation, TOOL_METADATA } from '../shared/types/tools';
import { NarrativeReport, NarrativeLine } from '../shared/types/session';

export class NarrativeGenerator {
  generate(
    snapshot: BehaviorSnapshot,
    relations: ToolRelation[],
    outcome: 'survived' | 'defeated',
    sessionNumber: number
  ): NarrativeReport {
    const lines: NarrativeLine[] = [];

    // Raw facts first
    lines.push({
      type: 'raw',
      text: `Você executou ${snapshot.totalStrokes} traços no papel.`,
    });

    const seconds = Math.round(snapshot.totalMs / 1000);
    lines.push({
      type: 'raw',
      text: `A sessão durou ${seconds} segundos antes da transição.`,
    });

    // Eraser behavior
    const eraserUsage = snapshot.toolUsage['eraser'];
    if (!eraserUsage || eraserUsage.useCount === 0) {
      lines.push({
        type: 'raw',
        text: 'Você não usou a borracha nenhuma vez.',
      });
    } else if (eraserUsage.useCount === 1) {
      lines.push({
        type: 'raw',
        text: 'Você tocou a borracha uma única vez.',
      });
    } else {
      const pct = Math.round((snapshot.eraserRatio || 0) * 100);
      lines.push({
        type: 'raw',
        text: `Você apagou ${eraserUsage.useCount} vezes (${pct}% do tempo total).`,
      });
    }

    // Dominant tool
    const dominantEntry = Object.entries(snapshot.toolUsage).sort(
      ([, a], [, b]) => b.strokeMs - a.strokeMs
    )[0];
    const dominantToolId = dominantEntry ? dominantEntry[0] : 'brush';
    const dominantMeta = TOOL_METADATA[dominantToolId as keyof typeof TOOL_METADATA];
    const dominantName = dominantMeta ? dominantMeta.shortName : dominantToolId;

    lines.push({
      type: 'raw',
      text: `${dominantName} ocupou a maior parte da sua atenção.`,
    });

    // Unused / Neglected tools
    const unused = Object.entries(snapshot.toolUsage)
      .filter(([, u]) => u.useCount === 0)
      .map(([id]) => {
        const m = TOOL_METADATA[id as keyof typeof TOOL_METADATA];
        return m ? m.shortName : id;
      });

    if (unused.length > 0) {
      lines.push({
        type: 'raw',
        text: `${unused.join(', ')} ${unused.length === 1 ? 'não foi tocada' : 'não foram tocadas'}.`,
      });
    }

    // Cross-session patterns
    const previousBoss = [...relations].sort(
      (a, b) => b.timesAsBoss - a.timesAsBoss
    )[0];
    if (previousBoss && previousBoss.timesAsBoss > 1) {
      const prevMeta = TOOL_METADATA[previousBoss.toolId];
      lines.push({
        type: 'pattern',
        text: `${prevMeta?.shortName || previousBoss.toolId} surgiu como confronto em ${previousBoss.timesAsBoss} sessões.`,
      });
    }

    // Psychological haunting line
    if (unused.length >= 3) {
      lines.push({
        type: 'haunting',
        text: 'Você já sabia exatamente o que evitar antes mesmo de encostar no papel.',
      });
    } else if (snapshot.eraserRatio > 0.3) {
      lines.push({
        type: 'haunting',
        text: 'O medo do traço imperfeito fez você apagar mais do que criar.',
      });
    } else {
      lines.push({
        type: 'haunting',
        text: 'O que você desenhou se tornou o mundo. O que você esqueceu se tornou o inimigo.',
      });
    }

    return {
      sessionId: snapshot.sessionId,
      sessionNumber,
      lines,
      dominantTool: dominantToolId as any,
      neglectedTools: unused as any,
      bossProfile: {
        toolId: (previousBoss?.toolId || 'brush') as any,
        deviationType: 'excess',
        wasReconciled: (previousBoss?.timesReconciled || 0) > 0,
      },
      timestamp: Date.now(),
    };
  }
}
