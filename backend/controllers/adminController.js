import User from '../models/User.js';
import Report from '../models/Report.js';
import { onlineSocketsMap } from '../socket/socketHandler.js';
import { getMatchmakingStats } from '../services/matchmaking/matchQueue.js';

export const getStats = async (req, res) => {
  try {
    const { searchingQueueCount, activeMatchesCount } = getMatchmakingStats();

    const [totalUsers, activeUsers, suspendedUsers, bannedUsers, pendingReports] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ accountStatus: 'active' }),
      User.countDocuments({ accountStatus: 'suspended' }),
      User.countDocuments({ accountStatus: 'banned' }),
      Report.countDocuments({ status: 'pending' }),
    ]);

    return res.json({
      totalUsers,
      activeUsers,
      suspendedUsers,
      bannedUsers,
      pendingReports,
      onlineNow: onlineSocketsMap ? onlineSocketsMap.size : 0,
      searchingQueueCount,
      activeMatchesCount,
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    return res.status(500).json({ error: 'Failed to retrieve admin operational stats.' });
  }
};

export const getUsers = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status) {
      query.accountStatus = status;
    }

    if (search) {
      query.usernameNormalized = { $regex: search.trim().toLowerCase(), $options: 'i' };
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      User.find(query)
        .select('username gender country state district accountStatus role createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      User.countDocuments(query),
    ]);

    return res.json({
      users,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch user list for admin.' });
  }
};

export const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'suspended', 'banned'].includes(status)) {
      return res.status(400).json({ error: 'Invalid account status specified.' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ error: 'Cannot modify status of an administrator account.' });
    }

    user.accountStatus = status;
    await user.save();

    return res.json({ message: `User status updated to ${status}.`, user });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update user status.' });
  }
};

export const getReports = async (req, res) => {
  try {
    const { status, reason, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (reason) query.reason = reason;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [reports, total] = await Promise.all([
      Report.find(query)
        .populate('reporterId', 'username gender state district')
        .populate('reportedUserId', 'username gender state district accountStatus')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Report.countDocuments(query),
    ]);

    return res.json({
      reports,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve reports.' });
  }
};

export const updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'reviewed', 'dismissed', 'actioned'].includes(status)) {
      return res.status(400).json({ error: 'Invalid report status.' });
    }

    const report = await Report.findByIdAndUpdate(id, { status }, { new: true });
    if (!report) {
      return res.status(404).json({ error: 'Report not found.' });
    }

    return res.json({ message: 'Report status updated successfully.', report });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update report.' });
  }
};
