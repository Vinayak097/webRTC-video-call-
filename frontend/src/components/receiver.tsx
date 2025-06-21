import React, { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'

const Receiver = ({socket}:{socket:Socket}) => {
    const VideoRef=useRef<HTMLVideoElement>(null);
    const remoteRef=useRef<HTMLVideoElement>(null);
    const [pc,setPc]=useState<RTCPeerConnection>();

    useEffect(() => {
        navigator.mediaDevices.getUserMedia({video:true,audio:true})
    .then(stream=>{
      if(VideoRef.current){
        VideoRef.current.srcObject = stream;
        VideoRef.current.play();
      }
    })
    .catch(err=>{
      console.error("Error accessing media devices.", err);
    })
        if(!socket){
          console.log("Socket is not initialized reciever ");
          return;
        }
        socket.on('offer',async (data)=>{
          console.log('Received offer from server');
          const pc =await new RTCPeerConnection();
          setPc(pc);
          await pc.setRemoteDescription(data.sdp);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('answer', {sdp:answer,roomId:data.roomId});
          console.log('Sent answer to server');
        })

      
    }, [socket])
    
  return (
    <div>
        <video className='receiver' ref={VideoRef} autoPlay ></video>
        <video ref={remoteRef} autoPlay></video>
    </div>
  )
}

export default Receiver