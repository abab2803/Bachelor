import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LogIn from './components/auth/LogIn';
import Register from './components/auth/register';
import Home from './components/Home/Home';
import EmsDetails from './components/ems/EmsDetails';
import VehicleDetails from './components/Vehicles/VehicleDetails';
import DataDetails from './components/data/DataDetails';
import MapDetails from './components/maps/MapDetails';
import ProfileDetails from './components/profile/ProfileDetails';
function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path='/' element={<LogIn />} />
          <Route path='/Register' element={<Register />} />
          {/* Hjemmesiden vil vise navbaren */}
          <Route path="/home" element={<Home />} />
           {/* Undersider som bruker samme navbar */}
           <Route path="/ems" element={<EmsDetails />} />
           <Route path="/vehicles" element={<VehicleDetails />} />
           <Route path="/maps" element={<MapDetails />} />
           <Route path="/data" element={<DataDetails />} />
           <Route path="/profile" element={<ProfileDetails />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
