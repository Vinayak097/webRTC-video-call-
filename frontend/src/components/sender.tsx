import React, { useCallback, useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client';

const Sender = ({socket,roomId}:{socket:Socket, roomId:number}) => {
  const VideoRef=useRef<HTMLVideoElement>(null);
  const remoteRef=useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  useEffect(()=>{
    
    console.log("Sender component mounted");
     const start = async () => {
      const pc = new RTCPeerConnection();
      pcRef.current=pc;

     
        console.log('Received send-offer from server');
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('offer', {sdp:offer,roomId:roomId});
      
        pc.onicecandidate=(event) => {
          if (event.candidate) {
            console.log('New ICE candidate:', event.candidate);
           
          }
        }

      // socket?.on('answer',async(data)=>{
      //   console.log('Received answer from server');
      //   if(pc){
      //     await pc.setRemoteDescription(data.sdp);
      //   } else {
      //     console.error("PeerConnection is not initialized");
      //   }
      // })

      
    };
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
      console.error("Socket is not initialized");
      return;
    }
      socket.on('answer', async (data) => {
          if(!pcRef.current){
            console.error("PeerConnection is not initialized");
            return;
          }
          pcRef.current.setRemoteDescription(data.sdp);
          console.log('Received answer from server');
        })
    
    socket.on("disconnect", () => {
      console.log("Disconnected from server");
    });
    start();
  return () => {
      socket?.off('send-offer');
      socket?.off('disconnect');
    };
  },[socket]);

return (
    <div>
        <video ref={VideoRef}></video>
        <video ref={remoteRef}></video>
    </div>
  )
}

export default Sender