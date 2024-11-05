import React, { useEffect, useState } from 'react';
import { db, auth} from "../../firebase";  // Firebase-importer
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';  // Firestore-funksjoner
import { Link } from 'react-router-dom';  // Importer Link fra react-router-dom
import Navbar from '../Common/Navbar';
import '../css/vehicles.css';  // CSS for styling

const VehicleDetails = () => {
  const [vehicles, setVehicles] = useState([]);  // State for kjøretøyene
  const [loading, setLoading] = useState(true);  // State for loading-indikator
  const [role, setRole] = useState('');


  // Funksjon som henter rolle fra firebase

  const fetchRole = async (uid) => {
    try {
      const userDOC = await getDoc(doc(db, "users", uid)); // går inn i collection users og videre inn i documentet
      if (userDOC.exists()) { // hvis uid eksisterer 
        return userDOC.data().role; // returner brukerens rolle (admin eller customer)
      }
    } catch (error) {             // hvis det er en error
      console.error("Error fetching user role:", error); // print ut denne meldingen på console
    }
    return null;
  }



  // Funksjon som henter kjøretøy fra Firestore basert på brukerens rolle
  const fetchVehicles = async () => {
    try {

      const user = auth.currentUser; // få nåværende bruker
      if(!user) {
        console.log("User is not logged in"); // hvis det ikke er en bruker pålogget print denne meldingen
        return;
      }


      // Hent brukerens rolle
      const userRolle = await fetchRole(user.uid);
      setRole(userRolle); // setter rollen i state 


      let q;
      const vehiclesCollection = collection(db, "vehicles");


      // Hvis brukeren er admin, hent alle kjøretøyene
      if(userRolle === 'admin') {
        q = query(vehiclesCollection);
      }

      // hvis brukeren er customer, hent bare deres kjøretøy
      else {
        q = query(vehiclesCollection, where("ownerId", "==", user.uid));
      }

      const querySnapshot = await getDocs(q);

      const vehiclesData = [];

      for (const vehicleDoc of querySnapshot.docs) {
        const vehicle = vehicleDoc.data();

        // Hent brukerinformasjon (eier) basert på ownerId
        const ownerDoc = await getDoc(doc(db, "users", vehicle.ownerId));
        const ownerData = ownerDoc.data();

        vehiclesData.push({
          ...vehicle,
          ownerName: ownerData ? ownerData.name : "Unknown",  // Henter eierens navn
          id: vehicleDoc.id,  // Dokument-ID for hvert kjøretøy
        });
      }

      
      vehiclesData.sort((a, b) => b.timestamp?.seconds - a.timestamp?.seconds);

      setVehicles(vehiclesData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching vehicles: ", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  if (loading) {
    return <p>Loading vehicles..</p>;
  }

  return (
    <div className="vehicle-details-container">
      <header className='header'>
      <Navbar />
    </header>
      <h1>Transport Details</h1>

      {/* Tabell eller liste over kjøretøy */}
      <div className="vehicle-list">
        <div className="vehicle-list-header">
          <span>Name</span>
          <span>Vehicle Type</span>
          <span>Vehicle ID</span>
          <span>Timestamp</span>
        </div>

        {vehicles.map((vehicle) => (
          <div key={vehicle.id} className="vehicle-list-row">
            <span>{vehicle.ownerName}</span>
            <span>{vehicle.vehicleType}</span>
            <span>{vehicle.vehicleId}</span>
            <span>{new Date(vehicle.timestamp?.seconds * 1000).toLocaleString()}</span>
          </div>
        ))}
      </div>
      <Link to="/vehicles/add-vehicles" className="add-vehicle-link">Add new Vehicle</Link>
    </div>
  );
};

export default VehicleDetails;
