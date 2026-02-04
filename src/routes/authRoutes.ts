import axios from 'axios';
import { Request, Response, Router } from 'express';
import admin from 'firebase-admin';
import emailService from '../services/emailService';
import firebaseService from '../services/firebaseService';

const router = Router();

const FIREBASE_AUTH_URL = 'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword';
const API_KEY = process.env.FIREBASE_API_KEY;

/**
 * POST /api/auth/login
 * Backend login endpoint - avoids frontend API key issues
 * 
 * Request body:
 * {
 *   "email": "admin@example.com",
 *   "password": "admin1234"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "token": "eyJhbGciOiJSUzI1NiIs...",
 *   "user": {
 *     "uid": "abc123",
 *     "email": "admin@example.com",
 *     "role": "admin"
 *   }
 * }
 */
router.post('/api/auth/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const cleanApiKey = API_KEY?.trim()?.replace(/['"]/g, ''); // Remove quotes or spaces

    if (!email || !password) {
      (res as any).status(400).json({
        success: false,
        error: 'Email and password are required',
      });
      return;
    }

    if (!cleanApiKey) {
      console.error('❌ FIREBASE_API_KEY is empty or missing in .env');
      (res as any).status(500).json({
        success: false,
        error: 'Authentication service not configured (Missing API Key)',
      });
      return;
    }

    console.log(`🔑 Attempting login with API Key (start): ${cleanApiKey.substring(0, 5)}...`);

    // Call Firebase Auth REST API
    try {
      const response = await axios.post(`${FIREBASE_AUTH_URL}?key=${cleanApiKey}`, {
        email,
        password,
        returnSecureToken: true
      });

      const { idToken, refreshToken, localId, email: userEmail } = response.data;

      console.log(`✅ Login successful for ${email}`);

      (res as any).json({
        success: true,
        token: idToken,
        refreshToken: refreshToken,
        user: {
          uid: localId,
          email: userEmail,
          role: 'admin',
        },
      });
    } catch (fireError: any) {
      const fbError = fireError.response?.data?.error?.message || 'Login failed';
      console.error(`❌ Login attempt failed for ${email}: ${fbError}`);

      let errorMsg = 'Invalid email or password';
      if (fbError === 'EMAIL_NOT_FOUND' || fbError === 'INVALID_PASSWORD') {
        errorMsg = 'Invalid email or password';
      } else if (fbError === 'USER_DISABLED') {
        errorMsg = 'This account has been disabled';
      } else if (fbError === 'TOO_MANY_ATTEMPTS_TRY_LATER') {
        errorMsg = 'Too many failed attempts. Please try again later.';
      }

      (res as any).status(401).json({
        success: false,
        error: errorMsg,
      });
    }
  } catch (error: any) {
    console.error('Login router error:', error);
    (res as any).status(500).json({
      success: false,
      error: 'An internal error occurred during login',
    });
  }
});

/**
 * POST /api/auth/forgot-password
 * Trigger a password reset email via Admin SDK
 */
router.post('/api/auth/forgot-password', async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  if (!email) {
    (res as any).status(400).json({ success: false, error: 'Email is required' });
    return;
  }

  try {
    console.log(`🔐 Password reset requested for: ${email}`);
    
    // 1. Verify service is initialized
    if (!firebaseService.isInitialized()) {
      await firebaseService.initialize();
    }

    // 2. Check if user exists first
    try {
      await admin.auth().getUserByEmail(email);
      console.log(`✅ User found: ${email}`);
    } catch (userError: any) {
      console.warn(`⚠️ User not found: ${email}`);
      // Return generic success to prevent email enumeration
      (res as any).json({
        success: true,
        message: 'If an account exists for this email, you will receive a reset link shortly.'
      });
      return;
    }

    // 3. Generate Reset Link via Firebase Admin
    console.log('🔗 Generating password reset link...');
    const resetLink = await admin.auth().generatePasswordResetLink(email, {
      // Optional: Redirect back to login after reset
      url: `${process.env.APP_URL || 'http://localhost:3000'}/admin/login`
    });
    console.log('✅ Reset link generated successfully');

    // 4. Send email via our EmailService
    console.log('📧 Attempting to send password reset email...');
    const sent = await emailService.sendPasswordResetEmail(email, resetLink);

    if (sent) {
      console.log(`✅ Password reset email sent successfully to: ${email}`);
      (res as any).json({
        success: true,
        message: 'If an account exists for this email, you will receive a reset link shortly.'
      });
    } else {
      console.error('❌ Email service returned false - email not sent');
      throw new Error('Failed to send email');
    }
  } catch (error: any) {
    console.error('❌ Forgot password error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    // Safety: Always return success message to avoid email enumeration
    (res as any).json({
      success: true,
      message: 'If an account exists for this email, you will receive a reset link shortly.'
    });
  }
});

/**
 * POST /api/auth/refresh-token
 * Exchange a refreshToken for a new idToken
 */
router.post('/api/auth/refresh-token', async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    const cleanApiKey = API_KEY?.trim()?.replace(/['"]/g, '');

    if (!refreshToken) {
      (res as any).status(400).json({ success: false, error: 'Refresh token required' });
      return;
    }

    const refreshUrl = `https://securetoken.googleapis.com/v1/token?key=${cleanApiKey}`;

    const response = await axios.post(refreshUrl, {
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    });

    // Firebase returns { access_token, expires_in, refresh_token, token_type, user_id, project_id }
    const { access_token, refresh_token, expires_in, user_id } = response.data;

    // Get real user info from Admin SDK to ensure email is current
    const userRecord = await admin.auth().getUser(user_id);

    (res as any).json({
      success: true,
      token: access_token,
      refreshToken: refresh_token,
      expiresIn: expires_in,
      user: {
        uid: user_id,
        email: userRecord.email,
        role: 'admin'
      }
    });

  } catch (error: any) {
    console.error('Refresh token error:', error.response?.data || error.message);
    (res as any).status(401).json({
      success: false,
      error: 'Session expired. Please login again.'
    });
  }
});

/**
 * POST /api/auth/verify
 * Verify if an existing token is valid
 */
router.post('/api/auth/verify', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body;

    if (!token) {
      (res as any).status(400).json({
        success: false,
        error: 'Token is required',
      });
      return;
    }

    try {
      // Decode the base64 token
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8')) as any;

      // Check if token is expired
      if (decoded.exp && decoded.exp < Date.now()) {
        (res as any).status(401).json({
          success: false,
          error: 'Token expired',
        });
        return;
      }

      (res as any).json({
        success: true,
        user: {
          uid: decoded.email,
          email: decoded.email,
          role: decoded.role,
        },
      });
    } catch (tokenError) {
      (res as any).status(401).json({
        success: false,
        error: 'Invalid token format',
      });
    }
  } catch (error: any) {
    console.error('Token verification error:', error);
    (res as any).status(401).json({
      success: false,
      error: 'Token verification failed',
    });
  }
});

export default router;
