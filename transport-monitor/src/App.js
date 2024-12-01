import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LogIn from './components/auth/LogIn';
import Register from './components/auth/register';
import Home from './components/Home/Home';
import EmsDetails from './components/ems/EmsDetails';
import VehicleDetails from './components/Vehicles/VehicleDetails';
import ManageVehicles  from './components/Vehicles/ManageVehicles';
import DataDetails from './components/data/DataDetails';
import MapDetails from './components/maps/MapDetails';
import ProfileDetails from './components/profile/ProfileDetails';
import ManageEms from './components/ems/ManageEms';
import PrivateRoute from './components/auth/PrivateRoute';

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path='/' element={<LogIn />} />
          <Route path='/Register' element={<Register />} />
          {/* Hjemmesiden vil vise navbaren og vil kreve autentisering*/}
          <Route path="/home" element={<PrivateRoute> <Home /> </PrivateRoute>} />
           {/* Undersider som bruker samme navbar og som krever autentisering*/}
           <Route path="/ems" element={<PrivateRoute> <EmsDetails /> </PrivateRoute>} />
           <Route path="/ems/manage-ems" element={  <PrivateRoute> <ManageEms /> </PrivateRoute> } />
           <Route path="/vehicles" element={  <PrivateRoute> <VehicleDetails /> </PrivateRoute>    } />
           <Route path="/vehicles/manage-vehicles" element={<PrivateRoute>  <ManageVehicles /> </PrivateRoute>    } />
           <Route path="/maps" element={  <PrivateRoute> <MapDetails /> </PrivateRoute>  } />
           <Route path="/data" element={ <PrivateRoute> <DataDetails /> </PrivateRoute>    } />
           <Route path="/profile" element={  <PrivateRoute>  <ProfileDetails /> </PrivateRoute>   } />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
