import { Router } from "express";
import { db } from "./db";
import { contentCategories, contentItems, offers, users } from "../shared/schema";
import { eq, desc, and } from "drizzle-orm";
import multer from "multer";
import path from "path";
import fs from "fs";
import { parseUserFromHeaders, requireRole, verifyToken } from "./jwtUtils";
import type { Request, Response, NextFunction } from "express";

const router = Router();

// parse user role/id from headers for role-based checks (no JWT required)
router.use(parseUserFromHeaders);

// Enhanced role checking that supports both JWT and headers
function flexibleRequireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    let user = (req as any).user;
    let role = user?.role;

    // If no role from headers, try JWT token
    if (!role) {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      
      if (token) {
        const decoded = verifyToken(token);
        if (decoded) {
          user = decoded;
          role = (decoded as any).role;
          (req as any).user = decoded;
        }
      }
    }

    if (!role) {
      return res.status(403).json({ error: 'Forbidden: authentication required' });
    }

    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ error: 'Forbidden: insufficient permissions' });
    }

    next();
  };
}
// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedExts = /\.(jpeg|jpg|png|gif|mp4|mov|avi|webm)$/i;
    const allowedMimes = /^(image|video)\//;
    
    if (allowedExts.test(file.originalname) && allowedMimes.test(file.mimetype)) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and videos are allowed'));
    }
  }
});

// Get all content categories
router.get("/categories", async (req, res) => {
  try {
    const categories = await db.select().from(contentCategories).where(eq(contentCategories.isActive, 1));
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// Create content category
router.post("/categories", async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name?.trim()) {
      return res.status(400).json({ error: "Category name is required" });
    }

    const [category] = await db.insert(contentCategories).values({
      name: name.trim(),
      description: description?.trim() || null,
    });
    res.json({ id: category.insertId, message: "Category created successfully" });
  } catch (error) {
    console.error('Category creation error:', error);
    res.status(500).json({ error: "Failed to create category", details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Get all content items
// Mounted at `/api/content` so this responds to GET /api/content
router.get("/", async (req, res) => {
  try {
    const { categoryId, mediaType } = req.query;
    let whereConditions = [];
    if (categoryId) {
      whereConditions.push(eq(contentItems.categoryId, categoryId as string));
    }
    if (mediaType) {
      whereConditions.push(eq(contentItems.mediaType, mediaType as string));
    }

    const baseQuery = db.select({
      id: contentItems.id,
      title: contentItems.title,
      description: contentItems.description,
      content: contentItems.content,
      mediaType: contentItems.mediaType,
      mediaUrl: contentItems.mediaUrl,
      thumbnailUrl: contentItems.thumbnailUrl,
      displayOrder: contentItems.displayOrder,
      isActive: contentItems.isActive,
      isPublished: contentItems.isPublished,
      publishedAt: contentItems.publishedAt,
      createdAt: contentItems.createdAt,
      categoryName: contentCategories.name,
      creatorName: users.firstName,
    })
    .from(contentItems)
    .leftJoin(contentCategories, eq(contentItems.categoryId, contentCategories.id))
    .leftJoin(users, eq(contentItems.createdBy, users.id));
    
    const content = await (whereConditions.length > 0 
      ? baseQuery.where(whereConditions.length === 1 ? whereConditions[0] : and(...whereConditions)).orderBy(desc(contentItems.createdAt))
      : baseQuery.orderBy(desc(contentItems.createdAt)));
    res.json(content);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch content" });
  }
});

// Create content item
// Mounted at `/api/content` so this responds to POST /api/content
router.post("/", upload.single('media'), async (req, res) => {
  try {
    const { title, description, content, categoryId, mediaType, displayOrder, isActive, isPublished } = req.body;
    const userId = (req as any).user?.id || null;
    
    console.log('Content creation - isPublished received:', isPublished, 'type:', typeof isPublished);
    console.log('Content creation - isActive received:', isActive, 'type:', typeof isActive);
    
    // Validation
    if (!title?.trim()) {
      return res.status(400).json({ error: "Title is required" });
    }
    if (!mediaType?.trim()) {
      return res.status(400).json({ error: "Media type is required" });
    }
    
    let mediaUrl = null;
    if (req.file) {
      mediaUrl = `/uploads/${req.file.filename}`;
    }

    const isPublishedValue = isPublished === 'true' || isPublished === '1' || parseInt(isPublished) === 1;
    const isActiveValue = isActive === 'true' || isActive === '1' || parseInt(isActive) === 1 ? 1 : 0;
    console.log('Content creation - Final values: isPublished =', isPublishedValue ? 1 : 0, 'isActive =', isActiveValue);
    
    const [contentItem] = await db.insert(contentItems).values({
      title: title.trim(),
      description: description?.trim() || null,
      content: content?.trim() || null,
      categoryId: categoryId?.trim() || null,
      mediaType: mediaType.trim(),
      mediaUrl,
      displayOrder: parseInt(displayOrder) || 0,
      isActive: isActiveValue,
      isPublished: isPublishedValue ? 1 : 0,
      publishedAt: isPublishedValue ? new Date() : null,
      createdBy: userId,
    });

    res.json({ id: contentItem.insertId, message: "Content created successfully" });
  } catch (error) {
    console.error('Content creation error:', error);
    res.status(500).json({ error: "Failed to create content", details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Update content item
// Mounted at `/api/content` so this responds to PUT /api/content/:id
router.put("/:id", upload.single('media'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, content, categoryId, mediaType, displayOrder, isActive, isPublished, removeExistingFile } = req.body;
    
    console.log('Content update - isPublished received:', isPublished, 'type:', typeof isPublished);
    console.log('Content update - isActive received:', isActive, 'type:', typeof isActive);
    
    if (!id?.trim()) {
      return res.status(400).json({ error: "Content ID is required" });
    }
    if (!title?.trim()) {
      return res.status(400).json({ error: "Title is required" });
    }
    if (!mediaType?.trim()) {
      return res.status(400).json({ error: "Media type is required" });
    }
    
    const isPublishedValue = isPublished === 'true' || isPublished === '1' || parseInt(isPublished) === 1;
    const isActiveValue = isActive === 'true' || isActive === '1' || parseInt(isActive) === 1 ? 1 : 0;
    console.log('Content update - Final values: isPublished =', isPublishedValue ? 1 : 0, 'isActive =', isActiveValue);
    
    const updateData: any = {
      title: title.trim(),
      description: description?.trim() || null,
      content: content?.trim() || null,
      categoryId: categoryId?.trim() || null,
      mediaType: mediaType.trim(),
      displayOrder: parseInt(displayOrder) || 0,
      isActive: isActiveValue,
      isPublished: isPublishedValue ? 1 : 0,
      updatedAt: new Date(),
    };

    if (req.file) {
      updateData.mediaUrl = `/uploads/${req.file.filename}`;
    } else if (removeExistingFile === 'true') {
      updateData.mediaUrl = null;
    }

    if (isPublishedValue) {
      updateData.publishedAt = new Date();
    } else {
      updateData.publishedAt = null;
    }

    const result = await db.update(contentItems).set(updateData).where(eq(contentItems.id, id));
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Content not found" });
    }
    
    res.json({ message: "Content updated successfully" });
  } catch (error) {
    console.error('Content update error:', error);
    res.status(500).json({ error: "Failed to update content", details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Delete content item
// Mounted at `/api/content` so this responds to DELETE /api/content/:id
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(contentItems).where(eq(contentItems.id, id));
    res.json({ message: "Content deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete content" });
  }
});

// Get all offers
router.get("/offers", async (req, res) => {
  try {
    const { active } = req.query;
    const baseQuery = db.select({
      id: offers.id,
      title: offers.title,
      description: offers.description,
      imageUrl: offers.imageUrl,
      linkUrl: offers.linkUrl,
      validFrom: offers.validFrom,
      validTo: offers.validTo,
      displayOrder: offers.displayOrder,
      isActive: offers.isActive,
      createdAt: offers.createdAt,
      creatorName: users.firstName,
    })
    .from(offers)
    .leftJoin(users, eq(offers.createdBy, users.id));

    const offersList = await (active === 'true'
      ? baseQuery.where(eq(offers.isActive, 1)).orderBy(offers.displayOrder, desc(offers.createdAt))
      : baseQuery.orderBy(offers.displayOrder, desc(offers.createdAt)));
    res.json(offersList);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch offers" });
  }
});

// Create offer
router.post("/offers", upload.single('image'), async (req, res) => {
  try {
    const { title, description, linkUrl, validFrom, validTo, displayOrder, isActive } = req.body;
    const userId = (req as any).user?.id || null;
    
    // Validation
    if (!title?.trim()) {
      return res.status(400).json({ error: "Title is required" });
    }
    
    let imageUrl = null;
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }

    // Date validation
    let validFromDate = null;
    let validToDate = null;
    
    if (validFrom) {
      validFromDate = new Date(validFrom);
      if (isNaN(validFromDate.getTime())) {
        return res.status(400).json({ error: "Invalid validFrom date" });
      }
    }
    
    if (validTo) {
      validToDate = new Date(validTo);
      if (isNaN(validToDate.getTime())) {
        return res.status(400).json({ error: "Invalid validTo date" });
      }
    }
    
    if (validFromDate && validToDate && validFromDate >= validToDate) {
      return res.status(400).json({ error: "validFrom must be before validTo" });
    }

    const [offer] = await db.insert(offers).values({
      title: title.trim(),
      description: description?.trim() || null,
      imageUrl,
      linkUrl: linkUrl?.trim() || null,
      validFrom: validFromDate,
      validTo: validToDate,
      displayOrder: parseInt(displayOrder) || 0,
      isActive: isActive === 'true' || isActive === '1' || parseInt(isActive) === 1 ? 1 : 0,
      createdBy: userId,
    });

    res.json({ id: offer.insertId, message: "Offer created successfully" });
  } catch (error) {
    console.error('Offer creation error:', error);
    res.status(500).json({ error: "Failed to create offer", details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Update offer
router.put("/offers/:id", upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, linkUrl, validFrom, validTo, displayOrder, isActive, removeExistingFile } = req.body;
    
    if (!id?.trim()) {
      return res.status(400).json({ error: "Offer ID is required" });
    }
    if (!title?.trim()) {
      return res.status(400).json({ error: "Title is required" });
    }
    
    // Date validation
    let validFromDate = null;
    let validToDate = null;
    
    if (validFrom) {
      validFromDate = new Date(validFrom);
      if (isNaN(validFromDate.getTime())) {
        return res.status(400).json({ error: "Invalid validFrom date" });
      }
    }
    
    if (validTo) {
      validToDate = new Date(validTo);
      if (isNaN(validToDate.getTime())) {
        return res.status(400).json({ error: "Invalid validTo date" });
      }
    }
    
    if (validFromDate && validToDate && validFromDate >= validToDate) {
      return res.status(400).json({ error: "validFrom must be before validTo" });
    }
    
    const updateData: any = {
      title: title.trim(),
      description: description?.trim() || null,
      linkUrl: linkUrl?.trim() || null,
      validFrom: validFromDate,
      validTo: validToDate,
      displayOrder: parseInt(displayOrder) || 0,
      isActive: isActive === 'true' || isActive === '1' || parseInt(isActive) === 1 ? 1 : 0,
      updatedAt: new Date(),
    };

    if (req.file) {
      updateData.imageUrl = `/uploads/${req.file.filename}`;
    } else if (removeExistingFile === 'true') {
      updateData.imageUrl = null;
    }

    const result = await db.update(offers).set(updateData).where(eq(offers.id, id));
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Offer not found" });
    }
    
    res.json({ message: "Offer updated successfully" });
  } catch (error) {
    console.error('Offer update error:', error);
    res.status(500).json({ error: "Failed to update offer", details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Delete offer
router.delete("/offers/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(offers).where(eq(offers.id, id));
    res.json({ message: "Offer deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete offer" });
  }
});

// Get published content for public display
router.get("/public/content", async (req, res) => {
  try {
    const content = await db.select()
      .from(contentItems)
      .where(
        and(
          eq(contentItems.isActive, 1),
          eq(contentItems.isPublished, 1)
        )
      )
      .orderBy(contentItems.displayOrder, desc(contentItems.publishedAt));
    
    console.log('Public content query result:', content);
    res.json(content);
  } catch (error) {
    console.error('Public content fetch error:', error);
    res.status(500).json({ error: "Failed to fetch public content" });
  }
});

// Get active offers for public display
router.get("/public/offers", async (req, res) => {
  try {
    const now = new Date();
    const activeOffers = await db.select()
      .from(offers)
      .where(eq(offers.isActive, 1))
      .orderBy(offers.displayOrder, desc(offers.createdAt));
    
    console.log('Public offers query result:', activeOffers);
    res.json(activeOffers);
  } catch (error) {
    console.error('Public offers fetch error:', error);
    res.status(500).json({ error: "Failed to fetch active offers" });
  }
});

export { router as contentRoutes };