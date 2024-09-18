import React, { useState } from 'react';
import "../css/auth.css";  // Importer CSS-filen her
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from "../../firebase";
import { Link } from 'react-router-dom';
import { setDoc, doc } from 'firebase/firestore';  // Importer Firestore funksjoner

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('customer');  // Standardrolle er 'customer'

  // Funksjon som håndterer logikken etter at skjemaet er sendt inn
  const register = (e) => {
    e.preventDefault();  // Forhindre at siden reloades ved innsending

    // Registrer bruker med e-post og passord
    createUserWithEmailAndPassword(auth, email, password)
      .then(async (userCredential) => {
        const user = userCredential.user;
        console.log(userCredential);

        try {
          // Lagre tilleggsinformasjon i Firestore, inkludert brukertype (role)
          await setDoc(doc(db, "users", user.uid), {
            name: name,
            company: company,
            email: email,
            role: role,  // Legger til brukertype (admin eller customer)
            uid: user.uid,
          });
          console.log("User registered and info saved to Firestore.");
        } catch (error) {
          console.error("Error saving user info to Firestore:", error);
        }
      })
      .catch((error) => {
        console.error("Error registering user:", error);
      });
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
        {/* Velg brukertype (admin eller customer) */}
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="input-field"
        >
          <option value="customer">Customer</option>
          <option value="admin">Admin</option>
        </select>
        <button type='submit'>Create</button>
        <p>Already have an account? <Link to="/">Log in here</Link></p>
      </form>
    </div>
  );
};

export default Register;
