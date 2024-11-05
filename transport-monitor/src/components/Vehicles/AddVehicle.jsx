import React, { useState } from 'react';
import { db, auth } from "../../firebase";  // Firebase-importer
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';  // Funksjoner for Firestore
import Navbar from '../Common/Navbar';

const AddVehicle = () => {
  const [vehicleType, setVehicleType] = useState('truck');  // Standard type
  const [vehicleId, setVehicleId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');  // For suksessmeldingen
  const [isLoading, setIsLoading] = useState(false);  // For å håndtere lastestatus

  const user = auth.currentUser;  // Hent innlogget bruker

  // Funksjon som håndterer kjøretøyregistrering
  const addVehicle = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validering av ID (minimum 5 tegn)
    if (!vehicleId || vehicleId.length < 5) {
      setError("Vehicle ID must be at least 5 characters long.");
      return;
    }

    try {
      setIsLoading(true);

      // Sjekk om ID-en allerede er tatt
      const q = query(collection(db, "vehicles"), where("vehicleId", "==", vehicleId));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setError("Vehicle ID is already taken. Please choose another ID.");
        setIsLoading(false);
        return;
      }

      // Hvis ID-en er unik, legg til kjøretøyet
      await addDoc(collection(db, "vehicles"), {
        vehicleType: vehicleType,
        vehicleId: vehicleId,
        ownerId: user.uid,  // Knytter kjøretøy til innlogget bruker
        timestamp: new Date()  // Lagrer når kjøretøyet ble lagt til
      });

      setSuccess("Vehicle added successfully!");  // Vis suksessmelding
      setVehicleId('');  // Tøm input-feltet
      setIsLoading(false);
    } catch (error) {
      console.error("Error adding vehicle: ", error);
      setError("Failed to add vehicle. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className='add-vehicle-container'>
      
      <header className='header'>
        <Navbar />
      </header>

      <form onSubmit={addVehicle}>
        <h1>Register a New Vehicle</h1>

        <label htmlFor="vehicleType">Vehicle Type:</label>
        <select
          id="vehicleType"
          value={vehicleType}
          onChange={(e) => setVehicleType(e.target.value)}
          className="input-field"
        >
          <option value="truck">Truck</option>
          <option value="boat">Boat</option>
          <option value="train">Train</option>
          <option value="plane">Plane</option>
          <option value="container">Container</option>
        </select>

        <label htmlFor="vehicleId">Vehicle ID:</label>
        <input
          type='text'
          id='vehicleId'
          name='vehicleId'
          placeholder='Enter unique vehicle ID.. (min. 5 characters)'
          value={vehicleId}
          onChange={(e) => setVehicleId(e.target.value)}
          className="input-field"
        />

        {/* Feilmelding vises hvis det er en feil */}
        {error && <p style={{ color: 'red' }}>{error}</p>}

        {/* Suksessmelding vises hvis det er suksess */}
        {success && <p style={{ color: 'green' }}>{success}</p>}

        {/* Lastestatus */}
        {isLoading ? <p>Adding vehicle...</p> : <button type='submit'>Add Vehicle</button>}
      </form>
    </div>
  );
};

export default AddVehicle;
