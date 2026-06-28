import { z } from 'zod';
import { lovedOneRelationshipValues } from './relationships';

const optionalDate = z.string().optional().default('');
const optionalEmail = z.union([
  z.literal(''),
  z.string().trim().email('Enter a valid email'),
]);

export const lovedOneFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  relationship: z
    .string()
    .refine((val) => lovedOneRelationshipValues.includes(val), {
      message: 'Relationship is required',
    }),
  date_of_birth: optionalDate,
  met_date: optionalDate,
  personal_notes: z.string().optional().default(''),
  photo_url: z.string().optional().default(''),
  email: optionalEmail,
});

export const lovedOneEditFormSchema = lovedOneFormSchema.extend({
  profile_theme: z.string().optional().default(''),
});

export const lovedOneFormDefaults = {
  name: '',
  relationship: '',
  date_of_birth: '',
  met_date: '',
  personal_notes: '',
  photo_url: '',
  email: '',
};

export const lovedOneEditFormDefaults = {
  ...lovedOneFormDefaults,
  profile_theme: '',
};
