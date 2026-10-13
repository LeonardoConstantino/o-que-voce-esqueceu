import { CanvasEngine } from './CanvasEngine';
import { ToolManager } from './ToolManager';
import { BehaviorTracker } from './BehaviorTracker';
import { Metronome } from './Metronome';
import { AtelierAmbience } from './AtelierAmbience';
import { bus } from '../shared/EventBus';
import { JumpScareLayer } from '../arena/JumpScareLayer';
import { ToolId } from '../shared/types/tools';
import { audio } from '../shell/AudioManager';

export class AtelierScene {
  public canvas!: CanvasEngine;
  public tools!: ToolManager;
  public tracker!: BehaviorTracker;
  public metronome!: Metronome;
  public ambience!: AtelierAmbience;
  private cleanups: Array<() => void> = [];

  constructor(
    private canvasContainer: HTMLElement,
    private sessionId: string,
    private sessionCount: number,
    private destroyedTools: ToolId[] = []
  ) {}

  public mount(onTick?: (remainingSec: number) => void): void {
    this.canvas = new CanvasEngine(this.canvasContainer, 720, 540);
    this.tools = new ToolManager(this.canvas, this.destroyedTools);
    this.tracker = new BehaviorTracker(this.sessionId);
    this.metronome = new Metronome(this.sessionCount);
    this.ambience = new AtelierAmbience(this.canvasContainer, this.sessionCount);

    this.tracker.start();
    this.ambience.start();
    this.tools.mount();
    audio.startAtelierAmbience();

    const hasJumpScare = this.sessionCount === 0 ? true : Math.random() > 0.4;

    this.metronome.start(
      () => {
        this.handleMetronomeFire(hasJumpScare);
      },
      this.canvas,
      onTick
    );
  }

  public finishDrawingManual(): void {
    const hasJumpScare = this.sessionCount === 0 ? true : Math.random() > 0.5;
    this.metronome.triggerNow(() => {
      this.handleMetronomeFire(hasJumpScare);
    }, this.canvas);
  }

  private handleMetronomeFire(withJumpScare: boolean): void {
    const behavior = this.tracker.collect();
    const snapshot = this.canvas.captureImageData();

    if (withJumpScare) {
      JumpScareLayer.trigger(this.sessionCount, () => {
        bus.emit('atelier:metronome-fires', { canvasSnapshot: snapshot, behavior });
      });
    } else {
      bus.emit('atelier:metronome-fires', { canvasSnapshot: snapshot, behavior });
    }
  }

  public destroy(): void {
    this.metronome.stop();
    this.tracker.destroy();
    this.tools.destroy();
    this.ambience.stop();
    this.canvas.destroy();
    this.cleanups.forEach(fn => fn());
  }
}
