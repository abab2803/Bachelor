import React from 'react'
import Navbar from '../Common/Navbar';

import "../css/home.css"
const Home = () => {

  
  return (
    <div className="home-container">
    <header className='header'>
      <Navbar />
    </header>

    <div className="content">
        <h1>Welcome to the Dashboard</h1>
        {/* Annet innhold på dashboardet */}
      </div>
  </div>
  )
}

export default Home