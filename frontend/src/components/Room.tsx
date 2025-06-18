import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Socket } from 'socket.io-client';
import { io } from 'socket.io-client';
import './Room.css';

export const url = "http://localhost:3000";

interface RoomProps {
    name: string;
    localaudioStream: MediaStreamTrack | null;
    localvideoStream: MediaStreamTrack | null;
}

type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'failed';

const Room: React.FC<RoomProps> = ({name, localaudioStream, localvideoStream}) => {
    const navigate = useNavigate();
    const [pendingCandidates, setPendingCandidates] = useState<RTCIceCandidate[]>([]);
    const [error, setError] = useState<string>('');
    const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');
    const [lobby, setLobby] = useState(true);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const [sendingpc, setSendingPc] = useState<RTCPeerConnection>();
    const [recievingpc, setRecievingpc] = useState<RTCPeerConnection>();

    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
  

    const configuration: RTCConfiguration = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ]
    };    useEffect(() => {        
        // Setup local video
        if(localVideoRef.current && localvideoStream){
            const localStream = new MediaStream([localvideoStream]);
            if(localaudioStream) {
                localStream.addTrack(localaudioStream);
            }
            localVideoRef.current.srcObject = localStream;
        }

        // Initialize socket connection with better config
        const socket = io(url, {
            transports: ['websocket'],
            reconnection: true,
            reconnectionDelay: 1000,
        });
        
        socket.on('connect', () => {
            console.log('Socket connected with ID:', socket.id);
        });

        socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            setError('Connection failed. Please try again.');
        });
        socket.on('disconnect', () => {
            console.log('Disconnected from server');
            setLobby(false);
        });

        socket.on('lobby', () => {
            console.log('Entered lobby state');
            setLobby(true);
        });

        socket.on('send-offer', async ({ roomId }) => {
    
    const pc = new RTCPeerConnection(configuration);
    
    pc.onconnectionstatechange = () => {
        console.log('Connection state:', pc.connectionState);
        
    };
    
    setSendingPc(pc);

    // Add tracks before creating offer
    if (!localvideoStream || !localaudioStream) {
        console.error('No local streams available');
        return;
    }
    
    const localStream = new MediaStream([localvideoStream, localaudioStream]);
    localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
    });

    // Add ICE candidate handler
    pc.onicecandidate = (event) => {
        if (event.candidate) {
            console.log('Sending ICE candidate');
            socket.emit('ice-candidate', {
                roomId,
                candidate: event.candidate
            });
        }
    };

    try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        
        console.log('Sending offer for room:', roomId);
        socket.emit('offer', {
            roomId,
            sdp: pc.localDescription
        });
    } catch (error) {
        console.error('Error creating offer:', error);
    }
});


       socket.on('offer', async ({ roomId, sdp }) => {
    setLobby(false);
    console.log('Received offer:', sdp);
    
    if(!localaudioStream || !localvideoStream){
        console.log('No local streams available');
        return;
    }

    const pc = new RTCPeerConnection();
      // Create new MediaStream for remote video
    const stream = new MediaStream();
    if(remoteVideoRef.current){
        remoteVideoRef.current.srcObject = stream;
    }
    setRemoteStream(stream);
    
    // Add local tracks
    const localStream = new MediaStream([localvideoStream, localaudioStream]);
    localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
    });

    // Handle incoming tracks
    pc.ontrack = (event) => {
        console.log('Received track:', event.track.kind);
        const [remoteStream] = event.streams;
        if(remoteVideoRef.current){
            remoteVideoRef.current.srcObject = remoteStream;
        }
    };

    try {
        // Set remote description first
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        
        // Then create answer
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        
        console.log('Sending answer');
        socket.emit('answer', {
            roomId,
            sdp: pc.localDescription
        });
        
        setRecievingpc(pc);
    } catch (error) {
        console.error('Error in offer handling:', error);
    }
});       socket.on('answer', async ({ sdp }) => {
    console.log('Received answer:', sdp);
    try {
        if (sendingpc) {
            await sendingpc.setRemoteDescription(new RTCSessionDescription(sdp));
            console.log('Set remote description from answer');
            // Process any pending ICE candidates
            for (const candidate of pendingCandidates) {
                await sendingpc.addIceCandidate(candidate);
                console.log('Added pending ICE candidate');
            }
            setPendingCandidates([]);
        }
    } catch (error) {
        console.error('Error handling answer:', error);
        setError('Failed to establish peer connection');
    }
    setLobby(false);
});

       

        socket.on('ice-candidate', async ({ candidate }) => {
    const iceCandidate = new RTCIceCandidate(candidate);
    try {
        if (recievingpc?.remoteDescription) {
            await recievingpc.addIceCandidate(iceCandidate);
            console.log('Added ICE candidate');
        } else {
            setPendingCandidates(prev => [...prev, iceCandidate]);
            console.log('Stored pending ICE candidate');
        }
    } catch (err) {
        console.error('Error adding ICE candidate:', err);
    }
});

        setSocket(socket);        // Cleanup
        return () => {
            socket.close();
            
            // Cleanup peer connections
            if (sendingpc) {
                sendingpc.close();
            }
            if (recievingpc) {
                recievingpc.close();
            }
            
            // Cleanup streams
            if (remoteStream) {
                remoteStream.getTracks().forEach(track => track.stop());
            }
        };
    }, [name, ]);

    const toggleMute = () => {
        if (localaudioStream) {
            localaudioStream.enabled = !localaudioStream.enabled;
            setIsMuted(!isMuted);
        }
    };

    const toggleVideo = () => {
        if (localvideoStream) {
            localvideoStream.enabled = !localvideoStream.enabled;
            setIsVideoOff(!isVideoOff);
        }
    };

    const leaveRoom = () => {
        if (socket) {
            socket.disconnect();
        }
        if (sendingpc) {
            sendingpc.close();
        }
        if (recievingpc) {
            recievingpc.close();
        }
        // Redirect to home
        window.location.href = '/';
    };

    if (lobby) {
    return (
        <div className="lobby">
            <h2>Waiting for another user to join...</h2>
            <div className="video-container">
                <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="local-video"
                />
            </div>
        </div>
    );
} else {    return (
        <div>
        <div className="room">
            <div className="status-bar">
                <div className="connection-status text-black">
                    Status: {connectionState || 'Initializing...'}
                </div>
                <div className="room-info">
                    Room ID: {name}
                </div>
            </div>
            
            <div className="video-grid">
                <div className="video-container">
                    <video
                        width={400}
                        height={400}
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`local-video ${isVideoOff ? 'video-off' : ''}`}
                    />
                    <div className="video-overlay">
                        <span className="participant-name">You</span>
                    </div>
                </div>
                <div className="video-container">
                    <video
                        width={400}
                        height={400}
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="remote-video"
                    />
                    <div className="video-overlay">
                        <span className="participant-name">Peer</span>
                    </div>
                </div>
            </div>
            
            <div className="controls">
                <button onClick={toggleMute}>
                    {isMuted ? 'Unmute' : 'Mute'}
                </button>
                <button onClick={toggleVideo}>
                    {isVideoOff ? 'Turn Video On' : 'Turn Video Off'}
                </button>
                <button onClick={leaveRoom} className="leave-btn">
                    Leave Room
                </button>
            </div>
            
            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}
            </div>
             <div className="controls">
                <button onClick={toggleMute}>
                    {isMuted ? 'Unmute' : 'Mute'}
                </button>
                <button onClick={toggleVideo}>
                    {isVideoOff ? 'Turn Video On' : 'Turn Video Off'}
                </button>
                <button onClick={leaveRoom}>Leave Room</button>
            </div>
        </div>
        
    );
}

    
}

export default Room