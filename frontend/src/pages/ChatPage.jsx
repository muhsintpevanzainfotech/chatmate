import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Send,
  Lock,
  Phone,
  Video,
  MoreVertical,
  Shield,
  Ban,
  Flag,
  Trash2,
  MessageSquare,
  Search,
  CheckCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useCall } from '../context/CallContext';
import {
  deriveSharedKey,
  encryptMessage,
  decryptMessage,
  importPublicKey,
} from '../crypto/e2ee';
import { ReportModal } from '../components/ReportModal';
import { BlockModal } from '../components/BlockModal';
import { ChatSkeleton } from '../components/SkeletonLoader';

export const ChatPage = () => {
  const [searchParams] = useSearchParams();
  const initialUserId = searchParams.get('userId');

  const { user, token, keyPair } = useAuth();
  const { socket, onlineUsersMap } = useSocket();
  const { initiateCall } = useCall();

  const [activePartner, setActivePartner] = useState(null); // Target active user object
  const [conversations, setConversations] = useState([]); // List of recent conversation contacts
  const [messages, setMessages] = useState([]); // Decrypted messages array: [{ senderId, text, timestamp }]
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sharedKeyMap, setSharedKeyMap] = useState(new Map()); // partnerId -> AES shared CryptoKey
  const [loadingChat, setLoadingChat] = useState(false);

  const [showMenu, setShowMenu] = useState(false);
  const [reportTarget, setReportTarget] = useState(null);
  const [blockTarget, setBlockTarget] = useState(null);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Auto-scroll chat to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // If URL has initialUserId (e.g. from UserCard click), fetch public profile
  useEffect(() => {
    if (initialUserId) {
      const fetchInitialUser = async () => {
        try {
          const res = await fetch(`/api/users/${initialUserId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (res.ok) {
            selectPartner(data.user);
          }
        } catch (err) {
          console.error('Failed to load target chat user:', err);
        }
      };
      fetchInitialUser();
    }
  }, [initialUserId, token]);

  // Derive AES shared key with partner user using Web Crypto API
  const getOrDeriveSharedKey = async (partner) => {
    if (!keyPair || !keyPair.privateKey) return null;
    if (sharedKeyMap.has(partner._id)) {
      return sharedKeyMap.get(partner._id);
    }

    try {
      if (!partner.publicKey) return null;
      const recipientPubKey = await importPublicKey(partner.publicKey);
      if (!recipientPubKey) return null;

      const sharedKey = await deriveSharedKey(keyPair.privateKey, recipientPubKey);
      setSharedKeyMap((prev) => new Map(prev).set(partner._id, sharedKey));
      return sharedKey;
    } catch (err) {
      console.error('Failed to derive E2EE shared key:', err);
      return null;
    }
  };

  const selectPartner = async (partner) => {
    setActivePartner(partner);
    setLoadingChat(true);

    // Derive shared key for local decryption
    await getOrDeriveSharedKey(partner);

    // Add to conversations list if not present
    setConversations((prev) => {
      if (!prev.some((c) => c._id === partner._id)) {
        return [partner, ...prev];
      }
      return prev;
    });

    // Load locally saved chat history for this conversation
    const savedLocalHistory = localStorage.getItem(`chat_history_${user._id}_${partner._id}`);
    if (savedLocalHistory) {
      try {
        setMessages(JSON.parse(savedLocalHistory));
      } catch (e) {
        setMessages([]);
      }
    } else {
      setMessages([]);
    }

    setLoadingChat(false);
  };

  // Socket event listeners for incoming E2EE messages & typing indicators
  useEffect(() => {
    if (!socket) return;

    socket.on('message:receive', async (data) => {
      const { senderId, recipientId, ciphertext, iv, senderPublicKey, timestamp } = data;

      // If active chat partner sent this message
      if (activePartner && (senderId === activePartner._id || recipientId === activePartner._id)) {
        let partnerKey = sharedKeyMap.get(activePartner._id);
        if (!partnerKey && senderPublicKey) {
          partnerKey = await getOrDeriveSharedKey({ ...activePartner, publicKey: senderPublicKey });
        }

        let decryptedText = '[Encrypted Message]';
        if (partnerKey) {
          decryptedText = await decryptMessage(ciphertext, iv, partnerKey);
        }

        const newMsg = {
          senderId,
          text: decryptedText,
          timestamp: timestamp || new Date().toISOString(),
        };

        setMessages((prev) => {
          const updated = [...prev, newMsg];
          // Save locally
          localStorage.setItem(`chat_history_${user._id}_${activePartner._id}`, JSON.stringify(updated));
          return updated;
        });
      }
    });

    socket.on('typing:start', ({ senderId }) => {
      if (activePartner && senderId === activePartner._id) {
        setIsTyping(true);
      }
    });

    socket.on('typing:stop', ({ senderId }) => {
      if (activePartner && senderId === activePartner._id) {
        setIsTyping(false);
      }
    });

    return () => {
      socket.off('message:receive');
      socket.off('typing:start');
      socket.off('typing:stop');
    };
  }, [socket, activePartner, sharedKeyMap, user]);

  // Handle send E2EE Message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activePartner || !socket) return;

    const messageText = inputMessage.trim();
    setInputMessage('');

    try {
      // 1. Get or derive shared key
      const sharedKey = await getOrDeriveSharedKey(activePartner);
      if (!sharedKey) {
        toast.error('Unable to establish E2EE key exchange with recipient.');
        return;
      }

      // 2. Encrypt message locally using AES-GCM-256
      const { ciphertext, iv } = await encryptMessage(messageText, sharedKey);

      // 3. Emit payload containing ONLY ciphertext over socket
      socket.emit('message:send', {
        recipientId: activePartner._id,
        conversationId: [user._id, activePartner._id].sort().join('_'),
        ciphertext,
        iv,
      });

      // 4. Update local state & storage
      const newMsg = {
        senderId: user._id,
        text: messageText,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => {
        const updated = [...prev, newMsg];
        localStorage.setItem(`chat_history_${user._id}_${activePartner._id}`, JSON.stringify(updated));
        return updated;
      });

      // Stop typing
      socket.emit('typing:stop', { recipientId: activePartner._id });
    } catch (err) {
      console.error('Send message error:', err);
      toast.error('Failed to encrypt and send message.');
    }
  };

  const handleInputChange = (e) => {
    setInputMessage(e.target.value);

    if (socket && activePartner) {
      socket.emit('typing:start', { recipientId: activePartner._id });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing:stop', { recipientId: activePartner._id });
      }, 2000);
    }
  };

  const clearLocalConversation = () => {
    if (!activePartner) return;
    localStorage.removeItem(`chat_history_${user._id}_${activePartner._id}`);
    setMessages([]);
    toast.success('Local chat history cleared.');
  };

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-4 sm:py-6 h-[calc(100vh-5rem)]">
      <div className="glass-panel rounded-3xl border border-slate-800 h-full flex overflow-hidden shadow-2xl">
        
        {/* Left Sidebar: Conversations list */}
        <div className={`w-full md:w-80 lg:w-96 bg-[#0a0d14]/90 border-r border-slate-800 flex flex-col ${activePartner ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-rose-500" />
              Conversations
            </h2>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              E2EE Active
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
            {conversations.length > 0 ? (
              conversations.map((c) => {
                const isOnline = !!onlineUsersMap.get(c._id);
                const isSelected = activePartner?._id === c._id;
                return (
                  <button
                    key={c._id}
                    onClick={() => selectPartner(c)}
                    className={`w-full p-4 flex items-center gap-3 text-left transition-all hover:bg-slate-900/60 ${
                      isSelected ? 'bg-slate-900 border-l-4 border-rose-500' : ''
                    }`}
                  >
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-rose-600 to-pink-500 p-0.5">
                        <div className="w-full h-full rounded-full bg-[#0a0d14] flex items-center justify-center text-sm font-bold text-white">
                          {c.username ? c.username[0].toUpperCase() : 'U'}
                        </div>
                      </div>
                      <span
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0a0d14] ${
                          isOnline ? 'bg-emerald-500' : 'bg-slate-500'
                        }`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-white truncate">{c.username}</h4>
                        <span className="text-[10px] text-slate-500 capitalize">{c.gender}</span>
                      </div>
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {c.state ? `${c.state}${c.district ? `, ${c.district}` : ''}` : 'Tap to start E2EE chat'}
                      </p>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-8 text-center text-slate-500">
                <MessageSquare className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs">No active conversations yet.</p>
                <p className="text-[11px] text-slate-600 mt-1">Visit "Meet People" to find compatible members.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Active Chat Pane */}
        {activePartner ? (
          <div className="flex-1 flex flex-col bg-[#0a0d14]/40 h-full">
            
            {/* Active Chat Header */}
            <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/60">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActivePartner(null)}
                  className="md:hidden p-1.5 text-slate-400 hover:text-white"
                >
                  ←
                </button>
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 p-0.5">
                    <div className="w-full h-full rounded-full bg-[#0a0d14] flex items-center justify-center text-xs font-bold text-white">
                      {activePartner.username ? activePartner.username[0].toUpperCase() : 'U'}
                    </div>
                  </div>
                  <span
                    className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#0a0d14] ${
                      onlineUsersMap.get(activePartner._id) ? 'bg-emerald-500' : 'bg-slate-500'
                    }`}
                  />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    {activePartner.username}
                    <Lock className="w-3 h-3 text-rose-400" title="Web Crypto E2EE Active" />
                  </h3>
                  <p className="text-[11px] text-slate-400 capitalize">
                    {onlineUsersMap.get(activePartner._id) ? '🟢 Online' : '⚪ Offline'} · {activePartner.gender} · {activePartner.state}
                  </p>
                </div>
              </div>

              {/* Action Buttons in Header */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => initiateCall(activePartner, 'voice')}
                  title="Start Voice Call"
                  className="p-2 text-slate-300 hover:text-emerald-400 hover:bg-slate-800 rounded-xl transition-all"
                >
                  <Phone className="w-4 h-4" />
                </button>
                <button
                  onClick={() => initiateCall(activePartner, 'video')}
                  title="Start Video Call"
                  className="p-2 text-slate-300 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-all"
                >
                  <Video className="w-4 h-4" />
                </button>

                <div className="relative">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {showMenu && (
                    <div
                      className="absolute right-0 mt-1 w-44 glass-panel bg-[#121824] rounded-xl shadow-xl border border-slate-800 py-1 z-20"
                      onMouseLeave={() => setShowMenu(false)}
                    >
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          clearLocalConversation();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                        Clear Local Chat
                      </button>
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          setReportTarget(activePartner);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 hover:text-amber-400 hover:bg-slate-800/60"
                      >
                        <Flag className="w-3.5 h-3.5" />
                        Report User
                      </button>
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          setBlockTarget(activePartner);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 hover:text-rose-400 hover:bg-slate-800/60"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        Block User
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Encrypted Notice Banner */}
            <div className="py-1.5 px-4 bg-rose-500/10 border-b border-rose-500/20 text-rose-300 text-[11px] flex items-center justify-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              <span>End-to-End Encrypted. No plaintext is ever stored on the server.</span>
            </div>

            {/* Chat Messages Log */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingChat ? (
                <ChatSkeleton />
              ) : messages.length > 0 ? (
                messages.map((msg, index) => {
                  const isMe = msg.senderId === user._id;
                  return (
                    <div
                      key={index}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[75%] sm:max-w-md px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          isMe
                            ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded-tr-none shadow-md shadow-rose-600/20'
                            : 'bg-slate-800/90 text-slate-100 rounded-tl-none border border-slate-700/60'
                        }`}
                      >
                        <p>{msg.text}</p>
                        <span className="block text-[10px] text-right mt-1 opacity-70">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 p-6">
                  <Lock className="w-10 h-10 text-rose-500/50 mb-2" />
                  <h4 className="text-sm font-bold text-slate-300">Start an Encrypted Chat</h4>
                  <p className="text-xs max-w-xs mt-1">
                    Send a private message to {activePartner.username}. Your keys are generated locally.
                  </p>
                </div>
              )}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-slate-800 px-3 py-1.5 rounded-2xl text-xs text-rose-400 font-medium animate-pulse">
                    {activePartner.username} is typing...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input Box */}
            <form onSubmit={handleSendMessage} className="p-3 sm:p-4 border-t border-slate-800 bg-slate-900/80">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={handleInputChange}
                  placeholder={`Type an encrypted message to ${activePartner.username}...`}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim()}
                  className="p-3 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white rounded-2xl shadow-lg shadow-rose-600/25 disabled:opacity-40 transition-all"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>

          </div>
        ) : (
          /* Empty Right Pane when no partner selected */
          <div className="hidden md:flex flex-1 flex-col items-center justify-center text-center p-8 text-slate-500">
            <div className="w-20 h-20 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mb-4 text-rose-500/60">
              <MessageSquare className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-bold text-white">No active conversation selected</h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              Select a conversation from the left sidebar or meet new people to start end-to-end encrypted messaging.
            </p>
          </div>
        )}

      </div>

      {/* Report & Block Modals */}
      <ReportModal
        isOpen={!!reportTarget}
        onClose={() => setReportTarget(null)}
        targetUser={reportTarget}
      />
      <BlockModal
        isOpen={!!blockTarget}
        onClose={() => setBlockTarget(null)}
        targetUser={blockTarget}
        onBlockedSuccess={() => setActivePartner(null)}
      />
    </div>
  );
};
