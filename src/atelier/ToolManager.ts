import { ToolId, ALL_TOOL_IDS } from '../shared/types/tools';
import { StrokeRecord } from '../shared/types/behavior';
import { CanvasEngine } from './CanvasEngine';
import {
  BaseTool,
  BrushTool,
  EraserTool,
  FillTool,
  LineTool,
  SprayTool,
  StampTool,
  SmudgeTool,
} from './ToolImplementations';
import { bus } from '../shared/EventBus';
import { audio } from '../shell/AudioManager';
import { ATELIER_PIGMENTS, MASTER_PALETTE } from '../shared/utils/color';

export class ToolManager {
  private tools: Map<ToolId, BaseTool> = new Map();
  public activeToolId: ToolId = 'brush';
  public currentColor: string = ATELIER_PIGMENTS[0].hex;
  public currentSize: number = 6;
  public destroyedTools: Set<ToolId> = new Set();

  private isPointerDown: boolean = false;
  private currentStrokePoints: Array<[number, number]> = [];
  private strokeStartTime: number = 0;
  private cleanups: Array<() => void> = [];

  constructor(
    private engine: CanvasEngine,
    destroyedList: ToolId[] = []
  ) {
    this.destroyedTools = new Set(destroyedList);

    this.tools.set('brush', new BrushTool(engine));
    this.tools.set('eraser', new EraserTool(engine));
    this.tools.set('fill', new FillTool(engine));
    this.tools.set('line', new LineTool(engine));
    this.tools.set('spray', new SprayTool(engine));
    this.tools.set('stamp', new StampTool(engine));
    this.tools.set('smudge', new SmudgeTool(engine));

    // Choose first available non-destroyed tool
    const available = ALL_TOOL_IDS.filter(id => !this.destroyedTools.has(id));
    if (available.length > 0 && !available.includes(this.activeToolId)) {
      this.activeToolId = available[0];
    }
  }

  public setTool(toolId: ToolId) {
    if (this.destroyedTools.has(toolId)) {
      return; // Tool was permanently destroyed in a previous session
    }
    const prev = this.activeToolId;
    this.activeToolId = toolId;
    bus.emit('atelier:tool-changed', {
      from: prev,
      to: toolId,
      timestamp: Date.now(),
    });
  }

  public setColor(color: string) {
    this.currentColor = color;
  }

  public setSize(size: number) {
    this.currentSize = Math.max(2, Math.min(32, size));
  }

  public mount() {
    const canvas = this.engine.canvas;

    const onMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      const pos = this.engine.getPointerPos(e);
      this.handlePointerDown(pos.x, pos.y);
    };

    const onMouseMove = (e: MouseEvent) => {
      const pos = this.engine.getPointerPos(e);
      this.handlePointerMove(pos.x, pos.y);
    };

    const onMouseUp = (e: MouseEvent) => {
      const pos = this.engine.getPointerPos(e);
      this.handlePointerUp(pos.x, pos.y);
    };

    const onMouseLeave = (e: MouseEvent) => {
      if (this.isPointerDown) {
        const pos = this.engine.getPointerPos(e);
        this.handlePointerUp(pos.x, pos.y);
      }
    };

    // Touch support
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        e.preventDefault();
        const pos = this.engine.getPointerPos(e.touches[0]);
        this.handlePointerDown(pos.x, pos.y);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        e.preventDefault();
        const pos = this.engine.getPointerPos(e.touches[0]);
        this.handlePointerMove(pos.x, pos.y);
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (this.isPointerDown) {
        e.preventDefault();
        const touch = e.changedTouches[0];
        const pos = touch ? this.engine.getPointerPos(touch) : { x: 0, y: 0 };
        this.handlePointerUp(pos.x, pos.y);
      }
    };

    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('mouseleave', onMouseLeave);

    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd, { passive: false });

    this.cleanups.push(() => {
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('mouseleave', onMouseLeave);

      canvas.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    });
  }

  private handlePointerDown(x: number, y: number) {
    if (this.destroyedTools.has(this.activeToolId)) return;

    this.isPointerDown = true;
    this.strokeStartTime = Date.now();
    this.currentStrokePoints = [[x, y]];

    const tool = this.tools.get(this.activeToolId);
    if (tool) {
      tool.onPointerDown(x, y, this.currentColor, this.currentSize);
    }
    audio.playToolSound(this.activeToolId);
  }

  private handlePointerMove(x: number, y: number) {
    if (!this.isPointerDown) return;
    this.currentStrokePoints.push([x, y]);

    const tool = this.tools.get(this.activeToolId);
    if (tool) {
      tool.onPointerMove(x, y, this.currentColor, this.currentSize);
    }

    if (Math.random() < 0.25) {
      audio.playToolSound(this.activeToolId);
    }
  }

  private handlePointerUp(x: number, y: number) {
    if (!this.isPointerDown) return;
    this.isPointerDown = false;
    const strokeEndTime = Date.now();

    const tool = this.tools.get(this.activeToolId);
    if (tool) {
      tool.onPointerUp(x, y);
    }

    const strokeRecord: StrokeRecord = {
      toolId: this.activeToolId,
      startTime: this.strokeStartTime,
      endTime: strokeEndTime,
      points: [...this.currentStrokePoints],
      pressure: 0.8,
      color: this.currentColor,
      size: this.currentSize,
    };

    bus.emit('atelier:stroke', strokeRecord);

    if (this.activeToolId === 'eraser') {
      const areaEstimate = Math.max(
        100,
        this.currentStrokePoints.length * this.currentSize * 15
      );
      bus.emit('atelier:eraser-used', {
        timestamp: strokeEndTime,
        area: areaEstimate,
      });
    }

    this.currentStrokePoints = [];
  }

  public destroy() {
    this.cleanups.forEach(fn => fn());
  }
}
