import { z } from 'zod';

export const clientValidationSchema = z.object({
  code: z.string().min(1, 'Client code is required').max(50, 'Client code too long'),
  name: z.string().min(1, 'Client name is required').max(100, 'Client name too long'),
  mobile: z.string().optional().nullable(),
  email: z.string().email('Invalid email format').optional().nullable(),
  dob: z.string().optional().nullable().transform(val => {
    if (!val || val === '') return null;
    const date = new Date(val);
    return isNaN(date.getTime()) ? null : date;
  }),
  panNo: z.string().optional().nullable(),
  aadhaarNo: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  pincode: z.number().optional().nullable(),
  branchId: z.number().optional().nullable()
});

export const clientUpdateSchema = clientValidationSchema.partial().omit({ code: true });

export function validateClientData(data: any) {
  return clientValidationSchema.parse(data);
}

export function validateClientUpdate(data: any) {
  return clientUpdateSchema.parse(data);
}