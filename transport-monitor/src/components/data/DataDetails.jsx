import React, { useEffect, useState } from "react";
import { db, auth } from "../../firebase";
import { collection, query, where, getDocs, getDoc, doc, orderBy } from "firebase/firestore";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Navbar from '../Common/Navbar';
import '../css/dataDetails.css'; // Importer CSS for styling

const DataDetails = () => {
    const [sensorData, setSensorData] = useState([]);
    const [loading, setLoading] = useState(true); // Rettet her
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

    // Funksjon som genererer data i en PDF direkte uten å være avhengig av HTML-innholdet
    const generatePDF = () => {
        const doc = new jsPDF();
    
        // Legg til tittel
        doc.setFontSize(18);
        doc.text('Sensor Data', 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
    
        // Forbered dataene for tabellen
        const tableColumn = ["Company", "Name", "Vehicle ID", "EMS ID", "Sensor ID", "Type", "Value", "Timestamp"]; // Oppdater kolonnene
        const tableRows = [];
    
        sensorData.forEach(data => {
            const value = data.type === "GPS"
                ? `Lat: ${data.latitude}, Lng: ${data.longitude}`
                : data.value;
    
            const rowData = [
                data.company || '',     // Legg til denne linjen
                data.name || '',
                data.vehicleId || '',
                data.emsId || '',
                data.sensorId || '',
                data.type || '',
                value || '',
                data.timestamp || '' 
            ];
            tableRows.push(rowData);
        }); 
    
        // Generer tabellen
        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 30,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [41, 128, 185] },
        });
    
        // Lagre PDF-en
        doc.save('sensor_data.pdf');
    };
    

    // Funksjon for å hente sensordata inkludert vehicleId, name og company
    const fetchSensorData = async (userId, role) => {
        setLoading(true);
        setError(null);
        try {
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

            const sensorDataArray = sensorSnapshots.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Hent unike customerId-er fra sensorDataArray
            const customerIds = [...new Set(sensorDataArray.map(data => data.customerId).filter(id => id))];

            // Opprett en mapping mellom customerId og brukerdata (name og company)
            let customerIdToUserData = {};
            for (const customerId of customerIds) {
                try {
                    const userDoc = await getDoc(doc(db, "users", customerId));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        customerIdToUserData[customerId] = {
                            name: userData.name || "Unknown",
                            company: userData.company || "Unknown"
                        };
                    } else {
                        customerIdToUserData[customerId] = { name: "Unknown", company: "Unknown" };
                    }
                } catch (error) {
                    console.error("Feil ved henting av brukerdata:", error);
                    customerIdToUserData[customerId] = { name: "Unknown", company: "Unknown" };
                }
            }

            // Lag en liste over unike emsId-er
            const emsIds = [...new Set(sensorDataArray.map(data => data.emsId).filter(id => id))];

            // Hent alle ems-dokumenter med disse emsId-ene
            let emsIdToVehicleId = {};
            if (emsIds.length > 0) {
                const emsQuery = query(
                    collection(db, "ems"),
                    where("emsId", "in", emsIds.slice(0, 10)) // Firestore støtter maks 10 elementer i 'in' spørringer
                );
                const emsSnapshots = await getDocs(emsQuery);
                emsSnapshots.docs.forEach(doc => {
                    const data = doc.data();
                    emsIdToVehicleId[data.emsId] = data.vehicleId || "Ukjent";
                });
            }

            // Oppdater sensorDataArray med vehicleId, name og company
            const updatedSensorData = sensorDataArray.map(data => {
                let timestamp = data.timestamp;
                // Håndter timestamp
                if (timestamp && timestamp.toDate) {
                    timestamp = timestamp.toDate().toLocaleString();
                } else if (typeof timestamp === "string" || timestamp instanceof Date) {
                    timestamp = new Date(timestamp).toLocaleString();
                } else {
                    timestamp = "Ukjent";
                }

                const vehicleId = emsIdToVehicleId[data.emsId] || "Ukjent";
                const userData = customerIdToUserData[data.customerId] || { name: "Unknown", company: "Unknown" };
                const name = userData.name;
                const company = userData.company;

                return {
                    ...data,
                    timestamp,
                    vehicleId,
                    name,
                    company
                };
            });

            setSensorData(updatedSensorData);
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
                console.log("Innlogget bruker:", currentUser);
                // Når brukeren er logget inn, hent deres rolle og tilknyttede sensordata
                const userRole = await fetchUserRole(currentUser.uid);
                console.log("Brukerens rolle:", userRole);
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
        <div className="data-details-container">
            <header className="header">
                <Navbar />
            </header>
            <div className="content">
            <h1 style={{ fontFamily: "'DM Serif Text', serif", marginTop: '60px', fontSize: '3rem', marginBottom: '30px',  fontWeight: 'normal', textAlign: 'center' }}>
                See All Sensor Data
            </h1>

                {error && <p style={{ color: "red" }}>{error}</p>}
                {loading ? (
                    <p>Loading...</p>
                ) : (
                    <>
                        <button onClick={generatePDF} className="pdf-button">
                            Export to PDF
                        </button>

                        <div className="data-table">
                            <div className="data-table-header">
                                <span>Company</span> {/* Legg til denne linjen */}
                                <span>Name</span>
                                <span>Vehicle ID</span>
                                <span>EMS ID</span>
                                <span>Sensor ID</span>
                                <span>Type</span>
                                <span>Value</span>
                                <span>Timestamp</span>
                            </div>
                            <div>
                                {sensorData.map((data, index) => (
                                    <div key={data.sensorId + index} className="data-table-row">
                                        <span>{data.company}</span> {/* Legg til denne linjen */}
                                        <span>{data.name}</span>
                                        <span>{data.vehicleId}</span>
                                        <span>{data.emsId}</span>
                                        <span>{data.sensorId}</span>
                                        <span>{data.type}</span>
                                        <span>
                                            {data.type === "GPS"
                                                ? `Lat: ${data.latitude}, Long: ${data.longitude}`
                                                : data.value}
                                        </span>
                                        <span>{data.timestamp}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default DataDetails;
