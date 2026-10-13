import { CanvasEngine } from './CanvasEngine';
import { bus } from '../shared/EventBus';
import { BehaviorSnapshot } from '../shared/types/behavior';

export class Metronome {
  private timerId: number | null = null;
  private intervalId: number | null = null;
  private readonly DURATION_MS = 90_000;
  private remainingMs: number = 90_000;
  private onTickCallback?: (remainingSec: number) => void;

  constructor(private sessionCount: number) {
    const jitter = sessionCount > 1 ? (Math.random() - 0.5) * 16_000 : 0;
    this.remainingMs = Math.max(30_000, this.DURATION_MS + jitter);
  }

  start(onFire: () => void, canvasEngine: CanvasEngine, onTick?: (sec: number) => void): void {
    this.onTickCallback = onTick;
    const startTime = Date.now();
    const targetDuration = this.remainingMs;

    this.intervalId = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const left = Math.max(0, Math.ceil((targetDuration - elapsed) / 1000));
      if (this.onTickCallback) {
        this.onTickCallback(left);
      }
    }, 1000);

    this.timerId = window.setTimeout(() => {
      this.fire(onFire, canvasEngine);
    }, targetDuration);
  }

  public triggerNow(onFire: () => void, canvasEngine: CanvasEngine) {
    this.fire(onFire, canvasEngine, true);
  }

  private fire(onFire: () => void, _canvasEngine: CanvasEngine, _isManual = false) {
    this.stop();
    onFire();
  }

  stop(): void {
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
