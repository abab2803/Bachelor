import React, { useEffect, useState } from "react";
import { db, auth } from "../../firebase";
import { collection, query, where, getDocs, getDoc, doc, orderBy } from "firebase/firestore";
import Navbar from '../Common/Navbar';
import '../css/dataDetails.css';

const DataDetails = () => {
    const [sensorData, setSensorData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userRole, setUserRole] = useState(""); // For å lagre brukerens rolle

    // Funksjon for å hente brukerens rolle
    const fetchUserRole = async (uid) => {
        try {
            const userDoc = await getDoc(doc(db, "users", uid));
            if (userDoc.exists()) {
                return userDoc.data().role; // Returnerer "admin" eller "customer"
            }
        } catch (error) {
            console.error("Feil ved henting av brukerens rolle:", error);
            setError("Feil ved henting av brukerdata");
        }
        return null;
    };

    // Funksjon for å hente sensordata basert på brukerens rolle
    const fetchSensorData = async (userId, role) => {
        setLoading(true);
        setError(null);
        try {
            const allSensorData = [];
            let sensorQuery;

            if (role === "admin") {
                // Admin kan hente alle sensordata
                sensorQuery = query(
                    collection(db, "sensorData"),
                    orderBy("timestamp", "desc")
                );
            } else {
                // Kunde får tilgang til kun sine egne sensordata
                sensorQuery = query(
                    collection(db, "sensorData"),
                    where("customerId", "==", userId),
                    orderBy("timestamp", "desc")
                );
            }

            // Hent sensordata basert på spørringen
            const sensorSnapshots = await getDocs(sensorQuery);
            console.log("Hentet sensordata:", sensorSnapshots.docs.map(doc => doc.data()));

            sensorSnapshots.forEach((sensorDoc) => {
                const sensorData = sensorDoc.data();
                let timestamp = sensorData.timestamp;

                // Hvis timestamp er et Firestore Timestamp-objekt
                if (timestamp && timestamp.toDate) {
                    timestamp = timestamp.toDate().toLocaleString();  // Konverter til JavaScript Date
                } else if (typeof timestamp === "string" || timestamp instanceof Date) {
                    // Hvis timestamp er en streng eller allerede en Date
                    timestamp = new Date(timestamp).toLocaleString();
                } else {
                    timestamp = "Ukjent"; // Hvis timestamp ikke er definert eller er et annet format
                }

                allSensorData.push({
                    emsId: sensorData.emsId,
                    sensorId: sensorData.sensorId,
                    type: sensorData.type,
                    value: sensorData.value,
                    timestamp: timestamp, // Nå håndteres timestamp riktig
                    latitude: sensorData.latitude,
                    longitude: sensorData.longitude,
                });
            });

            setSensorData(allSensorData);
        } catch (error) {
            console.error("Feil ved henting av sensor data:", error);
            setError("Feil ved henting av sensor data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged(async (currentUser) => {
            if (currentUser) {
                // Når brukeren er logget inn, hent deres rolle og tilknyttede sensordata
                const userRole = await fetchUserRole(currentUser.uid);
                setUserRole(userRole); // Sett brukerens rolle
                fetchSensorData(currentUser.uid, userRole); // Hent sensordata basert på rolle
            } else {
                setSensorData([]);
                setLoading(false);
            }
        });

        return () => unsubscribeAuth();
    }, []);

    return (
        <div className="container">
            <header className='header'>
                <Navbar />
            </header>
            <div className="content">
                <h1>See All Sensor Data</h1>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                {loading ? (
                    <p>Laster inn...</p>
                ) : (
                    <table className="styled-table">
                        <thead>
                            <tr>
                                <th>EMS ID</th>
                                <th>Sensor ID</th>
                                <th>Type</th>
                                <th>Value</th>
                                <th>Timestamp</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sensorData.map((data, index) => (
                                <React.Fragment key={data.sensorId + index}>
                                    <tr>
                                        <td>{data.emsId}</td>
                                        <td>{data.sensorId}</td>
                                        <td>{data.type}</td>
                                        <td>
                                            {data.type === "GPS"
                                                ? `Lat: ${data.latitude}, Lng: ${data.longitude}`
                                                : data.value}
                                        </td>
                                        <td>{data.timestamp}</td>
                                    </tr>
                                    {index < sensorData.length - 1 && (
                                        <tr className="divider">
                                            <td colSpan="5"><hr /></td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default DataDetails;
