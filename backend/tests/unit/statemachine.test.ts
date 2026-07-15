import { isValidTransition } from '../../src/utils/statemachine';
import { updateLeadStatus, updateLead } from '../../src/services/leads.service';
import { supabase } from '../../src/config/database';

jest.mock('../../src/config/database', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('isValidTransition', () => {
  it('allows valid forward transitions', () => {
    expect(isValidTransition('new', 'contacted')).toBe(true);
    expect(isValidTransition('new', 'closed_lost')).toBe(true);
    expect(isValidTransition('contacted', 'proposal')).toBe(true);
    expect(isValidTransition('contacted', 'closed_lost')).toBe(true);
    expect(isValidTransition('proposal', 'negotiation')).toBe(true);
    expect(isValidTransition('proposal', 'closed_lost')).toBe(true);
    expect(isValidTransition('negotiation', 'closed_won')).toBe(true);
    expect(isValidTransition('negotiation', 'closed_lost')).toBe(true);
  });

  it('rejects backward transitions', () => {
    expect(isValidTransition('contacted', 'new')).toBe(false);
    expect(isValidTransition('proposal', 'contacted')).toBe(false);
    expect(isValidTransition('negotiation', 'proposal')).toBe(false);
    expect(isValidTransition('closed_won', 'negotiation')).toBe(false);
  });

  it('rejects skip transitions', () => {
    expect(isValidTransition('new', 'proposal')).toBe(false);
    expect(isValidTransition('contacted', 'negotiation')).toBe(false);
    expect(isValidTransition('proposal', 'closed_won')).toBe(false);
  });

  it('rejects reopening terminal states', () => {
    expect(isValidTransition('closed_won', 'contacted')).toBe(false);
    expect(isValidTransition('closed_won', 'new')).toBe(false);
    expect(isValidTransition('closed_lost', 'new')).toBe(false);
    expect(isValidTransition('closed_lost', 'contacted')).toBe(false);
  });

  it('rejects same-status transitions', () => {
    expect(isValidTransition('new', 'new')).toBe(false);
    expect(isValidTransition('contacted', 'contacted')).toBe(false);
    expect(isValidTransition('closed_won', 'closed_won')).toBe(false);
  });
});

describe('Leads Service Transition Validation', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('throws 409 with allowed states for invalid transitions from mid-pipeline states', async () => {
    const mockSingle = jest.fn().mockResolvedValue({
      data: { id: 'test-lead-id', status: 'new' },
      error: null,
    });
    const mockSelect = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        is: jest.fn().mockReturnValue({
          single: mockSingle,
        }),
      }),
    });
    (supabase.from as jest.Mock).mockReturnValue({
      select: mockSelect,
      insert: jest.fn().mockResolvedValue({ error: null }),
    });

    await expect(
      updateLeadStatus('test-lead-id', 'proposal', 'test-actor')
    ).rejects.toEqual(
      expect.objectContaining({
        status: 409,
        message: "Invalid status transition from 'new' to 'proposal'. Valid next states: contacted, closed_lost",
      })
    );
  });

  it('throws 409 with terminal message for invalid transitions from terminal states', async () => {
    const mockSingle = jest.fn().mockResolvedValue({
      data: { id: 'test-lead-id', status: 'closed_won' },
      error: null,
    });
    const mockSelect = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        is: jest.fn().mockReturnValue({
          single: mockSingle,
        }),
      }),
    });
    (supabase.from as jest.Mock).mockReturnValue({
      select: mockSelect,
      insert: jest.fn().mockResolvedValue({ error: null }),
    });

    await expect(
      updateLeadStatus('test-lead-id', 'contacted', 'test-actor')
    ).rejects.toEqual(
      expect.objectContaining({
        status: 409,
        message: 'terminal state, no further transitions allowed',
      })
    );
  });

  it('throws 409 with correct message on same-status transition check', async () => {
    const mockSingle = jest.fn().mockResolvedValue({
      data: { id: 'test-lead-id', status: 'contacted' },
      error: null,
    });
    const mockSelect = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        is: jest.fn().mockReturnValue({
          single: mockSingle,
        }),
      }),
    });
    (supabase.from as jest.Mock).mockReturnValue({
      select: mockSelect,
      insert: jest.fn().mockResolvedValue({ error: null }),
    });

    await expect(
      updateLeadStatus('test-lead-id', 'contacted', 'test-actor')
    ).rejects.toEqual(
      expect.objectContaining({
        status: 409,
        message: "Invalid status transition from 'contacted' to 'contacted'. Valid next states: proposal, closed_lost",
      })
    );
  });

  it('updateLead throws 409 for invalid status transition', async () => {
    const mockSingle = jest.fn().mockResolvedValue({
      data: { id: 'test-lead-id', status: 'new', full_name: 'Jane Doe' },
      error: null,
    });
    const mockSelect = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        is: jest.fn().mockReturnValue({
          single: mockSingle,
        }),
      }),
    });
    (supabase.from as jest.Mock).mockReturnValue({
      select: mockSelect,
      insert: jest.fn().mockResolvedValue({ error: null }),
    });

    await expect(
      updateLead('test-lead-id', { status: 'proposal' }, 'test-actor')
    ).rejects.toEqual(
      expect.objectContaining({
        status: 409,
        message: "Invalid status transition from 'new' to 'proposal'. Valid next states: contacted, closed_lost",
      })
    );
  });

  it('updateLead does not throw 409 if status is not changed', async () => {
    const mockSingle = jest.fn().mockResolvedValue({
      data: { id: 'test-lead-id', status: 'new', full_name: 'Jane Doe' },
      error: null,
    });
    const mockSelect = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        is: jest.fn().mockReturnValue({
          single: mockSingle,
        }),
      }),
    });
    const mockUpdateSingle = jest.fn().mockResolvedValue({
      data: { id: 'test-lead-id', status: 'new', full_name: 'Jane Smith' },
      error: null,
    });
    const mockUpdateSelect = jest.fn().mockReturnValue({
      single: mockUpdateSingle,
    });
    const mockUpdateEq = jest.fn().mockReturnValue({
      is: jest.fn().mockReturnValue({
        select: mockUpdateSelect,
      }),
    });
    (supabase.from as jest.Mock).mockReturnValue({
      select: mockSelect,
      update: jest.fn().mockReturnValue({
        eq: mockUpdateEq,
      }),
      insert: jest.fn().mockResolvedValue({ error: null }),
    });

    await expect(
      updateLead('test-lead-id', { full_name: 'Jane Smith' }, 'test-actor')
    ).resolves.not.toThrow();
  });
});
