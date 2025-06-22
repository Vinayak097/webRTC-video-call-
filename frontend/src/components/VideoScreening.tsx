import React from 'react'

const VideoScreening = ({videoRef,remoteRef}:{videoRef:any,remoteRef:any}) => {
  return (
      <div className='bg-slate-400 h-screen  '>
    <div className='flex justify-center items-center  h-screen '>
      <div className='container flex  gap-4 rounded-lg '>
        <video className=' border flex-1 rounded-lg  ' ref={remoteRef}></video>
        <video className= 'h-64 rounded-lg ' ref={videoRef}></video>
        

      </div>
        
    </div>

  </div>
  )
}

export default VideoScreening