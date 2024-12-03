import React, { useState, useEffect } from 'react';
import Navbar from '../Common/Navbar';
import { collection, getDocs, getDoc, doc, query, where, limit, in as firestoreIn } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';

import "../css/home.css";

const Home = () => {
  const [usersCount, setUsersCount] = useState(0);
  const [emsCount, setEmsCount] = useState(0);
  const [vehiclesCount, setVehiclesCount] = useState(0);
  const [sensorCount, setSensorCount] = useState(0);
  const [vehicleTypesCount, setVehicleTypesCount] = useState({
    truck: 0,
    boat: 0,
    train: 0,
    plane: 0,
    container: 0,
  });
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);

        // Hent brukerrolle fra 'users'-samlingen
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const role = userDoc.data().role;
          setUserRole(role);
        } else {
          console.error('Brukerdokument ikke funnet');
        }
      } else {
        setUser(null);
        setUserRole('');
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (userRole) {
      fetchData();
    }
  }, [userRole]);

  const fetchData = async () => {
    try {
      if (!user) {
        console.error('Bruker ikke autentisert');
        return;
      }

      if (userRole === 'admin') {
        // Admin henter all data

        // Hent antall brukere
        const usersSnapshot = await getDocs(collection(db, "users"));
        setUsersCount(usersSnapshot.size);

        // Hent antall EMS
        const emsSnapshot = await getDocs(collection(db, "ems"));
        setEmsCount(emsSnapshot.size);

        // Hent antall kjøretøy og typefordeling
        const vehiclesSnapshot = await getDocs(collection(db, "vehicles"));
        setVehiclesCount(vehiclesSnapshot.size);

        const vehicleTypes = { truck: 0, boat: 0, train: 0, plane: 0, container: 0 };
        vehiclesSnapshot.docs.forEach(doc => {
          const data = doc.data();
          if (vehicleTypes[data.vehicleType] !== undefined) {
            vehicleTypes[data.vehicleType]++;
          }
        });
        setVehicleTypesCount(vehicleTypes);

        // Hent unike sensorId-er fra sensorData
        const sensorsSnapshot = await getDocs(collection(db, "sensorData"));
        const sensorIdsSet = new Set();

        sensorsSnapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.sensorId) {
            sensorIdsSet.add(data.sensorId);
          }
        });

        setSensorCount(sensorIdsSet.size); // Antall unike sensorer

      } else if (userRole === 'customer') {
        // Kunde henter kun sin egen data

        // Hent antall EMS knyttet til brukeren
        const emsSnapshot = await getDocs(
          query(collection(db, "ems"), where("customerId", "==", user.uid))
        );
        setEmsCount(emsSnapshot.size);

        // Hent antall kjøretøy og typefordeling knyttet til brukeren
        const vehiclesSnapshot = await getDocs(
          query(collection(db, "vehicles"), where("ownerId", "==", user.uid))
        );
        setVehiclesCount(vehiclesSnapshot.size);

        const vehicleTypes = { truck: 0, boat: 0, train: 0, plane: 0, container: 0 };
        vehiclesSnapshot.docs.forEach(doc => {
          const data = doc.data();
          if (vehicleTypes[data.vehicleType] !== undefined) {
            vehicleTypes[data.vehicleType]++;
          }
        });
        setVehicleTypesCount(vehicleTypes);

        // Hent unike sensorId-er fra sensorData knyttet til brukerens EMS
        // Først, få EMS-ID-er knyttet til brukeren
        const emsIds = emsSnapshot.docs.map(doc => doc.id);

        // Hent sensorData hvor emsId er i brukerens EMS-ID-er
        if (emsIds.length > 0) {
          // Firestore begrenser 'in' operatoren til maksimalt 10 elementer
          // Derfor må vi dele opp emsIds i grupper på 10 hvis det er flere
          const emsIdChunks = [];
          for (let i = 0; i < emsIds.length; i += 10) {
            emsIdChunks.push(emsIds.slice(i, i + 10));
          }

          const sensorIdsSet = new Set();

          for (const chunk of emsIdChunks) {
            const sensorsSnapshot = await getDocs(
              query(collection(db, "sensorData"), where("emsId", "in", chunk))
            );

            sensorsSnapshot.docs.forEach(doc => {
              const data = doc.data();
              if (data.sensorId) {
                sensorIdsSet.add(data.sensorId);
              }
            });
          }

          setSensorCount(sensorIdsSet.size); // Antall unike sensorer
        } else {
          setSensorCount(0);
        }

        // For kunder trenger vi kanskje ikke hente antall brukere
        // Du kan velge å skjule 'Users'-kortet for kunder
        setUsersCount(0);

      } else {
        console.error('Ukjent brukerrolle:', userRole);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  return (
    <div className="home-container">
      <header className='header'>
        <Navbar />
      </header>

      <div className="content">
        <h1 style={{ fontFamily: "'DM Serif Text', serif", marginTop: '120px', fontSize: '4rem', marginBottom: '50px',  fontWeight: 'normal', textAlign: 'center' }}>
           Welcome to  VirtualDrive
      </h1>

        {/* Kort for å vise antall */}
        <div className="dashboard-cards">
          {userRole === 'admin' && (
            <div className="card">
              <h2>Users</h2>
              <p>{usersCount}</p>
            </div>
          )}
          <div className="card">
            <h2>EMS's</h2>
            <p>{emsCount}</p>
          </div>
          <div className="card">
            <h2>Vehicles</h2>
            <p>{vehiclesCount}</p>
          </div>
          {userRole === 'admin' && (
            <div className="card">
             <h2>Sensors</h2>
             <p>{sensorCount}</p>
            </div>
          )}
        </div>

        {/* Kort for kjøretøytyper */}
        <h2 style={{fontSize: '2rem', fontFamily: "'DM Serif Text', serif", fontWeight: 'normal', textAlign: 'center'}}>Vehicles per type</h2>
        <div className="dashboard-cards">
          <div className="card">
            <h3>Trucks</h3>
            <p>{vehicleTypesCount.truck}</p>
          </div>
          <div className="card">
            <h3>Boats</h3>
            <p>{vehicleTypesCount.boat}</p>
          </div>
          <div className="card">
            <h3>Trains</h3>
            <p>{vehicleTypesCount.train}</p>
          </div>
          <div className="card">
            <h3>Planes</h3>
            <p>{vehicleTypesCount.plane}</p>
          </div>
          <div className="card">
            <h3>Containers</h3>
            <p>{vehicleTypesCount.container}</p>
          </div>
        </div>

        {/* Legg til flere seksjoner etter behov */}
      </div>
    </div>
  );
};

export default Home;
