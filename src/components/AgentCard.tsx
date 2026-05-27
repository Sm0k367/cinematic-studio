import React from 'react';

interface AgentCardProps {
  role: 'WRITER' | 'DIRECTOR' | 'EDITOR';
  model: string;
  description: string;
  status: 'idle' | 'active' | 'complete';
  icon: React.ReactNode;
}

const roleColors: Record<string, string> = {
  WRITER: 'text-[var(--neon-cyan)] border-[var(--neon-cyan)]',
  DIRECTOR: 'text-[var(--neon-purple)] border-[var(--neon-purple)]',
  EDITOR: 'text-[var(--neon-fuchsia)] border-[var(--neon-fuchsia)]',
};

export const AgentCard: React.FC<AgentCardProps> = ({ role, model, description, status, icon }) => {
  const isActive = status === 'active';
  const isComplete = status === 'complete';

  return (
    <div className={`glass rounded-2xl p-5 border-l-4 transition-all ${roleColors[role]} ${isActive ? 'ring-1 ring-inset ring-white/30' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="mt-0.5">{icon}</div>
          <div>
            <div className="font-semibold tracking-[-0.2px] text-lg">{role}</div>
            <div className="text-[10px] uppercase tracking-[1.5px] text-[var(--text-dim)] font-mono">{model}</div>
          </div>
        </div>
        
        <div className="agent-status text-right">
          <div className={`status-dot inline-block mr-1.5 align-middle ${isActive ? 'active' : isComplete ? 'complete' : ''}`} />
          <span className="text-xs font-medium uppercase tracking-widest">{status}</span>
        </div>
      </div>
      <p className="mt-3 text-sm leading-snug text-[var(--text-muted)]">{description}</p>
    </div>
  );
};

export default AgentCard;
