import User from '../models/User.js';
import Block from '../models/Block.js';
import Report from '../models/Report.js';
import TempMessage from '../models/TempMessage.js';
import { calculateAge } from '../utils/ageValidator.js';

export const discoverUsers = async (req, res) => {
  try {
    const { gender, country, state, district, page = 1, limit = 20 } = req.query;
    const currentUserId = req.user._id;

    // Fetch blocked user IDs (both directions)
    const blocksInitiated = await Block.find({ blockerId: currentUserId }).select('blockedUserId');
    const blocksReceived = await Block.find({ blockedUserId: currentUserId }).select('blockerId');

    const blockedUserIds = [
      ...blocksInitiated.map((b) => b.blockedUserId.toString()),
      ...blocksReceived.map((b) => b.blockerId.toString()),
    ];

    const query = {
      _id: { $ne: currentUserId, $nin: blockedUserIds },
      accountStatus: 'active',
      ageVerified: true,
      'privacySettings.discoverable': true,
    };

    if (gender && gender.toLowerCase() !== 'everyone' && gender.toLowerCase() !== 'all') {
      query.gender = gender.toLowerCase();
    }

    if (country) {
      query.country = country;
    }

    if (state && state.toLowerCase() !== 'all') {
      query.state = state;
    }

    if (district && district.toLowerCase() !== 'all') {
      query.district = district;
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-dob -sessionToken')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      User.countDocuments(query),
    ]);

    const publicProfiles = users.map((user) => user.toPublicJSON());

    return res.json({
      users: publicProfiles,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Discover users error:', error);
    return res.status(500).json({ error: 'Failed to discover users.' });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user._id;

    if (id === currentUserId.toString()) {
      return res.json({ user: req.user.toPublicJSON() });
    }

    const isBlocked = await Block.findOne({
      $or: [
        { blockerId: currentUserId, blockedUserId: id },
        { blockerId: id, blockedUserId: currentUserId },
      ],
    });

    if (isBlocked) {
      return res.status(404).json({ error: 'User profile unavailable.' });
    }

    const targetUser = await User.findById(id).select('-dob -sessionToken');
    if (!targetUser || targetUser.accountStatus !== 'active') {
      return res.status(404).json({ error: 'User not found or inactive.' });
    }

    return res.json({ user: targetUser.toPublicJSON() });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve profile.' });
  }
};

export const updateProfileAndPrivacy = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    const { username, gender, country, state, district, dob, publicKey, privacySettings } = req.body;

    // Optional Username update
    if (username && username.trim() !== user.username) {
      const trimmed = username.trim();
      if (trimmed.length < 3 || trimmed.length > 30 || !/^[a-zA-Z0-9_]+$/.test(trimmed)) {
        return res.status(400).json({ error: 'Username must be 3-30 characters (letters, numbers, underscores).' });
      }
      const norm = trimmed.toLowerCase();
      const existing = await User.findOne({ usernameNormalized: norm, _id: { $ne: user._id } });
      if (existing) {
        return res.status(400).json({ error: 'Username handle is already taken.' });
      }
      user.username = trimmed;
      user.usernameNormalized = norm;
    }

    // Optional DOB update (re-verifies age >= 18)
    if (dob) {
      const updatedAge = calculateAge(dob);
      if (updatedAge < 18) {
        return res.status(400).json({ error: 'Age verification failed. You must be at least 18 years old.' });
      }
      user.dob = new Date(dob);
      user.ageVerified = true;
    }

    if (gender) user.gender = gender;
    if (country) user.country = country;
    if (state) user.state = state;
    if (district) user.district = district;
    if (publicKey !== undefined) user.publicKey = publicKey;

    if (privacySettings) {
      user.privacySettings = {
        ...user.privacySettings.toObject(),
        ...privacySettings,
      };
    }

    await user.save();

    return res.json({
      message: 'Profile updated successfully.',
      user: {
        ...user.toPublicJSON(),
        privacySettings: user.privacySettings,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ error: 'Failed to update settings.' });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;

    // Perform complete purge of user session & stored profile data
    await Promise.all([
      User.findByIdAndDelete(userId),
      Block.deleteMany({ $or: [{ blockerId: userId }, { blockedUserId: userId }] }),
      Report.deleteMany({ reporterId: userId }),
      TempMessage.deleteMany({ $or: [{ senderId: userId }, { recipientId: userId }] }),
    ]);

    res.clearCookie('sessionToken');
    return res.json({ message: 'Your profile and associated data have been permanently deleted.' });
  } catch (error) {
    console.error('Account deletion error:', error);
    return res.status(500).json({ error: 'Failed to delete profile.' });
  }
};
