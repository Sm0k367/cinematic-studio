import React, { useState } from 'react';
import { Mic } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import Cinematic3DScene from './components/3DScene';

interface Generation {
  id: string;
  prompt: string;
  imageUrl: string;
}

const CinematicStudio: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentGeneration, setCurrentGeneration] = useState<Generation | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a vision');
      return;
    }

    setIsGenerating(true);
    await new Promise(r => setTimeout(r, 1800));

    const newGen: Generation = {
      id: `gen-${Date.now()}`,
      prompt: prompt.trim(),
      imageUrl: `https://picsum.photos/id/${1020 + Math.floor(Math.random() * 30)}/1200/800`
    };

    setCurrentGeneration(newGen);
    setIsGenerating(false);
    toast.success('Cinematic vision generated');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white relative overflow-hidden">
      {/* Background 3D Scene */}
      <div className="absolute inset-0 z-0 opacity-60">
        <Cinematic3DScene />
      </div>

      {/* Top Nav - Matching reference */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-400 flex items-center justify-center text-black font-bold text-xl">ET</div>
          <div>
            <div className="font-semibold text-2xl tracking-tight">Epic Tech AI</div>
            <div className="text-[10px] text-cyan-400 -mt-1">Epic Tech AI Cinematic AI Studio</div>
          </div>
        </div>

          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2 text-white/70 hover:text-white cursor-pointer">
              <span>Gallery</span>
            </div>
            <button className="px-5 py-2 rounded-full border border-white/20 hover:bg-white/5 transition text-sm">Sign In</button>
          </div>
      </nav>

      {/* Main Content Area - Matching the screenshot layout */}
      <div className="relative z-10 max-w-[1200px] mx-auto px-8 pt-8 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left: Agent Cards */}
          <div className="lg:col-span-3 space-y-4">
            {/* Writer */}
            <div className="agent-card p-4 rounded-2xl">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">⚡</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Writer</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-white/60">IDLE</span>
                  </div>
                  <div className="text-xs text-white/60 mt-0.5">Crafting the perfect screenplay</div>
                  <div className="h-1 bg-white/10 rounded mt-3 overflow-hidden">
                    <div className="h-1 w-3/4 bg-gradient-to-r from-cyan-400 to-transparent rounded"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Director */}
            <div className="agent-card p-4 rounded-2xl">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400">⚡</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Director</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-white/60">IDLE</span>
                  </div>
                  <div className="text-xs text-white/60 mt-0.5">Visualizing every frame</div>
                  <div className="h-1 bg-white/10 rounded mt-3 overflow-hidden">
                    <div className="h-1 w-2/3 bg-gradient-to-r from-cyan-400 to-transparent rounded"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Editor */}
            <div className="agent-card p-4 rounded-2xl">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">⚡</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Editor</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-white/60">IDLE</span>
                  </div>
                  <div className="text-xs text-white/60 mt-0.5">Polishing the final cut</div>
                  <div className="h-1 bg-white/10 rounded mt-3 overflow-hidden">
                    <div className="h-1 w-1/2 bg-gradient-to-r from-cyan-400 to-transparent rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Center: Main Generate Panel (exactly like screenshot) */}
          <div className="lg:col-span-6">
            <div className="glass rounded-3xl p-8 flex flex-col items-center text-center">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="sunrise"
                className="prompt-input w-full text-center text-3xl font-light tracking-tight mb-6 bg-transparent border-0 focus:outline-none"
              />

              <button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="main-button w-full max-w-[280px] flex items-center justify-center gap-2 text-lg disabled:opacity-70"
              >
                {isGenerating ? 'GENERATING...' : 'GENERATE CINEMATIC VISION'}
                <span className="text-xl">→</span>
              </button>

              <div className="flex items-center gap-2 mt-4 text-xs text-white/50">
                <Mic className="w-4 h-4" /> voice input
              </div>

              <div className="text-[10px] text-white/40 mt-4">
                Powered by Cloudflare AI • FLUX.1 • Llama 3.3
              </div>
            </div>
          </div>

          {/* Right: Placeholder (Memory Vault disabled on free plan) */}
          <div className="lg:col-span-3">
            <div className="glass rounded-3xl p-6 h-full flex flex-col items-center justify-center text-center">
              <div className="font-semibold mb-2">Memory Vault</div>
              <div className="text-sm text-white/60">
                Coming soon.<br />Requires a paid Cloudflare plan.
              </div>
            </div>
          </div>

        </div>

        {/* Generated Result */}
        <AnimatePresence>
          {currentGeneration && (
            <div className="mt-8 max-w-2xl mx-auto">
              <div className="glass rounded-3xl overflow-hidden">
                <img src={currentGeneration.imageUrl} className="w-full" alt="" />
                <div className="p-6 text-sm text-white/80">
                  {currentGeneration.prompt}
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CinematicStudio;
