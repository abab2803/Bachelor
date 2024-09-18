import React from 'react'
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';  // Firebase-konfigurasjonen
import "../css/home.css"
const Home = () => {

    const navigate = useNavigate();  // Bruk for navigasjon

    const handleLogout = () => {
      signOut(auth)
        .then(() => {
          console.log('User logged out');
          navigate('/');  // Naviger tilbake til logg inn-siden etter utlogging
        })
        .catch((error) => {
          console.error('Error logging out:', error);
        });
    };


  return (
    <div className="home-container">
    <header className='header'>
    <nav className='side-nav'>
      <ul>
        <li><Link to="/ems">EMS</Link></li>
        <li><Link to="/vehicles">Vehicles</Link></li>
        <li><Link to="/maps">Maps</Link></li>
        <li><Link to="/data">Data</Link></li>
        <li><Link to="/profile">Profile</Link></li>
      </ul>
    </nav>
    <button className="logout-button" onClick={handleLogout}>Log Out</button>
    </header>

    <div className="content">
        <h1>Welcome to the Dashboard</h1>
        {/* Annet innhold på dashboardet */}
      </div>
  </div>
  )
}

export default Home