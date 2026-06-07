import { z } from 'zod';

// ─── Auth ────────────────────────────────────────────────────────────────────

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// ─── Leads ───────────────────────────────────────────────────────────────────

export const CreateLeadSchema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  company: z.string().min(1, 'Company is required'),
  industry: z.string().optional(),
  status: z
    .enum(['new', 'contacted', 'proposal', 'negotiation', 'closed_won', 'closed_lost'])
    .default('new'),
  source: z.string().optional(),
  assigned_to: z.string().uuid('assigned_to must be a valid UUID').optional(),
  value: z.number().nonnegative('Value must be non-negative').optional(),
});

export const UpdateLeadSchema = CreateLeadSchema.partial();

export const UpdateLeadStatusSchema = z.object({
  status: z.enum(['new', 'contacted', 'proposal', 'negotiation', 'closed_won', 'closed_lost']),
});

export const LeadFilterSchema = z.object({
  status: z
    .enum(['new', 'contacted', 'proposal', 'negotiation', 'closed_won', 'closed_lost'])
    .optional(),
  assigned_to: z.string().uuid().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

// ─── Notes ───────────────────────────────────────────────────────────────────

export const CreateNoteSchema = z.object({
  content: z.string().min(1, 'Note content is required'),
});

// ─── Meetings ────────────────────────────────────────────────────────────────

export const CreateMeetingSchema = z.object({
  title: z.string().min(1, 'Meeting title is required'),
  met_at: z.string().datetime({ message: 'met_at must be an ISO datetime string' }),
  outcome: z.string().optional(),
  notes: z.string().optional(),
});

// ─── Follow-ups ──────────────────────────────────────────────────────────────

export const CreateFollowUpSchema = z.object({
  due_at: z.string().datetime({ message: 'due_at must be an ISO datetime string' }),
  description: z.string().min(1, 'Description is required'),
});

export const CompleteFollowUpSchema = z.object({
  completed: z.literal(true),
});

// ─── Audit ───────────────────────────────────────────────────────────────────

export const GenerateAuditSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  industry: z.string().min(1, 'Industry is required'),
  companyType: z.string().min(1, 'Company type is required'),
  companySize: z.string().min(1, 'Company size is required'),
  problems: z.array(z.string().min(1)).min(1, 'At least one problem is required'),
  currentTools: z.array(z.string()).default([]),
  budget: z.enum(['low', 'medium', 'high']),
});

// ─── Audit Report Shape (for response validation) ────────────────────────────

export const AuditReportSchema = z.object({
  executiveSummary: z.string(),
  painPoints: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      severity: z.enum(['high', 'medium', 'low']),
    })
  ),
  recommendations: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      priority: z.number(),
      estimatedImpact: z.string(),
    })
  ),
  aiOpportunities: z.array(
    z.object({
      area: z.string(),
      solution: z.string(),
      tools: z.array(z.string()),
      difficulty: z.enum(['easy', 'medium', 'hard']),
    })
  ),
  estimatedROI: z.string(),
  implementationRoadmap: z.array(
    z.object({
      phase: z.number(),
      title: z.string(),
      duration: z.string(),
      tasks: z.array(z.string()),
    })
  ),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type CreateLeadInput = z.infer<typeof CreateLeadSchema>;
export type UpdateLeadInput = z.infer<typeof UpdateLeadSchema>;
export type UpdateLeadStatusInput = z.infer<typeof UpdateLeadStatusSchema>;
export type CreateNoteInput = z.infer<typeof CreateNoteSchema>;
export type CreateMeetingInput = z.infer<typeof CreateMeetingSchema>;
export type CreateFollowUpInput = z.infer<typeof CreateFollowUpSchema>;
export type GenerateAuditInput = z.infer<typeof GenerateAuditSchema>;
export type AuditReport = z.infer<typeof AuditReportSchema>;
