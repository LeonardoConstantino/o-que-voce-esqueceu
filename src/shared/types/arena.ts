import { ToolId, ToolUsageRecord } from './tools';

export type TileType = 'floor' | 'void' | 'obstacle' | 'hazard' | 'ink_pool';

export type MovementStyle =
  | 'organic-curved'
  | 'retreating'
  | 'flooding'
  | 'straight-charge'
  | 'scattered-swarm'
  | 'teleporting'
  | 'blurring';

export type EnemyId = string;

export interface EnemyTemplate {
  toolOrigin: ToolId;
  count: number;
  movementStyle: MovementStyle;
  health: number;
  speed: number;
  damage: number;
}

export interface BossProfile {
  toolId: ToolId;
  deviationType: 'excess' | 'neglect';
  intensityLevel: 1 | 2 | 3;
  dialogueTier: number; // quantas vezes já foi boss
  wasReconciled: boolean;
  score?: number;
}

export interface Vec2 {
  x: number;
  y: number;
}

export interface ArenaMap {
  tiles: TileType[][];
  tileSize: number;
  cols: number;
  rows: number;
  palette: string[];
  enemies: EnemyTemplate[];
  bossSpawn: Vec2;
  bossProfile: BossProfile;
  playerStart: Vec2;
  coverageRatio: number;
  quadrantCoverage: [number, number, number, number];
}

export interface CanvasAnalysis {
  dominantColors: string[];
  coverageRatio: number;
  quadrantCoverage: [number, number, number, number];
  densityMap?: number[][];
}
