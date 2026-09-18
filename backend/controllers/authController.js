import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { is18OrOlder, calculateAge } from '../utils/ageValidator.js';

const generateSessionToken = (userId) => {
  return jwt.sign(
    { id: userId, sessionUuid: crypto.randomUUID() },
    process.env.JWT_SECRET || 'privacy_dating_secret_key_18plus',
    { expiresIn: '90d' }
  );
};

export const createProfile = async (req, res) => {
  try {
    const {
      username,
      gender,
      country,
      state,
      district,
      dob,
      confirm18Plus,
      confirmTerms,
      publicKey,
    } = req.body;

    // 1. Validate mandatory input fields
    if (!username || !gender || !country || !state || !district || !dob) {
      return res.status(400).json({ error: 'Please fill in all required profile fields.' });
    }

    if (!confirm18Plus || !confirmTerms) {
      return res.status(400).json({
        error: 'You must confirm that you are at least 18 years old and agree to the Terms & Conditions.',
      });
    }

    // 2. BACKEND AGE VERIFICATION (MUST INDEPENDENTLY VALIDATE DOB)
    const userAge = calculateAge(dob);
    if (userAge < 18) {
      return res.status(400).json({
        error: 'This platform is available only to people aged 18 and above.',
      });
    }

    // 3. Username formatting and uniqueness
    const trimmedUsername = username.trim();
    if (trimmedUsername.length < 3 || trimmedUsername.length > 30) {
      return res.status(400).json({ error: 'Username must be between 3 and 30 characters.' });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
      return res.status(400).json({
        error: 'Username can only contain letters, numbers, and underscores.',
      });
    }

    const usernameNormalized = trimmedUsername.toLowerCase();
    const existingUser = await User.findOne({ usernameNormalized });
    if (existingUser) {
      return res.status(400).json({ error: 'This username is already taken. Please choose another handle.' });
    }

    // 4. Generate cryptographically random session identity
    const initialSessionId = crypto.randomUUID();

    // 5. Save minimal temporary user profile
    const user = await User.create({
      username: trimmedUsername,
      usernameNormalized,
      sessionToken: initialSessionId,
      gender,
      country,
      state,
      district,
      dob: new Date(dob),
      ageVerified: true,
      publicKey: publicKey || '',
    });

    const token = generateSessionToken(user._id);
    user.sessionToken = token;
    await user.save();

    // Set secure HttpOnly cookie
    res.cookie('sessionToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 90 * 24 * 60 * 60 * 1000, // 90 days
    });

    return res.status(201).json({
      message: 'Profile created successfully. Welcome to Aura!',
      token,
      user: {
        ...user.toPublicJSON(),
        privacySettings: user.privacySettings,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Create profile error:', error);
    return res.status(500).json({ error: 'Internal server error while creating profile.' });
  }
};

export const getSession = async (req, res) => {
  try {
    const user = req.user;
    return res.json({
      user: {
        ...user.toPublicJSON(),
        privacySettings: user.privacySettings,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to restore session.' });
  }
};

export const clearSession = async (req, res) => {
  res.clearCookie('sessionToken');
  return res.json({ message: 'Session cleared successfully from this device.' });
};
