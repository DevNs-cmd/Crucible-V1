import { ActivityLogFilterSchema } from '../../src/utils/validators';
import { recordActivity } from '../../src/services/activityLog.service';
import { supabase } from '../../src/config/database';

jest.mock('../../src/config/database', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('ActivityLogFilterSchema', () => {
  it('accepts empty filters', () => {
    expect(ActivityLogFilterSchema.safeParse({}).success).toBe(true);
  });

  it('accepts valid entity_type filters', () => {
    const validTypes = ['lead', 'note', 'meeting', 'followup', 'user'];
    validTypes.forEach((type) => {
      expect(ActivityLogFilterSchema.safeParse({ entity_type: type }).success).toBe(true);
    });
  });

  it('rejects invalid entity_type filters', () => {
    expect(ActivityLogFilterSchema.safeParse({ entity_type: 'invalid' }).success).toBe(false);
  });

  it('accepts valid UUID entity_id', () => {
    expect(
      ActivityLogFilterSchema.safeParse({ entity_id: 'e2b34a6f-402a-4a2b-b8a9-46766d1f94c1' }).success
    ).toBe(true);
  });

  it('rejects invalid UUID entity_id', () => {
    expect(ActivityLogFilterSchema.safeParse({ entity_id: 'not-a-uuid' }).success).toBe(false);
  });
});

describe('recordActivity', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    jest.clearAllMocks();
  });

  it('successfully records activity and does not throw', async () => {
    const mockInsert = jest.fn().mockResolvedValue({ error: null });
    (supabase.from as jest.Mock).mockReturnValue({
      insert: mockInsert,
    });

    await expect(
      recordActivity({
        entity_type: 'lead',
        entity_id: 'd3b07384-d113-4956-a5cc-810d0bc483b8',
        action: 'create',
      })
    ).resolves.not.toThrow();

    expect(mockInsert).toHaveBeenCalledWith({
      entity_type: 'lead',
      entity_id: 'd3b07384-d113-4956-a5cc-810d0bc483b8',
      action: 'create',
      actor_id: null,
      before_state: null,
      after_state: null,
      metadata: null,
    });
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('swallows errors and logs to console.error when supabase insert returns an error', async () => {
    const mockInsert = jest.fn().mockResolvedValue({ error: { message: 'Supabase insert failed' } });
    (supabase.from as jest.Mock).mockReturnValue({
      insert: mockInsert,
    });

    await expect(
      recordActivity({
        entity_type: 'lead',
        entity_id: 'd3b07384-d113-4956-a5cc-810d0bc483b8',
        action: 'create',
      })
    ).resolves.not.toThrow();

    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('swallows exceptions and logs to console.error when supabase client throws', async () => {
    (supabase.from as jest.Mock).mockImplementation(() => {
      throw new Error('Supabase client connection exception');
    });

    await expect(
      recordActivity({
        entity_type: 'lead',
        entity_id: 'd3b07384-d113-4956-a5cc-810d0bc483b8',
        action: 'create',
      })
    ).resolves.not.toThrow();

    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});
