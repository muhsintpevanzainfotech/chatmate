import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.sessionToken) {
      token = req.cookies.sessionToken;
    }

    if (!token) {
      return res.status(401).json({ error: 'No active session token found' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'privacy_dating_secret_key_18plus');
    } catch (e) {
      // Fallback: check direct sessionToken matching
    }

    const query = decoded ? { _id: decoded.id } : { sessionToken: token };
    const user = await User.findOne(query);

    if (!user) {
      return res.status(401).json({ error: 'Session is no longer valid' });
    }

    if (user.accountStatus === 'banned') {
      return res.status(403).json({ error: 'This profile has been permanently banned' });
    }

    if (user.accountStatus === 'suspended') {
      return res.status(403).json({ error: 'This profile is currently suspended' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Session verification failed' });
  }
};

export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Access restricted to platform administrators' });
  }
};
