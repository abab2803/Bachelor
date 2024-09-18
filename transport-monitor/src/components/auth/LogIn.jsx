import React, {useState} from 'react'
import "../css/auth.css"  // Importer CSS-filen her
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from "../../firebase"
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

const LogIn = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();  // Hent useNavigate-hooken

    // create a function that is gonna handle all the logic after the form is submitted
    const logIn = (e) => {
        e.preventDefault(); // when form is submitted our page dont reload, and we dont loose the state of email and password.

        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                console.log(userCredential); 
                // Naviger til dashboard (home) etter vellykket innlogging
                navigate('/home'); 
            })
            .catch((error) => {
                console.error('Error signing in:', error.message);
                alert('Login failed(try again): ' + error.message);  // Viser en feilmelding til brukeren
            })
    };


  return (
    <div>

<img src="https://png.pngtree.com/png-vector/20191129/ourmid/pngtree-fast-delivery-icon-delivery-icon-png-image_2047531.jpg" alt="Logo" className="profile-logo" />

        <div className='sign-in-container'>
        <form onSubmit={logIn}>
    
            <h1>Log in</h1>
            <input
                type='email'
                id='email'
                name='email'
                placeholder='Enter your email..'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                autoComplete="email"  // Stor C for 'autoComplete'
            />
            <input 
                type='password' 
                id='password'           
                name='password'
                placeholder='Enter your password..' 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field" 
                autoComplete="current-password" > 
            </input>
            <button type='submit'>Submit</button>
            <p>Don't have an account? <Link to="/register">Register here</Link></p>
        </form>
    </div>

    </div>
    
  )
}

export default LogIn