'use client';

import React from 'react';

interface RealTimeFeedProps {
  logs: string[];
}

export const RealTimeFeed: React.FC<RealTimeFeedProps> = ({ logs }) => {
  return (
    <div className="w-full bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-600"></span>
          </span>
          <h3 className="font-semibold text-xs text-slate-400 uppercase tracking-wider">
            Live Automation Feed
          </h3>
        </div>
      </div>

      <div className="h-48 overflow-y-auto font-mono text-xs space-y-2 pr-2">
        {logs.length === 0 ? (
          <div className="text-slate-400 flex items-center justify-center h-full italic">
            Awaiting active pipeline events...
          </div>
        ) : (
          logs.map((log, index) => (
            <div 
              key={index} 
              className="p-2.5 rounded bg-slate-50 border-l-2 border-amber-600 text-slate-700 text-ellipsis overflow-hidden"
            >
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  );
};