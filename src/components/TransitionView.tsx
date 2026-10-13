import React, { useEffect, useState } from 'react';

interface TransitionViewProps {
  onComplete: () => void;
  bossToolName?: string;
}

export const TransitionView: React.FC<TransitionViewProps> = ({
  onComplete,
  bossToolName = 'A Ferramenta',
}) => {
  const [step, setStep] = useState<number>(1);

  useEffect(() => {
    const t1 = setTimeout(() => setStep(2), 1200);
    const t2 = setTimeout(() => setStep(3), 2600);
    const t3 = setTimeout(() => onComplete(), 4200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-[#121214] text-[#E8E1D3] flex flex-col items-center justify-center p-8 select-none z-50">
      <div className="max-w-xl text-center space-y-6">
        {step === 1 && (
          <p className="font-serif text-lg text-[#E8E1D3]/80 italic transition-opacity duration-700 animate-fade-in">
            Os traços no papel ganham profundidade...
          </p>
        )}

        {step === 2 && (
          <p className="font-serif text-xl text-[#C79A58] italic transition-opacity duration-700 animate-fade-in">
            A textura do papel se expande e se torna espaço.
          </p>
        )}

        {step === 3 && (
          <div className="space-y-2 transition-opacity duration-700 animate-fade-in">
            <p className="font-serif text-2xl text-[#E8E1D3] font-bold">
              Você não entrou em outro mundo.
            </p>
            <p className="font-serif text-lg text-[#7A3942] italic">
              Você entrou no que acabou de fazer.
            </p>
          </div>
        )}

        <div className="w-24 h-0.5 bg-[#7A3942]/40 mx-auto mt-8 animate-pulse" />
      </div>
    </div>
  );
};
