import { bus } from '../shared/EventBus';

export interface QueuedDialogue {
  text: string;
  durationMs: number;
  speaker: string;
}

export class DialogueSystem {
  private queueList: QueuedDialogue[] = [];
  public current: QueuedDialogue | null = null;
  private currentExpiresAt: number = 0;

  queue(text: string, durationMs: number = 4000, speaker: string = 'Boss'): void {
    this.queueList.push({ text, durationMs, speaker });
  }

  update(now: number): void {
    if (this.current && now > this.currentExpiresAt) {
      this.current = null;
    }

    if (!this.current && this.queueList.length > 0) {
      this.current = this.queueList.shift()!;
      this.currentExpiresAt = now + this.current.durationMs;
      bus.emit('arena:dialogue', {
        text: this.current.text,
        durationMs: this.current.durationMs,
        speaker: this.current.speaker,
      });
    }
  }

  clear(): void {
    this.queueList = [];
    this.current = null;
  }
}
