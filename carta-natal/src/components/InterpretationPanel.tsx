import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Home, Compass } from 'lucide-react';
import { getEntityInterpretation } from '../services/aiInterpretationService';
import type { AstroEntity } from '../types';

interface InterpretationPanelProps {
  entity: AstroEntity;
  onClose: () => void;
}

/** Returns the appropriate lucide icon for entity type */
function EntityIcon({ type }: { type: AstroEntity['type'] }) {
  switch (type) {
    case 'house':
      return <Home size={20} className="text-amber-600" />;
    case 'angle':
      return <Compass size={20} className="text-amber-600" />;
    case 'planet':
    default:
      return <Sparkles size={20} className="text-amber-600" />;
  }
}

/** Builds the panel header title */
function getEntityTitle(entity: AstroEntity): string {
  if (entity.sign) return `${entity.name} en ${entity.sign}`;
  return entity.name;
}

export default function InterpretationPanel({ entity, onClose }: InterpretationPanelProps) {
  const [text, setText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;
    setIsLoading(true);

    getEntityInterpretation(entity)
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
  }, [entity]);

  return (
    <AnimatePresence>
      {/* Backdrop overlay */}
      <motion.div
        key="interpretation-backdrop"
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Panel */}
      <motion.div
        key="interpretation-panel"
        className="fixed inset-y-0 right-0 z-50 w-full max-w-sm sm:max-w-md flex flex-col bg-white/80 backdrop-blur-2xl border-l border-slate-200/80 shadow-2xl shadow-black/8"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200/60 flex flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <EntityIcon type={entity.type} />
            <h2 className="text-xl font-serif text-amber-700 font-semibold tracking-wide truncate">
              {getEntityTitle(entity)}
            </h2>
          </div>
          <button 
            onClick={onClose} 
            aria-label="Cerrar panel" 
            className="shrink-0 p-2 text-slate-400 hover:text-slate-800 transition-colors cursor-pointer rounded-full hover:bg-slate-100 active:scale-95"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-48 space-y-5">
              {/* Animated skeleton lines */}
              <Sparkles className="animate-spin text-amber-500" size={32} />
              <p className="text-[13px] font-medium tracking-widest uppercase text-slate-400">
                Decodificando alineaciones...
              </p>
              {/* Skeleton pulse blocks */}
              <div className="w-full space-y-3 mt-4">
                <div className="h-3 bg-slate-200/80 rounded-full animate-pulse w-full" />
                <div className="h-3 bg-slate-200/80 rounded-full animate-pulse w-5/6" />
                <div className="h-3 bg-slate-200/80 rounded-full animate-pulse w-4/6" />
                <div className="h-3 bg-slate-200/60 rounded-full animate-pulse w-3/6 mt-4" />
                <div className="h-3 bg-slate-200/60 rounded-full animate-pulse w-full" />
                <div className="h-3 bg-slate-200/60 rounded-full animate-pulse w-5/6" />
              </div>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="prose prose-sm md:prose-base leading-relaxed text-slate-700 [&>p]:text-slate-700 [&>p>strong]:text-amber-600 [&>p>strong]:font-bold [&>h1]:text-slate-800 [&>h2]:text-slate-800 [&>h3]:text-slate-800 [&>h4]:text-slate-800 [&>p>b]:text-amber-600 [&>p>b]:font-bold [&>ul>li]:text-slate-600 [&>ol>li]:text-slate-600"
            >
              <ReactMarkdown>
                {text}
              </ReactMarkdown>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
