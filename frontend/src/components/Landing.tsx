import  { useState, useRef, useEffect } from 'react';



import Room from './Room';
import { TvMinimal } from 'lucide-react';

const Landing = () => {
    const [name, setName] = useState("");
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string>("");
    const videoRef = useRef<HTMLVideoElement>(null);
    const [joined,setjoined]=useState(false)

    
   

    const getCam=async()=>{
        const stream=await navigator.mediaDevices.getUserMedia({video:true,audio:true})

        const videoTrack= stream.getVideoTracks()[0];
        
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
        
        <div className="landing-container  h-screen bg-slate-400 from-yellow-200 to-amber-800">
            <div className='container mx-auto flex flex-col items-center justify-center'>
                <nav className='mx-64 myy-5'>
                <div className='flex gap-2 items-center'>
                    <TvMinimal className='h-18 ' />
                    <h1>VibeLink</h1>
                </div>
            </nav>
            
            {error && <div className="error-message">{error}</div>}
            <div className='flex flex-row gap-4 items-center justify'>       

                <div className="video-preview">
                    
                    <video  autoPlay ref={videoRef} muted playsInline />
                </div>
                <div className=" flex flex-col gap-8">
                    <input 
                    type="text" 
                    placeholder="Enter your name "
                    value={name}
                    className='p-2 border-none decoration-none hover:decoration-none border border-b shadow-md'
                    onChange={(e) => setName(e.target.value)}
                />
                    <button className='border-b cursor-pointer shadow-lg text-blue-500 hover:text-blue-900 ' 
                    onClick={handleJoin}
                    disabled={!localStream || !name.trim()}>
                    Join
                    </button>
                </div>
                

            </div>
            

            </div>
            
        </div>
    );
}else{
    console.log("room")
    return <Room name={name} ></Room>
}
}

export default Landing;


