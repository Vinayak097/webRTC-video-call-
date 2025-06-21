import React, { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client';
import Sender from './sender';
import Receiver from './receiver';
import '../App.css'
import { Navigate, useNavigate } from 'react-router-dom';
interface roomProps{
  localaudioStream: MediaStreamTrack | null;
  localvideoStream: MediaStreamTrack | null;

}
const Room = ({name}:{name:string}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [number,setNumber]=useState<number>(0);
  const [sendoffer,setOffer]=useState<{sendOffer:boolean,roomId:number}>({sendOffer:false, roomId:0});
  let roomId=0;
  useEffect(() => {
    const socket = io('http://localhost:3000'); // Connect to the server
    setSocket(socket); // Set the socket state

    socket.on('connect', () => {
      console.log('Connected to server room');
    });
     socket.on('send-offer', async (data) => {
        console.log('Received send-offer from server');
        roomId = data.roomId; 
        setOffer({sendOffer:true, roomId:roomId});
        // Get the room ID from the server
        
      });
    socket.emit('username',name);
    socket.on('me',(message)=>{
      console.log('me user no. ', message);
      setNumber(message);
    })
   return () => {
  socket.disconnect(); // Clean up socket ONLY here
};
    
  }, []);
  if(number==1 && socket && sendoffer.sendOffer){
    console.log("socket usernmae emitted  " , number)
     return (
    <div>
      
      <Sender roomId={sendoffer.roomId} socket={socket}></Sender>
      
        
    </div>
  )
  }
  if(number==2 && socket){
    console.log("socket usernmae emitted  " , number)
    return (
    <div>
      
      <Receiver socket={socket}></Receiver>
      
      
        
    </div>
  )
  }
  return(
    
    <div className='wait-div'>
      waiting for other user to join
    </div>
  )
 
}

export default Room