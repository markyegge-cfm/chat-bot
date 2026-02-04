import { type Request, type Response } from 'express';
import firebaseService from '../services/firebaseService';

const SETTINGS_DOC = 'config/widgetSettings';

interface WidgetSettings {
  greetingMessage: string;
  suggestions: string[];
}

const defaultSettings: WidgetSettings = {
  greetingMessage: 'Hi! How can I support you today?',
  suggestions: [
    'Learn About Our Courses',
    'Help Me Choose a Program',
    'Watch Free Training'
  ]
};

export async function getWidgetSettings(req: Request, res: Response) {
  try {
    const db = firebaseService.getDb();
    if (!db) {
      await firebaseService.initialize();
    }

    const docRef = firebaseService.getDb()!.doc(SETTINGS_DOC);
    const doc = await docRef.get();

    if (doc.exists) {
      res.json({
        success: true,
        data: doc.data() as WidgetSettings
      });
    } else {
      // Return default settings if not configured yet
      res.json({
        success: true,
        data: defaultSettings
      });
    }
  } catch (error) {
    console.error('Error fetching widget settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch widget settings'
    });
  }
}

export async function updateWidgetSettings(req: Request, res: Response) {
  try {
    const { greetingMessage, suggestions } = req.body;

    // Validation
    if (!greetingMessage || typeof greetingMessage !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Greeting message is required and must be a string'
      });
    }

    if (!Array.isArray(suggestions) || suggestions.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Suggestions must be a non-empty array'
      });
    }

    if (suggestions.length > 5) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 5 suggestions allowed'
      });
    }

    // Check each suggestion is a non-empty string
    for (const suggestion of suggestions) {
      if (typeof suggestion !== 'string' || suggestion.trim() === '') {
        return res.status(400).json({
          success: false,
          error: 'All suggestions must be non-empty strings'
        });
      }
    }

    const settings: WidgetSettings = {
      greetingMessage: greetingMessage.trim(),
      suggestions: suggestions.map(s => s.trim())
    };

    const db = firebaseService.getDb();
    if (!db) {
      await firebaseService.initialize();
    }

    const docRef = firebaseService.getDb()!.doc(SETTINGS_DOC);
    await docRef.set(settings, { merge: true });

    res.json({
      success: true,
      data: settings,
      message: 'Widget settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating widget settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update widget settings'
    });
  }
}
