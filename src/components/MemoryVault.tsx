import React from 'react';
import { Archive, Search } from 'lucide-react';

interface MemoryItem {
  id: string;
  type: string;
  content: string;
  count: number;
}

interface MemoryVaultProps {
  items: MemoryItem[];
  onQuery?: (query: string) => void;
}

export const MemoryVault: React.FC<MemoryVaultProps> = ({ items, onQuery }) => {
  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <Archive className="h-5 w-5 text-[var(--neon-purple)]" />
          <div>
            <div className="font-semibold tracking-[-0.3px]">MEMORY VAULT</div>
            <div className="text-[10px] text-[var(--text-muted)] -mt-px">Vectorize • BGE embeddings • Persistent</div>
          </div>
        </div>
        <div className="font-mono text-xs px-2 py-px bg-white/5 rounded text-[var(--neon-cyan)]">{items.length}</div>
      </div>

      {items.length > 0 ? (
        <div className="space-y-2 text-sm max-h-[340px] overflow-auto pr-1">
          {items.map((item, index) => (
            <div key={index} className="memory-item group flex gap-3 rounded-xl border border-white/10 bg-white/[0.015] p-3.5 hover:border-[var(--neon-cyan)]/40 transition">
              <div className="mt-0.5 text-[var(--neon-purple)]"><Archive className="h-4 w-4" /></div>
              <div className="flex-1 min-w-0">
                <div className="leading-tight pr-3">{item.content}</div>
                <div className="mt-1 flex items-center justify-between text-[10px]">
                  <span className="font-mono uppercase tracking-widest text-[var(--text-dim)]">{item.type}</span>
                  <span className="text-[var(--neon-cyan)] tabular-nums">{item.count} uses</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-9 text-center text-xs text-[var(--text-muted)]">Your characters, scenes &amp; motifs will persist here across generations.</div>
      )}

      <div className="mt-4">
        <button 
          onClick={() => onQuery?.('')} 
          className="w-full text-xs flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 transition"
        >
          <Search className="h-3.5 w-3.5" /> SEMANTIC SEARCH ACROSS ALL MEMORIES
        </button>
      </div>
    </div>
  );
};

export default MemoryVault;
