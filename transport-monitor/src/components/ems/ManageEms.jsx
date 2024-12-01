import React, { useState, useEffect } from 'react';
import Navbar from '../Common/Navbar';
import { db, auth } from '../../firebase'; 
import { collection, query, where, getDocs, getDoc, doc, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const ManageEms = () => {
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [emsId, setEmsId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [vehicles, setVehicles] = useState([]);
  const [sensors, setSensors] = useState([{ sensorId: '', type: 'temperature' }]);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const [emsList, setEmsList] = useState([]);
  const [selectedEmsId, setSelectedEmsId] = useState('');

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

  // Fetch EMS list from Firestore
  useEffect(() => {
    const fetchEmsList = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          console.error('User not authenticated');
          return;
        }

        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userRole = userDoc.exists() ? userDoc.data().role : null;

        let q;
        const emsCollection = collection(db, 'ems');

        if (userRole === 'admin') {
          q = query(emsCollection);
        } else {
          q = query(emsCollection, where('customerId', '==', user.uid));
        }

        const querySnapshot = await getDocs(q);
        const emsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        setEmsList(emsData);
      } catch (error) {
        console.error('Error fetching EMS list:', error);
      }
    };

    fetchEmsList();
  }, []);

  const handleSensorChange = (index, field, value) => {
    const newSensors = [...sensors];
    newSensors[index][field] = value;
    setSensors(newSensors);
  };

  const addSensorField = () => {
    setSensors([...sensors, { sensorId: '', type: 'temperature' }]);
  };

  const resetForm = () => {
    setEmsId('');
    setVehicleId('');
    setSensors([{ sensorId: '', type: 'temperature' }]);
    setSelectedEmsId('');
    setMessage('');
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

      if (isUpdateMode) {
        // Update existing EMS
        if (!selectedEmsId) {
          console.error('EMS is not selected');
          setMessage('Please select an EMS to update');
          return;
        }

        const emsDocRef = doc(db, 'ems', selectedEmsId);

        await updateDoc(emsDocRef, {
          emsId,
          vehicleId,
          sensors,
          timestamp: serverTimestamp(),
        });

        setMessage('EMS updated successfully!');
      } else {
        // Add new EMS
        await addDoc(collection(db, 'ems'), {
          emsId,                
          customerId: user.uid, 
          vehicleId,
          sensors,
          timestamp: serverTimestamp()  
        });

        setMessage('EMS registered successfully!');
      }

      resetForm();
    } catch (error) {
      console.error('Error submitting EMS:', error);
      setMessage('Failed to submit EMS. Please try again.');
    }
  };

  return (
    <div>
      <header className='header'>
        <Navbar />
      </header>

      <h1 style={styles.title}>{isUpdateMode ? 'Update EMS' : 'Add EMS'}</h1>

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
        {message && <p style={styles.message}>{message}</p>}
        <form onSubmit={handleSubmit} style={styles.form}>
          {isUpdateMode && (
            <div style={styles.formGroup}>
              <label style={styles.label}>Choose the EMS to update:</label>
              <select
                value={selectedEmsId}
                onChange={(e) => {
                  const emsId = e.target.value;
                  setSelectedEmsId(emsId);
                  const selectedEms = emsList.find(ems => ems.id === emsId);
                  if (selectedEms) {
                    setEmsId(selectedEms.emsId);
                    setVehicleId(selectedEms.vehicleId);
                    setSensors(selectedEms.sensors);
                  }
                }}
                required
                style={styles.select}
              >
                <option value="" disabled>Choose an EMS</option>
                {emsList.map(ems => (
                  <option key={ems.id} value={ems.id}>
                    {ems.emsId}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div style={styles.formGroup}>
            <label style={styles.label}>EMS ID:</label>
            <input
              type='text'
              value={emsId}
              onChange={(e) => setEmsId(e.target.value)}
              required
              style={styles.input}
              disabled={isUpdateMode}
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

          <button type='submit' style={styles.submitButton}>
            {isUpdateMode ? 'Oppdater EMS' : 'Registrer EMS'}
          </button>
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
    fontFamily: "'DM Serif Text', serif", 
    marginTop: '100px', 
    fontSize: '3rem', 
    marginBottom: '50px', 
    fontWeight: 'normal',
    textAlign: 'center'
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
    margin: '0 5px'}

};

export default ManageEms;
