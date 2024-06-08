import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { Sender} from './components/Sender'
import { Receiver } from './components/Reciever'
import { BrowserRouter , Routes,Route } from 'react-router-dom'
function App() {
  const handlestart=()=>{
    
  }

  return (
    <>
      <div>
      <BrowserRouter>
      <Routes>
        <Route path="/sender" element={<Sender />} />
        <Route path="/receiver" element={<Receiver />} />
      </Routes>
    </BrowserRouter>

        
      </div>
    </>
  )
}

export default App
