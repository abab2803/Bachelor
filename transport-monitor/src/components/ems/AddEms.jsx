import React, { useState, useEffect } from 'react';
import Navbar from '../Common/Navbar';
import { db, auth } from '../../firebase'; 
import { collection, query, where, getDocs, getDoc, doc, addDoc, serverTimestamp } from 'firebase/firestore';

const AddEms = () => {
  const [emsId, setEmsId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [vehicles, setVehicles] = useState([]);
  const [sensors, setSensors] = useState([{ sensorId: '', type: 'temperature' }]);
  const [message, setMessage] = useState('');

  const sensorTypes = ['temperature', 'GPS', 'humidity', 'pressure'];

  // Fetch vehicles from Firestore
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          console.error('User not authenticated');
          return;
        }
  
        // Fetch the user's role
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userRole = userDoc.exists() ? userDoc.data().role : null;
  
        let q;
        const vehiclesCollection = collection(db, 'vehicles');
  
        // Query all vehicles if admin, otherwise filter by ownerId
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
  
        setVehicles(vehiclesData);
      } catch (error) {
        console.error('Error fetching vehicles:', error);
      }
    };
  
    fetchVehicles();
  }, []);

  const handleSensorChange = (index, field, value) => {
    const newSensors = [...sensors];
    newSensors[index][field] = value;
    setSensors(newSensors);
  };

  const addSensorField = () => {
    setSensors([...sensors, { sensorId: '', type: 'temperature' }]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = auth.currentUser;
      if (!user) {
        console.error('User not authenticated');
        return;
      }

      if(!vehicleId){
        console.error('Vehicle ID is not selected');
        setMessage('Please select a vehicle');
        return;
      }

      await addDoc(collection(db, 'ems'), {
        emsId,                
        customerId: user.uid, 
        vehicleId,
        sensors,
        timestamp: serverTimestamp()  
      });

      setMessage('EMS registered successfully!');
      setEmsId('');
      setVehicleId('');
      setSensors([{ sensorId: '', type: 'temperature' }]);
    } catch (error) {
      console.error('Error registering EMS:', error);
      setMessage('Failed to register EMS. Please try again.');
    }
  };

  return (
    <div>
      <header className='header'>
        <Navbar />
      </header>

      <h1 style={styles.title}>Add EMS</h1>
      <div style={styles.container}>
        {message && <p style={styles.message}>{message}</p>}
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>EMS ID:</label>
            <input
              type='text'
              value={emsId}
              onChange={(e) => setEmsId(e.target.value)}
              required
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Vehicle ID:</label>
            <select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              required
              style={styles.select}
            >
              <option value="" disabled>Select a vehicle</option>
              {vehicles.map(vehicle => (
                <option key={vehicle.id} value={vehicle.vehicleId}>
                  {vehicle.vehicleId} ({vehicle.vehicleType})
                </option>
              ))}
            </select>
          </div>

          <div style={styles.formGroup}>
            <h3 style={styles.subTitle}>Sensors</h3>
            {sensors.map((sensor, index) => (
              <div key={index} style={styles.sensorGroup}>
                <label style={styles.label}>Sensor ID:</label>
                <input
                  type='text'
                  value={sensor.sensorId}
                  onChange={(e) => handleSensorChange(index, 'sensorId', e.target.value)}
                  required
                  style={styles.input}
                />
                <label style={styles.label}>Type:</label>
                <select
                  value={sensor.type}
                  onChange={(e) => handleSensorChange(index, 'type', e.target.value)}
                  required
                  style={styles.select}
                >
                  {sensorTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            ))}
            <button type='button' onClick={addSensorField} style={styles.button}>
              Add Sensor
            </button>
          </div>

          <button type='submit' style={styles.submitButton}>Register EMS</button>
        </form>
      </div>
    </div>
  );
};

// Updated styles for the component
const styles = {
  container: {
    marginTop: '20px',
    width: '100%',
    maxWidth: '600px',
    padding: '30px',
    backgroundColor: '#f9f9f9',
    border: '1px solid #ddd',
    borderRadius: '10px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  title: {
    textAlign: 'center',
    marginBottom: '20px',
    color: '#333',
  },
  message: {
    textAlign: 'center',
    color: 'green',
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
  button: {
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    padding: '10px 15px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    marginTop: '10px',
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
  sensorGroup: {
    marginBottom: '15px',
  },
  subTitle: {
    fontWeight: 'bold',
    marginBottom: '10px',
  },
};

export default AddEms;
