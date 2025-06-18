import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import Room from './Room';

const Landing = () => {
    const [name, setName] = useState("");
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string>("");
    const videoRef = useRef<HTMLVideoElement>(null);
    const [joined,setjoined]=useState(false)
    const [localaudioStream,setAudioStream]=useState<MediaStreamTrack|null>(null);
    const [localvideoStream,setlocalVideoStream]=useState<MediaStreamTrack|null>(null);
    
    const navigate = useNavigate();

    const getCam=async()=>{
        const stream=await navigator.mediaDevices.getUserMedia({video:true,audio:true})

        const  audioTrack=stream.getAudioTracks()[0];
        const videoTrack= stream.getVideoTracks()[0];
        setAudioStream(audioTrack)
        setlocalVideoStream(videoTrack)
        setLocalStream(stream)
        console.log(localStream)
        if(videoRef.current){
            videoRef.current.srcObject=new MediaStream([videoTrack])            
        }
        
        
        

    }

    useEffect(() => {
        // Get user media
        if(videoRef && videoRef.current)       {
            getCam();
        }        
    }, [videoRef]);
 
       const handleJoin = () => {
        if (!name.trim()) {
            setError('Please enter a name');
            return;
        }
        
        if (!localStream) {
            setError('Camera/Microphone not ready');
            return;
        }
        setjoined(true)
        // Store stream in sessionStorage
        sessionStorage.setItem('userName', name);
        
        // Navigate to room
       
    };
    if(!joined){

    
console.log("landing")
    return (
        <div className="landing-container">
            <h2>Join Video Chat</h2>
            {error && <div className="error-message">{error}</div>}
            <div className="video-preview">
                <video  autoPlay ref={videoRef} muted playsInline />
            </div>
            <div className="join-controls">
                <input 
                    type="text" 
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <button 
                    onClick={handleJoin}
                    disabled={!localStream || !name.trim()}>
                    Join
                </button>
            </div>
        </div>
    );
}else{
    console.log("room")
    return <Room name={name} localaudioStream={localaudioStream} localvideoStream={localvideoStream}></Room>
}
}

export default Landing;


