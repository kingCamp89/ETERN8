import { z } from 'zod';

const memoryTypes = ['text', 'voice', 'photo', 'video'];

export const memoryFormSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  content: z.string().optional().default(''),
  memory_type: z.enum(memoryTypes),
  loved_one_id: z.string().optional().default(''),
  loved_one_name: z.string().optional().default(''),
  loved_one_photo_url: z.string().optional().default(''),
  memory_date: z.string().min(1, 'Memory date is required'),
  media_url: z.string().optional().default(''),
  tags: z.array(z.string()).default([]),
  emotion: z.string().optional().default(''),
  is_scheduled: z.boolean().default(false),
  scheduled_date: z.string().optional().default(''),
  scheduled_time: z.string().optional().default('09:00'),
  scheduled_occasion: z.string().optional().default(''),
  location_name: z.string().optional().default(''),
  location_lat: z.number().nullable().optional().default(null),
  location_lng: z.number().nullable().optional().default(null),
  is_private: z.boolean().default(true),
  share_with_ids: z.array(z.string()).default([]),
  share_group_ids: z.array(z.string()).default([]),
  share_text: z.boolean().default(true),
  share_photo: z.boolean().default(true),
  share_voice: z.boolean().default(false),
  share_video: z.boolean().default(true),
});

export function buildMemoryFormDefaults({
  initialType = 'text',
  shareWithId = null,
} = {}) {
  return {
    title: '',
    content: '',
    memory_type: initialType,
    loved_one_id: '',
    loved_one_name: '',
    loved_one_photo_url: '',
    memory_date: new Date().toISOString().split('T')[0],
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
    is_private: !shareWithId,
    share_with_ids: shareWithId ? [shareWithId] : [],
    share_group_ids: [],
    share_text: true,
    share_photo: true,
    share_voice: false,
    share_video: true,
  };
}

export function getScheduledDeliveryError(values, lovedOnes = []) {
  if (!values.is_scheduled || !values.loved_one_id) return null;
  const person = lovedOnes.find((p) => p.id === values.loved_one_id);
  if (person && !person.email) {
    return 'To schedule a delivery, this person needs an email address. You can add one in their profile — use a guardian\'s email for children.';
  }
  return null;
}

export function toMemoryPayload(values, user) {
  const data = {
    ...values,
    ...(values.is_private
      ? {
          share_with_ids: [],
          share_group_ids: [],
          is_scheduled: false,
          scheduled_date: '',
          scheduled_occasion: '',
        }
      : {}),
    created_by_name: user?.display_name || user?.full_name || '',
    created_by_photo_url: user?.photo_url || '',
    delivery_type: values.is_scheduled ? 'scheduled' : 'normal',
    delivery_status: values.is_scheduled ? 'scheduled' : 'draft',
    scheduled_timezone: values.is_scheduled
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : undefined,
    recipient_ids: values.loved_one_id ? [values.loved_one_id] : [],
    recipient_names: values.loved_one_name ? [values.loved_one_name] : [],
  };

  if (!data.emotion) delete data.emotion;
  if (!data.scheduled_date) delete data.scheduled_date;
  if (!data.scheduled_time) delete data.scheduled_time;
  if (!data.scheduled_occasion) delete data.scheduled_occasion;

  return data;
}
