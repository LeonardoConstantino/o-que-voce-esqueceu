export class JumpScareLayer {
  static trigger(sessionCount: number, onComplete: () => void): void {
    const overlay = document.createElement('div');
    overlay.className =
      'fixed inset-0 z-50 pointer-events-none flex items-center justify-center bg-black transition-opacity duration-300';
    overlay.style.backgroundColor = '#121214';

    const intensity =
      sessionCount === 0 ? 'full' : sessionCount < 3 ? 'medium' : 'subtle';

    // Visual flicker element
    const flash = document.createElement('div');
    flash.className = 'w-full h-full flex flex-col items-center justify-center p-8';

    const text = document.createElement('div');
    text.className = 'font-serif text-2xl tracking-widest text-[#E8E1D3] italic opacity-90';
    text.innerText = sessionCount === 0 ? '...o desenho se lembra.' : '...o que você esqueceu.';

    flash.appendChild(text);
    overlay.appendChild(flash);
    document.body.appendChild(overlay);

    // Audio sting
    JumpScareLayer.triggerSound(intensity);

    const duration = intensity === 'full' ? 900 : intensity === 'medium' ? 600 : 350;

    setTimeout(() => {
      overlay.style.opacity = '0';
      setTimeout(() => {
        overlay.remove();
        onComplete();
      }, 300);
    }, duration);
  }

  private static triggerSound(intensity: 'full' | 'medium' | 'subtle'): void {
    try {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtxClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(90, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 0.12);

      const vol = intensity === 'full' ? 0.35 : intensity === 'medium' ? 0.2 : 0.1;
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);

      osc.start();
      osc.stop(ctx.currentTime + 0.75);
    } catch {
      // Audio context might be restricted before gesture
    }
  }
}
