import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Image, Download, RefreshCw, MessageCircle, Save, X } from 'lucide-react';

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
  const [showViewer, setShowViewer] = useState(false);

  // Persistent user ID for "accounts" + KV history
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
        body: JSON.stringify({ message: `Help improve this cinematic prompt: "${userMsg}"` }),
      });
      const data = await res.json();

      setChatMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch {
      setChatMessages(prev => [...prev, { role: 'assistant', content: "Try adding details about lighting, lens, and mood." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const loadFromVault = (gen: Generation) => {
    setCurrentGeneration(gen);
    setPrompt(gen.prompt);
    setShowVault(false);
  };

  // Full-screen cinematic viewer
  const openViewer = () => {
    if (currentGeneration) setShowViewer(true);
  };

  const closeViewer = () => setShowViewer(false);

  const createVariation = () => {
    if (currentGeneration) {
      handleGenerate(currentGeneration.prompt, { variation: true });
    }
  };

  const upscaleImage = () => {
    if (currentGeneration) {
      handleGenerate(currentGeneration.prompt, { upscale: true });
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Top Bar */}
      <div className="border-b border-white/10 bg-black/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#c084fc] via-[#f472b6] to-[#fb923c] flex items-center justify-center">
              <span className="text-black font-bold text-2xl">E</span>
            </div>
            <div>
              <div className="font-semibold tracking-[-1px]">Epic Tech AI</div>
              <div className="text-[10px] text-white/50 -mt-1">CINEMATIC STUDIO</div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <button onClick={() => setShowVault(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-white/5">
              <Save className="w-4 h-4" /> Memory Vault ({memoryVault.length})
            </button>
            <button onClick={() => setShowChat(!showChat)} className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-white/5">
              <MessageCircle className="w-4 h-4" /> Prompt Assistant
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pt-10 pb-24">
        <div className="text-center mb-10">
          <div className="inline px-4 py-1 text-xs tracking-[3px] bg-white/5 border border-white/10 rounded-full mb-4">POWERED BY CLOUDFLARE AI</div>
          <h1 className="text-6xl font-semibold tracking-[-2.5px] leading-none mb-4">
            Create studio-quality<br />cinematic frames.
          </h1>
          <p className="text-xl text-white/70">Writer. Director. FLUX. One click.</p>
        </div>

        {/* Prompt + Generate */}
        <div className="max-w-3xl mx-auto mb-8">
          <div className="glass rounded-3xl p-6 border border-white/10">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A lone figure walking through endless wheat fields at golden hour..."
              className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-lg min-h-[100px] focus:outline-none"
              disabled={isGenerating}
            />

            <div className="flex flex-wrap gap-2 mt-4">
              {suggestions.map((s, i) => (
                <button key={i} onClick={() => setPrompt(s)} className="text-xs px-3 py-1 bg-white/5 rounded-full border border-white/10 hover:border-white/30">
                  {s.length > 48 ? s.slice(0, 45) + "..." : s}
                </button>
              ))}
            </div>

            <button
              onClick={() => handleGenerate()}
              disabled={!prompt.trim() || isGenerating}
              className="mt-6 w-full h-14 rounded-2xl bg-white text-black font-semibold text-lg flex items-center justify-center gap-3 active:scale-[0.985] disabled:opacity-60"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="animate-spin w-5 h-5" />
                  {stage === 'writer' && "Writer thinking..."}
                  {stage === 'director' && "Director framing..."}
                  {stage === 'editor' && "FLUX rendering..."}
                </>
              ) : (
                "GENERATE CINEMATIC FRAME"
              )}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && <div className="max-w-3xl mx-auto mb-6 text-red-400 text-sm text-center">{error}</div>}

        {/* Preview */}
        <div className="max-w-[1100px] mx-auto">
          <div className="bg-[#111113] border border-white/10 rounded-3xl overflow-hidden aspect-video relative shadow-2xl">
            <AnimatePresence mode="wait">
              {currentGeneration ? (
                <motion.img src={currentGeneration.imageUrl} className="w-full h-full object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full text-white/40">Your cinematic frame will appear here</div>
              )}
            </AnimatePresence>
          </div>

          {currentGeneration && (
            <div className="flex justify-center gap-3 mt-4">
              <button onClick={() => saveToVault(currentGeneration)} className="px-5 py-2.5 rounded-2xl bg-white/10 flex items-center gap-2">
                <Save className="w-4 h-4" /> Save to Vault
              </button>
              <button onClick={() => { /* download logic */ }} className="px-5 py-2.5 rounded-2xl bg-white/10 flex items-center gap-2">
                <Download className="w-4 h-4" /> Download
              </button>
              <button onClick={() => setCurrentGeneration(null)} className="px-5 py-2.5 rounded-2xl bg-white/10">New Vision</button>
            </div>
          )}

          {/* Agent Insights */}
          {currentGeneration?.agents && (
            <div className="grid md:grid-cols-2 gap-4 mt-8">
              <div className="glass p-5 rounded-2xl border border-white/10">
                <div className="text-[#c084fc] text-xs mb-1 tracking-widest">WRITER</div>
                <p className="text-sm text-white/90">{currentGeneration.agents.writer}</p>
              </div>
              <div className="glass p-5 rounded-2xl border border-white/10">
                <div className="text-[#f472b6] text-xs mb-1 tracking-widest">DIRECTOR</div>
                <p className="text-sm text-white/90">{currentGeneration.agents.director}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Memory Vault Modal */}
      <AnimatePresence>
        {showVault && (
          <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-6" onClick={() => setShowVault(false)}>
            <div className="max-w-5xl w-full" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between mb-4 items-center">
                <div className="text-2xl font-semibold">Memory Vault</div>
                <button onClick={() => setShowVault(false)}><X /></button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-h-[70vh] overflow-auto">
                {memoryVault.map(gen => (
                  <div key={gen.id} onClick={() => loadFromVault(gen)} className="cursor-pointer overflow-hidden rounded-2xl border border-white/10">
                    <img src={gen.imageUrl} className="w-full aspect-video object-cover" />
                    <div className="p-3 text-xs text-white/70 line-clamp-2">{gen.prompt}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Chat Assistant */}
      <AnimatePresence>
        {showChat && (
          <div className="fixed bottom-6 right-6 w-80 bg-[#111113] border border-white/10 rounded-3xl shadow-2xl z-[70] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-white/10 flex justify-between">
              <div className="font-medium">Prompt Assistant</div>
              <button onClick={() => setShowChat(false)}><X size={18} /></button>
            </div>
            <div className="flex-1 p-4 space-y-3 overflow-auto max-h-80 text-sm">
              {chatMessages.map((m, i) => (
                <div key={i} className={m.role === 'user' ? 'text-right' : ''}>
                  <div className={`inline-block px-4 py-2 rounded-2xl ${m.role === 'user' ? 'bg-[#c084fc] text-black' : 'bg-white/10'}`}>
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
                placeholder="Help me improve my prompt..."
                className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-sm"
              />
              <button onClick={handleChatSend} disabled={isChatLoading} className="px-4 bg-white text-black rounded-xl">Send</button>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CinematicStudio;
