export type ToolId =
  | 'brush'
  | 'eraser'
  | 'fill'
  | 'line'
  | 'spray'
  | 'stamp'
  | 'smudge';

export const ALL_TOOL_IDS: ToolId[] = [
  'brush',
  'eraser',
  'fill',
  'line',
  'spray',
  'stamp',
  'smudge',
];

export interface ToolMetadata {
  id: ToolId;
  name: string;
  shortName: string;
  description: string;
  hotkey: string;
  cursor: string;
}

export const TOOL_METADATA: Record<ToolId, ToolMetadata> = {
  brush: {
    id: 'brush',
    name: 'Pincel de Cerdas',
    shortName: 'Pincel',
    description: 'Fluidez orgânica e pigmento contínuo sobre o papel.',
    hotkey: '1',
    cursor: 'crosshair',
  },
  eraser: {
    id: 'eraser',
    name: 'Borracha Gasta',
    shortName: 'Borracha',
    description: 'Cria ausência e esvazia o espaço antes ocupado.',
    hotkey: '2',
    cursor: 'cell',
  },
  fill: {
    id: 'fill',
    name: 'Balde de Pigmento',
    shortName: 'Balde',
    description: 'Expansão rápida e inundação de matéria.',
    hotkey: '3',
    cursor: 'crosshair',
  },
  line: {
    id: 'line',
    name: 'Tiralinhas / Grafite Reto',
    shortName: 'Linha',
    description: 'Precisão tensa, limites e geometrias retas.',
    hotkey: '4',
    cursor: 'crosshair',
  },
  spray: {
    id: 'spray',
    name: 'Aerógrafo / Spray',
    shortName: 'Spray',
    description: 'Partículas dispersas, nuvem e instabilidade.',
    hotkey: '5',
    cursor: 'crosshair',
  },
  stamp: {
    id: 'stamp',
    name: 'Carimbo de Madeira',
    shortName: 'Carimbo',
    description: 'Marcas rítmicas repetitivas e relevo fixo.',
    hotkey: '6',
    cursor: 'crosshair',
  },
  smudge: {
    id: 'smudge',
    name: 'Esfuminho de Feltro',
    shortName: 'Esfuminho',
    description: 'Distorção suave, fusão e perda de contorno.',
    hotkey: '7',
    cursor: 'crosshair',
  },
};

export interface ToolUsageRecord {
  toolId: ToolId;
  useCount: number; // total de ativações/cliques
  strokeMs: number; // ms acumulado com a ferramenta ativa
  area: number; // px² total estimado afetado
  lastUsedAt: number; // timestamp da última ativação
}

export interface ToolRelation {
  toolId: ToolId;
  temperament: number; // [-1, 1] — excesso acumulado cross-sessão
  resentment: number; // [-1, 1] — negligência acumulada cross-sessão
  sessionsSeen: number;
  timesAsBoss: number;
  timesReconciled: number;
  timesDestroyed: number;
}
