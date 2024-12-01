import React, { useState, useEffect } from 'react';
import { db, auth } from "../../firebase";
import { collection, addDoc, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import Navbar from '../Common/Navbar';

const ManageVehicles = () => {
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [vehicleType, setVehicleType] = useState('truck');
  const [vehicleId, setVehicleId] = useState('');
  const [vehicleList, setVehicleList] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const user = auth.currentUser;
 


  // Fetch existing vehicles
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        if (!user) {
          console.error('User not authenticated');
          return;
        }

        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userRole = userDoc.exists() ? userDoc.data().role : null;

        let q;
        const vehiclesCollection = collection(db, 'vehicles');

        if (userRole === 'admin') {
          q = query(vehiclesCollection);
        } else {
          q = query(vehiclesCollection, where('ownerId', '==', user.uid));
        }

        const querySnapshot = await getDocs(q);
        const vehiclesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        setVehicleList(vehiclesData);
      } catch (error) {
        console.error('Error fetching vehicles:', error);
      }
    };

    fetchVehicles();
  }, [user, success]); // Added success to dependencies

  const resetForm = () => {
    setVehicleType('truck');
    setVehicleId('');
    setSelectedVehicleId('');
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation: vehicleId must be at least 5 characters
    if (!vehicleId || vehicleId.length < 5) {
      setError("Vehicle ID must be at least 5 characters long.");
      return;
    }

    try {
      setIsLoading(true);

      // Check if vehicleId is unique
      const q = query(collection(db, "vehicles"), where("vehicleId", "==", vehicleId));
      const querySnapshot = await getDocs(q);

      if (isUpdateMode) {
        // Exclude current vehicle from uniqueness check
        const vehicleExists = querySnapshot.docs.some(doc => doc.id !== selectedVehicleId);
        if (vehicleExists) {
          setError("Vehicle ID is already taken by another vehicle. Please choose another ID.");
          setIsLoading(false);
          return;
        }

        // Update existing vehicle
        if (!selectedVehicleId) {
          setError("Please select a vehicle to update.");
          setIsLoading(false);
          return;
        }

        const vehicleDocRef = doc(db, 'vehicles', selectedVehicleId);

        await updateDoc(vehicleDocRef, {
          vehicleType: vehicleType,
          vehicleId: vehicleId,
          timestamp: new Date(),
        });

        setSuccess("Vehicle updated successfully!");
      } else {
        // In add mode, check if vehicleId is unique
        if (!querySnapshot.empty) {
          setError("Vehicle ID is already taken. Please choose another ID.");
          setIsLoading(false);
          return;
        }

        // Add new vehicle
        await addDoc(collection(db, "vehicles"), {
          vehicleType: vehicleType,
          vehicleId: vehicleId,
          ownerId: user.uid,
          timestamp: new Date(),
        });

        setSuccess("Vehicle added successfully!");
      }

      resetForm();
      setIsLoading(false);
    } catch (error) {
      console.error("Error submitting vehicle: ", error);
      setError("Failed to submit vehicle. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div>
      <header className='header'>
        <Navbar />
      </header>

      <h1 style={styles.title}>{isUpdateMode ? 'Update Vehicle' : 'Add Vehicle'}</h1>

      <div style={styles.modeToggle}>
        <button onClick={() => navigate(-1)} style={styles.backButton}>
          Go back
        </button>

        <button
          type="button"
          onClick={() => {
            setIsUpdateMode(false);
            resetForm();
          }}
          style={!isUpdateMode ? styles.addButton : styles.updateButton}
        >
          Add 
        </button>
        <button
          type="button"
          onClick={() => {
            setIsUpdateMode(true);
            resetForm();
          }}
          style={isUpdateMode ? styles.addButton : styles.updateButton}
        >
          Update 
        </button>
      </div>

      <div style={styles.container}>
        {error && <p style={styles.error}>{error}</p>}
        {success && <p style={styles.success}>{success}</p>}

        <form onSubmit={handleSubmit} style={styles.form}>
          {isUpdateMode && (
            <div style={styles.formGroup}>
              <label style={styles.label}>Choose the Vehicle to update:</label>
              <select
                value={selectedVehicleId}
                onChange={(e) => {
                  const vehicleDocId = e.target.value;
                  setSelectedVehicleId(vehicleDocId);
                  const selectedVehicle = vehicleList.find(vehicle => vehicle.id === vehicleDocId);
                  if (selectedVehicle) {
                    setVehicleId(selectedVehicle.vehicleId);
                    setVehicleType(selectedVehicle.vehicleType);
                  }
                }}
                required
                style={styles.select}
              >
                <option value="" disabled>Select a Vehicle</option>
                {vehicleList.map(vehicle => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.vehicleId} ({vehicle.vehicleType})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div style={styles.formGroup}>
            <label htmlFor="vehicleType" style={styles.label}>Vehicle Type:</label>
            <select
              id="vehicleType"
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
              style={styles.select}
            >
              <option value="truck">Truck</option>
              <option value="boat">Boat</option>
              <option value="train">Train</option>
              <option value="plane">Plane</option>
              <option value="container">Container</option>
            </select>
          </div>

          <div style={styles.formGroup}>
            <label htmlFor="vehicleId" style={styles.label}>Vehicle ID:</label>
            <input
              type='text'
              id='vehicleId'
              name='vehicleId'
              placeholder='Enter unique vehicle ID.. (min. 5 characters)'
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              style={styles.input}
            />
          </div>

          {isLoading ? (
            <p style={styles.loading}>{isUpdateMode ? 'Updating vehicle...' : 'Adding vehicle...'}</p>
          ) : (
            <button type='submit' style={styles.submitButton}>
              {isUpdateMode ? 'Update Vehicle' : 'Add Vehicle'}
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: {
    marginTop: '20px',
    width: '100%',
    maxWidth: '600px',
    padding: '30px',
    backgroundColor: '#f9f9f9',
    border: '1px solid #ddd',
    borderRadius: '10px',
    marginLeft: 'auto',
    marginRight: 'auto',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  title: {
    textAlign: 'center',
    marginBottom: '20px',
    color: '#333',
    fontFamily: "'DM Serif Text', serif", 
    marginTop: '150px', 
    fontSize: '3rem', 
    marginBottom: '30px', 
    fontWeight: 'normal',
    textAlign: 'center'
  },
  error: {
    color: 'red',
    textAlign: 'center',
  },
  success: {
    color: 'green',
    textAlign: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  formGroup: {
    marginBottom: '15px',
  },
  label: {
    display: 'block',
    fontWeight: 'bold',
    marginBottom: '5px',
    color: '#555',
  },
  input: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '14px',
  },
  select: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '14px',
  },
  submitButton: {
    backgroundColor: '#007BFF',
    color: 'white',
    border: 'none',
    padding: '10px 15px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
  },
  loading: {
    textAlign: 'center',
    color: '#555',
  },
  modeToggle: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '20px',
  },
  addButton: {
    backgroundColor: '#007BFF',
    color: 'white',
    border: 'none',
    padding: '10px 15px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    margin: '0 5px',
  },
  updateButton: {
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    padding: '10px 15px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    margin: '0 5px',
  },
  backButton: {
    backgroundColor: '#007BFF',
    color: 'white',
    border: 'none',
    padding: '10px 15px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    margin: '0 5px',

  }
};

export default ManageVehicles;
