'use client';

import { AppShell } from './components/AppShell';
import { useWorkflow } from './components/hooks/useWorkflow';
import { ExecutionTimeline } from './components/ExecutionTimeline';
import { RealTimeFeed } from './components/RealtimeFeed';

const INITIAL_TASKS = [
  { id: 'intent-101', task_name: 'AI Lead Routing Scoring Pass', state: 'PENDING' as const },
  { id: 'intent-102', task_name: 'Revenue Leak Watchdog Check', state: 'IN_PROGRESS' as const }
];

export default function AutomationEnginePage() {
  const { tasks, liveLogs, triggerStateTransition } = useWorkflow(INITIAL_TASKS);

  return (
    <AppShell>
      {/* 1. Added container margins, padding, and bumped the max-width to 90rem (1440px) */}
      <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-100 pb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
              Automation Engine
            </h1>
            <p className="mt-1 text-xs md:text-sm text-slate-500">
              Monitor execution task intents, real-time status brokers, and SLA lifecycles.
            </p>
          </div>
          
          {/* Role Badges */}
          <div className="mt-4 flex items-center gap-1.5 md:mt-0 bg-slate-100 p-1 rounded-lg text-xs font-medium self-start">
            <span className="text-slate-500 uppercase px-2 text-[10px]">Role Mock:</span>
            <button className="px-2.5 py-1 rounded text-slate-600 hover:bg-white transition">ADMIN</button>
            <button className="px-2.5 py-1 rounded bg-orange-500 text-white shadow-sm">OPERATOR</button>
            <button className="px-2.5 py-1 rounded text-slate-600 hover:bg-white transition">VIEWER</button>
          </div>
        </div>

        {/* Dynamic Panels - Reduced gap-8 to gap-6 for tighter padding ratios */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2">
            <ExecutionTimeline 
              tasks={tasks} 
              onTriggerTransition={triggerStateTransition} 
            />
          </div>
          
          <div className="lg:col-span-1">
            <RealTimeFeed logs={liveLogs} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}