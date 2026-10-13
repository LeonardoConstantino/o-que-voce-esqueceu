export class AtelierAmbience {
  private intervalId: number | null = null;
  private shadowLagElement: HTMLElement | null = null;

  constructor(
    private container: HTMLElement,
    private sessionCount: number
  ) {}

  start(): void {
    // If player has played previous sessions, create subtle wall marks or shadow deviations
    if (this.sessionCount > 0) {
      this.createSubtleEnvironmentalMarks();
    }
  }

  private createSubtleEnvironmentalMarks() {
    const mark = document.createElement('div');
    mark.className = 'absolute pointer-events-none opacity-30 select-none transition-opacity duration-1000';
    mark.style.top = '14px';
    mark.style.right = '24px';
    mark.style.fontSize = '11px';
    mark.style.fontFamily = 'serif';
    mark.style.color = '#7A3942';

    if (this.sessionCount === 1) {
      mark.innerText = 'uma marca tênue na madeira...';
    } else if (this.sessionCount === 2) {
      mark.innerText = 'o ateliê parece se lembrar do último traço.';
    } else {
      mark.innerText = `sessão ${this.sessionCount + 1} — as sombras demoram a obedecer.`;
    }

    this.container.appendChild(mark);
  }

  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
