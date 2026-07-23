export type WorkflowKey = 'n8n.new_lead' | 'n8n.status_change' | 'n8n.followup_reminder';

export interface WorkflowEntry {
  version: number;
  description: string;
}

/** Bump the version here when an n8n workflow changes shape. */
export const WORKFLOW_REGISTRY: Record<WorkflowKey, WorkflowEntry> = {
  'n8n.new_lead':          { version: 1, description: 'New lead notification workflow' },
  'n8n.status_change':     { version: 1, description: 'Lead status change workflow' },
  'n8n.followup_reminder': { version: 1, description: 'Follow-up reminder batch workflow' },
};

/** Get current version for a workflow key. */
export function getWorkflowVersion(key: WorkflowKey): number {
  const entry = WORKFLOW_REGISTRY[key];
  if (!entry) {
    throw Object.assign(new Error(`Unknown workflow key: ${key}`), { status: 400 });
  }
  return entry.version;
}
