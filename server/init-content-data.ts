import { db } from "./db";
import { contentCategories, mstIndicator } from "../shared/schema";
import { eq } from "drizzle-orm";

export async function initContentData() {
  try {
    console.log('Initializing content management data...');

    // Check if categories already exist
    const existingCategories = await db.select().from(contentCategories);
    
    if (existingCategories.length === 0) {
      console.log('Creating default content categories...');
      
      const defaultCategories = [
        {
          name: "Financial Updates",
          description: "Latest financial news and market updates",
          isActive: 1
        },
        {
          name: "Investment Opportunities",
          description: "New investment products and opportunities",
          isActive: 1
        },
        {
          name: "Market Analysis",
          description: "Market trends and analysis reports",
          isActive: 1
        },
        {
          name: "Company News",
          description: "Company announcements and updates",
          isActive: 1
        },
        {
          name: "Educational Content",
          description: "Financial education and tips",
          isActive: 1
        }
      ];

      for (const category of defaultCategories) {
        await db.insert(contentCategories).values(category);
      }
      
      console.log('Default content categories created successfully');
    } else {
      console.log('Content categories already exist, skipping initialization');
    }

    console.log('Content management data initialization completed');
  } catch (error) {
    console.error('Error initializing content data:', error);
    throw error;
  }
}

// Run initialization if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initContentData()
    .then(() => {
      console.log('Content data initialization completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Content data initialization failed:', error);
      process.exit(1);
    });
}