import React, { useEffect, useState } from 'react';
import { auth, db } from '../../firebase'; // Import your Firebase config
import { doc, getDoc } from 'firebase/firestore'; // Import Firestore functions
import "../css/profile.css";
import Navbar from '../Common/Navbar';

const ProfileDetails = () => {
  const [userData, setUserData] = useState(null);  // To store user data
  const [loading, setLoading] = useState(true);    // For loading state

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser; // Get the currently authenticated user
      if (user) {
        const uid = user.uid; // Get user's UID

        try {
          const docRef = doc(db, "users", uid); // Reference to the user's document
          const docSnap = await getDoc(docRef); // Fetch the document

          if (docSnap.exists()) {
            setUserData(docSnap.data()); // Set the fetched user data to state
          } else {
            console.log("No such document!");
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        } finally {
          setLoading(false); // Stop loading when data is fetched
        }
      }
    };

    fetchUserData();
  }, []);

 /*if (loading) {
    //return <div>Loading...</div>;  // Loading state
  }*/

  if (!userData) {
    return <div>No user data available</div>; // If no user data is found
  }

  return (

    <div className='profile-detail-container'>

    <header className='header'>
      <Navbar />
    </header>

    <h1>Profile</h1>

      <div className="profile-container">
      {/* Legg til logoen Ã¸verst */}
      <img src="https://www.freeiconspng.com/thumbs/profile-icon-png/user-icon-png-person-user-profile-icon-20.png" alt="Logo" className="profile-logo" />
      <p><strong>Role:</strong> {userData.role}</p> {/* If you store the role */}
      <p><strong>Name:</strong> {userData.name}</p>
      <p><strong>Email:</strong> {userData.email}</p>
      <p><strong>Company:</strong> {userData.company}</p>
    </div>
    </div>

    
    
  );
};

export default ProfileDetails