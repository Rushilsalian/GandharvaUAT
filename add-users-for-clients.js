import { db } from './server/db';
import { mstUser, mstClient } from './shared/schema';
import { eq } from 'drizzle-orm';

async function addUsersForClients() {
  try {
    console.log('Creating users for existing clients...');
    
    // Get all clients
    const clients = await db.select().from(mstClient);
    console.log(`Found ${clients.length} clients`);
    
    for (const client of clients) {
      // Check if user already exists for this client
      const existingUser = await db.select().from(mstUser).where(eq(mstUser.clientId, client.clientId));
      
      if (existingUser.length === 0) {
        const userName = client.name.toLowerCase().replace(/\s+/g, '_');
        await db.insert(mstUser).values({
          userName: userName,
          password: 'password123', // Default password
          email: client.email,
          mobile: client.mobile,
          roleId: 3, // Client role
          clientId: client.clientId,
          isActive: 1,
          createdById: 1,
          createdByUser: 'system',
          createdDate: new Date(),
          mobileVerified: null,
          emailVerified: null,
          modifiedById: null,
          modifiedByUser: null,
          modifiedDate: null,
          deletedById: null,
          deletedByUser: null,
          deletedDate: null
        });
        console.log(`Created user for client: ${client.name}`);
      }
    }
    
    console.log('Users creation completed!');
    
  } catch (error) {
    console.error('Error creating users:', error);
  }
}

addUsersForClients().then(() => {
  console.log('Done');
  process.exit(0);
}).catch(error => {
  console.error('Failed:', error);
  process.exit(1);
});