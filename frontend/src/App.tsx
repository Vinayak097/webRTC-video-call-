
import './App.css'


import { BrowserRouter , Routes,Route } from 'react-router-dom'

import Landing from './components/Landing'
import Room from './components/Room'
function App() {
 

  return (
    <>
      <div>
        
      <BrowserRouter>
      <Routes>
       
        <Route path='/' element={<Landing></Landing>}></Route>
        
        
      </Routes>
    </BrowserRouter>

        
      </div>
    </>
  )
}

export default App
