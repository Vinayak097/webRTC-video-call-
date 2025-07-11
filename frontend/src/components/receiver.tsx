import  { useEffect, useRef,  } from 'react'
import {  Socket } from 'socket.io-client'
import VideoScreening from './VideoScreening';

const Receiver = ({socket,roomId}:{socket:Socket,roomId?:number}) => {
    const VideoRef=useRef<HTMLVideoElement>(null);
    const remoteRef=useRef<HTMLVideoElement>(null);
    const pcRef = useRef<RTCPeerConnection | null>(null);
    
    useEffect(() => {
      const pc = new RTCPeerConnection();
      pc.ontrack = (event) => {
          console.log('Received remote track');
          if (remoteRef.current) {
            remoteRef.current.srcObject = event.streams[0];
            remoteRef.current.play();
          }
        }
      // pcRef.current=pc;
        navigator.mediaDevices.getUserMedia({video:true,audio:true})
    .then(stream=>{
      if(VideoRef.current){
        VideoRef.current.srcObject = stream;
        VideoRef.current.play();
      }
        pcRef.current=pc;
        pc.addTrack(stream.getVideoTracks()[0], stream);
        pc.onicecandidate=(event)=>{
          if(event.candidate){
            console.log('New ICE candidate from receiver:', event.candidate , roomId);
            socket.emit('ice-candidate', {
              candidate: event.candidate,
              roomId: roomId
            });

          }

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
          if(!pcRef.current){
            console.error("PeerConnection is not initialized");
            return;
          }
          await pc.setRemoteDescription(data.sdp);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('answer', {sdp:answer,roomId:data.roomId});
          console.log('Sent answer to server');
        })
        socket.on('ice-candidate',async(data)=>{
          if(!pcRef.current){
            console.log("PeerConnection is not initialized");
            return;
          }
          const candidate= new RTCIceCandidate(data.candidate);
          await pcRef.current.addIceCandidate(candidate);
           
          console.log('Received ICE candidate from server Receiver here');
        })
        
        

      
    }, [socket])
    
  return (
     <VideoScreening videoRef={VideoRef} remoteRef={remoteRef}></VideoScreening>
  )
}

export default Receiver