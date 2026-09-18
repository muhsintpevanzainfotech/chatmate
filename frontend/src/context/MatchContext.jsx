import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useSocket } from './SocketContext';

const MatchContext = createContext(null);

export const MatchProvider = ({ children }) => {
  const { socket } = useSocket();

  const [matchState, setMatchState] = useState('idle'); // 'idle' | 'searching' | 'matched' | 'connected' | 'partner_left'
  const [partner, setPartner] = useState(null);
  const [matchId, setMatchId] = useState(null);
  const [isInitiator, setIsInitiator] = useState(false);

  const [genderPref, setGenderPref] = useState('everyone');
  const [placePref, setPlacePref] = useState('all');

  // Socket event listeners for random matchmaking
  useEffect(() => {
    if (!socket) return;

    // 1. Queue Searching State
    socket.on('match:searching', () => {
      setMatchState('searching');
      setPartner(null);
      setMatchId(null);
    });

    // 2. Compatible Random Match Found!
    socket.on('match:found', ({ matchId: id, partner: matchedPartner, isInitiator: initiator }) => {
      setMatchId(id);
      setPartner(matchedPartner);
      setIsInitiator(initiator);
      setMatchState('matched');
      toast.success(`Matched with ${matchedPartner.username}!`, { icon: '✨' });
    });

    // 3. Partner Left or Clicked NEXT
    socket.on('match:partner_left', () => {
      setMatchState('partner_left');
      toast('The other person disconnected.', { icon: '👋' });
    });

    // 4. Cancel Search
    socket.on('match:cancelled', () => {
      setMatchState('idle');
      setPartner(null);
      setMatchId(null);
    });

    return () => {
      socket.off('match:searching');
      socket.off('match:found');
      socket.off('match:partner_left');
      socket.off('match:cancelled');
    };
  }, [socket]);

  // Start Searching for Random Compatible Stranger
  const startMatching = (gender = 'everyone', place = 'all') => {
    if (!socket) {
      toast.error('Connection lost. Please refresh.');
      return;
    }

    setGenderPref(gender);
    setPlacePref(place);
    setMatchState('searching');
    socket.emit('match:start', { genderPref: gender, placePref: place });
  };

  // Instant NEXT Button: End current match & search for another partner
  const nextMatch = () => {
    if (!socket) return;

    setMatchState('searching');
    setPartner(null);
    setMatchId(null);
    socket.emit('match:next', { genderPref, placePref });
  };

  // Cancel Search Queue
  const cancelMatch = () => {
    if (socket) {
      socket.emit('match:cancel');
    }
    setMatchState('idle');
    setPartner(null);
    setMatchId(null);
  };

  return (
    <MatchContext.Provider
      value={{
        matchState,
        setMatchState,
        partner,
        matchId,
        isInitiator,
        genderPref,
        placePref,
        setGenderPref,
        setPlacePref,
        startMatching,
        nextMatch,
        cancelMatch,
      }}
    >
      {children}
    </MatchContext.Provider>
  );
};

export const useMatch = () => useContext(MatchContext);
