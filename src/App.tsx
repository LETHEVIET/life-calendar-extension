import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Calendars from './components/life-calendar.tsx'
import { ModeToggle } from './components/mode-toggle.tsx'

function App() {

  return (
    <>
      <Calendars/>
      <div className='fixed bottom-0 left-0 m-4'>
        <ModeToggle/>
      </div>
    </>
  )
}

export default App
