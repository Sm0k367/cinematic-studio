import React from 'react';
import { Mic } from 'lucide-react';

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isGenerating: boolean;
  onVoiceInput: () => void;
  isListening: boolean;
}

export const PromptInput: React.FC<PromptInputProps> = ({
  value,
  onChange,
  onSubmit,
  isGenerating,
  onVoiceInput,
  isListening
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div>
      <div className="uppercase tracking-[2.5px] text-xs font-mono mb-3 text-[var(--neon-purple)] flex items-center gap-2">
        DESCRIBE YOUR CINEMATIC VISION
      </div>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="A lone samurai walking through a neon cyberpunk street during a rainstorm at night, dramatic side lighting, reflections on wet pavement..."
        className="prompt-input min-h-[118px] text-[15px] leading-snug"
        disabled={isGenerating}
      />

      <div className="flex items-center gap-3 mt-4">
        <button
          onClick={onSubmit}
          disabled={isGenerating || !value.trim()}
          className="btn-neon flex-1 py-[17px] text-[13px]"
        >
          {isGenerating ? 'RENDERING IN THE VAULT...' : 'GENERATE STUDIO-QUALITY FRAME'}
        </button>

        <button
          onClick={onVoiceInput}
          disabled={isGenerating}
          className={`btn-purple px-7 py-[17px] rounded-2xl flex items-center gap-2 text-sm ${isListening ? 'animate-pulse' : ''}`}
        >
          <Mic className="h-4 w-4" /> {isListening ? 'LISTENING' : 'VOICE'}
        </button>
      </div>
    </div>
  );
};

export default PromptInput;
