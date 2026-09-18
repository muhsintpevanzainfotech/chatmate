import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import { WebRTCManager } from '../webrtc/webRTCManager';

const CallContext = createContext(null);

export const CallProvider = ({ children }) => {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [callState, setCallState] = useState('idle'); // 'idle' | 'dialing' | 'incoming' | 'connected' | 'ended'
  const [callType, setCallType] = useState('video'); // 'video' | 'voice'
  const [peerUser, setPeerUser] = useState(null); // Target user object: { _id, username, gender, state, district }
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [connectionBadge, setConnectionBadge] = useState('Connecting...');

  const rtcManagerRef = useRef(null);
  const timerRef = useRef(null);

  // Initialize WebRTC Manager instance
  useEffect(() => {
    rtcManagerRef.current = new WebRTCManager({
      onLocalStream: (stream) => setLocalStream(stream),
      onRemoteStream: (stream) => setRemoteStream(stream),
      onIceCandidate: (candidate) => {
        if (socket && peerUser) {
          socket.emit('webrtc:ice-candidate', {
            targetUserId: peerUser._id,
            candidate,
          });
        }
      },
      onConnectionStateChange: (state) => {
        setConnectionBadge(state);
        if (state === 'connected') {
          setCallState('connected');
          startTimer();
        } else if (state === 'failed' || state === 'disconnected' || state === 'closed') {
          endCall();
        }
      },
    });

    return () => {
      if (rtcManagerRef.current) {
        rtcManagerRef.current.closePeerConnection();
      }
    };
  }, [peerUser, socket]);

  // Handle Socket signaling events
  useEffect(() => {
    if (!socket) return;

    // 1. Incoming call request
    socket.on('call:incoming', ({ callerId, callerUsername, callerGender, callerState, callerDistrict, callType: incomingType }) => {
      if (callState !== 'idle') {
        socket.emit('call:reject', { callerId, reason: 'busy' });
        return;
      }

      setCallType(incomingType);
      setPeerUser({
        _id: callerId,
        username: callerUsername,
        gender: callerGender,
        state: callerState,
        district: callerDistrict,
      });
      setCallState('incoming');
    });

    // 2. Caller receives call accepted event
    socket.on('call:accepted', async ({ acceptorId }) => {
      try {
        setCallState('connected');
        const offer = await rtcManagerRef.current.createOffer();
        socket.emit('webrtc:offer', { targetUserId: acceptorId, offer });
      } catch (err) {
        toast.error('Failed to establish WebRTC media connection');
        endCall();
      }
    });

    // 3. Caller receives call rejected event
    socket.on('call:rejected', ({ reason }) => {
      toast.error(reason === 'busy' ? 'User is currently on another call.' : 'Call declined by user.');
      endCall();
    });

    // 4. Remote end call
    socket.on('call:ended', () => {
      toast('Call ended by partner.', { icon: '📞' });
      endCall();
    });

    // 5. WebRTC Offer
    socket.on('webrtc:offer', async ({ senderId, offer }) => {
      try {
        if (rtcManagerRef.current) {
          if (!rtcManagerRef.current.localStream) {
            await rtcManagerRef.current.acquireMedia(callType);
          }
          const answer = await rtcManagerRef.current.handleOffer(offer);
          socket.emit('webrtc:answer', { targetUserId: senderId, answer });
        }
      } catch (err) {
        console.error('Error handling WebRTC offer:', err);
      }
    });

    // 6. WebRTC Answer
    socket.on('webrtc:answer', async ({ answer }) => {
      try {
        await rtcManagerRef.current.handleAnswer(answer);
      } catch (err) {
        console.error('Error handling WebRTC answer:', err);
      }
    });

    // 7. WebRTC ICE Candidate
    socket.on('webrtc:ice-candidate', async ({ candidate }) => {
      try {
        await rtcManagerRef.current.addIceCandidate(candidate);
      } catch (err) {
        console.error('Error adding ICE candidate:', err);
      }
    });

    return () => {
      socket.off('call:incoming');
      socket.off('call:accepted');
      socket.off('call:rejected');
      socket.off('call:ended');
      socket.off('webrtc:offer');
      socket.off('webrtc:answer');
      socket.off('webrtc:ice-candidate');
    };
  }, [socket, callState]);

  const startTimer = () => {
    stopTimer();
    setCallDuration(0);
    timerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Trigger Outgoing Call (Caller)
  const initiateCall = async (targetUser, type = 'video') => {
    if (!socket) {
      toast.error('Connection to server lost. Unable to start call.');
      return;
    }

    try {
      setPeerUser(targetUser);
      setCallType(type);
      setCallState('dialing');
      setIsMuted(false);
      setIsVideoOff(false);

      // Acquire camera/mic permission ONLY upon explicit button click
      await rtcManagerRef.current.acquireMedia(type);

      // Send signaling call request
      socket.emit('call:request', {
        recipientId: targetUser._id,
        callType: type,
      });
    } catch (err) {
      toast.error(err.message || 'Camera or microphone access denied');
      endCall();
    }
  };

  // Accept Incoming Call (Callee)
  const acceptCall = async () => {
    if (!peerUser || !socket) return;

    try {
      await rtcManagerRef.current.acquireMedia(callType);
      socket.emit('call:accept', { callerId: peerUser._id });
      setCallState('connected');
      startTimer();
    } catch (err) {
      toast.error('Permission denied to access media devices.');
      rejectCall();
    }
  };

  // Reject Incoming Call (Callee)
  const rejectCall = () => {
    if (peerUser && socket) {
      socket.emit('call:reject', { callerId: peerUser._id, reason: 'declined' });
    }
    endCall();
  };

  // End Active Call
  const endCall = () => {
    if (peerUser && socket && (callState === 'connected' || callState === 'dialing')) {
      socket.emit('call:end', { targetUserId: peerUser._id });
    }

    if (rtcManagerRef.current) {
      rtcManagerRef.current.closePeerConnection();
    }

    stopTimer();
    setCallState('idle');
    setPeerUser(null);
    setLocalStream(null);
    setRemoteStream(null);
    setIsMuted(false);
    setIsVideoOff(false);
    setCallDuration(0);
  };

  const toggleMute = () => {
    const nextState = !isMuted;
    setIsMuted(nextState);
    if (rtcManagerRef.current) {
      rtcManagerRef.current.toggleAudio(!nextState);
    }
  };

  const toggleVideo = () => {
    const nextState = !isVideoOff;
    setIsVideoOff(nextState);
    if (rtcManagerRef.current) {
      rtcManagerRef.current.toggleVideo(!nextState);
    }
  };

  const switchCamera = () => {
    if (rtcManagerRef.current) {
      rtcManagerRef.current.switchCamera();
    }
  };

  return (
    <CallContext.Provider
      value={{
        callState,
        callType,
        peerUser,
        localStream,
        remoteStream,
        isMuted,
        isVideoOff,
        callDuration,
        connectionBadge,
        initiateCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleVideo,
        switchCamera,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => useContext(CallContext);
