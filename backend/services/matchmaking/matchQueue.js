import crypto from 'crypto';
import Block from '../../models/Block.js';

// In-memory waiting queues and active matches map
const waitingQueue = new Map();
const activeMatches = new Map(); // matchId -> { userA, userB, roomName, createdAt }
const userRecentMatches = new Map(); // userId -> Set(recentUserId)

/**
 * Add a user to the waiting queue
 */
export const addToQueue = (userSession) => {
  waitingQueue.set(userSession.userId, {
    ...userSession,
    joinedAt: new Date(),
  });
};

/**
 * Remove user from waiting queue
 */
export const removeFromQueue = (userId) => {
  waitingQueue.delete(userId);
};

/**
 * Record recent match pair
 */
export const addRecentMatch = (userAId, userBId) => {
  if (!userRecentMatches.has(userAId)) {
    userRecentMatches.set(userAId, new Set());
  }
  if (!userRecentMatches.has(userBId)) {
    userRecentMatches.set(userBId, new Set());
  }

  userRecentMatches.get(userAId).add(userBId);
  userRecentMatches.get(userBId).add(userAId);

  // Expire recent match memory after 30 seconds
  setTimeout(() => {
    userRecentMatches.get(userAId)?.delete(userBId);
    userRecentMatches.get(userBId)?.delete(userAId);
  }, 30 * 1000);
};

/**
 * Check if User A and User B preferences are mutually compatible
 * @param {Object} userA
 * @param {Object} userB
 * @param {Boolean} allowRecent - If true, allows reconnecting to same person if no others exist
 */
const isMutuallyCompatible = async (userA, userB, allowRecent = false) => {
  // 1. Prevent self-matching
  if (userA.userId === userB.userId) return false;

  // 2. Recent repeat match filter (ignored if allowRecent fallback is true)
  if (!allowRecent && userRecentMatches.get(userA.userId)?.has(userB.userId)) {
    return false;
  }

  // 3. Gender Compatibility Check
  const genderAOk =
    userA.genderPref === 'everyone' ||
    userA.genderPref === 'all' ||
    userA.genderPref === userB.gender;

  const genderBOk =
    userB.genderPref === 'everyone' ||
    userB.genderPref === 'all' ||
    userB.genderPref === userA.gender;

  if (!genderAOk || !genderBOk) return false;

  // 4. Place Compatibility Check
  const placeAOk =
    userA.placePref === 'all' ||
    userA.placePref === 'everyone' ||
    userA.placePref === userB.state ||
    userA.placePref === userB.country ||
    userA.placePref === userB.district;

  const placeBOk =
    userB.placePref === 'all' ||
    userB.placePref === 'everyone' ||
    userB.placePref === userA.state ||
    userB.placePref === userA.country ||
    userB.placePref === userA.district;

  if (!placeAOk || !placeBOk) return false;

  // 5. Block Check (Never pair blocked users)
  try {
    const isBlocked = await Block.findOne({
      $or: [
        { blockerId: userA.userId, blockedUserId: userB.userId },
        { blockerId: userB.userId, blockedUserId: userA.userId },
      ],
    });
    if (isBlocked) return false;
  } catch (err) {
    console.error('Block check error during matching:', err);
  }

  return true;
};

/**
 * Attempt to find a mutually compatible match for candidate user.
 * Pass 1: Prefers new strangers.
 * Pass 2 (Fallback): Reconnects to same person if no other users exist in queue.
 */
export const findMatch = async (candidateUser) => {
  // Pass 1: Try to find a new stranger (not in recent matches)
  for (const [waitingUserId, waitingUser] of waitingQueue.entries()) {
    if (await isMutuallyCompatible(candidateUser, waitingUser, false)) {
      waitingQueue.delete(candidateUser.userId);
      waitingQueue.delete(waitingUserId);

      const matchId = `match_${crypto.randomUUID()}`;
      const matchSession = {
        matchId,
        userA: candidateUser,
        userB: waitingUser,
        roomName: matchId,
        createdAt: new Date(),
      };

      activeMatches.set(matchId, matchSession);
      addRecentMatch(candidateUser.userId, waitingUser.userId);
      return matchSession;
    }
  }

  // Pass 2 (Fallback): If no other strangers exist in queue, connect to same person if available!
  for (const [waitingUserId, waitingUser] of waitingQueue.entries()) {
    if (await isMutuallyCompatible(candidateUser, waitingUser, true)) {
      waitingQueue.delete(candidateUser.userId);
      waitingQueue.delete(waitingUserId);

      const matchId = `match_${crypto.randomUUID()}`;
      const matchSession = {
        matchId,
        userA: candidateUser,
        userB: waitingUser,
        roomName: matchId,
        createdAt: new Date(),
      };

      activeMatches.set(matchId, matchSession);
      addRecentMatch(candidateUser.userId, waitingUser.userId);
      return matchSession;
    }
  }

  return null;
};

/**
 * End an active match session
 */
export const endMatchSession = (matchId) => {
  const match = activeMatches.get(matchId);
  if (match) {
    activeMatches.delete(matchId);
  }
  return match;
};

/**
 * Find active match by user ID
 */
export const getActiveMatchByUserId = (userId) => {
  for (const match of activeMatches.values()) {
    if (match.userA.userId === userId || match.userB.userId === userId) {
      return match;
    }
  }
  return null;
};

/**
 * Return live matchmaking statistics for admin metrics
 */
export const getMatchmakingStats = () => {
  return {
    searchingQueueCount: waitingQueue.size,
    activeMatchesCount: activeMatches.size,
  };
};
