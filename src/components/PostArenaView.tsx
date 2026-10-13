import React from 'react';
import { BehaviorSnapshot } from '../shared/types/behavior';
import { ToolRelation, ALL_TOOL_IDS } from '../shared/types/tools';
import { NarrativeGenerator } from '../postarena/NarrativeGenerator';
import { ToolMirror } from '../postarena/ToolMirror';
import { ArrowRight, RotateCcw, Activity } from 'lucide-react';

interface PostArenaViewProps {
  behavior: BehaviorSnapshot;
  relations: ToolRelation[];
  sessionNumber: number;
  outcome: 'survived' | 'defeated';
  onNextSession: () => void;
  onResetAll?: () => void;
}

export const PostArenaView: React.FC<PostArenaViewProps> = ({
  behavior,
  relations,
  sessionNumber,
  outcome,
  onNextSession,
  onResetAll,
}) => {
  const generator = new NarrativeGenerator();
  const report = generator.generate(behavior, relations, outcome, sessionNumber);

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col items-center justify-center min-h-[90vh] py-6 px-4 select-none">
      <div className="w-full bg-[#f0ebd9] rounded-md border border-[#292826]/20 p-8 shadow-xl flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#292826]/10 pb-4">
          <div>
            <span className="text-[11px] uppercase tracking-widest font-serif text-[#657A83]">
              Relatório Comportamental
            </span>
            <h1 className="text-2xl font-serif font-bold text-[#292826]">
              Autópsia da Sessão {sessionNumber}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 text-xs font-serif rounded ${
                outcome === 'survived'
                  ? 'bg-[#65705A]/15 text-[#65705A]'
                  : 'bg-[#7A3942]/15 text-[#7A3942]'
              }`}
            >
              {outcome === 'survived' ? 'Confronto Superado' : 'Consumido pelo Desenho'}
            </span>
          </div>
        </div>

        {/* Narrative Revelations */}
        <div className="flex flex-col gap-3 bg-[#ded7c8]/60 p-5 rounded border border-[#292826]/10">
          <span className="text-xs uppercase tracking-wider font-serif text-[#634832] font-semibold flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5" />
            <span>Fatos do Traço &amp; Presença</span>
          </span>

          <div className="space-y-2 mt-1">
            {report.lines.map((line, idx) => (
              <p
                key={idx}
                className={`font-serif text-sm leading-relaxed ${
                  line.type === 'haunting'
                    ? 'text-[#7A3942] font-semibold italic text-base pt-2'
                    : line.type === 'pattern'
                    ? 'text-[#634832]'
                    : 'text-[#292826]'
                }`}
              >
                {line.text}
              </p>
            ))}
          </div>
        </div>

        {/* Tool Mirror Graph */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-serif text-[#292826] font-semibold">
              Espelho das Ferramentas (Memória Acumulada)
            </span>
            <span className="text-[11px] text-[#657A83] italic">
              Temperamento vs. Ressentimento
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {relations.map((rel) => {
              const info = ToolMirror.formatRelationStatus(rel);
              return (
                <div
                  key={rel.toolId}
                  className={`p-3 rounded border text-xs flex flex-col justify-between gap-1.5 ${
                    info.isDestroyed
                      ? 'bg-[#7A3942]/5 border-[#7A3942]/20 opacity-60'
                      : 'bg-[#ded7c8] border-[#292826]/15'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-serif font-bold text-[#292826]">
                      {info.name}
                    </span>
                    <span className={`text-[10px] font-medium ${info.statusColor}`}>
                      {info.status}
                    </span>
                  </div>

                  {!info.isDestroyed && (
                    <div className="flex items-center gap-4 text-[10px] text-[#657A83] font-mono mt-1">
                      <div>
                        Excesso:{' '}
                        <span className="text-[#65705A] font-bold">
                          {info.temperament > 0 ? `+${info.temperament}%` : '0%'}
                        </span>
                      </div>
                      <div>
                        Negligência:{' '}
                        <span className="text-[#7A3942] font-bold">
                          {info.resentment > 0 ? `+${info.resentment}%` : '0%'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between border-t border-[#292826]/10 pt-4 mt-2">
          {onResetAll && (
            <button
              id="reset-history-btn"
              onClick={onResetAll}
              className="flex items-center gap-1 text-xs text-[#657A83] hover:text-[#7A3942] transition cursor-pointer"
              title="Reiniciar memória e ferramentas"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reiniciar Memória</span>
            </button>
          )}

          <button
            id="next-session-btn"
            onClick={onNextSession}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#292826] hover:bg-[#7A3942] text-[#E8E1D3] rounded font-serif text-sm tracking-wider shadow transition cursor-pointer ml-auto"
          >
            <span>Retornar ao Ateliê — Sessão {sessionNumber + 1}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
