import { db } from './server/db';
import { mstClient } from './shared/schema';

const sampleClients = [
  { code: 'CL002', name: 'Jane Smith', mobile: '9876543211', email: 'jane@example.com', city: 'Delhi' },
  { code: 'CL003', name: 'Mike Johnson', mobile: '9876543212', email: 'mike@example.com', city: 'Bangalore' },
  { code: 'CL004', name: 'Sarah Wilson', mobile: '9876543213', email: 'sarah@example.com', city: 'Chennai' },
  { code: 'CL005', name: 'David Brown', mobile: '9876543214', email: 'david@example.com', city: 'Hyderabad' },
  { code: 'CL006', name: 'Lisa Davis', mobile: '9876543215', email: 'lisa@example.com', city: 'Pune' },
  { code: 'CL007', name: 'Tom Miller', mobile: '9876543216', email: 'tom@example.com', city: 'Kolkata' },
  { code: 'CL008', name: 'Amy Garcia', mobile: '9876543217', email: 'amy@example.com', city: 'Ahmedabad' },
  { code: 'CL009', name: 'Chris Lee', mobile: '9876543218', email: 'chris@example.com', city: 'Jaipur' },
  { code: 'CL010', name: 'Emma Taylor', mobile: '9876543219', email: 'emma@example.com', city: 'Lucknow' },
  { code: 'CL011', name: 'Ryan Clark', mobile: '9876543220', email: 'ryan@example.com', city: 'Kanpur' },
  { code: 'CL012', name: 'Olivia White', mobile: '9876543221', email: 'olivia@example.com', city: 'Nagpur' },
  { code: 'CL013', name: 'James Harris', mobile: '9876543222', email: 'james@example.com', city: 'Indore' },
  { code: 'CL014', name: 'Sophia Martin', mobile: '9876543223', email: 'sophia@example.com', city: 'Thane' },
  { code: 'CL015', name: 'Daniel Thompson', mobile: '9876543224', email: 'daniel@example.com', city: 'Bhopal' },
  { code: 'CL016', name: 'Isabella Anderson', mobile: '9876543225', email: 'isabella@example.com', city: 'Visakhapatnam' },
  { code: 'CL017', name: 'Matthew Jackson', mobile: '9876543226', email: 'matthew@example.com', city: 'Pimpri' },
  { code: 'CL018', name: 'Mia Rodriguez', mobile: '9876543227', email: 'mia@example.com', city: 'Patna' },
  { code: 'CL019', name: 'Alexander Martinez', mobile: '9876543228', email: 'alex@example.com', city: 'Vadodara' },
  { code: 'CL020', name: 'Charlotte Lopez', mobile: '9876543229', email: 'charlotte@example.com', city: 'Ghaziabad' },
  { code: 'CL021', name: 'William Gonzalez', mobile: '9876543230', email: 'william@example.com', city: 'Ludhiana' },
  { code: 'CL022', name: 'Amelia Perez', mobile: '9876543231', email: 'amelia@example.com', city: 'Agra' },
  { code: 'CL023', name: 'Benjamin Wilson', mobile: '9876543232', email: 'benjamin@example.com', city: 'Nashik' },
  { code: 'CL024', name: 'Harper Moore', mobile: '9876543233', email: 'harper@example.com', city: 'Faridabad' },
  { code: 'CL025', name: 'Lucas Taylor', mobile: '9876543234', email: 'lucas@example.com', city: 'Meerut' }
];

async function addMoreClients() {
  try {
    console.log('Adding more clients for pagination testing...');
    
    for (const client of sampleClients) {
      await db.insert(mstClient).values({
        code: client.code,
        name: client.name,
        mobile: client.mobile,
        email: client.email,
        dob: new Date('1990-01-01'),
        panNo: `PAN${client.code.slice(-3)}`,
        aadhaarNo: `12345678901${client.code.slice(-1)}`,
        branch: 'Main Branch',
        branchId: 1,
        address: `123 Street, ${client.city}`,
        city: client.city,
        pincode: '400001',
        referenceId: null,
        isActive: 1,
        createdById: 1,
        createdByUser: 'system',
        createdDate: new Date(),
        modifiedById: null,
        modifiedByUser: null,
        modifiedDate: null,
        deletedById: null,
        deletedByUser: null,
        deletedDate: null
      });
    }
    
    console.log(`Added ${sampleClients.length} more clients successfully!`);
    
  } catch (error) {
    console.error('Error adding clients:', error);
  }
}

addMoreClients().then(() => {
  console.log('Done');
  process.exit(0);
}).catch(error => {
  console.error('Failed:', error);
  process.exit(1);
});