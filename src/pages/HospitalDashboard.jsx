import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserInfo, logoutUser } from '../utils/auth';

const HospitalDashboard = () => {
    const [activeTab, setActiveTab] = useState('doctors');
    const navigate = useNavigate();
    const userInfo = getUserInfo();
    const [hospitalName, setHospitalName] = useState({ name: 'Loading...', city: '' });

    // Data States
    const [doctors, setDoctors] = useState([]);
    const [services, setServices] = useState([]);
    const [newDoctorData, setNewDoctorData] = useState({ name: '', specialty: '', status: 'Active', emergencyExtension: '' });
    const [newServiceData, setNewServiceData] = useState({ name: '', description: '', price: 0 });
    const [newLabData, setNewLabData] = useState({ name: '', email: '', password: '' });
    const [newPaData, setNewPaData] = useState({ name: '', email: '', password: '', doctorId: '' });
    const [newPatientData, setNewPatientData] = useState({ name: '', national_id: '', email: '', password: '', mrNumber: '' });
    const [passwordData, setPasswordData] = useState({ oldPassword: '', newPassword: '' });
    const [departments, setDepartments] = useState([]);
    const [newDepartment, setNewDepartment] = useState('');
    const [doctorFilter, setDoctorFilter] = useState('');

    useEffect(() => {
        if (!userInfo.token || userInfo.role !== 'Hospital Admin') {
            navigate('/login');
            return;
        }

        const fetchHospitalDetails = async () => {
            try {
                const res = await fetch(`http://localhost:5000/api/hospitals`, {
                    headers: { 'Authorization': `Bearer ${userInfo.token}` }
                });
                const data = await res.json();
                
                const myHospital = Array.isArray(data) ? data.find(h => h._id === userInfo.hospitalId) : null;
                
                if (myHospital) {
                    setHospitalName({ name: myHospital.name, city: myHospital.city?.name || '' });
                    setDepartments(myHospital.departments || []);
                    fetchDoctors(userInfo.hospitalId);
                    fetchServices(userInfo.hospitalId);
                } else {
                    setHospitalName({ name: 'Unassigned Hospital Sector', city: '' });
                }
            } catch (error) {
                setHospitalName({ name: 'Error Loading Hospital', city: '' });
            }
        };

        const fetchDoctors = async (hospitalId) => {
            try {
                const res = await fetch(`http://localhost:5000/api/doctors/hospital/${hospitalId}`, {
                    headers: { 'Authorization': `Bearer ${userInfo.token}` }
                });
                const data = await res.json();
                setDoctors(Array.isArray(data) ? data : []);
            } catch (error) {}
        };

        const fetchServices = async (hospitalId) => {
            try {
                const res = await fetch(`http://localhost:5000/api/services/hospital/${hospitalId}`, {
                    headers: { 'Authorization': `Bearer ${userInfo.token}` }
                });
                const data = await res.json();
                setServices(Array.isArray(data) ? data : []);
            } catch (error) {}
        };

        fetchHospitalDetails();
        
    }, [navigate, userInfo]);

    const handleLogout = () => {
        logoutUser();
        navigate('/');
    };

    const handleAddDoctor = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`http://localhost:5000/api/doctors`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userInfo.token}`
                },
                body: JSON.stringify(newDoctorData)
            });

            if (res.ok) {
                setNewDoctorData({ name: '', specialty: '', status: 'Active', emergencyExtension: '' });
                
                const refreshedRes = await fetch(`http://localhost:5000/api/doctors/hospital/${userInfo.hospitalId}`, {
                    headers: { 'Authorization': `Bearer ${userInfo.token}` }
                });
                const data = await refreshedRes.json();
                setDoctors(Array.isArray(data) ? data : []);
                
                alert('Doctor added successfully!');
            } else {
                const err = await res.json();
                alert(`Error: ${err.message}`);
            }
        } catch (error) {
            alert('Failed to connect to the backend server.');
        }
    };

    const handleDeleteDoctor = async (id) => {
        if (!window.confirm('Are you sure you want to remove this doctor?')) return;
        try {
            const res = await fetch(`http://localhost:5000/api/doctors/${id}`, {
                method: 'DELETE',
                headers: { 
                    'Authorization': `Bearer ${userInfo.token}`
                }
            });
            if (res.ok) {
                setDoctors(doctors.filter(d => d._id !== id));
                alert('Doctor removed successfully.');
            } else {
                const err = await res.json();
                alert(`Error: ${err.message}`);
            }
        } catch (error) {
            alert('Failed to connect to the backend server.');
        }
    };

    const handleAddService = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`http://localhost:5000/api/services`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userInfo.token}`
                },
                body: JSON.stringify(newServiceData)
            });

            if (res.ok) {
                setNewServiceData({ name: '', description: '', price: 0 });
                const refreshedRes = await fetch(`http://localhost:5000/api/services/hospital/${userInfo.hospitalId}`, {
                    headers: { 'Authorization': `Bearer ${userInfo.token}` }
                });
                const data = await refreshedRes.json();
                setServices(Array.isArray(data) ? data : []);
                alert('Service added successfully!');
            } else {
                const err = await res.json();
                alert(`Error: ${err.message}`);
            }
        } catch (error) {
            alert('Failed to connect to the backend server.');
        }
    };

    const handleAddLabAdmin = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`http://localhost:5000/api/users`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userInfo.token}`
                },
                body: JSON.stringify({
                    name: newLabData.name,
                    email: newLabData.email,
                    password: newLabData.password,
                    role: 'Lab Admin'
                })
            });

            if (res.ok) {
                setNewLabData({ name: '', email: '', password: '' });
                alert('Lab Administrator account created successfully!');
            } else {
                const err = await res.json();
                alert(`Error: ${err.message}`);
            }
        } catch (error) {
            alert('Failed to connect to the backend server.');
        }
    };

    const handleAddPaAdmin = async (e) => {
        e.preventDefault();
        if (!newPaData.doctorId) return alert("Please select a Doctor for this PA.");
        try {
            const res = await fetch(`http://localhost:5000/api/users`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userInfo.token}`
                },
                body: JSON.stringify({
                    name: newPaData.name,
                    email: newPaData.email,
                    password: newPaData.password,
                    role: 'PA Admin',
                    doctorId: newPaData.doctorId
                })
            });

            if (res.ok) {
                setNewPaData({ name: '', email: '', password: '', doctorId: '' });
                alert('PA Administrator account created successfully!');
            } else {
                const err = await res.json();
                alert(`Error: ${err.message}`);
            }
        } catch (error) {
            alert('Failed to connect to the backend server.');
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`http://localhost:5000/api/users/profile/password`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userInfo.token}`
                },
                body: JSON.stringify(passwordData)
            });

            if (res.ok) {
                setPasswordData({ oldPassword: '', newPassword: '' });
                alert('Password changed successfully!');
            } else {
                const err = await res.json();
                alert(`Error: ${err.message}`);
            }
        } catch (error) {
            alert('Failed to connect to the backend server.');
        }
    };

    const handleRegisterPatient = async (e) => {
        e.preventDefault();

        if (!newPatientData.national_id || !newPatientData.name || !newPatientData.email || !newPatientData.password) {
            return alert('Name, National ID, Email and Password are required.');
        }

        try {
            const res = await fetch('http://localhost:5000/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userInfo.token}`
                },
                body: JSON.stringify({
                    name: newPatientData.name,
                    email: newPatientData.email,
                    password: newPatientData.password,
                    role: 'Patient',
                    national_id: newPatientData.national_id,
                    hospitalId: userInfo.hospitalId,
                    mrNumber: newPatientData.mrNumber || undefined
                })
            });

            const data = await res.json();
            if (res.ok) {
                alert(`Patient profile registered. GHID: ${data.ghid || 'Generated'}`);
                setNewPatientData({ name: '', national_id: '', email: '', password: '', mrNumber: '' });
            } else {
                alert(`Error: ${data.message || 'Failed to register patient'}`);
            }
        } catch (error) {
            alert('Failed to connect to the backend server.');
        }
    };

    const handleAddDepartment = async (e) => {
        e.preventDefault();
        if (!newDepartment.trim()) return;
        const updatedDeps = [...departments, newDepartment.trim()];
        try {
            const res = await fetch(`http://localhost:5000/api/hospitals/${userInfo.hospitalId}/departments`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userInfo.token}`
                },
                body: JSON.stringify({ departments: updatedDeps })
            });
            if (res.ok) {
                setDepartments(updatedDeps);
                setNewDepartment('');
                alert('Department added successfully!');
            } else {
                const err = await res.json();
                alert(`Error: ${err.message}`);
            }
        } catch (error) {
            alert('Failed to update departments.');
        }
    };

    const handleDeleteDepartment = async (dep) => {
        if (!window.confirm(`Remove the ${dep} department?`)) return;
        const updatedDeps = departments.filter(d => d !== dep);
        try {
            const res = await fetch(`http://localhost:5000/api/hospitals/${userInfo.hospitalId}/departments`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userInfo.token}`
                },
                body: JSON.stringify({ departments: updatedDeps })
            });
            if (res.ok) {
                setDepartments(updatedDeps);
                alert('Department removed.');
            } else {
                const err = await res.json();
                alert(`Error: ${err.message}`);
            }
        } catch (error) {
            alert('Failed to update departments.');
        }
    };

    const filteredDoctors = doctorFilter ? doctors.filter(d => d.specialty === doctorFilter) : doctors;

    return (
        <div style={{ paddingBottom: '4rem' }}>
            <div style={{ background: 'var(--white)', padding: '1rem', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="hospital-name-display" style={{ fontWeight: 600, color: 'var(--primary-teal)' }}>
                    {hospitalName.name} <span style={{fontSize: '0.8rem', color: '#666', fontWeight: 'normal'}}>{hospitalName.city ? `(${hospitalName.city})` : ''}</span>
                </span>
                <div style={{ fontSize: '0.9rem' }}>
                    <i className="fas fa-user-shield"></i> {userInfo.email?.split('@')[0]}
                    <button onClick={handleLogout} className="btn btn-outline" style={{ marginLeft: '1rem', padding: '0.3rem 0.8rem' }}>Logout</button>
                </div>
            </div>

            <div className="dashboard-container" style={{ display: 'flex', minHeight: 'calc(100vh - 140px)' }}>
                {/* Sidebar */}
                <aside className="sidebar" style={{ width: '250px', background: 'var(--white)', borderRight: '1px solid #CCFBF1', padding: '2rem 0', display: 'flex', flexDirection: 'column' }}>
                    <div className={`sidebar-item ${activeTab === 'doctors' ? 'active' : ''}`} onClick={() => setActiveTab('doctors')} style={{ padding: '1rem 2rem', cursor: 'pointer', transition: 'all 0.3s', fontWeight: 500 }}>
                        <i className="fas fa-user-md" style={{ marginRight: '10px' }}></i> Manage Doctors
                    </div>
                    <div className={`sidebar-item ${activeTab === 'departments' ? 'active' : ''}`} onClick={() => setActiveTab('departments')} style={{ padding: '1rem 2rem', cursor: 'pointer', transition: 'all 0.3s', fontWeight: 500 }}>
                        <i className="fas fa-sitemap" style={{ marginRight: '10px' }}></i> Departments
                    </div>
                    <div className={`sidebar-item ${activeTab === 'patients' ? 'active' : ''}`} onClick={() => setActiveTab('patients')} style={{ padding: '1rem 2rem', cursor: 'pointer', transition: 'all 0.3s', fontWeight: 500 }}>
                        <i className="fas fa-user-injured" style={{ marginRight: '10px' }}></i> Register Patient
                    </div>
                    <div className={`sidebar-item ${activeTab === 'services' ? 'active' : ''}`} onClick={() => setActiveTab('services')} style={{ padding: '1rem 2rem', cursor: 'pointer', transition: 'all 0.3s', fontWeight: 500 }}>
                        <i className="fas fa-concierge-bell" style={{ marginRight: '10px' }}></i> Hospital Services
                    </div>
                    <div className={`sidebar-item ${activeTab === 'lab-portal' ? 'active' : ''}`} onClick={() => setActiveTab('lab-portal')} style={{ padding: '1rem 2rem', cursor: 'pointer', transition: 'all 0.3s', fontWeight: 500 }}>
                        <i className="fas fa-microscope" style={{ marginRight: '10px' }}></i> Manage Lab Portal
                    </div>
                    <div className={`sidebar-item ${activeTab === 'pa-portal' ? 'active' : ''}`} onClick={() => setActiveTab('pa-portal')} style={{ padding: '1rem 2rem', cursor: 'pointer', transition: 'all 0.3s', fontWeight: 500 }}>
                        <i className="fas fa-user-nurse" style={{ marginRight: '10px' }}></i> Manage PA Portal
                    </div>
                    <div className={`sidebar-item ${activeTab === 'security' ? 'active' : ''}`} onClick={() => setActiveTab('security')} style={{ padding: '1rem 2rem', cursor: 'pointer', transition: 'all 0.3s', fontWeight: 500 }}>
                        <i className="fas fa-lock" style={{ marginRight: '10px' }}></i> Security Settings
                    </div>
                </aside>

                {/* Main Content */}
                <main className="main-panel" style={{ flex: 1, padding: '2rem' }}>
                    {activeTab === 'doctors' && (
                        <section className="panel-section active">
                            <h2>Manage Doctor Profiles</h2>
                            
                            <form onSubmit={handleAddDoctor} className="glass-card" style={{ marginBottom: '2rem', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', padding: '1rem' }}>
                                <input type="text" placeholder="Dr. Name" required value={newDoctorData.name} onChange={(e) => setNewDoctorData({...newDoctorData, name: e.target.value})} style={{ flex: 1, minWidth: '180px' }} />
                                <select required value={newDoctorData.specialty} onChange={(e) => setNewDoctorData({...newDoctorData, specialty: e.target.value})} style={{ flex: 1, minWidth: '180px' }}>
                                    <option value="">-- Select Department --</option>
                                    {departments.map((dep, idx) => (
                                        <option key={idx} value={dep}>{dep}</option>
                                    ))}
                                </select>
                                <input type="text" placeholder="Emergency Ext" value={newDoctorData.emergencyExtension} onChange={(e) => setNewDoctorData({...newDoctorData, emergencyExtension: e.target.value})} style={{ flex: 1, minWidth: '120px' }} />
                                <select value={newDoctorData.status} onChange={(e) => setNewDoctorData({...newDoctorData, status: e.target.value})}>
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                    <option value="On Leave">On Leave</option>
                                </select>
                                <button type="submit" className="btn btn-primary">Add Doctor</button>
                            </form>

                            <div className="glass-card">
                                <div style={{ marginBottom: '1rem', display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <strong>Filter:</strong>
                                    <select value={doctorFilter} onChange={(e) => setDoctorFilter(e.target.value)} style={{ padding: '5px' }}>
                                        <option value="">All Departments</option>
                                        {departments.map((dep, idx) => (
                                            <option key={idx} value={dep}>{dep}</option>
                                        ))}
                                    </select>
                                </div>
                                {filteredDoctors.length === 0 ? <p>No doctors found.</p> : (
                                    <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid #eee' }}>
                                                <th style={{ padding: '10px' }}>Name</th>
                                                <th>Specialty</th>
                                                <th>Emergency Ext</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredDoctors.map(doc => (
                                                <tr key={doc._id}>
                                                    <td style={{ padding: '10px' }}>{doc.name}</td>
                                                    <td>{doc.specialty}</td>
                                                    <td>{doc.emergencyExtension || 'None'}</td>
                                                    <td style={{ color: doc.status === 'Active' ? 'green' : 'gray' }}>{doc.status}</td>
                                                    <td>
                                                        <button onClick={() => handleDeleteDoctor(doc._id)} className="btn btn-outline" style={{ padding: '2px 8px', fontSize: '0.8rem', color: '#DC2626', borderColor: '#FCA5A5' }}>Delete</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </section>
                    )}

                    {activeTab === 'departments' && (
                        <section className="panel-section active">
                            <h2>Manage Hospital Departments</h2>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Add or remove departments for your hospital. Doctors must be assigned to an existing department.</p>

                            <div className="glass-card" style={{ maxWidth: '600px', marginBottom: '2rem' }}>
                                <h4>Add New Department</h4>
                                <form onSubmit={handleAddDepartment} style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
                                    <input type="text" placeholder="Department Name (e.g., Cardiology)" required value={newDepartment} onChange={(e) => setNewDepartment(e.target.value)} style={{ flex: 1 }} />
                                    <button type="submit" className="btn btn-primary">Add</button>
                                </form>
                            </div>

                            <div className="glass-card" style={{ maxWidth: '600px' }}>
                                <h4>Current Departments</h4>
                                {departments.length === 0 ? <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>No departments added yet.</p> : (
                                    <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem' }}>
                                        {departments.map((dep, idx) => (
                                            <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #eee' }}>
                                                <span>{dep}</span>
                                                <button onClick={() => handleDeleteDepartment(dep)} className="btn btn-outline" style={{ padding: '2px 8px', fontSize: '0.8rem', color: 'red', borderColor: 'red' }}>Remove</button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </section>
                    )}

                    {activeTab === 'patients' && (
                        <section className="panel-section active">
                            <h2>Register New Patient</h2>
                            <div className="glass-card" style={{ maxWidth: '600px' }}>
                                <form onSubmit={handleRegisterPatient}>
                                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                                        <input type="text" placeholder="Full Name" value={newPatientData.name} onChange={(e) => setNewPatientData({ ...newPatientData, name: e.target.value })} required />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                                        <input type="text" placeholder="National ID (13 digits)" value={newPatientData.national_id} onChange={(e) => setNewPatientData({ ...newPatientData, national_id: e.target.value })} required pattern="[0-9]{13}" />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                                        <input type="email" placeholder="Patient Email Address" value={newPatientData.email} onChange={(e) => setNewPatientData({ ...newPatientData, email: e.target.value })} required />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                                        <input type="password" placeholder="Temporary Password" value={newPatientData.password} onChange={(e) => setNewPatientData({ ...newPatientData, password: e.target.value })} required />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                                        <input type="text" placeholder="Hospital MR Number (Optional)" value={newPatientData.mrNumber} onChange={(e) => setNewPatientData({ ...newPatientData, mrNumber: e.target.value })} />
                                    </div>
                                    <button type="submit" className="btn btn-primary">Create Patient Record</button>
                                </form>
                            </div>
                        </section>
                    )}

                    {activeTab === 'services' && (
                        <section className="panel-section active">
                            <h2>Hospital Services Management</h2>
                            <div className="glass-card" style={{ marginBottom: '2rem' }}>
                                <h4>Add New Service</h4>
                                <form onSubmit={handleAddService} style={{ display: 'flex', gap: '10px', marginTop: '1rem', flexWrap: 'wrap' }}>
                                    <input type="text" placeholder="Service Name (e.g., MRI Scan)" required value={newServiceData.name} onChange={(e) => setNewServiceData({...newServiceData, name: e.target.value})} style={{ flex: 1, minWidth: '200px' }} />
                                    <input type="text" placeholder="Short Description" value={newServiceData.description} onChange={(e) => setNewServiceData({...newServiceData, description: e.target.value})} style={{ flex: 2, minWidth: '200px' }} />
                                    <input type="number" placeholder="Price (PKR)" required value={newServiceData.price} onChange={(e) => setNewServiceData({...newServiceData, price: e.target.value})} style={{ width: '120px' }} />
                                    <button type="submit" className="btn btn-primary">Save Service</button>
                                </form>
                            </div>

                            <div className="glass-card">
                                {services.length === 0 ? <p>No services cataloged for this hospital.</p> : (
                                    <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid #eee' }}>
                                                <th style={{ padding: '10px' }}>Service Name</th>
                                                <th>Description</th>
                                                <th>Price</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {services.map(srv => (
                                                <tr key={srv._id}>
                                                    <td style={{ padding: '10px', fontWeight: 'bold' }}>{srv.name}</td>
                                                    <td style={{ color: '#666' }}>{srv.description}</td>
                                                    <td>Rs. {srv.price}</td>
                                                    <td><button className="btn btn-outline" style={{ padding: '2px 8px', fontSize: '0.8rem', color: 'red', borderColor: 'red' }}>Delete</button></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </section>
                    )}

                    {activeTab === 'lab-portal' && (
                        <section className="panel-section active">
                            <h2>Manage Laboratory Access</h2>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Create secure credentials for your Laboratory Technicians to upload reports.</p>
                            
                            <div className="glass-card" style={{ maxWidth: '600px' }}>
                                <h4>Create Lab Administrator Account</h4>
                                <form onSubmit={handleAddLabAdmin} style={{ marginTop: '1rem' }}>
                                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                                        <input type="text" placeholder="Lab Tech Full Name" required value={newLabData.name} onChange={(e) => setNewLabData({...newLabData, name: e.target.value})} />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                                        <input type="email" placeholder="Lab Email Address" required value={newLabData.email} onChange={(e) => setNewLabData({...newLabData, email: e.target.value})} />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                                        <input type="password" placeholder="Set Initial Password" required value={newLabData.password} onChange={(e) => setNewLabData({...newLabData, password: e.target.value})} />
                                    </div>
                                    <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>Generate Access</button>
                                </form>
                            </div>
                        </section>
                    )}

                    {activeTab === 'pa-portal' && (
                        <section className="panel-section active">
                            <h2>Manage PA Access</h2>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Create secure credentials for Doctor's Personal Assistants.</p>
                            
                            <div className="glass-card" style={{ maxWidth: '600px' }}>
                                <h4>Create PA Administrator Account</h4>
                                <form onSubmit={handleAddPaAdmin} style={{ marginTop: '1rem' }}>
                                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                                        <input type="text" placeholder="PA Full Name" required value={newPaData.name} onChange={(e) => setNewPaData({...newPaData, name: e.target.value})} />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                                        <input type="email" placeholder="PA Email Address" required value={newPaData.email} onChange={(e) => setNewPaData({...newPaData, email: e.target.value})} />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                                        <label style={{ fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block' }}>Assign Doctor</label>
                                        <select required value={newPaData.doctorId} onChange={(e) => setNewPaData({...newPaData, doctorId: e.target.value})} style={{ width: '100%', padding: '8px' }}>
                                            <option value="">-- Select Doctor --</option>
                                            {doctors.map(d => (
                                                <option key={d._id} value={d._id}>{d.name} ({d.specialty})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                                        <input type="password" placeholder="Set Initial Password" required value={newPaData.password} onChange={(e) => setNewPaData({...newPaData, password: e.target.value})} />
                                    </div>
                                    <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>Generate Access</button>
                                </form>
                            </div>
                        </section>
                    )}

                    {activeTab === 'security' && (
                        <section className="panel-section active">
                            <h2>Security Settings</h2>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Update your hospital admin password here.</p>
                            
                            <div className="glass-card" style={{ maxWidth: '600px' }}>
                                <h4>Change Password</h4>
                                <form onSubmit={handleChangePassword} style={{ marginTop: '1rem' }}>
                                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                                        <input type="password" placeholder="Old Password" required value={passwordData.oldPassword} onChange={(e) => setPasswordData({...passwordData, oldPassword: e.target.value})} />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                                        <input type="password" placeholder="New Password" required value={passwordData.newPassword} onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})} />
                                    </div>
                                    <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>Update Password</button>
                                </form>
                            </div>
                        </section>
                    )}
                </main>
            </div>
        </div>
    );
};

export default HospitalDashboard;
