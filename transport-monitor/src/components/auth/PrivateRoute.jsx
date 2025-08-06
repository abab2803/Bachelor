import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../firebase';

const PrivateRoute = ({ children }) => {
  const [user, loading] = useAuthState(auth);

  if (loading) {
    return <div>Loading...</div>; // Viser en loading-skjerm mens vi sjekker autentisering
  }

  return user ? children : <Navigate to="/" />; // Omdirigerer til loginsiden ("/") hvis brukeren ikke er autentisert.
};

export default PrivateRoute;
