import React, { useEffect, useState } from 'react';
import { db, auth } from '../../firebase'; 
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore'; 
import { Link } from 'react-router-dom';
import Navbar from '../Common/Navbar';
import '../css/ems.css'; 

const EmsDetails = () => {
  const [emsList, setEmsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('');

  // Funksjon for å hente rollen til brukeren
  const fetchRole = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        return userDoc.data().role;
      }
    } catch (error) {
      console.error("Error fetching user role:", error);
    }
    return null;
  };

  // Funksjon som henter EMS-data basert på brukerens rolle
  const fetchEmsData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.log("User is not logged in");
        return;
      }

      const userRole = await fetchRole(user.uid);
      setRole(userRole);

      let q;
      const emsCollection = collection(db, 'ems');

      // Hent alle EMS-data hvis admin, ellers hent bare for gjeldende bruker
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

      // Sorter EMS-dataene etter timestamp i synkende rekkefølge (nyeste først)
      emsData.sort((a, b) => b.timestamp?.seconds - a.timestamp?.seconds);

      setEmsList(emsData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching EMS data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmsData();
  }, []);

  if (loading) {
    return <p>Loading EMS data...</p>;
  }

  return (
    <div className="ems-details-container">
      <header className='header'>
        <Navbar />
      </header>

      <h1 style={{ fontFamily: "'DM Serif Text', serif", marginTop: '100px', fontSize: '3rem', marginBottom: '30px',  fontWeight: 'normal', textAlign: 'center' }}>
           Ems Details
      </h1>

      <Link to="/ems/manage-ems" className="add-ems-link">Manage Ems</Link>

      <table className="ems-table">
        <thead>
          <tr>
            <th>EMS ID</th>
            <th>Vehicle ID</th>
            <th>Timestamp</th>
            <th>Sensors</th>
          </tr>
        </thead>
        <tbody>
          {emsList.map((ems) => (
            <tr key={ems.id}>
              <td>{ems.emsId}</td>
              <td>{ems.vehicleId}</td>
              <td>{new Date(ems.timestamp?.seconds * 1000).toLocaleString()}</td>
              <td>
                {ems.sensors.map((sensor, index) => (
                  <div key={index}>
                    <strong>ID:</strong> {sensor.sensorId}, <strong>Type:</strong> {sensor.type}
                  </div>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EmsDetails;
