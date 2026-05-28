import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Image as ImageIcon, Download, RefreshCw } from 'lucide-react';

interface Generation {
  id: string;
  prompt: string;
  imageUrl: string;
  enhancedPrompt?: string;
  agents?: {
    writer: string;
    director: string;
  };
}

const CinematicStudio: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentGeneration, setCurrentGeneration] = useState<Generation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<'idle' | 'writer' | 'director' | 'editor'>('idle');

  const suggestions = [
    "Serene sunrise over misty mountain peaks, golden hour, anamorphic lens",
    "Lone samurai standing in pouring rain at dusk, dramatic side lighting",
    "Futuristic neon Tokyo street at night, reflections on wet pavement",
    "Epic wide shot of ancient temple ruins at golden hour, volumetric god rays",
    "Intimate close-up of a grieving astronaut, stars reflected in visor",
    "Vast desert caravan at twilight, warm lantern light, sweeping crane movement",
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError(null);
    setStage('writer');

    try {
      // Simulate agent pipeline for UX
      await new Promise(r => setTimeout(r, 800));
      setStage('director');

      await new Promise(r => setTimeout(r, 900));
      setStage('editor');

      const res = await fetch('/api/cinematic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.details || data.error || 'Generation failed');
      }

      const gen: Generation = {
        id: data.generation.id,
        prompt: data.generation.prompt,
        imageUrl: data.generation.imageUrl,
        enhancedPrompt: data.generation.enhancedPrompt,
        agents: data.generation.agents,
      };

      setCurrentGeneration(gen);
      setStage('idle');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Something went wrong. Please try again.');
      setStage('idle');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!currentGeneration) return;
    const link = document.createElement('a');
    link.href = currentGeneration.imageUrl;
    link.download = `cinematic-${currentGeneration.id}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Top Nav */}
      <div className="border-b border-white/10 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-[#c084fc] via-[#f472b6] to-[#fb923c] rounded-lg flex items-center justify-center">
              <span className="font-bold text-black text-xl">E</span>
            </div>
            <div>
              <div className="font-semibold tracking-tight">Epic Tech AI</div>
              <div className="text-[10px] text-white/50 -mt-1">CINEMATIC STUDIO</div>
            </div>
          </div>

          <div className="text-sm text-white/60">Powered by Cloudflare AI</div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 pt-10 pb-20">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-block px-4 py-1 rounded-full bg-white/5 text-xs tracking-[3px] mb-4 border border-white/10">
            HOLLYWOOD MEETS EDGE AI
          </div>
          <h1 className="text-6xl font-semibold tracking-tighter mb-3">
            Create cinematic frames.<br />Powered by agents.
          </h1>
          <p className="text-xl text-white/70 max-w-md mx-auto">
            Writer. Director. FLUX. One click to studio-quality results.
          </p>
        </div>

        {/* Prompt Area */}
        <div className="max-w-3xl mx-auto mb-8">
          <div className="bg-[#111113] border border-white/10 rounded-3xl p-6">
            <div className="text-xs uppercase tracking-[2px] text-[#c084fc] mb-3 font-medium">YOUR VISION</div>

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleGenerate();
                }
              }}
              placeholder="A lone figure walking through an endless wheat field at golden hour, warm wind, anamorphic lens flares, 35mm film..."
              className="w-full bg-black/50 border border-white/10 rounded-2xl p-5 text-lg placeholder:text-white/40 focus:outline-none focus:border-[#c084fc]/50 resize-none min-h-[110px]"
              disabled={isGenerating}
            />

            {/* Suggestions */}
            <div className="flex flex-wrap gap-2 mt-4">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setPrompt(s)}
                  disabled={isGenerating}
                  className="text-xs px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                >
                  {s.length > 55 ? s.substring(0, 52) + '...' : s}
                </button>
              ))}
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="mt-6 w-full h-14 rounded-2xl bg-white text-black font-semibold text-lg flex items-center justify-center gap-3 hover:bg-white/90 disabled:opacity-50 transition-all active:scale-[0.985]"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {stage === 'writer' && 'Writer is crafting the scene...'}
                  {stage === 'director' && 'Director is framing the shot...'}
                  {stage === 'editor' && 'FLUX is rendering the frame...'}
                </>
              ) : (
                'GENERATE CINEMATIC FRAME'
              )}
            </button>
          </div>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <div className="max-w-3xl mx-auto mb-6 p-4 bg-red-950/50 border border-red-900/50 text-red-400 rounded-2xl text-sm">
              {error}
            </div>
          )}
        </AnimatePresence>

        {/* Preview Area */}
        <div className="max-w-5xl mx-auto">
          <div className="bg-[#111113] border border-white/10 rounded-3xl overflow-hidden aspect-[16/9] relative flex items-center justify-center">
            <AnimatePresence mode="wait">
              {currentGeneration ? (
                <motion.img
                  key={currentGeneration.id}
                  src={currentGeneration.imageUrl}
                  alt={currentGeneration.prompt}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center text-white/40">
                  <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-40" />
                  <div>Your cinematic frame will appear here</div>
                </div>
              )}
            </AnimatePresence>

            {currentGeneration && (
              <div className="absolute top-4 right-4 px-3 py-1 text-[10px] tracking-widest bg-black/70 rounded-full border border-white/20">
                FLUX.1-SCHNELL • CINEMATIC
              </div>
            )}
          </div>

          {/* Actions */}
          {currentGeneration && (
            <div className="flex gap-3 mt-4 justify-center">
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-sm"
              >
                <Download className="w-4 h-4" /> Download
              </button>
              <button
                onClick={() => {
                  setCurrentGeneration(null);
                  setPrompt('');
                  setError(null);
                }}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-sm"
              >
                <RefreshCw className="w-4 h-4" /> New Vision
              </button>
            </div>
          )}

          {/* Agent Breakdown */}
          {currentGeneration?.agents && (
            <div className="mt-8 grid md:grid-cols-2 gap-4 max-w-5xl mx-auto">
              <div className="bg-[#111113] border border-white/10 rounded-2xl p-5">
                <div className="text-[#c084fc] text-xs tracking-widest mb-2">WRITER AGENT</div>
                <p className="text-sm text-white/90 leading-relaxed">{currentGeneration.agents.writer}</p>
              </div>
              <div className="bg-[#111113] border border-white/10 rounded-2xl p-5">
                <div className="text-[#f472b6] text-xs tracking-widest mb-2">DIRECTOR AGENT</div>
                <p className="text-sm text-white/90 leading-relaxed">{currentGeneration.agents.director}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CinematicStudio;
