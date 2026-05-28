import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Download, Save, X, MessageCircle } from 'lucide-react';

interface Generation {
  id: string;
  prompt: string;
  imageUrl: string;
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

  // Load vault
  useEffect(() => {
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

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError(null);
    setStage('writer');

    try {
      await new Promise(r => setTimeout(r, 700));
      setStage('director');

      await new Promise(r => setTimeout(r, 800));
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
        agents: data.generation.agents,
      };

      setCurrentGeneration(gen);
      setStage('idle');

      // Auto-save
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
        body: JSON.stringify({ message: `Help improve this cinematic prompt: "${userMsg}"` }),
      });
      const data = await res.json();
      setChatMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch {
      setChatMessages(prev => [...prev, { role: 'assistant', content: "Try adding more details about lighting, lens, and mood." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050508] text-white">
      {/* Premium Top Bar */}
      <div className="border-b border-white/10 bg-[#050508]/95 backdrop-blur-2xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#c084fc] via-[#f472b6] to-[#fb923c] flex items-center justify-center">
              <span className="font-bold text-black text-2xl">E</span>
            </div>
            <div>
              <div className="font-semibold tracking-[-0.5px] text-2xl">Epic Tech AI</div>
              <div className="text-[10px] text-white/50 -mt-1 tracking-[2px]">CINEMATIC STUDIO</div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <button onClick={() => setShowVault(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-white/5 transition-colors">
              <Save className="w-4 h-4" /> Memory Vault <span className="text-white/50">({memoryVault.length})</span>
            </button>
            <button onClick={() => setShowChat(!showChat)} className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-white/5 transition-colors">
              <MessageCircle className="w-4 h-4" /> Prompt Assistant
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pt-10 pb-16">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline px-4 py-1 text-xs tracking-[3px] bg-white/5 border border-white/10 rounded-full mb-5">POWERED BY CLOUDFLARE AI</div>
          <h1 className="text-6xl font-semibold tracking-[-3px] leading-none mb-3">
            Create studio-quality<br />cinematic frames.
          </h1>
          <p className="text-xl text-white/70">Writer. Director. FLUX. One click.</p>
        </div>

        {/* Prompt Area - Clean & Luxurious */}
        <div className="max-w-3xl mx-auto mb-8">
          <div className="glass rounded-3xl p-6 border border-white/10">
            <div className="text-xs uppercase tracking-[2.5px] text-[#c084fc] mb-3 font-medium">YOUR VISION</div>

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGenerate(); } }}
              placeholder="A lone figure walking through endless wheat fields at golden hour, warm wind, anamorphic lens flares..."
              className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-lg placeholder:text-white/40 focus:outline-none focus:border-[#c084fc]/40 resize-none min-h-[110px]"
              disabled={isGenerating}
            />

            <div className="flex flex-wrap gap-2 mt-4">
              {suggestions.map((s, i) => (
                <button key={i} onClick={() => setPrompt(s)} disabled={isGenerating} className="text-xs px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors">
                  {s.length > 55 ? s.substring(0, 52) + '…' : s}
                </button>
              ))}
            </div>

            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className="mt-6 w-full h-12 rounded-2xl bg-white text-black font-semibold text-base tracking-[0.5px] flex items-center justify-center gap-2 active:scale-[0.985] disabled:opacity-60"
            >
              {isGenerating ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> {stage === 'writer' ? 'Writer thinking...' : stage === 'director' ? 'Director framing...' : 'FLUX rendering...'}</>
              ) : (
                'GENERATE CINEMATIC FRAME'
              )}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && <div className="max-w-3xl mx-auto mb-6 text-center text-red-400 text-sm">{error}</div>}

        {/* Preview */}
        <div className="max-w-[1000px] mx-auto">
          <div className="bg-[#0a0a0f] border border-white/10 rounded-3xl overflow-hidden aspect-video shadow-2xl relative">
            <AnimatePresence mode="wait">
              {currentGeneration ? (
                <motion.img src={currentGeneration.imageUrl} className="w-full h-full object-cover" initial={{ opacity: 0.6 }} animate={{ opacity: 1 }} />
              ) : (
                <div className="flex items-center justify-center h-full text-white/30">Your cinematic frame will appear here</div>
              )}
            </AnimatePresence>
          </div>

          {currentGeneration && (
            <div className="flex justify-center gap-3 mt-5">
              <button onClick={() => saveToVault(currentGeneration)} className="px-5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 flex items-center gap-2 text-sm"><Save className="w-4 h-4" /> Save to Vault</button>
              <button onClick={() => { /* download */ }} className="px-5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 flex items-center gap-2 text-sm"><Download className="w-4 h-4" /> Download</button>
              <button onClick={() => setCurrentGeneration(null)} className="px-5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-sm">New Vision</button>
            </div>
          )}

          {/* Agent Insights - Clean & Minimal */}
          {currentGeneration?.agents && (
            <div className="grid md:grid-cols-2 gap-4 mt-8 max-w-[1000px] mx-auto">
              <div className="glass p-5 rounded-2xl border border-white/10">
                <div className="text-[#c084fc] text-xs tracking-[2px] mb-1.5 font-medium">WRITER AGENT</div>
                <p className="text-sm text-white/90 leading-relaxed">{currentGeneration.agents.writer}</p>
              </div>
              <div className="glass p-5 rounded-2xl border border-white/10">
                <div className="text-[#f472b6] text-xs tracking-[2px] mb-1.5 font-medium">DIRECTOR AGENT</div>
                <p className="text-sm text-white/90 leading-relaxed">{currentGeneration.agents.director}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Memory Vault Modal */}
      <AnimatePresence>
        {showVault && (
          <div className="fixed inset-0 bg-black/95 z-[60] flex items-center justify-center p-8" onClick={() => setShowVault(false)}>
            <div className="max-w-5xl w-full" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between mb-6 items-center">
                <div className="text-3xl font-semibold tracking-tight">Memory Vault</div>
                <button onClick={() => setShowVault(false)}><X /></button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[70vh] overflow-auto">
                {memoryVault.map(gen => (
                  <div key={gen.id} onClick={() => { setCurrentGeneration(gen); setShowVault(false); }} className="cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0f] hover:border-[#c084fc]/40 transition-all">
                    <img src={gen.imageUrl} className="w-full aspect-video object-cover" />
                    <div className="p-4 text-sm text-white/80 line-clamp-2">{gen.prompt}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Chat Assistant - Floating Premium Panel */}
      <AnimatePresence>
        {showChat && (
          <div className="fixed bottom-6 right-6 w-80 bg-[#0a0a0f] border border-white/10 rounded-3xl shadow-2xl z-[70] flex flex-col overflow-hidden glass">
            <div className="p-4 border-b border-white/10 flex justify-between">
              <div className="font-medium">Prompt Assistant</div>
              <button onClick={() => setShowChat(false)}><X size={18} /></button>
            </div>
            <div className="flex-1 p-4 space-y-3 overflow-auto max-h-72 text-sm">
              {chatMessages.map((m, i) => (
                <div key={i} className={m.role === 'user' ? 'text-right' : ''}>
                  <div className={`inline-block px-4 py-2 rounded-2xl ${m.role === 'user' ? 'bg-[#c084fc] text-black' : 'bg-white/10'}`}>
                    {m.content}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-white/10 flex gap-2">
              <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleChatSend()} placeholder="Help me improve this prompt..." className="flex-1 bg-black/50 border border-white/10 rounded-2xl px-4 py-2 text-sm" />
              <button onClick={handleChatSend} disabled={isChatLoading} className="px-4 rounded-2xl bg-white text-black text-sm font-medium">Send</button>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CinematicStudio;
