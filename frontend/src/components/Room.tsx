import  { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client';
import Sender from './sender';
import Receiver from './receiver';
import '../App.css'


const Room = ({name}:{name:string}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [number,setNumber]=useState<number>(0);
  const [sendoffer,setOffer]=useState<{sendOffer:boolean,roomId:number}>({sendOffer:false, roomId:0});
  const [roomId,setroomId]=useState<number>(0);
  
  useEffect(() => {
    const socket = io('http://localhost:3000'); // Connect to the server
    setSocket(socket); // Set the socket state

    socket.on('connect', () => {
      console.log('Connected to server room');
    });
     socket.on('send-offer', async (data) => {
        console.log('Received send-offer from server');
        setroomId(data.roomId); 
        setOffer({sendOffer:true, roomId:data.roomId});
        // Get the room ID from the server
        
      });
    socket.emit('username',name);
    socket.on('me',(message)=>{
      console.log('me user no. ', message);
      setNumber(message.number);
      setroomId(message.roomId); 
    })
   return () => {
  socket.disconnect(); // Clean up socket ONLY here
};
    
  }, []);
  console.log("socket usernmae emitted  " , number)
  if(number==1 && socket && sendoffer.sendOffer){
    console.log("socket usernmae emitted  " , number)
     return (

      
      <Sender roomId={sendoffer.roomId} socket={socket}></Sender>
      
 
  )
  }
  if(number==2 && socket){
    console.log("socket usernmae emitted  " , number)
    return (
    <div>
      
      <Receiver roomId={roomId} socket={socket}></Receiver>
      
      
        
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