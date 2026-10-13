import { ToolId, ToolUsageRecord } from './tools';

export interface StrokeRecord {
  toolId: ToolId;
  startTime: number;
  endTime: number;
  points: Array<[number, number]>;
  pressure: number;
  color: string;
  size?: number;
}

export interface BehaviorSnapshot {
  sessionId: string;
  totalStrokes: number;
  totalMs: number;
  toolUsage: Record<ToolId, ToolUsageRecord>;
  firstToolUsed: ToolId;
  lastToolUsed: ToolId;
  eraserRatio: number; // eraserMs / totalMs
  colorPalette: string[]; // top 5 cores usadas
  drawingQuadrants: [number, number, number, number]; // % de cobertura por quadrante [TL, TR, BL, BR]
  pauseCount?: number;
  averageStrokeSpeed?: number;
}
