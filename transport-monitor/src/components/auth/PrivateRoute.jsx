// src/components/auth/PrivateRoute.jsx

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../firebase'; // Importer autentisering fra Firebase

const PrivateRoute = ({ children }) => {
  const [user, loading] = useAuthState(auth);

  if (loading) {
    return <div>Loading...</div>; // Viser en lasteskjerm mens vi sjekker autentisering
  }

  // Hvis brukeren er autentisert, returnerer vi komponenten som barnet (f.eks. Home, ProfileDetails)
  return user ? children : <Navigate to="/" />; // Omdirigerer til loginsiden ("/") hvis brukeren ikke er autentisert
};

export default PrivateRoute;
