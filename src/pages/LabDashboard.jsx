import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserInfo, logoutUser } from '../utils/auth';

const LabDashboard = () => {
    const navigate = useNavigate();
    const userInfo = getUserInfo();
    const [hospitalName, setHospitalName] = useState('Loading...');
    const [uploadFile, setUploadFile] = useState(null);
    const [patientId, setPatientId] = useState('');
    const [testType, setTestType] = useState('Blood Count (CBC)');
    const [patients, setPatients] = useState([]);

    useEffect(() => {
        if (!userInfo.token || userInfo.role !== 'Lab Admin') {
            navigate('/lab-login');
            return;
        }

        const fetchHospitalDetails = async () => {
            try {
                const res = await fetch(`http://localhost:5000/api/hospitals`, {
                    headers: { 'Authorization': `Bearer ${userInfo.token}` }
                });
                const data = await res.json();
                
                // Find our specific hospital using the ID connected to this Lab Admin
                const myHospital = Array.isArray(data) ? data.find(h => h._id === userInfo.hospitalId) : null;
                
                if (myHospital) {
                    setHospitalName(myHospital.name);
                } else {
                    setHospitalName('Unassigned Laboratory');
                }
            } catch (error) {
                console.error("Failed to load hospital details");
                setHospitalName('Error Loading Laboratory');
            }
        };

        const fetchPatients = async () => {
            try {
                const res = await fetch(`http://localhost:5000/api/users/patients`, {
                    headers: { 'Authorization': `Bearer ${userInfo.token}` }
                });
                const data = await res.json();
                setPatients(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Failed to load patients", error);
            }
        };

        fetchHospitalDetails();
        fetchPatients();
    }, [navigate, userInfo]);

    const handleLogout = () => {
        logoutUser();
        navigate('/');
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!uploadFile) {
            return alert('Please select a file to upload!');
        }
        
        const formData = new FormData();
        formData.append('report', uploadFile);
        if (patientId.trim()) {
            formData.append('patientId', patientId.trim());
        }
        formData.append('testType', testType);
        
        try {
            const res = await fetch('http://localhost:5000/api/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${userInfo.token}`
                },
                body: formData
            });
            
            if (res.ok) {
                const data = await res.json();
                alert(`Report uploaded successfully.\nReport ID: ${data.reportId}\nSaved at: ${data.filePath}`);
                setUploadFile(null); // Reset after upload
                setPatientId('');
            } else {
                const err = await res.json();
                alert(`Upload failed: ${err.message}`);
            }
        } catch (error) {
            alert('Failed to connect to the backend server.');
        }
    };

    return (
        <div style={{ paddingBottom: '4rem' }}>
            <div style={{ background: 'var(--white)', padding: '1rem', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="hospital-name-display" style={{ fontWeight: 600, color: 'var(--primary-teal)' }}>{hospitalName}</span>
                <div style={{ fontSize: '0.9rem' }}>
                    <i className="fas fa-user-circle"></i> {userInfo.email ? userInfo.email.split('@')[0] : 'Lab Tech'}
                    <button onClick={handleLogout} className="btn btn-outline" style={{ marginLeft: '1rem', padding: '0.3rem 0.8rem' }}>Logout</button>
                </div>
            </div>

            <div className="dashboard-container" style={{ display: 'flex', minHeight: 'calc(100vh - 140px)' }}>
                {/* Sidebar */}
                <aside className="sidebar" style={{ width: '250px', background: 'var(--white)', borderRight: '1px solid #CCFBF1', padding: '2rem 0', display: 'flex', flexDirection: 'column' }}>
                    <div className="sidebar-item active" style={{ padding: '1rem 2rem', cursor: 'pointer', fontWeight: 500, color: 'var(--primary-teal)', background: 'var(--primary-bg)', borderRight: '3px solid var(--primary-teal)' }}>
                        <i className="fas fa-upload" style={{ marginRight: '10px' }}></i> Upload Reports
                    </div>
                    <div className="sidebar-item" style={{ padding: '1rem 2rem', cursor: 'pointer', fontWeight: 500, color: 'var(--text-muted)' }}>
                        <i className="fas fa-users" style={{ marginRight: '10px' }}></i> Patient Directory
                    </div>
                </aside>

                {/* Main Content */}
                <main className="main-panel" style={{ flex: 1, padding: '2rem' }}>
                    <h2>Upload Patient Lab Reports</h2>
                    <div className="glass-card" style={{ maxWidth: '600px', margin: '1rem 0' }}>
                        <form onSubmit={handleUpload}>
                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label>Select Patient (optional)</label>
                                <select value={patientId} onChange={(e) => setPatientId(e.target.value)}>
                                    <option value="">-- No Patient / General Report --</option>
                                    {patients.map(p => (
                                        <option key={p._id} value={p._id}>{p.name} ({p.ghid || p.email})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label>Test Type</label>
                                <select value={testType} onChange={(e) => setTestType(e.target.value)}>
                                    <option>Blood Count (CBC)</option>
                                    <option>X-Ray</option>
                                    <option>MRI</option>
                                    <option>Covid-19 PCR</option>
                                </select>
                            </div>

                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label>Upload File (PDF/JPG)</label>
                                <div style={{ position: 'relative', border: '2px dashed #ccc', padding: '2rem', textAlign: 'center', borderRadius: '8px', cursor: 'pointer' }}>
                                    <i className="fas fa-cloud-upload-alt" style={{ fontSize: '2rem', color: 'var(--text-muted)' }}></i>
                                    <p>{uploadFile ? uploadFile.name : 'Click to browse files'}</p>
                                    <input 
                                        type="file" 
                                        onChange={(e) => setUploadFile(e.target.files[0])}
                                        style={{ opacity: 0, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', cursor: 'pointer' }} 
                                    />
                                </div>
                            </div>

                            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={!uploadFile}>
                                {uploadFile ? 'Upload & Notify Patient' : 'Select File to Upload'}
                            </button>
                        </form>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default LabDashboard;
