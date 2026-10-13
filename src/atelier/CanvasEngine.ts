import { hexToRgb, MASTER_PALETTE } from '../shared/utils/color';

export class CanvasEngine {
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;
  private width: number = 720;
  private height: number = 540;
  private isDrawing: boolean = false;
  private undoStack: ImageData[] = [];

  constructor(container: HTMLElement, width: number = 720, height: number = 540) {
    this.width = width;
    this.height = height;

    this.canvas = document.createElement('canvas');
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.canvas.className = 'w-full h-full object-contain cursor-crosshair rounded-sm shadow-inner transition-transform duration-300';
    this.canvas.style.backgroundColor = MASTER_PALETTE.papelVivo;

    const context = this.canvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('Canvas 2D context not available');
    this.ctx = context;

    this.initPaperBackground();
    container.appendChild(this.canvas);
  }

  public initPaperBackground() {
    this.ctx.fillStyle = MASTER_PALETTE.papelVivo;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Subtle paper grain noise
    const imgData = this.ctx.getImageData(0, 0, this.width, this.height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const grain = (Math.random() - 0.5) * 8;
      data[i] = Math.max(0, Math.min(255, data[i] + grain));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + grain));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + grain));
    }
    this.ctx.putImageData(imgData, 0, 0);
    this.saveState();
  }

  public saveState() {
    if (this.undoStack.length >= 15) {
      this.undoStack.shift();
    }
    this.undoStack.push(this.ctx.getImageData(0, 0, this.width, this.height));
  }

  public undo(): boolean {
    if (this.undoStack.length > 1) {
      this.undoStack.pop(); // Remove current
      const prev = this.undoStack[this.undoStack.length - 1];
      if (prev) {
        this.ctx.putImageData(prev, 0, 0);
        return true;
      }
    }
    return false;
  }

  public clear() {
    this.initPaperBackground();
  }

  public captureImageData(): ImageData {
    return this.ctx.getImageData(0, 0, this.width, this.height);
  }

  public getPointerPos(e: MouseEvent | Touch): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.width / rect.width;
    const scaleY = this.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  // Flood fill algorithm for Fill tool
  public floodFill(startX: number, startY: number, fillColorHex: string) {
    const startXInt = Math.floor(startX);
    const startYInt = Math.floor(startY);
    if (startXInt < 0 || startXInt >= this.width || startYInt < 0 || startYInt >= this.height) return;

    this.saveState();
    const imgData = this.ctx.getImageData(0, 0, this.width, this.height);
    const data = imgData.data;
    const fillRgb = hexToRgb(fillColorHex);

    const startIndex = (startYInt * this.width + startXInt) * 4;
    const targetR = data[startIndex];
    const targetG = data[startIndex + 1];
    const targetB = data[startIndex + 2];
    const targetA = data[startIndex + 3];

    // Check if target color is already fill color
    if (
      Math.abs(targetR - fillRgb.r) < 10 &&
      Math.abs(targetG - fillRgb.g) < 10 &&
      Math.abs(targetB - fillRgb.b) < 10
    ) {
      return;
    }

    const tolerance = 42;
    const matchTarget = (idx: number) => {
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];
      return (
        Math.abs(r - targetR) <= tolerance &&
        Math.abs(g - targetG) <= tolerance &&
        Math.abs(b - targetB) <= tolerance &&
        Math.abs(a - targetA) <= tolerance
      );
    };

    const visited = new Uint8Array(this.width * this.height);
    const queue: number[] = [startXInt, startYInt];
    visited[startYInt * this.width + startXInt] = 1;

    let head = 0;
    while (head < queue.length) {
      const x = queue[head++];
      const y = queue[head++];

      const idx = (y * this.width + x) * 4;
      data[idx] = fillRgb.r;
      data[idx + 1] = fillRgb.g;
      data[idx + 2] = fillRgb.b;
      data[idx + 3] = 255;

      const neighbors = [
        [x + 1, y],
        [x - 1, y],
        [x, y + 1],
        [x, y - 1],
      ];

      for (const [nx, ny] of neighbors) {
        if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
          const nIndex = ny * this.width + nx;
          if (!visited[nIndex]) {
            visited[nIndex] = 1;
            const nPixelIdx = nIndex * 4;
            if (matchTarget(nPixelIdx)) {
              queue.push(nx, ny);
            }
          }
        }
      }
    }

    this.ctx.putImageData(imgData, 0, 0);
  }

  // Smudge algorithm
  public applySmudge(x: number, y: number, radius: number = 14) {
    const rx = Math.max(0, Math.floor(x - radius));
    const ry = Math.max(0, Math.floor(y - radius));
    const rw = Math.min(this.width - rx, radius * 2);
    const rh = Math.min(this.height - ry, radius * 2);

    if (rw <= 0 || rh <= 0) return;

    const imgData = this.ctx.getImageData(rx, ry, rw, rh);
    const data = imgData.data;

    // Fast box blur on region
    for (let py = 1; py < rh - 1; py++) {
      for (let px = 1; px < rw - 1; px++) {
        const idx = (py * rw + px) * 4;
        let sumR = 0, sumG = 0, sumB = 0, count = 0;

        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const sidx = ((py + dy) * rw + (px + dx)) * 4;
            sumR += data[sidx];
            sumG += data[sidx + 1];
            sumB += data[sidx + 2];
            count++;
          }
        }

        data[idx] = Math.round(sumR / count);
        data[idx + 1] = Math.round(sumG / count);
        data[idx + 2] = Math.round(sumB / count);
      }
    }

    this.ctx.putImageData(imgData, rx, ry);
  }

  public destroy() {
    this.canvas.remove();
  }
}
