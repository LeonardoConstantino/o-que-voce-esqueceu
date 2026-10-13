import { ToolId } from './tools';
import { StrokeRecord, BehaviorSnapshot } from './behavior';
import { ArenaMap, BossProfile, EnemyId } from './arena';

export type SceneName = 'atelier' | 'transition' | 'arena' | 'resolution' | 'postarena';

export interface GameEvents {
  // Ateliê
  'atelier:stroke': StrokeRecord;
  'atelier:tool-changed': { from: ToolId; to: ToolId; timestamp: number };
  'atelier:eraser-used': { timestamp: number; area: number };
  'atelier:metronome-fires': { canvasSnapshot: ImageData; behavior: BehaviorSnapshot; isManual?: boolean };

  // Conversor
  'converter:arena-ready': { map: ArenaMap; bossProfile: BossProfile };

  // Arena
  'arena:player-hit': { damage: number; source: EnemyId };
  'arena:player-heal': { amount: number };
  'arena:enemy-defeated': { enemyId: EnemyId; toolOrigin: ToolId };
  'arena:boss-phase': { phase: 1 | 2 | 3 };
  'arena:dialogue': { text: string; durationMs: number; speaker: string };
  'arena:resolution': { choice: 'reconcile' | 'destroy'; toolId: ToolId };
  'arena:session-end': { outcome: 'survived' | 'defeated' };

  // Shell & Navigation
  'shell:scene-change': { to: SceneName; payload?: unknown };
  'shell:session-start': { sessionId: string; sessionCount: number };
  'audio:play-sfx': { sound: string; volume?: number };
}
