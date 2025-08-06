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
  const markersRef = useRef([]);

  // State variables
  const [vehicleList, setVehicleList] = useState([]); // List of vehicles
  const [selectedVehicleId, setSelectedVehicleId] = useState(null); // Selected vehicle
  const [emsList, setEmsList] = useState([]); // List of EMS devices
  const [selectedEmsId, setSelectedEmsId] = useState(null); // Selected EMS
  const [gpsDataPoints, setGpsDataPoints] = useState([]); // GPS data points

  // Fetch vehicles for user
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
      console.error("Error fetching vehicles:", error);
    }
  };

  // Fetch EMS list for selected vehicle
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
      console.error("Error fetching EMS list:", error);
    }
  };

  

  // Fetch GPS data for selected EMS
  const fetchRouteData = async (emsId) => {
    const sensorDataRef = collection(db, "sensorData");

    try {
      const q = query(sensorDataRef, where("emsId", "==", emsId));
      const querySnapshot = await getDocs(q);
      const dataByTimestamp = {};

      querySnapshot.forEach((doc) => {
        const docData = doc.data();

        // Parse timestamp
        let timestamp = null;
        if (docData.timestamp) {
          // Remove microseconds (if any) to prevent parsing errors
          const timestampStr = docData.timestamp.split(".")[0];
          timestamp = new Date(timestampStr);
        }
        const timestampKey = timestamp ? timestamp.toISOString() : null;

        if (!timestampKey) return; // Skip if timestamp is invalid

        // Initialize the data for this timestamp if not already done
        if (!dataByTimestamp[timestampKey]) {
          dataByTimestamp[timestampKey] = {
            timestamp: timestamp,
            emsId: docData.emsId,
            sensors: {},
          };
        }

        // For GPS data
        if (docData.type === "GPS") {
          let latitude, longitude;
          if (docData.latitude !== undefined && docData.longitude !== undefined) {
            latitude = docData.latitude;
            longitude = docData.longitude;
          } else if (docData.value) {
            // Parse value string
            const value = docData.value;
            const latMatch = value.match(/Lat:\s*([\d.-]+)/);
            const lngMatch = value.match(/Lng:\s*([\d.-]+)/);

            if (latMatch && lngMatch) {
              // Swap latitude and longitude if necessary
              longitude = parseFloat(latMatch[1]); // Note: Lat may actually be longitude
              latitude = parseFloat(lngMatch[1]);  // Lng may actually be latitude
            }
          }

          if (latitude !== undefined && longitude !== undefined) {
            dataByTimestamp[timestampKey].latitude = latitude;
            dataByTimestamp[timestampKey].longitude = longitude;
          }
        }

        // Add sensor data
        dataByTimestamp[timestampKey].sensors[docData.sensorId] = {
          type: docData.type,
          value: docData.value,
        };
      });

      // Create an array of data points with GPS data
      const gpsDataArray = Object.values(dataByTimestamp).filter(
        (dataPoint) => dataPoint.latitude !== undefined && dataPoint.longitude !== undefined
      );

      // Sort gpsDataPoints by timestamp (ascending order)
      gpsDataArray.sort((a, b) => a.timestamp - b.timestamp);

      console.log("GPS Data Points:", gpsDataArray);

      setGpsDataPoints(gpsDataArray);

    } catch (error) {
      console.error("Error fetching route data from Firebase:", error);
    }
  };

  // Initialize map and update route
  useEffect(() => {
    if (!map.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v11",
        center: [10.7522, 59.9139], // Oslo
        zoom: 15,
      });
    }

    if (gpsDataPoints.length >= 2) {
      // Create a GeoJSON LineString from gpsDataPoints
      const coordinates = gpsDataPoints.map((point) => [point.longitude, point.latitude]);

      const geojson = {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: coordinates,
        },
      };

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

      const bounds = new mapboxgl.LngLatBounds();
      coordinates.forEach((coord) => bounds.extend(coord));
      map.current.fitBounds(bounds, { padding: 20 });
    } else {
      // If no route, reset the map to default view
      if (map.current.getSource("route")) {
        map.current.removeLayer("route");
        map.current.removeSource("route");
      }
      map.current.flyTo({
        center: [10.7522, 59.9139], // Default center (Norway)
        zoom: 5,
      });
    }
  }, [gpsDataPoints]);

  // UseEffect to handle markers
  useEffect(() => {
    if (!map.current) return; // Wait for the map to initialize

    // Remove existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add new markers
    gpsDataPoints.forEach((point) => {
      const popupContent = `
        <h3>EMS ID: ${point.emsId}</h3>
        <p>Timestamp: ${point.timestamp.toLocaleString()}</p>
        <p>Latitude: ${point.latitude}</p>
        <p>Longitude: ${point.longitude}</p>
        <p>Sensors:</p>
        <ul>
          ${Object.entries(point.sensors)
            .map(
              ([sensorId, sensorData]) =>
                `<li>${sensorData.type} (${sensorId}): ${sensorData.value}</li>`
            )
            .join("")}
        </ul>
      `;

      const marker = new mapboxgl.Marker()
        .setLngLat([point.longitude, point.latitude])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(popupContent)
        )
        .addTo(map.current);

      markersRef.current.push(marker);
    });
  }, [gpsDataPoints]);

  // Handle user authentication
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
    <div style={{ width: "100vw", height: "100vh" }}>
      <header className="header" style={{ zIndex: 10, position: "absolute", width: "100%" }}>
        <Navbar />
      </header>

      <div style={{ display: "flex", flexDirection: "column", height: "100%", marginTop: "60px" }}>
        <div style={{ marginBottom: "20px", padding: "10px" }}>
          <label htmlFor="vehicleDropdown" style={{ marginRight: "10px" }}>
            Choose a vehicle:
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
            Choose an EMS:
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
