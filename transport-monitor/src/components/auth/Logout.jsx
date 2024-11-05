import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';  // Firebase-konfigurasjonen

const Logout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        console.log('User logged out');
        navigate('/');  // Naviger tilbake til logg inn-siden etter utlogging
      })
      .catch((error) => {
        console.error('Error logging out:', error);
      });
  };

  return (
    <button className="logout-button" onClick={handleLogout}>
      Log Out
    </button>
  );
};

export default Logout;
