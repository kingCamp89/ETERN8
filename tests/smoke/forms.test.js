import { describe, expect, it } from 'vitest';
import { lovedOneFormSchema } from '@/lib/schemas/lovedOne';
import { getScheduledDeliveryError, memoryFormSchema } from '@/lib/schemas/memory';

describe('lovedOneFormSchema', () => {
  it('requires name and relationship', () => {
    const result = lovedOneFormSchema.safeParse({
      name: '',
      relationship: '',
      date_of_birth: '',
      met_date: '',
      personal_notes: '',
      photo_url: '',
      email: '',
    });
    expect(result.success).toBe(false);
  });

  it('accepts a valid loved one', () => {
    const result = lovedOneFormSchema.safeParse({
      name: 'Alex',
      relationship: 'daughter',
      date_of_birth: '',
      met_date: '',
      personal_notes: '',
      photo_url: '',
      email: 'alex@example.com',
    });
    expect(result.success).toBe(true);
  });
});

describe('memoryFormSchema', () => {
  it('requires a title', () => {
    const result = memoryFormSchema.safeParse({
      title: '  ',
      content: '',
      memory_type: 'text',
      loved_one_id: '',
      loved_one_name: '',
      loved_one_photo_url: '',
      memory_date: '2026-06-28',
      media_url: '',
      tags: [],
      emotion: '',
      is_scheduled: false,
      scheduled_date: '',
      scheduled_time: '09:00',
      scheduled_occasion: '',
      location_name: '',
      location_lat: null,
      location_lng: null,
      is_private: true,
      share_with_ids: [],
      share_group_ids: [],
      share_text: true,
      share_photo: true,
      share_voice: false,
      share_video: true,
    });
    expect(result.success).toBe(false);
  });
});

describe('getScheduledDeliveryError', () => {
  it('flags missing recipient email for scheduled deliveries', () => {
    const error = getScheduledDeliveryError(
      { is_scheduled: true, loved_one_id: 'p1' },
      [{ id: 'p1', name: 'Alex', email: '' }],
    );
    expect(error).toContain('email address');
  });
});
