import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { collection, query, where, getDocs } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../../firebase";
import "mapbox-gl/dist/mapbox-gl.css"; // Import Mapbox CSS
import Navbar from '../Common/Navbar';

mapboxgl.accessToken = 'pk.eyJ1IjoibW9oMzMiLCJhIjoiY20zcTBkMDkxMGplbDJucXU4cm1zb3hpOSJ9.KWWbnXEBrm1ntpWHDZtl9Q';

const MapDetails = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [vehicleList, setVehicleList] = useState([]); // Liste over kjøretøy
  const [selectedVehicleId, setSelectedVehicleId] = useState(null); // Valgt kjøretøy
  const [emsList, setEmsList] = useState([]); // Liste over EMS-er
  const [selectedEmsId, setSelectedEmsId] = useState(null); // Valgt EMS
  const [startEndPoints, setStartEndPoints] = useState(null); // Start- og sluttpunkter

  // Hent kjøretøy for bruker
  const fetchVehicles = async (role, uid) => {
    const emsRef = collection(db, "ems");
    try {
      let q;
      if (role === "admin") {
        q = query(emsRef);
      } else {
        q = query(emsRef, where("customerId", "==", uid));
      }

      const querySnapshot = await getDocs(q);
      const vehicles = new Set();
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        vehicles.add(data.vehicleId);
      });

      setVehicleList([...vehicles]);
      if (vehicles.size > 0) {
        setSelectedVehicleId([...vehicles][0]);
      }
    } catch (error) {
      console.error("Feil ved henting av kjøretøy:", error);
    }
  };

  // Hent EMS-er for valgt kjøretøy
  const fetchEmsList = async (vehicleId) => {
    const emsRef = collection(db, "ems");
    try {
      const q = query(emsRef, where("vehicleId", "==", vehicleId));
      const querySnapshot = await getDocs(q);
      const ems = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        ems.push({ emsId: data.emsId, customerId: data.customerId });
      });

      setEmsList(ems);
      if (ems.length > 0) {
        setSelectedEmsId(ems[0].emsId);
      }
    } catch (error) {
      console.error("Feil ved henting av EMS-liste:", error);
    }
  };

  // Hent GPS-data for valgt EMS
  const fetchRouteData = async (emsId) => {
    const sensorDataRef = collection(db, "sensorData");

    try {
      const q = query(sensorDataRef, where("emsId", "==", emsId));
      const querySnapshot = await getDocs(q);
      const gpsData = [];

      querySnapshot.forEach((doc) => {
        const docData = doc.data();
        if (docData.type === "GPS" && docData.latitude && docData.longitude) {
          gpsData.push({
            latitude: docData.latitude,
            longitude: docData.longitude,
            timestamp: new Date(docData.timestamp),
          });
        }
      });

      console.log("GPS Data from Firebase:", gpsData);

      gpsData.sort((a, b) => a.timestamp - b.timestamp);

      if (gpsData.length >= 2) {
        setStartEndPoints({
          start: [gpsData[0].latitude, gpsData[0].longitude],
          end: [gpsData[gpsData.length - 1].latitude, gpsData[gpsData.length - 1].longitude],
        });
      } else {
        console.warn("Ikke nok GPS-punkter for å generere en rute.");
        alert("Ingen rute tilgjengelig for denne EMS-en.");
        setStartEndPoints(null);
      }
    } catch (error) {
      console.error("Feil ved henting av rutedata fra Firebase:", error);
      setStartEndPoints(null);
    }
  };

  // Hent rute fra Mapbox Directions API
  const getRoute = async (start, end) => {
    try {
      const query = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson&access_token=${mapboxgl.accessToken}`
      );
      const json = await query.json();

      if (!json.routes || json.routes.length === 0) {
        console.error("Ingen ruter funnet mellom punktene:", start, end);
        alert("Ingen ruter funnet mellom punktene. Sjekk at punktene er koblet via veier.");
        return null;
      }

      return {
        type: "Feature",
        properties: {},
        geometry: json.routes[0].geometry,
      };
    } catch (error) {
      console.error("Feil ved henting av rute fra API:", error);
      return null;
    }
  };

  // Initialiser kartet og oppdater ruten
  useEffect(() => {
    if (!map.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v11",
        center: [10.7522, 59.9139], // Oslo
        zoom: 15,
      });
    }
  
    if (startEndPoints) {
      const { start, end } = startEndPoints;
  
      const fetchAndDisplayRoute = async () => {
        const geojson = await getRoute(start, end);
        if (geojson) {
          if (map.current.getSource("route")) {
            map.current.removeLayer("route");
            map.current.removeSource("route");
          }
          map.current.addSource("route", {
            type: "geojson",
            data: geojson,
          });
          map.current.addLayer({
            id: "route",
            type: "line",
            source: "route",
            layout: {
              "line-join": "round",
              "line-cap": "round",
            },
            paint: {
              "line-color": "#3887be",
              "line-width": 5,
              "line-opacity": 0.75,
            },
          });
  
          const bounds = geojson.geometry.coordinates.reduce(
            (bounds, coord) => bounds.extend(coord),
            new mapboxgl.LngLatBounds(
              geojson.geometry.coordinates[0],
              geojson.geometry.coordinates[0]
            )
          );
          map.current.fitBounds(bounds, { padding: 20 });
        }
      };
  
      fetchAndDisplayRoute();
    } else {
      // Hvis ingen rute, tilbakestill kartet til standardvisning
      if (map.current.getSource("route")) {
        map.current.removeLayer("route");
        map.current.removeSource("route");
      }
      map.current.flyTo({
        center: [10.7522, 59.9139], // Standard senter (Norge)
        zoom: 5,
      });
    }
  }, [startEndPoints]);
  

  // Håndter brukerinnlogging
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const uid = user.uid;

        const userRef = collection(db, "users");
        const q = query(userRef, where("uid", "==", uid));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0].data();
          fetchVehicles(userDoc.role, uid);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (selectedVehicleId) {
      fetchEmsList(selectedVehicleId);
    }
  }, [selectedVehicleId]);

  useEffect(() => {
    if (selectedEmsId) {
      fetchRouteData(selectedEmsId);
    }
  }, [selectedEmsId]);

  return (
    <div style={{ width: "100vw", height: "100vh" }}> {/* Full skjermbredde og høyde */}
    <header className="header" style={{ zIndex: 10, position: "absolute", width: "100%" }}>
      <Navbar />
    </header>
  
    <div style={{ display: "flex", flexDirection: "column", height: "100%", marginTop: "60px" }}>
      <div style={{ marginBottom: "20px", padding: "10px" }}>
        <label htmlFor="vehicleDropdown" style={{ marginRight: "10px" }}>
          Velg et kjøretøy:
        </label>
        <select
          id="vehicleDropdown"
          value={selectedVehicleId || ""}
          onChange={(e) => setSelectedVehicleId(e.target.value)}
          style={{ marginRight: "20px" }}
        >
          {vehicleList.map((vehicle) => (
            <option key={vehicle} value={vehicle}>
              {vehicle}
            </option>
          ))}
        </select>
  
        <label htmlFor="emsDropdown" style={{ marginRight: "10px" }}>
          Velg en EMS:
        </label>
        <select
          id="emsDropdown"
          value={selectedEmsId || ""}
          onChange={(e) => setSelectedEmsId(e.target.value)}
        >
          {emsList.map((ems) => (
            <option key={ems.emsId} value={ems.emsId}>
              {ems.emsId}
            </option>
          ))}
        </select>
      </div>
  
      <div
        ref={mapContainer}
        style={{
          flex: 1,
          width: "100vw",
          height: "100%",
        }}
      />
    </div>
  </div>
  
        
  );
};

export default MapDetails;
