import  {  useEffect, useRef,  } from 'react'
import {  Socket } from 'socket.io-client';
import VideoScreening from './VideoScreening';

const Sender = ({socket,roomId}:{socket:Socket, roomId:number}) => {
  const VideoRef=useRef<HTMLVideoElement>(null);
  const remoteRef=useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  useEffect(()=>{
    const pc = new RTCPeerConnection();
    pc.ontrack = (event) => {
          console.log('Received remote track');
          if (remoteRef.current) {
            remoteRef.current.srcObject = event.streams[0];
            remoteRef.current.play();
          }
        }
      pcRef.current=pc;
      console.log('Received send-offer from server');
    console.log("Sender component mounted");
     
    navigator.mediaDevices.getUserMedia({video:true,audio:true})
    .then(async(stream)=>{
      if(VideoRef.current){
        console.log("stream recieved ")
        VideoRef.current.srcObject = stream;
        VideoRef.current.play();
      }
      pc.addTrack(stream.getVideoTracks()[0], stream);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('offer', {sdp:offer,roomId:roomId});
      
        pc.onicecandidate=(event) => {
          if (event.candidate) {
            console.log('New ICE candidate from sender:', event.candidate);
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
      console.error("Socket is not initialized");
      return;
    }
      socket.on('answer', async (data) => {
          if(!pcRef.current){
            console.error("PeerConnection is not initialized");
            return;
          }
          await pc.setRemoteDescription(data.sdp);
          console.log('Received answer from server');
        })
    
    socket.on("disconnect", () => {
    console.log("Disconnected from server");
    });
    socket.on('ice-candidate',async(data)=>{
      if(!pcRef.current){
        console.error("PeerConnection is not initialized");
        return;
      }
      const candidate = new RTCIceCandidate(data.candidate);
      await pcRef.current.addIceCandidate(candidate);
      console.log('Received ICE candidate from server Sender here');
       
    })
    
  return () => {
      socket?.off('send-offer');
      socket?.off('disconnect');
    };
  },[socket]);

return (
  
 
  <VideoScreening videoRef={VideoRef} remoteRef={remoteRef}></VideoScreening>
        

     
    
  )
}

export default Sender