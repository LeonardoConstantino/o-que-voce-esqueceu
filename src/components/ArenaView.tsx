import React, { useEffect, useRef, useState } from 'react';
import { ArenaMap } from '../shared/types/arena';
import { ArenaScene } from '../arena/ArenaScene';
import { TOOL_METADATA } from '../shared/types/tools';
import { Volume2, VolumeX, Shield, Heart } from 'lucide-react';

interface ArenaViewProps {
  arenaMap: ArenaMap;
  onBossDefeated: () => void;
  onPlayerDefeated: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const ArenaView: React.FC<ArenaViewProps> = ({
  arenaMap,
  onBossDefeated,
  onPlayerDefeated,
  isMuted,
  onToggleMute,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<ArenaScene | null>(null);

  const [playerHp, setPlayerHp] = useState<number>(100);
  const [bossHp, setBossHp] = useState<number>(100);
  const [bossPhase, setBossPhase] = useState<number>(1);

  const bossMeta = TOOL_METADATA[arenaMap.bossProfile.toolId];
  const bossName = bossMeta ? bossMeta.name : arenaMap.bossProfile.toolId;

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new ArenaScene(
      containerRef.current,
      arenaMap,
      () => {
        onBossDefeated();
      },
      () => {
        onPlayerDefeated();
      }
    );

    scene.mount();
    sceneRef.current = scene;

    // Periodic state sync for HUD
    const interval = setInterval(() => {
      if (sceneRef.current) {
        setPlayerHp(Math.max(0, sceneRef.current.player.hp));
        if (sceneRef.current.boss) {
          const b = sceneRef.current.boss;
          const ratio = (b.hp / b.maxHp) * 100;
          setBossHp(Math.max(0, ratio));
          setBossPhase(b.phase);
        }
      }
    }, 100);

    return () => {
      clearInterval(interval);
      scene.destroy();
    };
  }, [arenaMap, onBossDefeated, onPlayerDefeated]);

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col items-center justify-between min-h-[92vh] py-3 px-2 select-none">
      {/* Top HUD */}
      <div className="w-full flex items-center justify-between border-b border-[#292826]/10 pb-2 mb-2">
        {/* Player Vitality */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-serif font-semibold text-[#292826]">
            <Heart className="w-4 h-4 text-[#7A3942] fill-[#7A3942]" />
            <span>Estilete</span>
          </div>
          <div className="w-36 h-3 bg-[#292826]/15 rounded-full overflow-hidden p-0.5 border border-[#292826]/20">
            <div
              className="h-full bg-[#7A3942] rounded-full transition-all duration-200"
              style={{ width: `${playerHp}%` }}
            />
          </div>
          <span className="text-xs font-mono text-[#292826]">{Math.round(playerHp)} HP</span>
        </div>

        {/* Boss Status */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2">
            <span className="font-serif text-xs font-bold text-[#7A3942] tracking-wider uppercase">
              {bossName}
            </span>
            <span className="text-[10px] px-1.5 py-0.2 bg-[#7A3942]/10 text-[#7A3942] rounded">
              Fase {bossPhase}
            </span>
          </div>
          <div className="w-48 h-2 bg-[#292826]/15 rounded-full overflow-hidden mt-1">
            <div
              className="h-full bg-[#7A3942] rounded-full transition-all duration-200"
              style={{ width: `${bossHp}%` }}
            />
          </div>
        </div>

        {/* Sound toggle */}
        <div>
          <button
            id="arena-audio-toggle"
            onClick={onToggleMute}
            className="p-1.5 rounded border border-[#292826]/15 hover:bg-[#292826]/5 transition text-[#292826]"
            title={isMuted ? 'Desmutar Som' : 'Mutar Som'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Arena Canvas Container */}
      <div className="relative w-full flex-1 flex items-center justify-center p-1">
        <div
          ref={containerRef}
          id="arena-canvas-container"
          className="relative max-w-[800px] w-full aspect-[4/3] rounded shadow-xl overflow-hidden bg-[#121214] border-2 border-[#292826]/30 flex items-center justify-center"
        />
      </div>

      {/* Control Footer Hints */}
      <div className="w-full max-w-4xl mt-2 flex items-center justify-between text-xs text-[#657A83] font-serif px-3 py-1.5 bg-[#f0ebd9] rounded border border-[#292826]/10">
        <div className="flex items-center gap-4">
          <span>
            <strong className="text-[#292826]">WASD / Setas:</strong> Mover
          </span>
          <span>
            <strong className="text-[#292826]">Mouse:</strong> Mirar &amp; Cortar (Esq.)
          </span>
          <span>
            <strong className="text-[#292826]">Espaço / Dir.:</strong> Esquiva (Dash)
          </span>
        </div>
        <div className="text-[11px] italic text-[#7A3942]">
          {arenaMap.bossProfile.deviationType === 'excess'
            ? 'O excesso do seu traço ganhou forma.'
            : 'O vazio que você evitou cobra sua presença.'}
        </div>
      </div>
    </div>
  );
};
