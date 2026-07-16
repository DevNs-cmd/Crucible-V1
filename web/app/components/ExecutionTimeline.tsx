'use client';

import React from 'react';
import { WorkflowTask } from './hooks/useWorkflow';

interface ExecutionTimelineProps {
  tasks: WorkflowTask[];
  onTriggerTransition?: (id: string, state: WorkflowTask['state']) => void | Promise<void>;
}

export const ExecutionTimeline: React.FC<ExecutionTimelineProps> = ({ tasks, onTriggerTransition }) => {
  const getStateStyles = (state: WorkflowTask['state']) => {
    switch (state) {
      case 'COMPLETED': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'ESCALATED': return 'bg-rose-50 text-rose-700 border-rose-200 font-semibold';
      case 'FAILED': return 'bg-red-50 text-red-700 border-red-200';
      case 'IN_PROGRESS': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm space-y-6">
      <div>
        <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider block mb-1">
          Pipeline Monitoring
        </span>
        <h3 className="text-xl font-bold text-slate-900">Execution Intent Timeline</h3>
      </div>
      
      <div className="relative border-l border-slate-100 ml-3 space-y-6 py-1">
        {tasks.map((task, index) => {
          // Normalize transition target IDs securely
          const taskId = task.id || `intent-${101 + index}`;

          return (
            <div key={taskId} className="relative pl-6">
              {/* Status Indicator Dot */}
              <div className={`absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full border bg-white transition-colors duration-200 ${
                task.state === 'COMPLETED' ? 'border-emerald-500 bg-emerald-500' :
                task.state === 'ESCALATED' ? 'border-rose-500 bg-rose-500' :
                task.state === 'IN_PROGRESS' ? 'border-amber-500 bg-amber-500' : 'border-slate-300'
              }`} />

              {/* Card Container */}
              <div className="border border-slate-100 rounded-lg p-4 bg-slate-50/50 hover:bg-slate-50 transition duration-150">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{task.task_name}</h4>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">ID: {taskId}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border transition-colors duration-200 ${getStateStyles(task.state)}`}>
                    {task.state}
                  </span>
                </div>

                {task.error_message && (
                  <p className="text-xs bg-red-50 text-red-600 p-2 rounded font-mono mt-2 border border-red-100">
                    {task.error_message}
                  </p>
                )}

                {onTriggerTransition && task.state !== 'COMPLETED' && (
                  <div className="mt-3 pt-3 border-t border-slate-100 flex gap-2">
                    {task.state === 'PENDING' && (
                      <button
                        onClick={() => onTriggerTransition(taskId, 'IN_PROGRESS')}
                        className="text-xs bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 rounded font-medium transition active:scale-95"
                      >
                        Start Execution
                      </button>
                    )}
                    {task.state !== 'ESCALATED' && task.state !== 'FAILED' && (
                      <button
                        onClick={() => onTriggerTransition(taskId, 'ESCALATED')}
                        className="text-xs bg-white hover:bg-rose-50 border border-slate-200 text-rose-600 px-3 py-1.5 rounded font-medium transition active:scale-95"
                      >
                        Force Escalation
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};