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
    const sendingPcRef = useRef<RTCPeerConnection | null>(null);
const recievingPcRef = useRef<RTCPeerConnection | null>(null);


    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
  

    const configuration: RTCConfiguration = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ]
    };   
     useEffect(() => {        
        // Setup local video
        if (localVideoRef.current && localvideoStream) {
    const localStream = new MediaStream([localvideoStream]);
    if (localaudioStream) {
        localStream.addTrack(localaudioStream);
    }
    localVideoRef.current.srcObject = localStream; // ✅ Corrected
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
        socket.on('ice-candidate', async ({ candidate }) => {
    console.log('Received ICE candidate from server:', candidate);
    const iceCandidate = new RTCIceCandidate(candidate);

    try {
        if (recievingPcRef.current && recievingPcRef.current.remoteDescription) {
            await recievingPcRef.current.addIceCandidate(iceCandidate);
            console.log('ICE candidate added to receiving peer');
        } else if (sendingPcRef.current && sendingPcRef.current.remoteDescription) {
            await sendingPcRef.current.addIceCandidate(iceCandidate);
            console.log('ICE candidate added to sending peer');
        } else {
            setPendingCandidates(prev => [...prev, iceCandidate]);
            console.log('Stored pending ICE candidate');
        }
    } catch (err) {
        console.error('Failed to add ICE candidate:', err);
    }
});
        socket.on('send-offer', async ({ roomId }) => {
            
            const pc = new RTCPeerConnection(configuration);
            
            pc.onicecandidate = (event) => {
    if (event.candidate) {
        socket.emit('ice-candidate', {
            roomId,
            candidate: event.candidate
        });
    }
};
            console.log('setling sending pc ' , pc)
            sendingPcRef.current=pc;
            
    try {
        const localStream = new MediaStream();
if (localvideoStream) localStream.addTrack(localvideoStream);
if (localaudioStream) localStream.addTrack(localaudioStream);

localStream.getTracks().forEach(track => {
    pc.addTrack(track, localStream);
});


pc.ontrack = (event) => {
    const remoteMediaStream = new MediaStream();
    event.streams[0].getTracks().forEach(track => {
        remoteMediaStream.addTrack(track);
    });
    setRemoteStream(remoteMediaStream);
    if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteMediaStream;
    }
};

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
    }); //send offer close


    socket.on('offer', async ({ roomId, sdp }) => {
        
        setLobby(false);
        console.log('Received offer:', sdp , roomId);
    
        

        const pc = new RTCPeerConnection();
        const localStream = new MediaStream();
if (localvideoStream) localStream.addTrack(localvideoStream);
if (localaudioStream) localStream.addTrack(localaudioStream);

localStream.getTracks().forEach(track => {
    pc.addTrack(track, localStream);
});

        pc.ontrack = (event) => {
    const remoteMediaStream = new MediaStream();
    event.streams[0].getTracks().forEach(track => {
        remoteMediaStream.addTrack(track);
    });
    setRemoteStream(remoteMediaStream);
    if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteMediaStream;
    }
};

        pc.onicecandidate = (event) => {
    if (event.candidate) {
        socket.emit('ice-candidate', {
            roomId,
            candidate: event.candidate
        });
    }
};
        try {
        // Set remote description first
            await pc.setRemoteDescription(sdp);
        recievingPcRef.current=pc;
        // Then create answer
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        
        console.log('Sending answer');
        socket.emit('answer', {
            roomId,
            sdp: pc.localDescription
        });
        
        
    } catch (error) {
        console.error('Error in offer handling:', error);
    }
});       
socket.on('answer', async ({ roomId, sdp }) => {
    console.log('Received answer:',roomId,   sdp);
    try {
        if(!sendingPcRef.current){
            console.log("sendig pc not found")
            return;

        }
            await sendingPcRef.current.setRemoteDescription(sdp);
            console.log('Set remote description from answer');
            // Process any pending ICE candidates
          
       
    } catch (error) {
        console.error('Error handling answer:', error);
        setError('Failed to establish peer connection');
    }
    setLobby(false);
});

       

        

        setSocket(socket);        // Cleanup
        return () => {
            socket.close();
            
            // Cleanup peer connections
            if (sendingPcRef.current) {
                sendingPcRef.current.close();
            }
            if (recievingPcRef.current) {
                recievingPcRef.current.close();
            }
            
            // Cleanup streams
            if (remoteStream) {
                remoteStream.getTracks().forEach(track => track.stop());
            }
        };
    }, [name ]);

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
           if (sendingPcRef.current) {
                sendingPcRef.current.close();
            }
            if (recievingPcRef.current) {
                recievingPcRef.current.close();
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