import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';
const JWT_EXPIRES_IN = '1h';
const JWT_RESET_EXPIRES_IN = '15m';

export function generateToken(payload: object, expiresIn: string = JWT_EXPIRES_IN) {
  return jwt.sign(payload, JWT_SECRET as string, { expiresIn } as jwt.SignOptions);
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

export function generateResetToken(email: string) {
  return generateToken({ email, type: 'reset' }, JWT_RESET_EXPIRES_IN);
}

// JWT Authentication Middleware
export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }

  (req as any).user = decoded;
  next();
}

// Optional authentication middleware (doesn't fail if no token)
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      (req as any).user = decoded;
    }
  }
  
  next();
}

// Simple login check middleware (only checks if user is logged in)
export function checkLoggedIn(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Please log in to access this resource' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Please log in to access this resource' });
  }

  (req as any).user = decoded;
  next();
}

// Parse user information from headers (no token required).
// Expected headers:
// - x-user-role: role string (e.g. 'admin', 'editor')
// - x-user-id: optional user id (UUID or string) used for createdBy/updatedBy fields
export function parseUserFromHeaders(req: Request, _res: Response, next: NextFunction) {
  const roleHeader = req.headers['x-user-role'];
  const idHeader = req.headers['x-user-id'];

  const role = Array.isArray(roleHeader) ? roleHeader[0] : roleHeader;
  const id = Array.isArray(idHeader) ? idHeader[0] : idHeader;

  if (role || id) {
    (req as any).user = {
      role: role as string | undefined,
      id: id as string | undefined,
    };
  }

  next();
}

// Middleware factory to require one of the provided roles.
export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    const role = user && user.role;

    if (!role) {
      return res.status(403).json({ error: 'Forbidden: role header missing' });
    }

    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ error: 'Forbidden: insufficient role' });
    }

    next();
  };
}
