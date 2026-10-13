import { ToolId, ToolRelation } from './tools';
import { BehaviorSnapshot } from './behavior';

export interface PlayerProfile {
  id: string; // Sempre 'player'
  totalSessions: number;
  completedAtLeastOnce: boolean;
  destroyedTools: ToolId[];
  reconciledTools: ToolId[];
  createdAt: number;
  lastPlayedAt: number;
}

export interface SessionRecord {
  sessionId: string;
  sessionNumber: number;
  outcome: 'survived' | 'defeated';
  bossToolId: ToolId;
  bossDeviationType: 'excess' | 'neglect';
  resolutionChoice?: 'reconcile' | 'destroy';
  createdAt: number;
  durationMs: number;
  totalDamageDealt?: number;
  totalDamageTaken?: number;
}

export interface NarrativeLine {
  type: 'raw' | 'reflection' | 'pattern' | 'silence' | 'haunting';
  text: string;
}

export interface NarrativeReport {
  sessionId: string;
  sessionNumber: number;
  lines: NarrativeLine[];
  dominantTool: ToolId;
  neglectedTools: ToolId[];
  bossProfile: {
    toolId: ToolId;
    deviationType: 'excess' | 'neglect';
    wasReconciled: boolean;
  };
  timestamp: number;
}
