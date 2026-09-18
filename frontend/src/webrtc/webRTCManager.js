/**
 * Native WebRTC PeerConnection Manager for Voice & Video Calls
 * Zero server recording, pure peer-to-peer encrypted media stream
 */

const DEFAULT_ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
];

export class WebRTCManager {
  constructor(options = {}) {
    this.iceServers = options.iceServers || DEFAULT_ICE_SERVERS;
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.callType = 'video'; // 'video' | 'voice'
    this.facingMode = 'user'; // 'user' | 'environment'

    // Callbacks
    this.onLocalStream = options.onLocalStream || (() => {});
    this.onRemoteStream = options.onRemoteStream || (() => {});
    this.onIceCandidate = options.onIceCandidate || (() => {});
    this.onConnectionStateChange = options.onConnectionStateChange || (() => {});
    this.onPermissionStatus = options.onPermissionStatus || (() => {});

    this.permissionStatus = 'unknown'; // 'unknown' | 'granted' | 'denied' | 'audio-only' | 'text-only'
    this.iceCandidateQueue = [];
  }

  /**
   * Initialize RTCPeerConnection instance
   */
  initPeerConnection() {
    if (this.peerConnection) {
      this.closePeerConnection(true);
    }

    this.peerConnection = new RTCPeerConnection({
      iceServers: this.iceServers,
    });

    // Automatically attach existing live local tracks if stream is active
    if (this.localStream && this.localStream.getTracks) {
      this.localStream.getTracks().forEach((track) => {
        if (track.readyState === 'live') {
          const senders = this.peerConnection.getSenders();
          if (!senders.some((s) => s.track && s.track.id === track.id)) {
            this.peerConnection.addTrack(track, this.localStream);
          }
        }
      });
    }

    // Handle remote stream tracks
    this.remoteStream = new MediaStream();
    this.peerConnection.ontrack = (event) => {
      console.log('📡 WebRTC remote track received:', event.track?.kind);
      if (event.streams && event.streams[0]) {
        event.streams[0].getTracks().forEach((track) => {
          if (!this.remoteStream.getTracks().some((t) => t.id === track.id)) {
            this.remoteStream.addTrack(track);
          }
        });
      } else if (event.track) {
        if (!this.remoteStream.getTracks().some((t) => t.id === event.track.id)) {
          this.remoteStream.addTrack(event.track);
        }
      }
      this.onRemoteStream(new MediaStream(this.remoteStream.getTracks()));
    };

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.onIceCandidate(event.candidate);
      }
    };

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      if (this.peerConnection) {
        this.onConnectionStateChange(this.peerConnection.connectionState);
      }
    };

    this.peerConnection.oniceconnectionstatechange = () => {
      if (this.peerConnection) {
        this.onConnectionStateChange(this.peerConnection.iceConnectionState);
      }
    };
  }

  /**
   * Ensure local tracks are attached to the RTCPeerConnection instance
   */
  ensureLocalTracks() {
    if (!this.peerConnection || !this.localStream || !this.localStream.getTracks) return;
    const senders = this.peerConnection.getSenders();
    this.localStream.getTracks().forEach((track) => {
      const hasTrack = senders.some((s) => s.track && s.track.kind === track.kind);
      if (!hasTrack) {
        this.peerConnection.addTrack(track, this.localStream);
      }
    });
  }

  /**
   * Caller: Create offer SDP
   */
  async createOffer() {
    if (!this.peerConnection) this.initPeerConnection();
    this.ensureLocalTracks();
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    return offer;
  }

  /**
   * Callee: Handle offer and create answer SDP
   */
  async handleOffer(offer) {
    if (!this.peerConnection) this.initPeerConnection();
    this.ensureLocalTracks();
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    await this.flushQueuedIceCandidates();
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    return answer;
  }

  /**
   * Caller: Handle answer SDP
   */
  async handleAnswer(answer) {
    if (!this.peerConnection) return;
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    await this.flushQueuedIceCandidates();
  }

  /**
   * Add received ICE candidate with queuing support
   */
  async addIceCandidate(candidate) {
    if (!this.peerConnection) return;
    if (!this.peerConnection.remoteDescription || !this.peerConnection.remoteDescription.type) {
      this.iceCandidateQueue.push(candidate);
      return;
    }
    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.error('Error adding ICE candidate:', err);
    }
  }

  /**
   * Flush queued ICE candidates after remote description is set
   */
  async flushQueuedIceCandidates() {
    if (!this.peerConnection || !this.peerConnection.remoteDescription) return;
    while (this.iceCandidateQueue.length > 0) {
      const candidate = this.iceCandidateQueue.shift();
      try {
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error('Error flushing queued ICE candidate:', err);
      }
    }
  }

  /**
   * Enumerate media devices to check for camera and microphone hardware presence
   */
  async checkAvailableDevices() {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        return { hasVideo: true, hasAudio: true };
      }
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasVideo = devices.some((d) => d.kind === 'videoinput');
      const hasAudio = devices.some((d) => d.kind === 'audioinput');
      return { hasVideo, hasAudio };
    } catch (err) {
      return { hasVideo: true, hasAudio: true };
    }
  }

  /**
   * Acquire local media stream with multi-stage fallbacks
   * 1. Full Video + Audio (simplified boolean constraint for 100% desktop/mobile compatibility)
   * 2. Audio-only (if video camera unavailable or denied)
   * 3. Text-only (if all media hardware unavailable or blocked)
   */
  async acquireMedia(callType = 'video') {
    this.callType = callType;

    // Fast-path: Reuse existing active local media stream if tracks are live
    if (this.localStream && this.localStream.active) {
      const liveVideoTracks = this.localStream.getVideoTracks().filter((t) => t.readyState === 'live');
      const liveAudioTracks = this.localStream.getAudioTracks().filter((t) => t.readyState === 'live');

      if (callType === 'video' && liveVideoTracks.length > 0) {
        this.permissionStatus = 'granted';
        this.onPermissionStatus(this.permissionStatus);
        this.onLocalStream(this.localStream);
        if (!this.peerConnection) this.initPeerConnection();
        this.ensureLocalTracks();
        return this.localStream;
      } else if (callType === 'voice' && liveAudioTracks.length > 0) {
        this.permissionStatus = liveVideoTracks.length > 0 ? 'granted' : 'audio-only';
        this.onPermissionStatus(this.permissionStatus);
        this.onLocalStream(this.localStream);
        if (!this.peerConnection) this.initPeerConnection();
        this.ensureLocalTracks();
        return this.localStream;
      }
    }

    const { hasVideo } = await this.checkAvailableDevices();

    if (!hasVideo && callType === 'video') {
      console.log('No camera hardware detected on device. Using audio-only mode.');
      callType = 'voice';
      this.callType = 'voice';
    }

    try {
      if (callType === 'video') {
        try {
          // Primary Attempt: Simple boolean video constraint (works on 100% desktop webcams)
          this.localStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true,
          });
          this.permissionStatus = 'granted';
        } catch (boolErr) {
          // Fallback 1a: Try with facingMode constraint for mobile cameras
          this.localStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: { facingMode: this.facingMode },
          });
          this.permissionStatus = 'granted';
        }
      } else {
        throw new Error('Audio mode selected');
      }
    } catch (primaryErr) {
      console.warn('Video stream unavailable, trying audio-only stream:', primaryErr);
      const isDenied = primaryErr.name === 'NotAllowedError' || primaryErr.name === 'PermissionDeniedError';

      try {
        // Fallback 2: Audio-only stream
        this.localStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
        this.callType = 'voice';
        this.permissionStatus = isDenied ? 'denied' : 'audio-only';
      } catch (audioErr) {
        console.warn('Audio stream unavailable, proceeding in text-only mode:', audioErr);
        // Fallback 3: Text-only mode (empty MediaStream)
        this.localStream = new MediaStream();
        this.permissionStatus = 'text-only';
      }
    }

    this.onPermissionStatus(this.permissionStatus);
    this.onLocalStream(this.localStream);

    // Initialize peer connection and attach available tracks
    this.initPeerConnection();
    if (this.localStream && this.localStream.getTracks) {
      this.localStream.getTracks().forEach((track) => {
        if (track.readyState === 'live') {
          const senders = this.peerConnection.getSenders();
          if (!senders.some((s) => s.track && s.track.id === track.id)) {
            this.peerConnection.addTrack(track, this.localStream);
          }
        }
      });
    }

    return this.localStream;
  }

  /**
   * Explicitly re-request camera permission & attach track to live connection
   */
  async reAcquireCamera() {
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: { facingMode: this.facingMode },
      });
      
      this.permissionStatus = 'granted';
      this.callType = 'video';
      this.onPermissionStatus(this.permissionStatus);

      const newVideoTrack = newStream.getVideoTracks()[0];
      const newAudioTrack = newStream.getAudioTracks()[0];

      if (this.localStream) {
        if (newVideoTrack) {
          const oldVideoTrack = this.localStream.getVideoTracks()[0];
          if (oldVideoTrack) {
            oldVideoTrack.stop();
            this.localStream.removeTrack(oldVideoTrack);
          }
          this.localStream.addTrack(newVideoTrack);
        }
        if (newAudioTrack && this.localStream.getAudioTracks().length === 0) {
          this.localStream.addTrack(newAudioTrack);
        }
      } else {
        this.localStream = newStream;
      }

      this.onLocalStream(this.localStream);

      // Update active RTCPeerConnection video sender if peer connection exists
      if (this.peerConnection && newVideoTrack) {
        const senders = this.peerConnection.getSenders();
        const videoSender = senders.find((s) => s.track && s.track.kind === 'video');
        if (videoSender) {
          await videoSender.replaceTrack(newVideoTrack);
        } else {
          this.peerConnection.addTrack(newVideoTrack, this.localStream);
        }
      }

      return this.localStream;
    } catch (err) {
      console.error('reAcquireCamera failed:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        this.permissionStatus = 'denied';
      }
      this.onPermissionStatus(this.permissionStatus);
      throw err;
    }
  }



  /**
   * Mute / Unmute Microphone
   */
  toggleAudio(enabled) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = enabled;
      });
    }
  }

  /**
   * Enable / Disable Camera Video
   */
  toggleVideo(enabled) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((track) => {
        track.enabled = enabled;
      });
    }
  }

  /**
   * Flip Camera (Facing mode toggle for mobile)
   */
  async switchCamera() {
    if (this.callType !== 'video') return;
    this.facingMode = this.facingMode === 'user' ? 'environment' : 'user';

    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((track) => track.stop());

      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: this.facingMode },
        });
        const newVideoTrack = newStream.getVideoTracks()[0];

        const senders = this.peerConnection.getSenders();
        const videoSender = senders.find((sender) => sender.track && sender.track.kind === 'video');
        if (videoSender) {
          videoSender.replaceTrack(newVideoTrack);
        }

        const oldTrack = this.localStream.getVideoTracks()[0];
        if (oldTrack) this.localStream.removeTrack(oldTrack);
        this.localStream.addTrack(newVideoTrack);

        this.onLocalStream(this.localStream);
      } catch (err) {
        console.error('Failed to switch camera:', err);
      }
    }
  }

  /**
   * Close peer connection and release media tracks completely
   * If keepLocalStream is true, local media tracks are preserved across matches.
   */
  closePeerConnection(keepLocalStream = false) {
    if (!keepLocalStream && this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        track.stop();
      });
      this.localStream = null;
    }

    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach((track) => {
        track.stop();
      });
      this.remoteStream = null;
    }

    if (this.peerConnection) {
      this.peerConnection.onicecandidate = null;
      this.peerConnection.ontrack = null;
      this.peerConnection.onconnectionstatechange = null;
      this.peerConnection.close();
      this.peerConnection = null;
    }
  }
}
