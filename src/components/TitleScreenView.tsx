import React, { useEffect, useState, useRef, useCallback } from 'react';
import { audio } from '../shell/AudioManager';
import { ToolId, TOOL_METADATA } from '../shared/types/tools';
import { Volume2, VolumeX, RotateCcw, X, Info, Sparkles } from 'lucide-react';

interface TitleScreenViewProps {
  sessionCount: number;
  destroyedTools: ToolId[];
  onStartGame: () => void;
  onResetMemory: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const TitleScreenView: React.FC<TitleScreenViewProps> = ({
  sessionCount,
  destroyedTools,
  onStartGame,
  onResetMemory,
  isMuted,
  onToggleMute,
}) => {
  // Reveal menu only after 4.8 seconds of solitary room atmosphere
  const [menuVisible, setMenuVisible] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);

  // Subtle reality glitches
  const [lampFlicker, setLampFlicker] = useState(false);
  const [toolShift, setToolShift] = useState(false);
  const [canvasZoom, setCanvasZoom] = useState(false);
  const [strokeDrawn, setStrokeDrawn] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const idleTimerRef = useRef<number | null>(null);

  // Start atmospheric title sound on mount
  useEffect(() => {
    audio.startTitleAmbience(sessionCount);

    const revealTimer = window.setTimeout(() => {
      setMenuVisible(true);
    }, 4600);

    return () => {
      clearTimeout(revealTimer);
      audio.stopAmbience();
    };
  }, [sessionCount]);

  // Idle tracking for micro-glitches ("Eu vi isso?")
  useEffect(() => {
    let timeout: number;

    const scheduleIdleGlitches = () => {
      const delay = 9000 + Math.random() * 8000;
      timeout = window.setTimeout(() => {
        // Subtle lamp flicker
        setLampFlicker(true);
        setTimeout(() => setLampFlicker(false), 120);

        // Tool micro-shift
        if (Math.random() > 0.4) {
          setToolShift((prev) => !prev);
        }

        scheduleIdleGlitches();
      }, delay);
    };

    scheduleIdleGlitches();

    return () => {
      clearTimeout(timeout);
    };
  }, []);

  const handleStart = useCallback(() => {
    if (isStarting) return;
    setIsStarting(true);
    audio.playPencilTouch();

    // Animate pencil touching paper, stroke drawing itself, then zooming in
    setTimeout(() => {
      setStrokeDrawn(true);
    }, 250);

    setTimeout(() => {
      setCanvasZoom(true);
    }, 600);

    setTimeout(() => {
      onStartGame();
    }, 1600);
  }, [isStarting, onStartGame]);

  // Chair narrative positioning based on session count
  // Session 0: chair pushed back and empty
  // Session 1: closer
  // Session 2: turned 14 degrees
  // Session 3+: right in front of canvas
  const getChairTransform = () => {
    if (sessionCount === 0) return 'translate-y-12 rotate-[-4deg] opacity-75';
    if (sessionCount === 1) return 'translate-y-7 rotate-[-1deg] opacity-85';
    if (sessionCount === 2) return 'translate-y-3 rotate-[12deg] opacity-90';
    return 'translate-y-0 rotate-[0deg] opacity-95';
  };

  const allToolsList: ToolId[] = ['brush', 'eraser', 'fill', 'line', 'spray', 'stamp', 'smudge'];

  return (
    <div
      ref={containerRef}
      id="title-screen-container"
      className={`relative w-full h-screen overflow-hidden select-none bg-[#1C1814] text-[#E0D8C8] flex items-center justify-center font-serif transition-transform duration-1000 ease-out ${
        canvasZoom ? 'scale-[2.4] opacity-0' : 'scale-100 opacity-100'
      }`}
      style={{
        cursor: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none'><path d='M3 21l3.5-1 12-12-2.5-2.5-12 12-1 3.5z' fill='%23C2B49D' stroke='%233A332C' stroke-width='1.5'/><path d='M3 21l1.5-4 2.5 2.5-4 1.5z' fill='%23221E19'/><circle cx='3.5' cy='20.5' r='1' fill='%23111'/></svg>\") 3 21, crosshair",
      }}
    >
      {/* --- AMBIENT DESK & ROOM LIGHTING --- */}
      {/* Deep wood grain background texture */}
      <div
        className="absolute inset-0 opacity-45 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(ellipse at 78% 22%, rgba(245, 215, 160, 0.22) 0%, rgba(200, 165, 110, 0.08) 42%, transparent 75%),
            radial-gradient(ellipse at 25% 75%, rgba(0, 0, 0, 0.6) 0%, transparent 70%),
            linear-gradient(135deg, #1C1814 0%, #2A221B 50%, #171411 100%)
          `,
        }}
      />

      {/* Desk Lamp Glow */}
      <div
        className={`absolute top-0 right-12 md:right-28 w-[520px] h-[520px] rounded-full pointer-events-none transition-opacity duration-75 ${
          lampFlicker ? 'opacity-30' : 'opacity-85'
        }`}
        style={{
          background: 'radial-gradient(circle, rgba(255, 238, 195, 0.16) 0%, rgba(230, 190, 130, 0.05) 50%, transparent 80%)',
        }}
      />

      {/* Floating dust motes in the lamp light */}
      <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
        <div className="w-1.5 h-1.5 rounded-full bg-[#EADCC5] absolute top-1/4 right-1/3 animate-pulse duration-1000" />
        <div className="w-1 h-1 rounded-full bg-[#EADCC5] absolute top-1/3 right-1/4 animate-pulse duration-700" />
        <div className="w-1 h-1 rounded-full bg-[#EADCC5] absolute top-1/2 left-1/3 animate-pulse duration-1000" />
      </div>

      {/* --- DESK SURFACE CONTENT (Cinematic 70% Environment) --- */}
      <div className="relative w-full max-w-5xl h-full max-h-[820px] flex flex-col items-center justify-between p-6 md:p-10 pointer-events-auto">
        
        {/* TOP: Subtle Title & Status */}
        <div className="w-full flex flex-col items-center pt-2 z-10">
          <div className="text-center tracking-[0.28em] font-serif uppercase">
            <span className="block text-xs md:text-sm text-[#8C7E6D] mb-1 font-light tracking-[0.35em]">
              O QUE
            </span>
            <span className="block text-xl md:text-2xl font-normal text-[#C8B89E] relative">
              VOCÊ ES
              {/* Subtle typographic flaw in "QUECEU" */}
              <span className="inline-block transition-transform duration-300 transform -translate-y-px opacity-90">
                Q
              </span>
              UECEU
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#8C7E6D] opacity-40 ml-1.5 align-middle" />
            </span>
          </div>

          {/* Session 5+ subtle handwritten note */}
          {sessionCount >= 4 && (
            <div className="mt-2 text-xs italic tracking-widest text-[#7D7060] font-serif animate-fade-in">
              você voltou
            </div>
          )}
        </div>

        {/* CENTER: THE DESK, CANVAS & TOOLS (20% Canvas) */}
        <div className="relative w-full flex items-center justify-center my-auto py-4">
          
          {/* SPREAD OF TOOLS ON THE WOODEN DESK */}
          <div className="absolute inset-0 flex items-center justify-between pointer-events-none px-4 md:px-12">
            {/* Left side tools */}
            <div className="flex flex-col gap-8 md:gap-12 items-center">
              {allToolsList.slice(0, 3).map((toolId, idx) => {
                const isDestroyed = destroyedTools.includes(toolId);
                const isWet = toolId === 'brush' && sessionCount === 0; // Fresh glistening ink on brush
                const meta = TOOL_METADATA[toolId];

                return (
                  <div
                    key={toolId}
                    id={`title-tool-${toolId}`}
                    title={meta.name}
                    className={`relative flex items-center justify-center w-12 h-12 md:w-16 md:h-16 transition-all duration-700 ${
                      toolShift && idx === 1 ? 'translate-x-1 -translate-y-0.5' : ''
                    }`}
                  >
                    {isDestroyed ? (
                      // Ghostly dust imprint of destroyed tool
                      <div className="w-10 h-10 border border-dashed border-[#5A4F43]/40 rounded-sm flex items-center justify-center opacity-30">
                        <span className="text-[10px] text-[#7A6B5B] font-mono">{idx + 1}</span>
                      </div>
                    ) : (
                      // Tactile tool presentation
                      <div className="relative group p-2 bg-[#251F19]/60 border border-[#42372B]/60 rounded-md shadow-md">
                        <div className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center text-[#B0A089]">
                          {toolId === 'brush' && (
                            <svg className="w-6 h-6 stroke-current fill-none" viewBox="0 0 24 24" strokeWidth="1.5">
                              <path d="M18.375 2.625a3.875 3.875 0 0 0-5.48 0L3.5 12v4.5h4.5l9.395-9.395a3.875 3.875 0 0 0 0-5.48z" />
                              <path d="M3.5 16.5c.5 1.5 2 3.5 4.5 3.5 3 0 4-2 4-2" />
                            </svg>
                          )}
                          {toolId === 'eraser' && (
                            <svg className="w-6 h-6 stroke-current fill-none" viewBox="0 0 24 24" strokeWidth="1.5">
                              <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
                              <path d="M22 21H7" />
                              <path d="m5 11 9 9" />
                            </svg>
                          )}
                          {toolId === 'fill' && (
                            <svg className="w-6 h-6 stroke-current fill-none" viewBox="0 0 24 24" strokeWidth="1.5">
                              <path d="m19 11-8-8-8.6 8.6a2 2 0 0 0 0 2.8l5.2 5.2c.8.8 2 .8 2.8 0L19 11Z" />
                              <path d="m5 2 5 5" />
                              <path d="M2 13h15" />
                              <path d="M22 20a2 2 0 1 1-4 0c0-1.6 1.7-2.4 2-4 .3 1.6 2 2.4 2 4Z" />
                            </svg>
                          )}
                        </div>

                        {/* Wet sheen on brush tip */}
                        {isWet && (
                          <span
                            className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#181614] border border-[#756551] shadow-sm animate-pulse"
                            title="Tinta fresca..."
                          />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Right side tools */}
            <div className="flex flex-col gap-8 md:gap-12 items-center">
              {allToolsList.slice(3, 7).map((toolId, idx) => {
                const isDestroyed = destroyedTools.includes(toolId);
                const meta = TOOL_METADATA[toolId];

                return (
                  <div
                    key={toolId}
                    id={`title-tool-${toolId}`}
                    title={meta.name}
                    className={`relative flex items-center justify-center w-12 h-12 md:w-16 md:h-16 transition-all duration-700 ${
                      toolShift && idx === 0 ? '-translate-x-1 translate-y-0.5' : ''
                    }`}
                  >
                    {isDestroyed ? (
                      <div className="w-10 h-10 border border-dashed border-[#5A4F43]/40 rounded-sm flex items-center justify-center opacity-30">
                        <span className="text-[10px] text-[#7A6B5B] font-mono">{idx + 4}</span>
                      </div>
                    ) : (
                      <div className="relative group p-2 bg-[#251F19]/60 border border-[#42372B]/60 rounded-md shadow-md">
                        <div className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center text-[#B0A089]">
                          {toolId === 'line' && (
                            <svg className="w-6 h-6 stroke-current fill-none" viewBox="0 0 24 24" strokeWidth="1.5">
                              <path d="M5 19 19 5" />
                              <circle cx="5" cy="19" r="1.5" />
                              <circle cx="19" cy="5" r="1.5" />
                            </svg>
                          )}
                          {toolId === 'spray' && (
                            <svg className="w-6 h-6 stroke-current fill-none" viewBox="0 0 24 24" strokeWidth="1.5">
                              <path d="M3 3h.01M7 5h.01M11 7h.01M3 7h.01M7 9h.01M3 11h.01M15 5h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
                              <path d="m13 9 2-2" />
                            </svg>
                          )}
                          {toolId === 'stamp' && (
                            <svg className="w-6 h-6 stroke-current fill-none" viewBox="0 0 24 24" strokeWidth="1.5">
                              <path d="M5 22h14" />
                              <path d="M19.27 13.73A2.5 2.5 0 0 0 17.5 13h-11A2.5 2.5 0 0 0 4.73 13.73L3 17h18l-1.73-3.27Z" />
                              <path d="M12 13V2" />
                            </svg>
                          )}
                          {toolId === 'smudge' && (
                            <svg className="w-6 h-6 stroke-current fill-none" viewBox="0 0 24 24" strokeWidth="1.5">
                              <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
                              <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" />
                              <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
                              <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
                            </svg>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* THE CANVAS (Paper Resting on the Desk) */}
          <div
            id="title-canvas-paper"
            onClick={menuVisible ? handleStart : undefined}
            className={`relative w-[310px] sm:w-[420px] md:w-[480px] h-[210px] sm:h-[280px] md:h-[320px] bg-[#FAF7F0] rounded-sm shadow-2xl transition-all duration-700 flex flex-col items-center justify-center p-6 border border-[#D1C6B4] cursor-pointer group ${
              isStarting ? 'ring-2 ring-[#705E4D]' : 'hover:shadow-[0_20px_50px_rgba(0,0,0,0.6)]'
            }`}
            style={{
              boxShadow: '0 15px 35px rgba(0,0,0,0.55), 0 2px 6px rgba(0,0,0,0.4)',
            }}
          >
            {/* Paper Texture Overlay */}
            <div
              className="absolute inset-0 opacity-15 pointer-events-none rounded-sm"
              style={{
                backgroundImage: 'radial-gradient(#8C7E6D 1px, transparent 1px)',
                backgroundSize: '8px 8px',
              }}
            />

            {/* THE ENIGMATIC CANVAS MARK (Evolves with sessions) */}
            <div className="relative w-full h-full flex items-center justify-center">
              {sessionCount === 0 && (
                // Session 0: A single, tiny, enigmatic dot on paper
                <div className="relative">
                  <span
                    className={`block w-2 h-2 rounded-full bg-[#292623] transition-all duration-500 ${
                      strokeDrawn ? 'scale-[1.8] bg-[#141210]' : 'opacity-80'
                    }`}
                  />
                  {strokeDrawn && (
                    <svg
                      className="absolute top-1 left-1 w-32 h-20 -translate-y-2 pointer-events-none stroke-[#292623] fill-none stroke-[2]"
                      viewBox="0 0 120 80"
                    >
                      <path
                        d="M0 0 Q 30 -15, 60 10 T 110 30"
                        strokeDasharray="140"
                        strokeDashoffset="0"
                        className="animate-[dash_0.8s_ease-out_forwards]"
                      />
                    </svg>
                  )}
                </div>
              )}

              {sessionCount === 1 && (
                // Session 1: A faint smudge
                <div className="w-6 h-3 rounded-full bg-[#4A433A]/20 blur-[1px] rotate-12" />
              )}

              {sessionCount === 2 && (
                // Session 2: Resíduo de grafite apagado
                <div className="relative">
                  <div className="w-8 h-4 rounded-sm border border-dashed border-[#8A7F73]/30 rotate-[-8deg]" />
                  <div className="w-2 h-2 rounded-full bg-[#594E43]/40 absolute top-1 right-2" />
                </div>
              )}

              {sessionCount >= 3 && (
                // Session 3+: Residual memory contour
                <div className="w-16 h-10 border-b border-r border-[#6B5F52]/30 rounded-br-2xl rotate-[3deg] opacity-60" />
              )}
            </div>

            {/* Subtle pencil touching hint on hover */}
            <div className="absolute bottom-3 text-[10px] text-[#A69785] tracking-widest uppercase font-mono opacity-0 group-hover:opacity-60 transition-opacity">
              tocar o papel
            </div>
          </div>
        </div>

        {/* BOTTOM: THE CHAIR & MINIMALIST MENU (10% Interface) */}
        <div className="w-full flex flex-col items-center pb-4 z-10">
          
          {/* THE CHAIR (Narrative presence) */}
          <div
            id="title-chair-presence"
            className={`w-28 h-10 border-t-2 border-[#544638] rounded-t-xl bg-[#2B231B]/40 flex items-center justify-center mb-6 transition-all duration-1000 ${getChairTransform()}`}
            title="A cadeira vazia..."
          >
            <div className="w-16 h-1 bg-[#4A3E31] rounded-full opacity-60" />
          </div>

          {/* THE DELAYED HANDWRITTEN MENU */}
          <div
            id="title-menu-actions"
            className={`flex flex-col items-center gap-3 tracking-[0.25em] lowercase font-serif transition-all duration-1000 ${
              menuVisible ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'
            }`}
          >
            {/* START / RETURN BUTTON */}
            <button
              id="title-btn-start"
              onClick={handleStart}
              onMouseEnter={() => {
                setHoveredOption('start');
                audio.playPencilTouch();
              }}
              onMouseLeave={() => setHoveredOption(null)}
              className="relative text-base md:text-lg text-[#EDE6D8] hover:text-[#FFFFFF] py-1 px-4 transition-colors font-light group"
            >
              {sessionCount === 0 ? 'começar' : 'voltar'}

              {/* Micro-graphite mark drawn underneath when hovering */}
              <span
                className={`absolute bottom-0 left-2 right-2 h-0.5 bg-[#C9BAA2] transition-all duration-300 ${
                  hoveredOption === 'start' ? 'opacity-90 scale-x-100' : 'opacity-0 scale-x-0'
                }`}
              />
            </button>

            {/* OPTIONS BUTTON */}
            <button
              id="title-btn-options"
              onClick={() => {
                setShowOptions(true);
                audio.playPencilTouch();
              }}
              onMouseEnter={() => {
                setHoveredOption('options');
              }}
              onMouseLeave={() => setHoveredOption(null)}
              className="relative text-xs md:text-sm text-[#948777] hover:text-[#D5C9B8] py-0.5 px-3 transition-colors group"
            >
              opções
              <span
                className={`absolute bottom-0 left-2 right-2 h-[1px] bg-[#948777] transition-all duration-300 ${
                  hoveredOption === 'options' ? 'opacity-70 scale-x-100' : 'opacity-0 scale-x-0'
                }`}
              />
            </button>

            {/* RESET MEMORY (Discreet, if past session 0) */}
            {sessionCount > 0 && (
              <button
                id="title-btn-reset-trigger"
                onClick={() => setShowResetConfirm(true)}
                onMouseEnter={() => setHoveredOption('reset')}
                onMouseLeave={() => setHoveredOption(null)}
                className="relative text-[11px] text-[#695E52] hover:text-[#9C8F80] py-0.5 px-2 transition-colors mt-1"
              >
                esquecer tudo
                <span
                  className={`absolute bottom-0 left-1 right-1 h-[1px] bg-[#695E52] transition-all duration-300 ${
                    hoveredOption === 'reset' ? 'opacity-50 scale-x-100' : 'opacity-0 scale-x-0'
                  }`}
                />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* --- MUTE QUICK TOGGLE (Bottom corner) --- */}
      <button
        id="title-mute-btn"
        onClick={onToggleMute}
        className="absolute bottom-4 right-4 p-2 text-[#7A6E5E] hover:text-[#D1C5B2] transition-colors z-20 rounded-md focus:outline-none"
        title={isMuted ? 'Desmutar Som' : 'Mutar Som'}
      >
        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
      </button>

      {/* --- OPTIONS MODAL (Subtle Archival Card) --- */}
      {showOptions && (
        <div
          id="title-options-modal"
          className="fixed inset-0 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
          onClick={() => setShowOptions(false)}
        >
          <div
            className="bg-[#241E18] border border-[#4A3F33] text-[#D8CEBF] rounded-md p-6 md:p-8 max-w-md w-full shadow-2xl space-y-6 font-serif relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowOptions(false)}
              className="absolute top-4 right-4 text-[#8C7E6D] hover:text-[#E8DEC0] p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-lg tracking-widest text-[#E8DFC8] uppercase border-b border-[#3D3328] pb-2 font-light">
                Caderno de Opções
              </h3>
              <p className="text-xs text-[#8C7E6D] mt-1 italic">
                Ajustes do ateliê e da ressonância acústica.
              </p>
            </div>

            <div className="space-y-4 text-sm">
              {/* Audio toggle */}
              <div className="flex items-center justify-between py-2 border-b border-[#3D3328]/60">
                <span className="text-[#C4B7A4]">Som e Ressonância:</span>
                <button
                  onClick={onToggleMute}
                  className={`px-3 py-1 text-xs uppercase tracking-wider rounded border transition-colors ${
                    isMuted
                      ? 'border-[#5A4D3E] text-[#8C7E6D] bg-[#1A1612]'
                      : 'border-[#8C7B67] text-[#EDE4D5] bg-[#332A21]'
                  }`}
                >
                  {isMuted ? 'Silenciado' : 'Ativo'}
                </button>
              </div>

              {/* Memory info */}
              <div className="flex items-center justify-between py-2 border-b border-[#3D3328]/60">
                <span className="text-[#C4B7A4]">Sessões Lembradas:</span>
                <span className="font-mono text-xs text-[#B3A490]">
                  {sessionCount} {sessionCount === 1 ? 'sessão' : 'sessões'}
                </span>
              </div>

              {/* Controls guide */}
              <div className="pt-2 text-xs text-[#9E907E] space-y-1.5 font-sans">
                <p className="font-serif text-[#C4B7A4] text-sm">Como interagir:</p>
                <p>• <strong>Ateliê:</strong> Desenhe livremente com as 7 ferramentas (teclas 1 a 7).</p>
                <p>• <strong>Metrônomo:</strong> O tempo conta silenciosamente a cada traço.</p>
                <p>• <strong>Arena:</strong> WASD para mover, Mouse para mirar e disparar.</p>
                <p>• <strong>Memória:</strong> As ferramentas observam e se lembram de você.</p>
              </div>
            </div>

            <div className="pt-2 text-center">
              <button
                onClick={() => setShowOptions(false)}
                className="text-xs tracking-widest uppercase text-[#A89A86] hover:text-[#EDE4D5] transition-colors py-1 px-4 border border-[#473B2F] rounded"
              >
                fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- RESET MEMORY CONFIRMATION DIALOG --- */}
      {showResetConfirm && (
        <div
          id="title-reset-modal"
          className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
          onClick={() => setShowResetConfirm(false)}
        >
          <div
            className="bg-[#241E18] border border-[#5E3B35] text-[#D8CEBF] rounded-md p-6 max-w-sm w-full shadow-2xl space-y-5 font-serif text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="text-base tracking-widest text-[#E6B4A8] uppercase font-light">
              Apagar Toda a Memória?
            </h4>
            <p className="text-xs text-[#A89886] leading-relaxed">
              Todas as relações com as ferramentas, feridas de combate e sessões acumuladas serão esquecidas pelo ateliê.
            </p>

            <div className="flex items-center justify-center gap-4 pt-2">
              <button
                onClick={() => {
                  onResetMemory();
                  setShowResetConfirm(false);
                }}
                className="text-xs tracking-wider uppercase bg-[#4A2621] hover:bg-[#632E27] text-[#FAD5CF] py-1.5 px-4 rounded transition-colors"
              >
                Sim, esquecer
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="text-xs tracking-wider uppercase border border-[#473B2F] text-[#B0A18E] hover:text-[#EDE4D5] py-1.5 px-4 rounded transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
