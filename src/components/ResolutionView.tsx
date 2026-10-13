import React from 'react';
import { BossProfile } from '../shared/types/arena';
import { ResolutionScene } from '../arena/ResolutionScene';
import { TOOL_METADATA } from '../shared/types/tools';
import { Sparkles, Trash2, HeartHandshake } from 'lucide-react';

interface ResolutionViewProps {
  bossProfile: BossProfile;
  onChoice: (choice: 'reconcile' | 'destroy') => void;
}

export const ResolutionView: React.FC<ResolutionViewProps> = ({
  bossProfile,
  onChoice,
}) => {
  const { toolName, reconcileText, destroyText } =
    ResolutionScene.getResolutionTexts(bossProfile);

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[85vh] p-6 text-center select-none">
      <div className="w-full bg-[#f0ebd9] rounded-md border border-[#292826]/20 p-8 shadow-xl flex flex-col items-center gap-6">
        {/* Title */}
        <div className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-widest font-serif text-[#657A83]">
            O Confronto Cessou
          </span>
          <h2 className="text-2xl font-serif font-bold text-[#292826]">
            O Destino de {toolName}
          </h2>
        </div>

        {/* Atmosphere description */}
        <p className="text-sm font-serif italic text-[#292826]/80 max-w-md leading-relaxed">
          {bossProfile.deviationType === 'excess'
            ? `Você usou ${toolName} até esgotar o papel. A matéria se desfez, mas a marca permanece.`
            : `Você evitou ${toolName} durante todo o desenho. A ausência cobrou seu peso no combate.`}
        </p>

        <div className="w-16 h-px bg-[#292826]/20 my-1" />

        {/* Choices */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mt-2">
          {/* Reconcile */}
          <button
            id="resolution-reconcile-btn"
            onClick={() => onChoice('reconcile')}
            className="flex flex-col items-center justify-between p-5 rounded border border-[#C79A58]/40 bg-[#ded7c8] hover:bg-[#c9c1b0] hover:border-[#C79A58] transition text-left cursor-pointer group shadow-sm"
          >
            <div className="flex items-center gap-2 mb-3 text-[#634832] font-serif font-semibold text-base">
              <HeartHandshake className="w-5 h-5 text-[#C79A58] group-hover:scale-110 transition-transform" />
              <span>Reconciliar</span>
            </div>
            <p className="text-xs text-[#292826]/80 font-serif leading-relaxed text-center">
              {reconcileText}
            </p>
            <span className="mt-4 text-[10px] uppercase tracking-wider text-[#634832]/70 font-mono">
              [ Conservar Ferramenta ]
            </span>
          </button>

          {/* Destroy */}
          <button
            id="resolution-destroy-btn"
            onClick={() => onChoice('destroy')}
            className="flex flex-col items-center justify-between p-5 rounded border border-[#7A3942]/40 bg-[#ded7c8] hover:bg-[#7A3942]/10 hover:border-[#7A3942] transition text-left cursor-pointer group shadow-sm"
          >
            <div className="flex items-center gap-2 mb-3 text-[#7A3942] font-serif font-semibold text-base">
              <Trash2 className="w-5 h-5 text-[#7A3942] group-hover:scale-110 transition-transform" />
              <span>Destruir</span>
            </div>
            <p className="text-xs text-[#292826]/80 font-serif leading-relaxed text-center">
              {destroyText}
            </p>
            <span className="mt-4 text-[10px] uppercase tracking-wider text-[#7A3942]/70 font-mono">
              [ Perda Permanente ]
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
