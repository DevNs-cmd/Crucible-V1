'use client';

import React, { useState, useEffect } from 'react';

interface CommandPaletteProps {
  onTriggerSlaCheck: () => void;
  onNavigate: (route: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ onTriggerSlaCheck, onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const commands = [
    { text: 'Go to CRM Dashboard', action: () => onNavigate('/crm') },
    { text: 'Go to Automation Engine Logs', action: () => onNavigate('/audit') },
    { text: 'Force SLA Watchdog Scan', action: onTriggerSlaCheck },
  ];

  const filteredCommands = commands.filter((cmd) =>
    cmd.text.toLowerCase().includes(search.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-start justify-center pt-[15vh]">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden p-4">
        <input
          type="text"
          placeholder="Type a command to search... (Esc to close)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:border-amber-500 transition"
          autoFocus
        />
        <div className="mt-3 space-y-0.5 max-h-60 overflow-y-auto">
          {filteredCommands.map((cmd, i) => (
            <button
              key={i}
              onClick={() => { cmd.action(); setIsOpen(false); }}
              className="w-full text-left text-xs text-slate-700 hover:bg-slate-50 hover:text-amber-600 p-2.5 rounded-md transition font-mono"
            >
              ⚡ {cmd.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};