import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserInfo, logoutUser } from '../utils/auth';

const API_URL = 'http://localhost:5000/api';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('cities');
    const navigate = useNavigate();
    const userInfo = getUserInfo();

    // Data States
    const [cities, setCities] = useState([]);
    const [hospitals, setHospitals] = useState([]);
    const [users, setUsers] = useState([]);

    // Form States
    const [newCityName, setNewCityName] = useState('');
    const [newHospitalData, setNewHospitalData] = useState({ name: '', city: '', address: '', phone: '', email: '', type: 'General', status: 'Active' });
    const [newUserData, setNewUserData] = useState({ name: '', email: '', password: '', role: 'Hospital Admin', hospitalId: '' });

    useEffect(() => {
        // Enforce basic admin auth before rendering real data using the real token
        if (!userInfo.token || userInfo.role !== 'Web Admin') {
            navigate('/login');
        } else {
            fetchCities();
            fetchHospitals();
            fetchUsers();
        }
    }, [navigate, userInfo.token, userInfo.role]);

    const handleLogout = () => {
        logoutUser();
        navigate('/');
    };

    // --- API CALLS ---
    const fetchCities = async () => {
        try {
            const res = await fetch(`${API_URL}/cities`, {
                headers: { 'Authorization': `Bearer ${userInfo.token}` }
            });
            const data = await res.json();
            setCities(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch cities', error);
        }
    };

    const fetchHospitals = async () => {
        try {
            const res = await fetch(`${API_URL}/hospitals`, {
                headers: { 'Authorization': `Bearer ${userInfo.token}` }
            });
            const data = await res.json();
            setHospitals(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch hospitals', error);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await fetch(`${API_URL}/users`, {
                headers: { 'Authorization': `Bearer ${userInfo.token}` }
            });
            const data = await res.json();
            setUsers(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch users', error);
        }
    };

    // --- ADD HANDLERS ---
    const handleAddCity = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/cities`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userInfo.token}`
                },
                body: JSON.stringify({ name: newCityName })
            });

            if (res.ok) {
                setNewCityName('');
                fetchCities();
                alert('City added successfully!');
            } else {
                const err = await res.json();
                alert(`Error: ${err.message}`);
            }
        } catch (error) {
            alert('Failed to connect to the backend server.');
        }
    };

    const handleAddHospital = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/hospitals`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userInfo.token}`
                },
                body: JSON.stringify(newHospitalData)
            });

            if (res.ok) {
                setNewHospitalData({ name: '', city: '', address: '', phone: '', email: '', type: 'General', status: 'Active' });
                fetchHospitals();
                alert('Hospital added successfully!');
            } else {
                const err = await res.json();
                alert(`Error: ${err.message}`);
            }
        } catch (error) {
            alert('Failed to connect to the backend server.');
        }
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/users`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userInfo.token}`
                },
                body: JSON.stringify(newUserData)
            });

            const data = await res.json();
            
            if (res.ok) {
                setNewUserData({ name: '', email: '', password: '', role: 'Hospital Admin', hospitalId: '' });
                fetchUsers();
                alert(`User ${data.email} created successfully as a ${data.role}!`);
            } else {
                alert(`Error: ${data.message}`);
            }
        } catch (error) {
            alert('Failed to connect to the backend server.');
        }
    };

    const handleImageUpload = async (e, hospitalId) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);

        try {
            const res = await fetch(`${API_URL}/upload/hospital-image/${hospitalId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${userInfo.token}` },
                body: formData
            });

            if (res.ok) {
                alert('Image uploaded successfully!');
                fetchHospitals(); // Refresh to show any possible updates
            } else {
                const data = await res.json();
                alert(`Error: ${data.message}`);
            }
        } catch (error) {
            alert('Failed to connect to the backend server.');
        }
    };

    // --- DELETE HANDLERS ---
    const handleDeleteCity = async (id) => {
        if (!window.confirm("Are you sure you want to delete this city?")) return;
        try {
            await fetch(`${API_URL}/cities/${id}`, { 
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${userInfo.token}` }
            });
            fetchCities();
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteHospital = async (id) => {
        if (!window.confirm("Are you sure you want to delete this hospital?")) return;
        try {
            await fetch(`${API_URL}/hospitals/${id}`, { 
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${userInfo.token}` }
            });
            fetchHospitals();
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm("Are you sure you want to delete this user?")) return;
        try {
            const res = await fetch(`${API_URL}/users/${id}`, { 
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${userInfo.token}` }
            });
            if (res.ok) {
                fetchUsers();
            } else {
                const data = await res.json();
                alert(`Error: ${data.message}`);
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div style={{ paddingBottom: '4rem' }}>
            <div style={{ background: 'var(--white)', padding: '1rem', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="hospital-name-display" style={{ fontWeight: 600, color: 'var(--primary-teal)' }}>System Administration</span>
                <div style={{ fontSize: '0.9rem' }}>
                    <i className="fas fa-user-shield"></i> Admin
                    <button onClick={handleLogout} className="btn btn-outline" style={{ marginLeft: '1rem', padding: '0.3rem 0.8rem' }}>Logout</button>
                </div>
            </div>

            <div className="dashboard-container" style={{ display: 'flex', minHeight: 'calc(100vh - 140px)' }}>
                {/* Sidebar */}
                <aside className="sidebar" style={{ width: '250px', background: 'var(--white)', borderRight: '1px solid #CCFBF1', padding: '2rem 0', display: 'flex', flexDirection: 'column' }}>
                    <div className={`sidebar-item ${activeTab === 'cities' ? 'active' : ''}`} onClick={() => setActiveTab('cities')} style={{ padding: '1rem 2rem', cursor: 'pointer', transition: 'all 0.3s', fontWeight: 500 }}>
                        <i className="fas fa-city" style={{ marginRight: '10px' }}></i> Manage Cities
                    </div>
                    <div className={`sidebar-item ${activeTab === 'hospitals' ? 'active' : ''}`} onClick={() => setActiveTab('hospitals')} style={{ padding: '1rem 2rem', cursor: 'pointer', transition: 'all 0.3s', fontWeight: 500 }}>
                        <i className="fas fa-hospital-symbol" style={{ marginRight: '10px' }}></i> Manage Hospitals
                    </div>
                    <div className={`sidebar-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')} style={{ padding: '1rem 2rem', cursor: 'pointer', transition: 'all 0.3s', fontWeight: 500 }}>
                        <i className="fas fa-users-cog" style={{ marginRight: '10px' }}></i> System Users
                    </div>
                </aside>

                {/* Main Content */}
                <main className="main-panel" style={{ flex: 1, padding: '2rem' }}>
                    
                    {/* --- CITIES TAB --- */}
                    {activeTab === 'cities' && (
                        <section className="panel-section active">
                            <h2>Manage Cities</h2>
                            
                            <form onSubmit={handleAddCity} className="glass-card" style={{ marginBottom: '2rem', display: 'flex', gap: '10px', alignItems: 'center', padding: '1rem' }}>
                                <input 
                                    type="text" 
                                    placeholder="Enter new city name" 
                                    value={newCityName} 
                                    onChange={(e) => setNewCityName(e.target.value)} 
                                    required 
                                    style={{ flex: 1 }}
                                />
                                <button type="submit" className="btn btn-primary">Add New City</button>
                            </form>

                            <div className="glass-card">
                                {cities.length === 0 ? <p>No cities found. Add one above!</p> : (
                                    <ul style={{ listStyle: 'none', padding: 0 }}>
                                        {cities.map((city) => (
                                            <li key={city._id} style={{ padding: '10px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                {city.name} 
                                                <button onClick={() => handleDeleteCity(city._id)} className="btn btn-outline" style={{ fontSize: '0.7rem', padding: '2px 8px', color: 'red', borderColor: 'red' }}>Delete</button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </section>
                    )}

                    {/* --- HOSPITALS TAB --- */}
                    {activeTab === 'hospitals' && (
                        <section className="panel-section active">
                            <h2>Manage Hospitals</h2>

                            <form onSubmit={handleAddHospital} className="glass-card" style={{ marginBottom: '2rem', display: 'flex', gap: '10px', flexDirection: 'column', padding: '1.5rem' }}>
                                <h4>Add New Hospital</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <input type="text" placeholder="Hospital Name" value={newHospitalData.name} onChange={(e) => setNewHospitalData({...newHospitalData, name: e.target.value})} required />
                                    <select value={newHospitalData.city} onChange={(e) => setNewHospitalData({...newHospitalData, city: e.target.value})} required>
                                        <option value="">-- Choose City --</option>
                                        {cities.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                    </select>
                                    <input type="text" placeholder="Address" value={newHospitalData.address} onChange={(e) => setNewHospitalData({...newHospitalData, address: e.target.value})} required />
                                    <input type="text" placeholder="Phone Number" value={newHospitalData.phone} onChange={(e) => setNewHospitalData({...newHospitalData, phone: e.target.value})} />
                                    <input type="email" placeholder="Email (Optional)" value={newHospitalData.email} onChange={(e) => setNewHospitalData({...newHospitalData, email: e.target.value})} />
                                    <select value={newHospitalData.type} onChange={(e) => setNewHospitalData({...newHospitalData, type: e.target.value})}>
                                        <option value="General">General</option>
                                        <option value="Specialized">Specialized</option>
                                        <option value="Clinic">Clinic</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <select value={newHospitalData.status} onChange={(e) => setNewHospitalData({...newHospitalData, status: e.target.value})} style={{ width: '50%' }}>
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                                <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>Save Hospital</button>
                            </form>

                            <div className="glass-card" style={{ overflowX: 'auto' }}>
                                {hospitals.length === 0 ? <p>No hospitals found.</p> : (
                                    <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid #eee' }}>
                                                <th style={{ padding: '10px' }}>Hospital Details</th>
                                                <th>City</th>
                                                <th>Type</th>
                                                <th>Contact</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {hospitals.map(h => (
                                                <tr key={h._id}>
                                                    <td style={{ padding: '10px' }}>
                                                        <strong>{h.name}</strong><br/>
                                                        <small style={{color:'var(--text-muted)'}}>{h.address}</small>
                                                    </td>
                                                    <td>{h.city?.name || 'Unknown'}</td>
                                                    <td>{h.type || 'General'}</td>
                                                    <td>{h.phone || 'N/A'}<br/><small>{h.email || ''}</small></td>
                                                    <td style={{ color: h.status === 'Active' ? 'green' : 'red' }}>{h.status}</td>
                                                    <td>
                                                        <label className="btn btn-outline" style={{ fontSize: '0.7rem', color: 'var(--primary-teal)', borderColor: 'var(--primary-teal)', cursor: 'pointer', marginRight: '5px', display: 'inline-block' }}>
                                                            Upload Image
                                                            <input type="file" style={{ display: 'none' }} accept="image/*" onChange={(e) => handleImageUpload(e, h._id)} />
                                                        </label>
                                                        <button onClick={() => handleDeleteHospital(h._id)} className="btn btn-outline" style={{ fontSize: '0.7rem', color: 'red', borderColor: 'red' }}>Delete</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </section>
                    )}

                    {/* --- USERS TAB --- */}
                    {activeTab === 'users' && (
                        <section className="panel-section active">
                            <h2>Manage System Users</h2>
                            <div className="glass-card">
                                <p>Create Admin accounts for hospital managers.</p>
                                <form style={{ marginTop: '1rem' }} onSubmit={handleAddUser}>
                                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                                        <input 
                                            type="text" 
                                            placeholder="User Full Name" 
                                            required 
                                            value={newUserData.name}
                                            onChange={(e) => setNewUserData({...newUserData, name: e.target.value})}
                                        />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                                        <input 
                                            type="email" 
                                            placeholder="User Email" 
                                            required 
                                            value={newUserData.email}
                                            onChange={(e) => setNewUserData({...newUserData, email: e.target.value})}
                                        />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                                        <input 
                                            type="password" 
                                            placeholder="Temporary Password" 
                                            required 
                                            value={newUserData.password}
                                            onChange={(e) => setNewUserData({...newUserData, password: e.target.value})}
                                        />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                                        <select 
                                            value={newUserData.role}
                                            onChange={(e) => setNewUserData({...newUserData, role: e.target.value})}
                                        >
                                            <option value="Hospital Admin">Hospital Admin</option>
                                            <option value="Web Admin">Web Admin Master</option>
                                        </select>
                                    </div>
                                    
                                    {/* Only show hospital select if they are creating a Hospital Admin */}
                                    {newUserData.role === 'Hospital Admin' && (
                                        <div className="form-group" style={{ marginBottom: '1rem', background: '#f0fdf4', padding: '1rem', border: '1px solid #bbf7d0', borderRadius: '5px' }}>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#166534' }}>
                                                <i className="fas fa-hospital"></i> Required: Assign to a specific Hospital
                                            </label>
                                            <select 
                                                required
                                                value={newUserData.hospitalId}
                                                onChange={(e) => setNewUserData({...newUserData, hospitalId: e.target.value})}
                                            >
                                                <option value="">-- Choose Hospital --</option>
                                                {hospitals.map(h => <option key={h._id} value={h._id}>{h.name}</option>)}
                                            </select>
                                        </div>
                                    )}

                                    <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>Create User</button>
                                </form>
                            </div>

                            <div className="glass-card" style={{ overflowX: 'auto', marginTop: '2rem' }}>
                                <h4>Existing System Users</h4>
                                {users.length === 0 ? <p>No users found in database.</p> : (
                                    <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginTop: '1rem' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid #eee' }}>
                                                <th style={{ padding: '10px' }}>Name & Email</th>
                                                <th>Role</th>
                                                <th>Associated Hospital</th>
                                                <th>Global ID</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {users.map(u => (
                                                <tr key={u._id}>
                                                    <td style={{ padding: '10px' }}>
                                                        <strong>{u.name}</strong><br/>
                                                        <small>{u.email}</small>
                                                    </td>
                                                    <td><span style={{ padding: '3px 8px', background: '#e0f2fe', color: '#0369a1', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>{u.role}</span></td>
                                                    <td>{u.hospitalId?.name || '---'}</td>
                                                    <td><small>{u.ghid || 'N/A'}</small></td>
                                                    <td>
                                                        <button 
                                                            onClick={() => handleDeleteUser(u._id)} 
                                                            className="btn btn-outline" 
                                                            style={{ fontSize: '0.7rem', color: u.email === 'superadmin@caresync.com' ? 'gray' : 'red', borderColor: u.email === 'superadmin@caresync.com' ? 'gray' : 'red' }}
                                                            disabled={u.email === 'superadmin@caresync.com'}
                                                        >
                                                            {u.email === 'superadmin@caresync.com' ? 'Protected' : 'Delete'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </section>
                    )}
                </main>
            </div>
        </div>
    );
};

export default AdminDashboard;
