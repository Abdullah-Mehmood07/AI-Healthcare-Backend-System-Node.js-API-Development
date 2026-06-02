import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../utils/auth';

const LabLogin = () => {
    const [mode, setMode] = useState('login');
    const [email, setEmail] = useState('lab@caresync.ai');
    const [password, setPassword] = useState('123456');
    const [name, setName] = useState('');
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();
        loginUser('lab', email);
        navigate('/lab-dashboard');
    };

    const handleRegister = (e) => {
        e.preventDefault();
        alert('Request sent to Administrator. Please wait for approval.');
        setMode('login');
    };

    return (
        <div className="auth-container glass-card" style={{ maxWidth: '450px', margin: '4rem auto', textAlign: 'center' }}>
            <h2 id="form-title">{mode === 'login' ? 'Lab Operator Portal' : 'Request Lab Access'}</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                Manage test requests and upload reports.
            </p>

            {mode === 'login' ? (
                <form onSubmit={handleLogin}>
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <input type="email" placeholder="Email Address" required value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div className="form-group" style={{ marginBottom: '2rem' }}>
                        <input type="password" placeholder="Password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Secure Login</button>
                    <p style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
                        Need an account? <span role="button" tabIndex={0} onClick={() => setMode('register')} style={{ color: 'var(--primary-teal)', fontWeight: 600, cursor: 'pointer' }}>Request Access</span>
                    </p>
                </form>
            ) : (
                <form onSubmit={handleRegister}>
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <input type="text" placeholder="Lab Name / Full Name" required value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <input type="email" placeholder="Email Address" required value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div className="form-group" style={{ marginBottom: '2rem' }}>
                        <input type="password" placeholder="Create Password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Request Account</button>
                    <p style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
                        Already have an account? <span role="button" tabIndex={0} onClick={() => setMode('login')} style={{ color: 'var(--primary-teal)', fontWeight: 600, cursor: 'pointer' }}>Login Here</span>
                    </p>
                </form>
            )}
        </div>
    );
};

export default LabLogin;
