import React from 'react';
import { Link } from 'react-router-dom';
import Logout from '../auth/Logout';
import '../css/navbar.css';  

const Navbar = () => {
  return (
    <header>
      <nav className="navbar">
        <ul>
          <img 
            src="https://png.pngtree.com/png-vector/20191129/ourmid/pngtree-fast-delivery-icon-delivery-icon-png-image_2047531.jpg" 
            alt="Logo" 
            className="profile-logo2"  /* Bruk riktig CSS-klasse her */
          />
          <li><Link to="/home">Home</Link></li>
          <li><Link to="/data">Data</Link></li>
          <li><Link to="/ems">EMS</Link></li>
          <li><Link to="/vehicles">Vehicles</Link></li>
          <li><Link to="/maps">Locations</Link></li>
          <li><Link to="/profile">Profile</Link></li>
          <Logout />
          
        
        </ul>
      </nav>
    </header>
  );
};

export default Navbar;
