import React, { useState, useEffect } from 'react';
import Navbar from '../Common/Navbar';
import { collection, getDocs, orderBy, query, limit } from 'firebase/firestore';
import { db } from '../../firebase'; // Firebase instans
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2'; // For sensordata-diagram

import "../css/home.css"

// Registrer nødvendige komponenter fra Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Home = () => {
  const [usersCount, setUsersCount] = useState(0);
  const [emsCount, setEmsCount] = useState(0);
  const [vehiclesCount, setVehiclesCount] = useState(0);
  const [temperatureData, setTemperatureData] = useState(null);

  useEffect(() => {
    fetchData();
    fetchLatestSensorData();
  }, []);

  const fetchData = async () => {
    try {
      // Hent antall brukere
      const usersSnapshot = await getDocs(collection(db, "users"));
      setUsersCount(usersSnapshot.size);

      // Hent antall EMS
      const emsSnapshot = await getDocs(collection(db, "ems"));
      setEmsCount(emsSnapshot.size);

      // Hent antall kjøretøy
      const vehiclesSnapshot = await getDocs(collection(db, "vehicles"));
      setVehiclesCount(vehiclesSnapshot.size);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const fetchLatestSensorData = async () => {
    try {
      // Hent den siste sensorData for temperatur (du kan gjøre dette for trykk, fuktighet, etc.)
      const sensorQuery = query(
        collection(db, "sensorData"),
        orderBy("timestamp", "desc"), // Sorter etter timestamp for å få den nyeste
        limit(1) // Hent kun den siste verdien
      );
      
      const sensorSnapshot = await getDocs(sensorQuery);
      if (!sensorSnapshot.empty) {
        const latestData = sensorSnapshot.docs[0].data();
        
        // Hent temperaturverdien fra den siste sensoren
        const latestTemperature = latestData.temperature; // Assuming 'temperature' is the field name

        // Sett temperature data for Chart.js
        setTemperatureData(latestTemperature);
      }
    } catch (error) {
      console.error('Error fetching latest sensor data:', error);
    }
  };

  // Chart.js-data for temperatur
  const chartData = {
    labels: ['Latest Sensor'], // Lagt til en etikett for siste sensor
    datasets: [
      {
        label: 'Temperature (°C)',
        data: temperatureData ? [temperatureData] : [20], // Bruk siste temperaturdata
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
        fill: false,
      },
    ],
  };

  return (
    <div className="home-container">
      <header className='header'>
        <Navbar />
      </header>

      <div className="content">
        <h1>Welcome to the Dashboard</h1>

        {/* Cards for displaying counts */}
        <div className="dashboard-cards">
          <div className="card">
            <h2>Users</h2>
            <p>{usersCount}</p>
          </div>
          <div className="card">
            <h2>EMS</h2>
            <p>{emsCount}</p>
          </div>
          <div className="card">
            <h2>Vehicles</h2>
            <p>{vehiclesCount}</p>
          </div>
        </div>

        {/* Chart for displaying sensor data */}
        <div className="card">
          <h2>Sensor Data - Temperature</h2>
          <Line data={chartData} />
        </div>
      </div>
    </div>
  );
};

export default Home;
