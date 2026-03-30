import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { X, Loader2 } from 'lucide-react';
import { getPlanetInterpretation } from '../services/aiInterpretationService';
import type { PlanetPosition } from '../types';

interface InterpretationPanelProps {
  planet: PlanetPosition;
  onClose: () => void;
}

export default function InterpretationPanel({ planet, onClose }: InterpretationPanelProps) {
  const [text, setText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;
    setIsLoading(true);

    getPlanetInterpretation(planet.name, planet.sign, planet.house)
      .then((res) => {
        if (active) {
          setText(res);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setText("Error al consultar a los astros.");
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [planet]);

  // Subtle enter animation using Tailwind custom values or standard utility classes.
  // We use fixed overlay & centered modal for desktop, side-over for mobile, or just slide-over right.
  // The glassmorphic aesthetic is requested: bg-stone-900/90, backdrop-blur-md, border-yellow-600/30, soft shadow.
  return (
    <>
      <div 
        className="fixed inset-0 z-40 bg-stone-900/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
        aria-hidden="true" 
      />
      
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm sm:max-w-md flex flex-col bg-stone-900/90 backdrop-blur-md border-l border-yellow-600/30 shadow-2xl animate-[slideInRight_400ms_ease-out] will-change-transform translate-x-0 !transition-transform !duration-500">
        <div className="px-6 py-5 border-b border-yellow-600/20 flex flex-row items-center justify-between">
          <h2 className="text-xl font-serif text-yellow-500 font-semibold tracking-wide">
            {planet.name} en {planet.sign}
          </h2>
          <button 
            onClick={onClose} 
            aria-label="Cerrar panel" 
            className="p-2 text-stone-400 hover:text-stone-200 transition-colors cursor-pointer rounded-full hover:bg-white/5 active:scale-95"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-48 space-y-4 text-stone-300">
              <Loader2 className="animate-spin text-yellow-600" size={32} />
              <p className="text-[13px] font-medium tracking-widest uppercase opacity-80">
                Consultando a los astros...
              </p>
            </div>
          ) : (
            <div className="animate-[fadeIn_500ms_ease-out] prose prose-invert prose-yellow prose-sm md:prose-base leading-relaxed text-stone-300 [&>p>strong]:text-yellow-500 [&>p>strong]:font-semibold">
              <ReactMarkdown>
                {text}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
