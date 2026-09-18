import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required for admin login.' });
    }

    const usernameNormalized = username.trim().toLowerCase();
    const user = await User.findOne({ usernameNormalized, role: 'admin' });

    if (!user) {
      return res.status(401).json({ error: 'Invalid admin credentials.' });
    }

    // Generate Admin JWT Token
    const token = jwt.sign(
      { id: user._id, role: 'admin' },
      process.env.JWT_SECRET || 'privacy_dating_secret_key_18plus',
      { expiresIn: '7d' }
    );

    return res.json({
      message: 'Admin authentication successful.',
      token,
      user: {
        _id: user._id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(500).json({ error: 'Internal server error during admin login.' });
  }
};
