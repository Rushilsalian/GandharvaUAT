import { 
  validateEmail, 
  validateMobile, 
  normalizeMobile,
  bulkClientValidationSchema,
  thirdPartyClientValidationSchema,
  userValidationSchema,
  validateClientBatch,
  formatValidationErrors
} from './validation';

// Test email validation
console.log('=== Email Validation Tests ===');
console.log('Valid emails:');
console.log('test@example.com:', validateEmail('test@example.com')); // true
console.log('user.name@domain.co.in:', validateEmail('user.name@domain.co.in')); // true
console.log('user+tag@example.org:', validateEmail('user+tag@example.org')); // true

console.log('\nInvalid emails:');
console.log('invalid-email:', validateEmail('invalid-email')); // false
console.log('test@:', validateEmail('test@')); // false
console.log('@domain.com:', validateEmail('@domain.com')); // false
console.log('test..test@domain.com:', validateEmail('test..test@domain.com')); // false

// Test mobile validation
console.log('\n=== Mobile Validation Tests ===');
console.log('Valid Indian mobiles:');
console.log('9876543210:', validateMobile('9876543210')); // true
console.log('8123456789:', validateMobile('8123456789')); // true
console.log('7000000000:', validateMobile('7000000000')); // true
console.log('6999999999:', validateMobile('6999999999')); // true

console.log('\nInvalid Indian mobiles:');
console.log('5876543210:', validateMobile('5876543210')); // false (starts with 5)
console.log('98765432:', validateMobile('98765432')); // false (8 digits)
console.log('987654321012:', validateMobile('987654321012')); // false (12 digits)
console.log('abcd123456:', validateMobile('abcd123456')); // false (contains letters)

console.log('\nMobile normalization:');
console.log('Normalize "+91 9876543210":', normalizeMobile('+91 9876543210')); // 9876543210
console.log('Normalize "98765-43210":', normalizeMobile('98765-43210')); // 9876543210
console.log('Normalize "(987) 654-3210":', normalizeMobile('(987) 654-3210')); // 9876543210

// Test bulk client validation
console.log('\n=== Bulk Client Validation Tests ===');
const testClients = [
  {
    client_code: 'CLI001',
    name: 'John Doe',
    email: 'john@example.com',
    mobile: '9876543210'
  },
  {
    client_code: 'CLI002',
    name: 'Jane Smith',
    email: 'invalid-email',
    mobile: '9876543211'
  },
  {
    client_code: 'CLI003',
    name: 'Bob Johnson',
    email: 'bob@example.com',
    mobile: '5876543210' // Invalid mobile
  },
  {
    client_code: '', // Missing client code
    name: 'Alice Brown',
    email: 'alice@example.com'
  },
  {
    client_code: 'CLI005',
    name: 'Charlie Wilson'
    // Missing both email and mobile
  }
];

const validationResult = validateClientBatch(testClients);
console.log('Valid clients:', validationResult.valid.length);
console.log('Invalid clients:', validationResult.invalid.length);

console.log('\nInvalid client details:');
validationResult.invalid.forEach((invalid, index) => {
  console.log(`Client ${index + 1}:`, invalid.client.client_code || 'NO_CODE');
  console.log('Errors:', invalid.errors.map(e => `${e.field}: ${e.message}`).join(', '));
  console.log('---');
});

// Test third-party client validation
console.log('\n=== Third-Party Client Validation Tests ===');
const thirdPartyClient = {
  code: 'TP001',
  name: 'Third Party Client',
  email: 'tp@example.com',
  mobile: '+91 9876543210',
  panNo: 'ABCDE1234F'
};

try {
  const validatedClient = thirdPartyClientValidationSchema.parse(thirdPartyClient);
  console.log('Third-party client validation passed:', validatedClient.code);
  console.log('Normalized mobile:', validatedClient.mobile);
} catch (error) {
  console.log('Third-party client validation failed:', error.errors);
}

// Test user validation
console.log('\n=== User Validation Tests ===');
const testUser = {
  userName: 'Test User',
  password: 'password123',
  email: 'user@example.com',
  mobile: '9876543210',
  roleId: 3
};

try {
  const validatedUser = userValidationSchema.parse(testUser);
  console.log('User validation passed:', validatedUser.userName);
  console.log('Normalized mobile:', validatedUser.mobile);
} catch (error) {
  console.log('User validation failed:', formatValidationErrors(error));
}

// Test user validation without email or mobile
console.log('\n=== User Validation Without Contact Info ===');
const testUserNoContact = {
  userName: 'Test User No Contact',
  password: 'password123',
  roleId: 3
};

try {
  const validatedUser = userValidationSchema.parse(testUserNoContact);
  console.log('User validation passed (should not reach here)');
} catch (error) {
  console.log('User validation failed (expected):', formatValidationErrors(error));
}

console.log('\n=== Validation Tests Complete ===');