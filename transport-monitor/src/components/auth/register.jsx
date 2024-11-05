import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from "../../firebase";
import { Link } from 'react-router-dom';
import { setDoc, doc, where, getDocs, collection, query } from 'firebase/firestore';  
import "../css/auth.css";  

const Modal = ({ message, onClose, isSuccess }) => {
  return (
    <div className="modal">
      <div className="modal-content">
        <span className="close" onClick={onClose}>&times;</span>
        <p style={{ color: isSuccess ? 'green' : 'red' }}>{message}</p>
      </div>
    </div>
  );
};

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');  
  const [isLoading, setIsLoading] = useState(false);  
  const [showModal, setShowModal] = useState(false);  // State for modal
  const [isSuccess, setIsSuccess] = useState(false);  // State for success message

  const register = async (e) => {
    e.preventDefault();  
    setError('');
    setSuccess('');
  
    if (!email || !password) {
      setError("Email and password are required.");
      setIsSuccess(false);
      setShowModal(true);
      return;
    }
  
    setIsLoading(true);
    console.log("Attempting to register user with email:", email);
  
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
  
      await setDoc(doc(db, "users", user.uid), {
        name: name,
        company: company,
        email: email,
        role: "customer", 
        uid: user.uid,
      });
  
      setSuccess("User added successfully!");
      setIsSuccess(true);
      setEmail('');
      setPassword('');
      setName('');
      setCompany('');
      setShowModal(true);
    } catch (error) {
      console.error("Error registering user", error);
      setError(error.message); // Vise spesifikk feilmelding
      setIsSuccess(false);
      setShowModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='sign-in-container'>
      <form onSubmit={register}>
        <h1>Register an account</h1>
        <input
          type='text'
          id='name'
          name='name'
          placeholder='Enter your name..'
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input-field"
        />
        <input
          type='text'
          id='company'
          name='company'
          placeholder='Enter your company..'
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          className="input-field"
        />
        <input
          type='email'
          id='email'
          name='email'
          placeholder='Enter your email..'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-field"
          autoComplete="email"
        />
        <input
          type='password'
          id='password'
          name='password'
          placeholder='Enter your password..'
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input-field"
          autoComplete="current-password"
        />

        {isLoading ? <p>Creating account...</p> : <button type='submit'>Create</button>}
        <p>Already have an account? <Link to="/">Log in here</Link></p>
      </form>

      {/* Vis modal hvis det er en feil eller suksess */}
      {showModal && (
        <Modal 
          message={error || success} 
          onClose={() => setShowModal(false)} 
          isSuccess={isSuccess} // send isSucces prop
        />
      )}
    </div>
  );
};

export default Register;
