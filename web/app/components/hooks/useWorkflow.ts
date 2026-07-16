'use client';

import { useOptimistic, useState, useEffect, useTransition } from 'react';

export interface WorkflowTask {
  id: string;
  task_name: string;
  state: 'PENDING' | 'IN_PROGRESS' | 'BLOCKED' | 'COMPLETED' | 'FAILED' | 'ESCALATED';
  error_message?: string | null;
}

export function useWorkflow(initialTasks: WorkflowTask[]) {
  const [tasks, setTasks] = useState<WorkflowTask[]>(initialTasks);
  const [liveLogs, setLiveLogs] = useState<string[]>([]);
  const [, startTransition] = useTransition();

  // Optimistic updates for seamless state transitions
  const [optimisticTasks, setOptimisticState] = useOptimistic(
    tasks,
    (currentTasks, update: { id: string; newState: WorkflowTask['state'] }) =>
      currentTasks.map((task) =>
        task.id === update.id ? { ...task, state: update.newState } : task
      )
  );

  // SSE Stream logic
  useEffect(() => {
    const eventSource = new EventSource('/api/automation/stream');

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.message || data.event) {
          setLiveLogs((prev) => [
            `[${new Date().toLocaleTimeString()}] ${data.message || data.event}`,
            ...prev.slice(0, 49),
          ]);
        }

        if (data.intentId && data.newState) {
          setTasks((prevTasks) =>
            prevTasks.map((task) =>
              task.id === data.intentId ? { ...task, state: data.newState } : task
            )
          );
        }
      } catch (err) {
        console.error('Error parsing live event packet:', err);
      }
    };

    eventSource.onerror = () => {
      console.warn('Real-time feed stream disconnected. Reconnecting...');
    };

    return () => eventSource.close();
  }, []);

  const triggerStateTransition = async (taskId: string, targetState: WorkflowTask['state']) => {
    // Wrap entire network cycle inside startTransition to prevent instant rollback
    startTransition(async () => {
      setOptimisticState({ id: taskId, newState: targetState });

      try {
        const response = await fetch(`/api/automation/tasks/${taskId}/transition`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ state: targetState }),
        });

        if (!response.ok) throw new Error('Network transition request failed');
        
        let updatedTask: Partial<WorkflowTask> = {};
        try {
          updatedTask = await response.json();
        } catch (e) {
          // Fallback if parsing fails
        }
        
        // Ensure state update persists even if the server returns an empty or generic payload
        const finalState = updatedTask.state || targetState;
        
        setTasks((prevTasks) => 
          prevTasks.map((t) => (t.id === taskId ? { ...t, ...updatedTask, state: finalState } : t))
        );
      } catch (error) {
        console.error('Failed to persist state transition, rolling back:', error);
        setTasks((prevTasks) => [...prevTasks]); // Force UI recovery
      }
    });
  };

  return {
    tasks: optimisticTasks,
    liveLogs,
    triggerStateTransition,
  };
}