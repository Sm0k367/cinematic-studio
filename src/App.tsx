import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Download, MessageCircle, Save, X, Repeat, Maximize2 } from 'lucide-react';

interface Generation {
  id: string;
  prompt: string;
  imageUrl: string;
  enhancedPrompt?: string;
  agents?: { writer: string; director: string };
}

const CinematicStudio: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentGeneration, setCurrentGeneration] = useState<Generation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<'idle' | 'writer' | 'director' | 'editor'>('idle');
  const [memoryVault, setMemoryVault] = useState<Generation[]>([]);
  const [showVault, setShowVault] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: string; content: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [userId, setUserId] = useState('');

  // User ID + Vault
  useEffect(() => {
    let id = localStorage.getItem('cinematic-user-id');
    if (!id) {
      id = 'user_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('cinematic-user-id', id);
    }
    setUserId(id);

    const saved = localStorage.getItem('cinematic-vault');
    if (saved) setMemoryVault(JSON.parse(saved));
  }, []);

  const saveToVault = (gen: Generation) => {
    const updated = [gen, ...memoryVault.filter(g => g.id !== gen.id)].slice(0, 20);
    setMemoryVault(updated);
    localStorage.setItem('cinematic-vault', JSON.stringify(updated));
    setShowVault(true);
  };

  const suggestions = [
    "Serene sunrise over misty mountains, golden hour, anamorphic lens",
    "Lone samurai in pouring rain at dusk, dramatic side lighting",
    "Cyberpunk neon Tokyo street at night, wet reflections",
    "Ancient temple ruins at golden hour, volumetric god rays",
    "Grieving astronaut with stars reflected in visor, melancholic",
    "Desert caravan at twilight with warm lantern light",
  ];

  const handleGenerate = async (basePrompt?: string, options: { variation?: boolean; upscale?: boolean } = {}) => {
    const finalPrompt = basePrompt || prompt.trim();
    if (!finalPrompt) return;

    setIsGenerating(true);
    setError(null);
    setStage('writer');

    try {
      await new Promise(r => setTimeout(r, 650));
      setStage('director');
      await new Promise(r => setTimeout(r, 750));
      setStage('editor');

      const res = await fetch('/api/cinematic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: finalPrompt,
          userId,
          variation: options.variation,
          upscale: options.upscale,
        }),
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

      // Auto-save to vault
      const updated = [gen, ...memoryVault.filter(g => g.id !== gen.id)].slice(0, 20);
      setMemoryVault(updated);
      localStorage.setItem('cinematic-vault', JSON.stringify(updated));

    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setStage('idle');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleChatSend = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg }),
      });
      const data = await res.json();
      setChatMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch {
      setChatMessages(prev => [...prev, { role: 'assistant', content: "Try adding more details about lighting and mood." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const createVariation = () => currentGeneration && handleGenerate(currentGeneration.prompt, { variation: true });
  const upscaleImage = () => currentGeneration && handleGenerate(currentGeneration.prompt, { upscale: true });

  return (
    <div className="min-h-screen bg-[#050508] text-white">
      {/* Top Nav - Expensive Look */}
      <div className="border-b border-white/10 bg-[#050508]/95 backdrop-blur-2xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#c084fc] via-[#f472b6] to-[#fb923c] flex items-center justify-center">
              <span className="font-bold text-black text-2xl tracking-[-1px]">E</span>
            </div>
            <div>
              <div className="font-semibold tracking-[-0.5px] text-xl">Epic Tech AI</div>
              <div className="text-[10px] text-white/50 -mt-1.5 tracking-[2px]">CINEMATIC STUDIO</div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <button onClick={() => setShowVault(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-white/5 transition-colors">
              <Save className="w-4 h-4" /> Memory Vault <span className="text-white/50">({memoryVault.length})</span>
            </button>
            <button onClick={() => setShowChat(!showChat)} className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-white/5 transition-colors">
              <MessageCircle className="w-4 h-4" /> Prompt Assistant
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 pt-12 pb-20">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white/5 border border-white/10 text-xs tracking-[3px] mb-6">
            POWERED BY CLOUDFLARE AI
          </div>
          <h1 className="text-7xl font-semibold tracking-[-3.5px] leading-none mb-4">
            Create studio-quality<br />cinematic frames.
          </h1>
          <p className="text-2xl text-white/70">Writer. Director. FLUX. One click.</p>
        </div>

        {/* Prompt Area - Premium Glass */}
        <div className="max-w-3xl mx-auto mb-10">
          <div className="glass rounded-3xl p-7 border border-white/10">
            <div className="text-xs uppercase tracking-[3px] text-[#c084fc] mb-3 font-medium">YOUR VISION</div>

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGenerate(); } }}
              placeholder="A lone figure walking through endless wheat fields at golden hour, warm wind, anamorphic lens flares..."
              className="w-full bg-black/40 border border-white/10 rounded-2xl p-6 text-lg placeholder:text-white/40 focus:outline-none focus:border-[#c084fc]/40 resize-none min-h-[120px]"
              disabled={isGenerating}
            />

            <div className="flex flex-wrap gap-2 mt-5">
              {suggestions.map((s, i) => (
                <button key={i} onClick={() => setPrompt(s)} disabled={isGenerating} className="suggestion-chip text-xs px-3.5 py-1.5 rounded-full hover:text-white">
                  {s.length > 52 ? s.substring(0, 49) + '…' : s}
                </button>
              ))}
            </div>

            <button
              onClick={() => handleGenerate()}
              disabled={!prompt.trim() || isGenerating}
              className="premium-btn mt-7 w-full h-14 rounded-2xl text-lg font-semibold tracking-[0.5px] flex items-center justify-center gap-3 active:scale-[0.985] disabled:opacity-60"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {stage === 'writer' && "Writer is crafting the scene..."}
                  {stage === 'director' && "Director is framing the shot..."}
                  {stage === 'editor' && "FLUX is rendering the frame..."}
                </>
              ) : (
                "GENERATE CINEMATIC FRAME"
              )}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && <div className="max-w-3xl mx-auto mb-6 p-4 bg-red-950/40 border border-red-900 text-red-400 rounded-2xl text-sm">{error}</div>}

        {/* Preview + Actions */}
        <div className="max-w-[1080px] mx-auto">
          <div className="preview-frame rounded-3xl overflow-hidden border border-white/10 shadow-2xl aspect-video bg-black relative">
            <AnimatePresence mode="wait">
              {currentGeneration ? (
                <motion.img 
                  key={currentGeneration.id}
                  src={currentGeneration.imageUrl} 
                  className="w-full h-full object-cover"
                  initial={{ opacity: 0.7 }}
                  animate={{ opacity: 1 }}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-white/30 text-lg">Your cinematic frame will appear here</div>
              )}
            </AnimatePresence>

            {currentGeneration && (
              <div className="absolute top-4 right-4 px-3 py-1 text-[10px] tracking-[2px] bg-black/70 border border-white/20 rounded-full">
                FLUX.1-SCHNELL • CINEMATIC
              </div>
            )}
          </div>

          {/* Action Bar */}
          {currentGeneration && (
            <div className="flex flex-wrap justify-center gap-3 mt-5">
              <button onClick={() => saveToVault(currentGeneration)} className="glass px-6 py-2.5 rounded-2xl flex items-center gap-2 text-sm hover:border-[#c084fc]/50">
                <Save className="w-4 h-4" /> Save to Vault
              </button>
              <button onClick={() => { /* download */ }} className="glass px-6 py-2.5 rounded-2xl flex items-center gap-2 text-sm hover:border-[#c084fc]/50">
                <Download className="w-4 h-4" /> Download
              </button>
              <button onClick={createVariation} className="glass px-6 py-2.5 rounded-2xl flex items-center gap-2 text-sm hover:border-[#c084fc]/50">
                <Repeat className="w-4 h-4" /> Create Variation
              </button>
              <button onClick={upscaleImage} className="glass px-6 py-2.5 rounded-2xl flex items-center gap-2 text-sm hover:border-[#c084fc]/50">
                <Maximize2 className="w-4 h-4" /> Upscale
              </button>
              <button onClick={() => setCurrentGeneration(null)} className="glass px-6 py-2.5 rounded-2xl text-sm hover:border-white/30">
                New Vision
              </button>
            </div>
          )}

          {/* Agent Pipeline Visualization */}
          {currentGeneration?.agents && (
            <div className="mt-8 grid md:grid-cols-2 gap-4">
              <div className="glass p-6 rounded-2xl border border-white/10">
                <div className="text-[#c084fc] text-xs tracking-[2px] mb-2 font-medium">WRITER AGENT</div>
                <p className="text-sm text-white/90 leading-relaxed">{currentGeneration.agents.writer}</p>
              </div>
              <div className="glass p-6 rounded-2xl border border-white/10">
                <div className="text-[#f472b6] text-xs tracking-[2px] mb-2 font-medium">DIRECTOR AGENT</div>
                <p className="text-sm text-white/90 leading-relaxed">{currentGeneration.agents.director}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Memory Vault Modal - Expensive Look */}
      <AnimatePresence>
        {showVault && (
          <div className="fixed inset-0 bg-black/95 z-[60] flex items-center justify-center p-8" onClick={() => setShowVault(false)}>
            <div className="max-w-6xl w-full" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <div className="text-3xl font-semibold tracking-tight">Memory Vault</div>
                  <div className="text-white/50 text-sm">Your cinematic archive</div>
                </div>
                <button onClick={() => setShowVault(false)} className="text-white/60 hover:text-white"><X size={24} /></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[75vh] overflow-auto">
                {memoryVault.map((gen) => (
                  <div key={gen.id} onClick={() => { setCurrentGeneration(gen); setShowVault(false); }} className="vault-item cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0f]">
                    <img src={gen.imageUrl} className="w-full aspect-video object-cover" />
                    <div className="p-4 text-sm text-white/80 line-clamp-2">{gen.prompt}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Prompt Assistant - Expensive Floating Panel */}
      <AnimatePresence>
        {showChat && (
          <div className="fixed bottom-6 right-6 w-96 bg-[#0a0a0f] border border-white/10 rounded-3xl shadow-2xl z-[70] flex flex-col overflow-hidden glass">
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
              <div className="font-medium tracking-tight">Prompt Assistant</div>
              <button onClick={() => setShowChat(false)}><X size={18} /></button>
            </div>
            <div className="flex-1 p-4 space-y-4 overflow-auto max-h-80 text-sm">
              {chatMessages.map((m, i) => (
                <div key={i} className={m.role === 'user' ? 'text-right' : ''}>
                  <div className={`chat-bubble inline-block ${m.role === 'user' ? 'chat-bubble user' : 'chat-bubble assistant'}`}>
                    {m.content}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-white/10 flex gap-2">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleChatSend()}
                placeholder="Help me improve this prompt..."
                className="flex-1 bg-black/50 border border-white/10 rounded-2xl px-4 py-2 text-sm focus:border-[#c084fc]/40"
              />
              <button onClick={handleChatSend} disabled={isChatLoading} className="px-5 rounded-2xl bg-white text-black font-medium text-sm">Send</button>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CinematicStudio;
