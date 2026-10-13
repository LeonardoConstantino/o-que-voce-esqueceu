import React, { useEffect, useRef, useState } from 'react';
import { AtelierScene } from '../atelier/AtelierScene';
import {
  ALL_TOOL_IDS,
  TOOL_METADATA,
  ToolId,
} from '../shared/types/tools';
import { ATELIER_PIGMENTS } from '../shared/utils/color';
import {
  Paintbrush,
  Eraser,
  PaintBucket,
  Slash,
  SprayCan,
  Stamp,
  Hand,
  Undo,
  Trash2,
  Volume2,
  VolumeX,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { audio } from '../shell/AudioManager';

interface AtelierViewProps {
  sessionId: string;
  sessionCount: number;
  destroyedTools: ToolId[];
  onFinishDrawing: () => void;
  onSceneMounted?: (scene: AtelierScene) => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const AtelierView: React.FC<AtelierViewProps> = ({
  sessionId,
  sessionCount,
  destroyedTools,
  onFinishDrawing,
  onSceneMounted,
  isMuted,
  onToggleMute,
}) => {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<AtelierScene | null>(null);
  const [activeTool, setActiveTool] = useState<ToolId>('brush');
  const [activeColor, setActiveColor] = useState<string>(ATELIER_PIGMENTS[0].hex);
  const [brushSize, setBrushSize] = useState<number>(6);
  const [metronomeSeconds, setMetronomeSeconds] = useState<number>(90);

  useEffect(() => {
    if (!canvasContainerRef.current) return;

    const scene = new AtelierScene(
      canvasContainerRef.current,
      sessionId,
      sessionCount,
      destroyedTools
    );

    scene.mount((sec) => {
      setMetronomeSeconds(sec);
    });

    sceneRef.current = scene;
    if (onSceneMounted) {
      onSceneMounted(scene);
    }

    // Default to first non-destroyed tool
    const available = ALL_TOOL_IDS.filter((t) => !destroyedTools.includes(t));
    if (available.length > 0) {
      setActiveTool(available[0]);
      scene.tools.setTool(available[0]);
    }

    return () => {
      scene.destroy();
    };
  }, [sessionId, sessionCount, destroyedTools]);

  const handleSelectTool = (id: ToolId) => {
    if (destroyedTools.includes(id)) return;
    setActiveTool(id);
    if (sceneRef.current) {
      sceneRef.current.tools.setTool(id);
    }
  };

  const handleSelectColor = (hex: string) => {
    setActiveColor(hex);
    if (sceneRef.current) {
      sceneRef.current.tools.setColor(hex);
    }
  };

  const handleSizeChange = (val: number) => {
    setBrushSize(val);
    if (sceneRef.current) {
      sceneRef.current.tools.setSize(val);
    }
  };

  const handleUndo = () => {
    if (sceneRef.current) {
      sceneRef.current.canvas.undo();
    }
  };

  const handleClear = () => {
    if (sceneRef.current) {
      sceneRef.current.canvas.clear();
    }
  };

  const handleFinish = () => {
    if (sceneRef.current) {
      sceneRef.current.finishDrawingManual();
    } else {
      onFinishDrawing();
    }
  };

  const getToolIcon = (id: ToolId) => {
    switch (id) {
      case 'brush':
        return <Paintbrush className="w-4 h-4" />;
      case 'eraser':
        return <Eraser className="w-4 h-4" />;
      case 'fill':
        return <PaintBucket className="w-4 h-4" />;
      case 'line':
        return <Slash className="w-4 h-4" />;
      case 'spray':
        return <SprayCan className="w-4 h-4" />;
      case 'stamp':
        return <Stamp className="w-4 h-4" />;
      case 'smudge':
        return <Hand className="w-4 h-4" />;
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col items-center justify-between min-h-[90vh] py-4 px-2 select-none">
      {/* Header Bar */}
      <div className="w-full flex items-center justify-between border-b border-[#292826]/10 pb-3 mb-3">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-serif text-lg tracking-wider text-[#292826] font-semibold">
              O QUE VOCÊ ESQUECEU
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-[#C79A58]/15 text-[#634832] font-medium">
              Sessão {sessionCount + 1}
            </span>
          </div>
          <p className="text-xs text-[#657A83] italic">
            O papel aguarda. Desenhe livremente antes que o tempo se esgote.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="audio-toggle-btn"
            onClick={onToggleMute}
            className="p-2 rounded border border-[#292826]/15 hover:bg-[#292826]/5 transition text-[#292826]"
            title={isMuted ? 'Desmutar Som' : 'Mutar Som'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            id="finish-drawing-btn"
            onClick={handleFinish}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#292826] hover:bg-[#7A3942] text-[#E8E1D3] text-xs font-serif tracking-wider rounded transition cursor-pointer shadow-sm"
          >
            <span>Concluir Desenho</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Canvas Frame */}
      <div className="relative w-full flex-1 flex items-center justify-center p-2">
        <div className="relative rounded-sm p-3 bg-[#ded7c8] shadow-md border border-[#292826]/15 max-w-[750px] w-full aspect-[4/3] flex items-center justify-center">
          {/* Subtle paper watermark */}
          <div
            ref={canvasContainerRef}
            id="atelier-canvas-container"
            className="w-full h-full rounded overflow-hidden shadow-inner flex items-center justify-center bg-[#E8E1D3]"
          />
        </div>
      </div>

      {/* Controls & Tool Rack */}
      <div className="w-full max-w-4xl mt-3 flex flex-col gap-2.5 bg-[#f0ebd9] p-3 rounded border border-[#292826]/10 shadow-sm">
        {/* Tool Selector */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {ALL_TOOL_IDS.map((id) => {
              const meta = TOOL_METADATA[id];
              const isDestroyed = destroyedTools.includes(id);
              const isActive = activeTool === id;

              if (isDestroyed) {
                return (
                  <div
                    key={id}
                    className="flex items-center gap-1 px-3 py-1.5 rounded border border-dashed border-[#7A3942]/30 bg-[#7A3942]/5 text-[#7A3942]/50 text-xs line-through cursor-not-allowed select-none"
                    title="Esta ferramenta foi destruída em uma sessão anterior e não retornará."
                  >
                    {getToolIcon(id)}
                    <span>{meta.shortName} (Vazia)</span>
                  </div>
                );
              }

              return (
                <button
                  key={id}
                  id={`tool-btn-${id}`}
                  onClick={() => handleSelectTool(id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded font-medium transition cursor-pointer ${
                    isActive
                      ? 'bg-[#292826] text-[#E8E1D3] shadow'
                      : 'bg-[#ded7c8] text-[#292826] hover:bg-[#c9c1b0]'
                  }`}
                  title={`${meta.name} — ${meta.description}`}
                >
                  {getToolIcon(id)}
                  <span>{meta.shortName}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              id="undo-btn"
              onClick={handleUndo}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-[#ded7c8] hover:bg-[#c9c1b0] text-[#292826] rounded transition"
              title="Desfazer último traço"
            >
              <Undo className="w-3.5 h-3.5" />
              <span>Desfazer</span>
            </button>
            <button
              id="clear-btn"
              onClick={handleClear}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-[#ded7c8] hover:bg-[#7A3942] hover:text-[#E8E1D3] text-[#292826] rounded transition"
              title="Limpar papel"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpar</span>
            </button>
          </div>
        </div>

        {/* Pigment & Size Row */}
        <div className="flex items-center justify-between flex-wrap gap-3 pt-2 border-t border-[#292826]/10 text-xs">
          {/* Pigments */}
          <div className="flex items-center gap-2">
            <span className="text-[#657A83] font-serif">Pigmento:</span>
            <div className="flex items-center gap-1.5">
              {ATELIER_PIGMENTS.map((p) => (
                <button
                  key={p.hex}
                  id={`color-btn-${p.hex.replace('#', '')}`}
                  onClick={() => handleSelectColor(p.hex)}
                  className={`w-6 h-6 rounded-full border transition-transform ${
                    activeColor === p.hex
                      ? 'scale-110 border-[#292826] shadow-md ring-2 ring-[#C79A58]'
                      : 'border-black/20 hover:scale-105'
                  }`}
                  style={{ backgroundColor: p.hex }}
                  title={p.name}
                />
              ))}
            </div>
          </div>

          {/* Size slider */}
          <div className="flex items-center gap-2">
            <span className="text-[#657A83] font-serif">Espessura:</span>
            <input
              id="brush-size-slider"
              type="range"
              min="2"
              max="28"
              value={brushSize}
              onChange={(e) => handleSizeChange(Number(e.target.value))}
              className="w-24 accent-[#292826] cursor-pointer"
            />
            <span className="w-5 text-right font-mono text-[#292826]">{brushSize}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
