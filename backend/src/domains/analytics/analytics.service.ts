import { supabase } from '../../config/database';

export interface LeadsByStatus {
  status: string;
  count: number;
}

export interface RevenueByMonth {
  month: string;
  revenue: number;
}

export interface TopPerformer {
  userId: string;
  fullName: string;
  closedWon: number;
  totalValue: number;
}

export interface DashboardStats {
  totalLeads: number;
  activeLeads: number;
  closedWon: number;
  closedLost: number;
  totalPipelineValue: number;
  conversionRate: number;
  overdueFollowUps: number;
}

/**
 * High-level dashboard stats for the analytics overview.
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const { data: leads, error } = await supabase
    .from('leads')
    .select('status, value')
    .is('deleted_at', null);

  if (error) throw Object.assign(new Error(error.message), { status: 500 });

  const all = (leads ?? []) as Array<{ status: string; value: number | null }>;

  const totalLeads = all.length;
  const closedWon = all.filter((l) => l.status === 'closed_won').length;
  const closedLost = all.filter((l) => l.status === 'closed_lost').length;
  const activeLeads = all.filter(
    (l) => !['closed_won', 'closed_lost'].includes(l.status)
  ).length;
  const totalPipelineValue = all.reduce((sum, l) => sum + (l.value ?? 0), 0);
  const conversionRate =
    totalLeads > 0 ? Math.round((closedWon / totalLeads) * 100 * 10) / 10 : 0;

  const { count: overdueFollowUps } = await supabase
    .from('followups')
    .select('id', { count: 'exact', head: true })
    .lte('due_at', new Date().toISOString())
    .eq('completed', false);

  return {
    totalLeads,
    activeLeads,
    closedWon,
    closedLost,
    totalPipelineValue,
    conversionRate,
    overdueFollowUps: overdueFollowUps ?? 0,
  };
}

/**
 * Lead count grouped by status.
 */
export async function getLeadsByStatus(): Promise<LeadsByStatus[]> {
  const { data, error } = await supabase
    .from('leads')
    .select('status')
    .is('deleted_at', null);

  if (error) throw Object.assign(new Error(error.message), { status: 500 });

  const counts: Record<string, number> = {};
  for (const row of (data ?? []) as Array<{ status: string }>) {
    counts[row.status] = (counts[row.status] ?? 0) + 1;
  }

  return Object.entries(counts).map(([status, count]) => ({ status, count }));
}

/**
 * Monthly closed-won revenue for the last 6 months.
 */
export async function getRevenueByMonth(): Promise<RevenueByMonth[]> {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const { data, error } = await supabase
    .from('leads')
    .select('value, updated_at')
    .eq('status', 'closed_won')
    .is('deleted_at', null)
    .gte('updated_at', sixMonthsAgo.toISOString());

  if (error) throw Object.assign(new Error(error.message), { status: 500 });

  const monthly: Record<string, number> = {};
  for (const row of (data ?? []) as Array<{ value: number | null; updated_at: string }>) {
    const month = row.updated_at.slice(0, 7); // YYYY-MM
    monthly[month] = (monthly[month] ?? 0) + (row.value ?? 0);
  }

  return Object.entries(monthly)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, revenue]) => ({ month, revenue }));
}

/**
 * Top performers ranked by closed-won deals and total value.
 */
export async function getTopPerformers(): Promise<TopPerformer[]> {
  const { data, error } = await supabase
    .from('leads')
    .select('assigned_to, value, users:assigned_to(id, full_name)')
    .eq('status', 'closed_won')
    .is('deleted_at', null)
    .not('assigned_to', 'is', null);

  if (error) throw Object.assign(new Error(error.message), { status: 500 });

  const performers: Record<string, { fullName: string; closedWon: number; totalValue: number }> = {};

  for (const row of (data ?? []) as unknown as Array<{
    assigned_to: string;
    value: number | null;
    users: { id: string; full_name: string } | null;
  }>) {
    const uid = row.assigned_to;
    if (!performers[uid]) {
      performers[uid] = {
        fullName: row.users?.full_name ?? 'Unknown',
        closedWon: 0,
        totalValue: 0,
      };
    }
    performers[uid].closedWon += 1;
    performers[uid].totalValue += row.value ?? 0;
  }

  return Object.entries(performers)
    .map(([userId, stats]) => ({ userId, ...stats }))
    .sort((a, b) => b.closedWon - a.closedWon)
    .slice(0, 10);
}
