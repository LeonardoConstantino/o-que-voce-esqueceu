const FIXED_STEP_MS = 16.67; // ~60fps fixed logical timestep

export class GameLoop {
  private rafId: number | null = null;
  private lastTime: number = 0;
  private accumulator: number = 0;
  private running: boolean = false;

  constructor(
    private update: (deltaMs: number) => void,
    private render: (alpha: number) => void
  ) {}

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.loop(this.lastTime);
  }

  private loop = (now: number): void => {
    if (!this.running) return;

    const elapsed = Math.min(now - this.lastTime, 100); // Cap elapsed time to prevent spiral of death
    this.lastTime = now;
    this.accumulator += elapsed;

    while (this.accumulator >= FIXED_STEP_MS) {
      this.update(FIXED_STEP_MS);
      this.accumulator -= FIXED_STEP_MS;
    }

    // Alpha for rendering interpolation
    this.render(this.accumulator / FIXED_STEP_MS);
    this.rafId = requestAnimationFrame(this.loop);
  };

  stop(): void {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
}
