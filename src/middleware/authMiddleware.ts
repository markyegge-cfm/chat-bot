import { NextFunction, Request, Response } from 'express';
import firebaseService from '../services/firebaseService';

// Extend Express Request to include user info
export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email: string;
    role: string;
  };
}

export const authenticateAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No auth header or invalid format');
      return res.status(401).json({ 
        success: false, 
        error: 'Unauthorized: No token provided' 
      });
    }

    const token = authHeader.split('Bearer ')[1];
    
    if (!token || token.trim() === '') {
      console.log('❌ Empty token after splitting');
      return res.status(401).json({ 
        success: false, 
        error: 'Unauthorized: Invalid token format' 
      });
    }
    
    console.log('🔑 Token received (first 20 chars):', token.substring(0, 20) + '...');
    
    // Verify using our FirebaseService
    const user = await firebaseService.verifyAdminToken(token);
    
    // Attach user to request for use in route handlers
    req.user = user;
    
    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    return res.status(403).json({ 
      success: false, 
      error: 'Unauthorized: Invalid token or insufficient permissions' 
    });
  }
};