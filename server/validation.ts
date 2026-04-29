import { z } from 'zod';

// Email validation regex - RFC 5322 compliant
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// Mobile validation regex - Indian mobile numbers (10 digits, starting with 6-9)
const MOBILE_REGEX = /^[6-9]\d{9}$/;

// International mobile regex (with country code)
const INTERNATIONAL_MOBILE_REGEX = /^\+?[1-9]\d{1,14}$/;

/**
 * Validates email format
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  return EMAIL_REGEX.test(email.trim());
}

/**
 * Validates mobile number format (Indian format by default)
 */
export function validateMobile(mobile: string, international = false): boolean {
  if (!mobile || typeof mobile !== 'string') return false;
  const cleanMobile = mobile.replace(/[\s\-\(\)]/g, ''); // Remove spaces, dashes, parentheses
  
  if (international) {
    return INTERNATIONAL_MOBILE_REGEX.test(cleanMobile);
  }
  
  // For Indian numbers, remove +91 prefix if present
  const indianMobile = cleanMobile.replace(/^\+91/, '');
  return MOBILE_REGEX.test(indianMobile);
}

/**
 * Normalizes mobile number to standard format
 */
export function normalizeMobile(mobile: string): string {
  if (!mobile) return mobile;
  const cleanMobile = mobile.replace(/[\s\-\(\)]/g, '');
  // Remove +91 prefix for Indian numbers
  return cleanMobile.replace(/^\+91/, '');
}

/**
 * Zod schema for email validation
 */
export const emailSchema = z.string()
  .min(1, 'Email is required')
  .refine(validateEmail, 'Invalid email format');

/**
 * Zod schema for optional email validation
 */
export const optionalEmailSchema = z.string()
  .optional()
  .nullable()
  .refine((email) => !email || validateEmail(email), 'Invalid email format');

/**
 * Zod schema for mobile validation
 */
export const mobileSchema = z.string()
  .min(1, 'Mobile number is required')
  .transform(normalizeMobile)
  .refine(validateMobile, 'Invalid mobile number format. Must be 10 digits starting with 6-9');

/**
 * Zod schema for optional mobile validation
 */
export const optionalMobileSchema = z.string()
  .optional()
  .nullable()
  .transform((mobile) => mobile ? normalizeMobile(mobile) : mobile)
  .refine((mobile) => !mobile || validateMobile(mobile), 'Invalid mobile number format. Must be 10 digits starting with 6-9');

/**
 * Enhanced client validation schema with proper email and mobile validation
 */
export const enhancedClientValidationSchema = z.object({
  code: z.string().min(1, 'Client code is required').max(50, 'Client code too long'),
  name: z.string().min(1, 'Client name is required').max(100, 'Client name too long'),
  mobile: optionalMobileSchema,
  email: optionalEmailSchema,
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
  branchId: z.number().optional().nullable(),
  referenceId: z.number().optional().nullable(),
  openingInvestment: z.union([
    z.string(),
    z.number()
  ]).optional().nullable().transform(val => {
    if (val === null || val === undefined || val === '') return null;
    return val.toString();
  }),
  openingWithdrawl: z.union([
    z.string(),
    z.number()
  ]).optional().nullable().transform(val => {
    if (val === null || val === undefined || val === '') return null;
    return val.toString();
  }),
  openingPayout: z.union([
    z.string(),
    z.number()
  ]).optional().nullable().transform(val => {
    if (val === null || val === undefined || val === '') return null;
    return val.toString();
  }),
  openingClosure: z.union([
    z.string(),
    z.number()
  ]).optional().nullable().transform(val => {
    if (val === null || val === undefined || val === '') return null;
    return val.toString();
  })
}).refine(
  (data) => data.email || data.mobile,
  {
    message: "Either email or mobile number is required",
    path: ["email"]
  }
);

/**
 * Bulk upload client validation schema - allows client creation without email/mobile
 */
export const bulkClientValidationSchema = z.object({
  client_code: z.string().min(1, 'Client code is required').max(50, 'Client code too long'),
  name: z.string().min(1, 'Client name is required').max(100, 'Client name too long'),
  mobile: z.any().optional().nullable().transform((mobile) => {
    if (!mobile || mobile === '' || mobile === 'N/A') return null;
    try {
      const normalized = normalizeMobile(mobile.toString());
      return validateMobile(normalized) ? normalized : null;
    } catch {
      return null;
    }
  }),
  email: z.any().optional().nullable().transform((email) => {
    if (!email || email === '' || email === 'N/A' || email === '.') return null;
    try {
      const emailStr = email.toString().trim();
      return validateEmail(emailStr) ? emailStr : null;
    } catch {
      return null;
    }
  }),
  dob: z.string().optional().nullable(),
  pan_no: z.union([z.string(), z.number()]).optional().nullable().transform(val => (val !== null && val !== undefined && val !== '') ? val.toString() : null),
  aadhaar_no: z.union([z.string(), z.number()]).optional().nullable().transform(val => (val !== null && val !== undefined && val !== '') ? val.toString() : null),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  pincode: z.union([z.string(), z.number()]).optional().nullable().transform(val => (val !== null && val !== undefined && val !== '') ? val.toString() : null),
  branch: z.string().optional().nullable(),
  reference_code: z.union([z.string(), z.number()]).optional().nullable().transform(val => (val !== null && val !== undefined && val !== '') ? val.toString() : null),
  opening_investment: z.union([
    z.string(),
    z.number()
  ]).optional().nullable().transform(val => {
    if (val === null || val === undefined || val === '') return null;
    return val.toString();
  })
});

/**
 * Third-party API client sync validation schema - allows client creation without email/mobile
 */
export const thirdPartyClientValidationSchema = z.object({
  code: z.string().min(1, 'Client code is required').max(50, 'Client code too long'),
  name: z.string().min(1, 'Client name is required').max(100, 'Client name too long'),
  mobile: z.any().optional().nullable().transform((mobile) => {
    if (!mobile || mobile === '' || mobile === 'N/A') return null;
    try {
      const normalized = normalizeMobile(mobile.toString());
      return validateMobile(normalized) ? normalized : null;
    } catch {
      return null;
    }
  }),
  email: z.any().optional().nullable().transform((email) => {
    if (!email || email === '' || email === 'N/A' || email === '.') return null;
    try {
      const emailStr = email.toString().trim();
      return validateEmail(emailStr) ? emailStr : null;
    } catch {
      return null;
    }
  }),
  dob: z.string().optional().nullable(),
  panNo: z.string().optional().nullable(),
  aadhaarNo: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  pincode: z.number().optional().nullable(),
  branch: z.string().optional().nullable(),
  branchId: z.number().optional().nullable(),
  referenceId: z.number().optional().nullable(),
  reference_code: z.union([z.string(), z.number()]).optional().nullable().transform(val => (val !== null && val !== undefined && val !== '') ? val.toString() : null),
  openingInvestment: z.union([
    z.string(),
    z.number()
  ]).optional().nullable().transform(val => {
    if (val === null || val === undefined || val === '') return null;
    return val.toString();
  }),
  openingWithdrawl: z.union([
    z.string(),
    z.number()
  ]).optional().nullable().transform(val => {
    if (val === null || val === undefined || val === '') return null;
    return val.toString();
  }),
  openingPayout: z.union([
    z.string(),
    z.number()
  ]).optional().nullable().transform(val => {
    if (val === null || val === undefined || val === '') return null;
    return val.toString();
  }),
  openingClosure: z.union([
    z.string(),
    z.number()
  ]).optional().nullable().transform(val => {
    if (val === null || val === undefined || val === '') return null;
    return val.toString();
  })
});

/**
 * User validation schema with email and mobile validation
 */
export const userValidationSchema = z.object({
  userName: z.string().min(1, 'Username is required').max(100, 'Username too long'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  email: optionalEmailSchema,
  mobile: optionalMobileSchema,
  roleId: z.number().min(1, 'Role ID is required'),
  clientId: z.number().optional().nullable()
}).refine(
  (data) => data.email || data.mobile,
  {
    message: "Either email or mobile number is required",
    path: ["email"]
  }
);

/**
 * Validation error formatter
 */
export function formatValidationErrors(errors: z.ZodError): Array<{ field: string; message: string }> {
  return errors.errors.map(error => ({
    field: error.path.join('.'),
    message: error.message
  }));
}

/**
 * Validates a batch of client records and returns validation results
 */
export function validateClientBatch(clients: any[]): {
  valid: any[];
  invalid: Array<{ client: any; errors: Array<{ field: string; message: string }> }>;
} {
  const valid: any[] = [];
  const invalid: Array<{ client: any; errors: Array<{ field: string; message: string }> }> = [];

  for (const client of clients) {
    try {
      const validatedClient = bulkClientValidationSchema.parse(client);
      valid.push(validatedClient);
    } catch (error) {
      if (error instanceof z.ZodError) {
        invalid.push({
          client,
          errors: formatValidationErrors(error)
        });
      } else {
        invalid.push({
          client,
          errors: [{ field: 'general', message: 'Unknown validation error' }]
        });
      }
    }
  }

  return { valid, invalid };
}

/**
 * Checks if client has valid contact information (email or mobile)
 */
export function hasValidContactInfo(client: any): boolean {
  const hasValidEmail = client.email && client.email !== null && client.email !== 'N/A' && client.email !== '.' && validateEmail(client.email);
  const hasValidMobile = client.mobile && client.mobile !== null && client.mobile !== 'N/A' && validateMobile(client.mobile);
  return hasValidEmail || hasValidMobile;
}