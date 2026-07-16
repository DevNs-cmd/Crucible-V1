import { NextRequest, NextResponse } from 'next/server';

// Temporary in-memory state store for local dev mocking
let tasksStateMock = [
  { id: 'intent-101', task_name: 'AI Lead Routing Scoring Pass', state: 'PENDING' },
  { id: 'intent-102', task_name: 'Revenue Leak Watchdog Check', state: 'IN_PROGRESS' },
];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // 1. Typped as a Promise
) {
  try {
    // 2. Await the dynamic route parameters safely
    const resolvedParams = await params;
    const targetId = resolvedParams.id;

    const body = await request.json();
    const { state } = body;

    if (!state) {
      return NextResponse.json({ error: 'Missing transition state status' }, { status: 400 });
    }

    // Find the task inside our local mock array
    const taskIndex = tasksStateMock.findIndex(t => t.id === targetId);

    if (taskIndex === -1) {
      return NextResponse.json({ error: 'Task intent token not found' }, { status: 404 });
    }

    // Mutate state update
    tasksStateMock[taskIndex].state = state;

    return NextResponse.json({
      success: true,
      message: `State successfully transitioned to ${state}`,
      updatedTask: tasksStateMock[taskIndex]
    }, { status: 200 });

  } catch (error) {
    console.error("API Transition Route Error:", error);
    return NextResponse.json({ error: 'Internal server state transition error' }, { status: 500 });
  }
}