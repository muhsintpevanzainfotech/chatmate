import Block from '../models/Block.js';
import Report from '../models/Report.js';
import User from '../models/User.js';

export const blockUser = async (req, res) => {
  try {
    const { id: blockedUserId } = req.params;
    const blockerId = req.user._id;

    if (blockerId.toString() === blockedUserId) {
      return res.status(400).json({ error: 'You cannot block yourself.' });
    }

    const targetUser = await User.findById(blockedUserId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User to block does not exist.' });
    }

    await Block.findOneAndUpdate(
      { blockerId, blockedUserId },
      { blockerId, blockedUserId },
      { upsert: true, new: true }
    );

    return res.json({ message: 'User blocked successfully.' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to block user.' });
  }
};

export const unblockUser = async (req, res) => {
  try {
    const { id: blockedUserId } = req.params;
    const blockerId = req.user._id;

    await Block.findOneAndDelete({ blockerId, blockedUserId });

    return res.json({ message: 'User unblocked successfully.' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to unblock user.' });
  }
};

export const getBlockedUsers = async (req, res) => {
  try {
    const blockerId = req.user._id;
    const blocks = await Block.find({ blockerId }).populate('blockedUserId', 'username gender country state district');

    const blockedProfiles = blocks
      .filter((b) => b.blockedUserId)
      .map((b) => ({
        blockId: b._id,
        user: {
          _id: b.blockedUserId._id,
          username: b.blockedUserId.username,
          gender: b.blockedUserId.gender,
          state: b.blockedUserId.state,
          district: b.blockedUserId.district,
        },
        createdAt: b.createdAt,
      }));

    return res.json({ blockedUsers: blockedProfiles });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch blocked users list.' });
  }
};

export const createReport = async (req, res) => {
  try {
    const { reportedUserId, reason, description } = req.body;
    const reporterId = req.user._id;

    if (!reportedUserId || !reason) {
      return res.status(400).json({ error: 'Reported user ID and reason are required.' });
    }

    if (reporterId.toString() === reportedUserId) {
      return res.status(400).json({ error: 'You cannot report yourself.' });
    }

    const validReasons = [
      'spam',
      'harassment',
      'fake_profile',
      'inappropriate_behavior',
      'scam',
      'underage_concern',
      'other',
    ];

    if (!validReasons.includes(reason)) {
      return res.status(400).json({ error: 'Invalid report reason specified.' });
    }

    const report = await Report.create({
      reporterId,
      reportedUserId,
      reason,
      description: description ? description.trim().slice(0, 500) : '',
    });

    return res.status(201).json({
      message: 'Report submitted successfully. Thank you for helping keep our community safe.',
      reportId: report._id,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to submit report.' });
  }
};
