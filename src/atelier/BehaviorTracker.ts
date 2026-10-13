import { ToolId, ToolUsageRecord, ALL_TOOL_IDS } from '../shared/types/tools';
import { StrokeRecord, BehaviorSnapshot } from '../shared/types/behavior';
import { bus } from '../shared/EventBus';

export class BehaviorTracker {
  private snapshot: BehaviorSnapshot;
  private cleanups: Array<() => void> = [];

  constructor(private sessionId: string) {
    this.snapshot = this.createEmpty();
  }

  start(): void {
    this.cleanups.push(
      bus.on('atelier:stroke', (record: StrokeRecord) => {
        this.snapshot.totalStrokes++;
        const duration = Math.max(16, record.endTime - record.startTime);
        this.snapshot.totalMs += duration;

        const usage = this.snapshot.toolUsage[record.toolId];
        if (usage) {
          usage.useCount++;
          usage.strokeMs += duration;
          usage.area += this.estimateArea(record.points);
          usage.lastUsedAt = record.endTime;
        }

        if (this.snapshot.totalStrokes === 1) {
          this.snapshot.firstToolUsed = record.toolId;
        }
        this.snapshot.lastToolUsed = record.toolId;

        // Collect color
        if (record.color && !this.snapshot.colorPalette.includes(record.color)) {
          this.snapshot.colorPalette.push(record.color);
        }
      }),

      bus.on('atelier:eraser-used', ({ area }) => {
        const usage = this.snapshot.toolUsage['eraser'];
        if (usage) {
          usage.area += area;
        }
      })
    );
  }

  collect(): BehaviorSnapshot {
    const totalMs = Math.max(this.snapshot.totalMs, 1);
    const eraserMs = this.snapshot.toolUsage['eraser']?.strokeMs || 0;
    this.snapshot.eraserRatio = eraserMs / totalMs;
    return { ...this.snapshot };
  }

  destroy(): void {
    this.cleanups.forEach(fn => fn());
  }

  private createEmpty(): BehaviorSnapshot {
    const emptyUsage = {} as Record<ToolId, ToolUsageRecord>;
    for (const id of ALL_TOOL_IDS) {
      emptyUsage[id] = {
        toolId: id,
        useCount: 0,
        strokeMs: 0,
        area: 0,
        lastUsedAt: 0,
      };
    }
    return {
      sessionId: this.sessionId,
      totalStrokes: 0,
      totalMs: 0,
      toolUsage: emptyUsage,
      firstToolUsed: 'brush',
      lastToolUsed: 'brush',
      eraserRatio: 0,
      colorPalette: [],
      drawingQuadrants: [0, 0, 0, 0],
    };
  }

  private estimateArea(points: Array<[number, number]>): number {
    if (points.length < 2) return 20;
    const xs = points.map(p => p[0]);
    const ys = points.map(p => p[1]);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    return Math.max(30, (maxX - minX) * (maxY - minY));
  }
}
