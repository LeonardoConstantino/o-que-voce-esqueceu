import { CanvasEngine } from './CanvasEngine';
import { MASTER_PALETTE } from '../shared/utils/color';

export interface BaseTool {
  id: string;
  onPointerDown(x: number, y: number, color: string, size: number): void;
  onPointerMove(x: number, y: number, color: string, size: number): void;
  onPointerUp(x: number, y: number): void;
}

export class BrushTool implements BaseTool {
  id = 'brush';
  private lastX: number = 0;
  private lastY: number = 0;
  private isDrawing: boolean = false;

  constructor(private engine: CanvasEngine) {}

  onPointerDown(x: number, y: number, color: string, size: number) {
    this.isDrawing = true;
    this.lastX = x;
    this.lastY = y;
    this.engine.saveState();

    const ctx = this.engine.ctx;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = size;

    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  onPointerMove(x: number, y: number, color: string, size: number) {
    if (!this.isDrawing) return;
    const ctx = this.engine.ctx;
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(this.lastX, this.lastY);
    // Smooth quadratic curve midpoint
    const midX = (this.lastX + x) / 2;
    const midY = (this.lastY + y) / 2;
    ctx.quadraticCurveTo(this.lastX, this.lastY, midX, midY);
    ctx.stroke();

    this.lastX = x;
    this.lastY = y;
  }

  onPointerUp() {
    this.isDrawing = false;
  }
}

export class EraserTool implements BaseTool {
  id = 'eraser';
  private lastX: number = 0;
  private lastY: number = 0;
  private isDrawing: boolean = false;

  constructor(private engine: CanvasEngine) {}

  onPointerDown(x: number, y: number, _color: string, size: number) {
    this.isDrawing = true;
    this.lastX = x;
    this.lastY = y;
    this.engine.saveState();

    const ctx = this.engine.ctx;
    ctx.strokeStyle = MASTER_PALETTE.papelVivo;
    ctx.fillStyle = MASTER_PALETTE.papelVivo;
    ctx.lineWidth = size * 1.6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.arc(x, y, size * 0.8, 0, Math.PI * 2);
    ctx.fill();
  }

  onPointerMove(x: number, y: number, _color: string, size: number) {
    if (!this.isDrawing) return;
    const ctx = this.engine.ctx;
    ctx.strokeStyle = MASTER_PALETTE.papelVivo;
    ctx.lineWidth = size * 1.6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(this.lastX, this.lastY);
    ctx.lineTo(x, y);
    ctx.stroke();

    this.lastX = x;
    this.lastY = y;
  }

  onPointerUp() {
    this.isDrawing = false;
  }
}

export class FillTool implements BaseTool {
  id = 'fill';

  constructor(private engine: CanvasEngine) {}

  onPointerDown(x: number, y: number, color: string) {
    this.engine.floodFill(x, y, color);
  }

  onPointerMove() {}
  onPointerUp() {}
}

export class LineTool implements BaseTool {
  id = 'line';
  private startX: number = 0;
  private startY: number = 0;
  private previewSnapshot: ImageData | null = null;
  private isDrawing: boolean = false;

  constructor(private engine: CanvasEngine) {}

  onPointerDown(x: number, y: number, _color: string) {
    this.isDrawing = true;
    this.startX = x;
    this.startY = y;
    this.engine.saveState();
    this.previewSnapshot = this.engine.ctx.getImageData(
      0,
      0,
      this.engine.canvas.width,
      this.engine.canvas.height
    );
  }

  onPointerMove(x: number, y: number, color: string, size: number) {
    if (!this.isDrawing || !this.previewSnapshot) return;
    this.engine.ctx.putImageData(this.previewSnapshot, 0, 0);

    const ctx = this.engine.ctx;
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.lineCap = 'square';

    ctx.beginPath();
    ctx.moveTo(this.startX, this.startY);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  onPointerUp() {
    this.isDrawing = false;
    this.previewSnapshot = null;
  }
}

export class SprayTool implements BaseTool {
  id = 'spray';
  private isDrawing: boolean = false;

  constructor(private engine: CanvasEngine) {}

  onPointerDown(x: number, y: number, color: string, size: number) {
    this.isDrawing = true;
    this.engine.saveState();
    this.spray(x, y, color, size);
  }

  onPointerMove(x: number, y: number, color: string, size: number) {
    if (!this.isDrawing) return;
    this.spray(x, y, color, size);
  }

  onPointerUp() {
    this.isDrawing = false;
  }

  private spray(x: number, y: number, color: string, size: number) {
    const ctx = this.engine.ctx;
    ctx.fillStyle = color;
    const density = Math.floor(size * 1.8);
    const radius = size * 1.5;

    for (let i = 0; i < density; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * radius;
      const px = x + Math.cos(angle) * r;
      const py = y + Math.sin(angle) * r;
      const pSize = Math.random() * 1.5 + 0.5;

      ctx.fillRect(px, py, pSize, pSize);
    }
  }
}

export class StampTool implements BaseTool {
  id = 'stamp';

  constructor(private engine: CanvasEngine) {}

  onPointerDown(x: number, y: number, color: string, size: number) {
    this.engine.saveState();
    const ctx = this.engine.ctx;
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;

    const stampRadius = size * 2;
    // Geometric wood stamp pattern (concentric diamond + circle mark)
    ctx.beginPath();
    ctx.arc(x, y, stampRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x, y - stampRadius * 0.7);
    ctx.lineTo(x + stampRadius * 0.7, y);
    ctx.lineTo(x, y + stampRadius * 0.7);
    ctx.lineTo(x - stampRadius * 0.7, y);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x, y, stampRadius * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = MASTER_PALETTE.papelVivo;
    ctx.fill();
  }

  onPointerMove() {}
  onPointerUp() {}
}

export class SmudgeTool implements BaseTool {
  id = 'smudge';
  private isDrawing: boolean = false;

  constructor(private engine: CanvasEngine) {}

  onPointerDown(x: number, y: number, _color: string, size: number) {
    this.isDrawing = true;
    this.engine.saveState();
    this.engine.applySmudge(x, y, size * 1.5);
  }

  onPointerMove(x: number, y: number, _color: string, size: number) {
    if (!this.isDrawing) return;
    this.engine.applySmudge(x, y, size * 1.5);
  }

  onPointerUp() {
    this.isDrawing = false;
  }
}
