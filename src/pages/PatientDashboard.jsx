import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserInfo, logoutUser } from '../utils/auth';

const PatientDashboard = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const navigate = useNavigate();
    const userInfo = getUserInfo();
    
    // Data states
    const [hospitals, setHospitals] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [doctorsGlobal, setDoctorsGlobal] = useState([]);
    const [myAppointments, setMyAppointments] = useState([]);
    const [myReports, setMyReports] = useState([]);
    const [filterByHosp, setFilterByHosp] = useState(true);
    
    // Chat states
    const [selectedDoctorId, setSelectedDoctorId] = useState('');
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');

    // Booking Form State
    const [bookingData, setBookingData] = useState({
        hospitalId: '', doctorId: '', department: 'General Medicine', date: '', timeSlot: '10:00 AM - 10:30 AM'
    });

    // Persisted Hospital Info
    const [selectedHospitalId, setSelectedHospitalId] = useState(localStorage.getItem('selectedHospitalId') || '');
    const [selectedHospitalName, setSelectedHospitalName] = useState(localStorage.getItem('selectedHospitalName') || '');
    
    // Services
    const [hospitalServices, setHospitalServices] = useState([]);
    
    // Video Call
    const [videoCallActive, setVideoCallActive] = useState(false);
    const [localStream, setLocalStream] = useState(null);

    // Prescriptions
    const [myPrescriptions, setMyPrescriptions] = useState([]);
    const [prescriptionFile, setPrescriptionFile] = useState(null);
    const [prescriptionText, setPrescriptionText] = useState('');
    const [uploadingPres, setUploadingPres] = useState(false);
    const [explainingPres, setExplainingPres] = useState(false);
    const [selectedPres, setSelectedPres] = useState(null);
    const [clarifyText, setClarifyText] = useState('');
    const [sendingClarify, setSendingClarify] = useState(false);

    useEffect(() => {
        if (!userInfo.token || userInfo.role !== 'Patient') {
            navigate('/login');
            return;
        }

        const fetchInitialData = async () => {
            try {
                const hospRes = await fetch('http://localhost:5000/api/hospitals', { headers: { 'Authorization': `Bearer ${userInfo.token}` } });
                const hospData = await hospRes.json();
                setHospitals(Array.isArray(hospData)? hospData : []);

                const apptRes = await fetch('http://localhost:5000/api/appointments/my-appointments', { headers: { 'Authorization': `Bearer ${userInfo.token}` } });
                const apptData = await apptRes.json();
                setMyAppointments(Array.isArray(apptData) ? apptData : []);

                const reportsRes = await fetch('http://localhost:5000/api/upload/my-reports', { headers: { 'Authorization': `Bearer ${userInfo.token}` } });
                const reportsData = await reportsRes.json();
                setMyReports(Array.isArray(reportsData) ? reportsData : []);

                const globalDocRes = await fetch('http://localhost:5000/api/doctors/all', { headers: { 'Authorization': `Bearer ${userInfo.token}` } });
                const globalDocData = await globalDocRes.json();
                setDoctorsGlobal(Array.isArray(globalDocData) ? globalDocData : []);

            } catch (err) { console.error("Failed to load patient static data", err); }
        };
        fetchInitialData();
    }, [navigate, userInfo.token, userInfo.role, userInfo._id]);

    useEffect(() => {
        if (selectedHospitalId && userInfo.token) {
            // Automatically fetch doctors for the persistent hospital selection
            const fetchHospDocs = async () => {
                try {
                    const docRes = await fetch(`http://localhost:5000/api/doctors/hospital/${selectedHospitalId}`, {
                        headers: { 'Authorization': `Bearer ${userInfo.token}` }
                    });
                    const docData = await docRes.json();
                    setDoctors(Array.isArray(docData) ? docData : []);
                    if (Array.isArray(docData) && docData.length > 0) {
                        setBookingData(prev => ({ ...prev, doctorId: docData[0]._id }));
                    }
                } catch (err) {
                    console.error("Error loading hospital doctors", err);
                }
            };
            
            const fetchHospServices = async () => {
                try {
                    const servRes = await fetch(`http://localhost:5000/api/services/hospital/${selectedHospitalId}`, {
                        headers: { 'Authorization': `Bearer ${userInfo.token}` }
                    });
                    const servData = await servRes.json();
                    setHospitalServices(Array.isArray(servData) ? servData : []);
                } catch (err) {
                    console.error("Error loading hospital services", err);
                }
            };

            fetchHospDocs();
            fetchHospServices();

            // Set booking form hospitalId default
            setBookingData(prev => ({ ...prev, hospitalId: selectedHospitalId }));
        }
    }, [selectedHospitalId, userInfo.token]);

    const fetchPrescriptions = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/upload/my-prescriptions', {
                headers: { 'Authorization': `Bearer ${userInfo.token}` }
            });
            const data = await res.json();
            setMyPrescriptions(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to load prescriptions", error);
        }
    };

    useEffect(() => {
        if (userInfo.token && activeTab === 'prescriptions') {
            fetchPrescriptions();
        }
    }, [activeTab, userInfo.token]);

    const startVideoCall = async () => {
        setVideoCallActive(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setLocalStream(stream);
        } catch (err) {
            console.warn("Camera access denied or not available, proceeding with simulated stream.", err);
        }
    };

    const endVideoCall = () => {
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            setLocalStream(null);
        }
        setVideoCallActive(false);
    };

    useEffect(() => {
        return () => {
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
        };
    }, [localStream]);

    const handlePrescriptionUpload = async (e) => {
        e.preventDefault();
        if (!prescriptionFile) {
            return alert("Please select a prescription file first.");
        }
        if (!selectedHospitalId) {
            return alert("Please select a hospital portal first on the landing page.");
        }

        setUploadingPres(true);
        const formData = new FormData();
        formData.append('prescription', prescriptionFile);
        formData.append('hospitalId', selectedHospitalId);

        try {
            const res = await fetch('http://localhost:5000/api/upload/prescription', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${userInfo.token}`
                },
                body: formData
            });

            if (res.ok) {
                alert("Prescription uploaded successfully!");
                setPrescriptionFile(null);
                if (document.getElementById('prescription-file-input')) {
                    document.getElementById('prescription-file-input').value = '';
                }
                fetchPrescriptions();
            } else {
                const err = await res.json();
                alert(`Upload failed: ${err.message}`);
            }
        } catch (err) {
            alert("Connection error during upload.");
        } finally {
            setUploadingPres(false);
        }
    };

    const handleGetAiExplanation = async (presId) => {
        setExplainingPres(true);
        const textToExplain = prescriptionText.trim() || 
            "Rx: Paracetamol 500mg. Take 1 tablet every 6 hours as needed for fever/pain. Max 4 tablets daily. Amoxicillin 500mg. Take 1 capsule 3 times daily for 7 days until finished. Take after food. Caution: may cause mild drowsiness.";
        
        try {
            const res = await fetch(`http://localhost:5000/api/ai/explain-prescription/${presId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${userInfo.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ prescriptionText: textToExplain })
            });

            if (res.ok) {
                const data = await res.json();
                alert("AI Explanation generated successfully!");
                
                // Fetch updated prescriptions list first
                const listRes = await fetch('http://localhost:5000/api/upload/my-prescriptions', {
                    headers: { 'Authorization': `Bearer ${userInfo.token}` }
                });
                const listData = await listRes.json();
                const freshPrescriptions = Array.isArray(listData) ? listData : [];
                setMyPrescriptions(freshPrescriptions);

                const freshObj = freshPrescriptions.find(p => p._id === presId);
                setSelectedPres(freshObj || null);
            } else {
                const err = await res.json();
                alert(`Explanation failed: ${err.message}`);
            }
        } catch (err) {
            alert("Error connecting to Gemini explainer.");
        } finally {
            setExplainingPres(false);
        }
    };

    const handleSendClarifyRequest = async (e) => {
        e.preventDefault();
        if (!selectedPres || !clarifyText.trim()) return;

        const docId = selectedDoctorId || (doctors[0] ? doctors[0]._id : '');
        if (!docId) {
            return alert("Please select a doctor to direct the clarification to.");
        }

        setSendingClarify(true);
        try {
            const res = await fetch(`http://localhost:5000/api/ai/clarify-prescription/${selectedPres._id}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${userInfo.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    doctorId: docId,
                    text: clarifyText
                })
            });

            if (res.ok) {
                alert("Clarification request sent to the doctor and chat stream!");
                setClarifyText('');
                
                const listRes = await fetch('http://localhost:5000/api/upload/my-prescriptions', {
                    headers: { 'Authorization': `Bearer ${userInfo.token}` }
                });
                const listData = await listRes.json();
                const freshPrescriptions = Array.isArray(listData) ? listData : [];
                setMyPrescriptions(freshPrescriptions);

                const freshObj = freshPrescriptions.find(p => p._id === selectedPres._id);
                setSelectedPres(freshObj || null);
            } else {
                const err = await res.json();
                alert(`Clarification request failed: ${err.message}`);
            }
        } catch (err) {
            alert("Connection error sending clarification.");
        } finally {
            setSendingClarify(false);
        }
    };

    // Chat thread loader (polling)
    useEffect(() => {
        if (activeTab === 'chats' && selectedDoctorId) {
            const fetchMessages = async () => {
                try {
                    const res = await fetch(`http://localhost:5000/api/chats/${userInfo._id}/${selectedDoctorId}`, {
                        headers: { 'Authorization': `Bearer ${userInfo.token}` }
                    });
                    const data = await res.json();
                    if (Array.isArray(data)) setMessages(data);
                } catch (error) {}
            };
            fetchMessages();
            const interval = setInterval(fetchMessages, 3000); // Polling every 3s
            return () => clearInterval(interval);
        }
    }, [activeTab, selectedDoctorId, userInfo._id, userInfo.token]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedDoctorId) return;
        try {
            const res = await fetch('http://localhost:5000/api/chats', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${userInfo.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    patientId: userInfo._id,
                    doctorId: selectedDoctorId,
                    text: newMessage
                })
            });
            if (res.ok) {
                setNewMessage('');
                const newMsg = await res.json();
                setMessages([...messages, newMsg]);
            } else {
                alert('Session expired or identifier missing. Please logout and log back in to refresh your connection.');
            }
        } catch (error) { 
            console.error("Message send failed", error); 
            alert('Failed to connect to chat server. Please check your network or try logging out and back in.');
        }
    };

    const handleHospitalSelect = async (e) => {
        const selectedHospitalId = e.target.value;
        setBookingData({ ...bookingData, hospitalId: selectedHospitalId, doctorId: '' });

        if (!selectedHospitalId) {
            setDoctors([]);
            return;
        }

        try {
            const docRes = await fetch(`http://localhost:5000/api/doctors/hospital/${selectedHospitalId}`, {
                headers: { 'Authorization': `Bearer ${userInfo.token}` }
            });
            const docData = await docRes.json();
            setDoctors(Array.isArray(docData) ? docData : []);
            if (docData.length > 0) {
                setBookingData(prev => ({ ...prev, doctorId: docData[0]._id })); 
            }
        } catch (error) { console.error('Failed to fetch doctors', error); }
    };

    const handleLogout = () => {
        logoutUser();
        navigate('/');
    };

    const handleBooking = async (e) => {
        e.preventDefault();
        if (!bookingData.hospitalId || !bookingData.doctorId || !bookingData.date) {
            return alert("Please fill out all booking fields.");
        }
        try {
            const res = await fetch('http://localhost:5000/api/appointments', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userInfo.token}`
                },
                body: JSON.stringify({
                    doctorId: bookingData.doctorId,
                    hospitalId: bookingData.hospitalId,
                    date: bookingData.date,
                    timeSlot: bookingData.timeSlot
                })
            });
            if (res.ok) {
                alert('Appointment Request Sent Successfully!');
                const apptRes = await fetch('http://localhost:5000/api/appointments/my-appointments', { headers: { 'Authorization': `Bearer ${userInfo.token}` } });
                const apptData = await apptRes.json();
                setMyAppointments(Array.isArray(apptData) ? apptData : []);
                setActiveTab('dashboard');
            } else {
                const err = await res.json();
                alert(`Booking Failed: ${err.message}`);
            }
        } catch (error) { alert('Failed to connect to server.'); }
    };

    return (
        <div style={{ paddingBottom: '4rem' }}>
            <div style={{ background: 'var(--white)', padding: '1rem', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="hospital-name-display" style={{ fontWeight: 600, color: 'var(--primary-teal)' }}>CareSync Network</span>
                <div style={{ fontSize: '0.9rem' }}>
                    <i className="fas fa-user-circle"></i> {userInfo.email.split('@')[0]} <span style={{color: 'var(--text-muted)'}}>| GHID: {userInfo.ghid || 'N/A'}</span>
                    <button onClick={handleLogout} className="btn btn-outline" style={{ marginLeft: '1rem', padding: '0.3rem 0.8rem' }}>Logout</button>
                </div>
            </div>

            {selectedHospitalName && (
                <div style={{ background: '#CCFBF1', color: '#0F766E', padding: '0.5rem 1rem', fontSize: '0.9rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid #99F6E4' }}>
                    <i className="fas fa-hospital-symbol"></i> Hospital Portal Mode: <strong>{selectedHospitalName}</strong> (Actions default to this facility)
                    <button onClick={() => { localStorage.removeItem('selectedHospital'); localStorage.removeItem('selectedHospitalName'); localStorage.removeItem('selectedHospitalId'); setSelectedHospitalId(''); setSelectedHospitalName(''); }} style={{ background: 'none', border: 'none', color: '#0F766E', textDecoration: 'underline', cursor: 'pointer', marginLeft: 'auto' }}>Exit Hospital Portal</button>
                </div>
            )}

            <div className="dashboard-container" style={{ display: 'flex', minHeight: 'calc(100vh - 140px)' }}>
                {/* Sidebar */}
                <aside className="sidebar" style={{ width: '250px', background: 'var(--white)', borderRight: '1px solid #CCFBF1', padding: '2rem 0', display: 'flex', flexDirection: 'column' }}>
                    <div className={`sidebar-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')} style={{ padding: '1rem 2rem', cursor: 'pointer', transition: 'all 0.3s', fontWeight: 500 }}>
                        <i className="fas fa-th-large" style={{ marginRight: '10px' }}></i> Dashboard
                    </div>
                    <div className={`sidebar-item ${activeTab === 'booking' ? 'active' : ''}`} onClick={() => setActiveTab('booking')} style={{ padding: '1rem 2rem', cursor: 'pointer', transition: 'all 0.3s', fontWeight: 500 }}>
                        <i className="fas fa-calendar-plus" style={{ marginRight: '10px' }}></i> Book Appointment
                    </div>
                    <div className={`sidebar-item ${activeTab === 'services' ? 'active' : ''}`} onClick={() => setActiveTab('services')} style={{ padding: '1rem 2rem', cursor: 'pointer', transition: 'all 0.3s', fontWeight: 500 }}>
                        <i className="fas fa-concierge-bell" style={{ marginRight: '10px' }}></i> Hospital Services
                    </div>
                    <div className={`sidebar-item ${activeTab === 'schedule' ? 'active' : ''}`} onClick={() => setActiveTab('schedule')} style={{ padding: '1rem 2rem', cursor: 'pointer', transition: 'all 0.3s', fontWeight: 500 }}>
                        <i className="fas fa-user-md" style={{ marginRight: '10px' }}></i> Doctor Network
                    </div>
                    <div className={`sidebar-item ${activeTab === 'chats' ? 'active' : ''}`} onClick={() => setActiveTab('chats')} style={{ padding: '1rem 2rem', cursor: 'pointer', transition: 'all 0.3s', fontWeight: 500 }}>
                        <i className="fas fa-comments" style={{ marginRight: '10px' }}></i> Consult Doctor
                    </div>
                    <div className={`sidebar-item ${activeTab === 'prescriptions' ? 'active' : ''}`} onClick={() => setActiveTab('prescriptions')} style={{ padding: '1rem 2rem', cursor: 'pointer', transition: 'all 0.3s', fontWeight: 500 }}>
                        <i className="fas fa-prescription-bottle-alt" style={{ marginRight: '10px' }}></i> Prescription Portal
                    </div>
                    <div className={`sidebar-item ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')} style={{ padding: '1rem 2rem', cursor: 'pointer', transition: 'all 0.3s', fontWeight: 500 }}>
                        <i className="fas fa-history" style={{ marginRight: '10px' }}></i> Medical History
                    </div>
                    <div className={`sidebar-item ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')} style={{ padding: '1rem 2rem', cursor: 'pointer', transition: 'all 0.3s', fontWeight: 500 }}>
                        <i className="fas fa-file-medical" style={{ marginRight: '10px' }}></i> Lab Reports
                    </div>
                </aside>

                {/* Main Content */}
                <main className="main-panel" style={{ flex: 1, padding: '2rem' }}>
                    {activeTab === 'dashboard' && (
                        <section className="panel-section active">
                            <h2>Overview</h2>
                            <div className="services-grid" style={{ margin: '2rem 0', gridTemplateColumns: 'repeat(3, 1fr)' }}>
                                <div className="stat-card" style={{ background: 'white', padding: '1.5rem', borderRadius: 'var(--radius-md)', boxShadow: '0 4px 6px -1px var(--shadow-light)', textAlign: 'center' }}>
                                    <div className="stat-value" style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary-teal)' }}>
                                        {myAppointments.filter(a => a.status === 'Pending' || a.status === 'Confirmed').length < 10 ? `0${myAppointments.filter(a => a.status === 'Pending' || a.status === 'Confirmed').length}` : myAppointments.filter(a => a.status === 'Pending' || a.status === 'Confirmed').length}
                                    </div>
                                    <p>Active Appointments</p>
                                </div>
                                <div className="stat-card" style={{ background: 'white', padding: '1.5rem', borderRadius: 'var(--radius-md)', boxShadow: '0 4px 6px -1px var(--shadow-light)', textAlign: 'center' }}>
                                    <div className="stat-value" style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary-teal)' }}>
                                        {myReports.length < 10 ? `0${myReports.length}` : myReports.length}
                                    </div>
                                    <p>Lab Reports Uploaded</p>
                                </div>
                                <div className="stat-card" style={{ background: 'white', padding: '1.5rem', borderRadius: 'var(--radius-md)', boxShadow: '0 4px 6px -1px var(--shadow-light)', textAlign: 'center' }}>
                                    <div className="stat-value text-muted" style={{ fontSize: '2rem', fontWeight: 700 }}>--</div>
                                    <p>Queue Position</p>
                                </div>
                            </div>

                            <h3>Your Appointments</h3>
                            <div className="glass-card" style={{ padding: '1rem', marginTop: '1rem' }}>
                                {myAppointments.length === 0 ? <p>You have no appointments yet.</p> : (
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid #eee' }}>
                                                <th style={{ padding: '10px' }}>Doctor</th>
                                                <th>Hospital</th>
                                                <th>Date</th>
                                                <th>Time</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {myAppointments.map(appt => (
                                                <tr key={appt._id}>
                                                    <td style={{ padding: '10px', fontWeight: 'bold' }}>{appt.doctorId?.name || 'Unknown'}</td>
                                                    <td>{appt.hospitalId?.name || 'Unknown Facility'}</td>
                                                    <td>{new Date(appt.date).toLocaleDateString()}</td>
                                                    <td>{appt.timeSlot}</td>
                                                    <td>
                                                        <span style={{ 
                                                            padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600, 
                                                            background: appt.status === 'Confirmed' ? '#DCFCE7' : '#FEF2F2', 
                                                            color: appt.status === 'Confirmed' ? '#166534' : '#991B1B' 
                                                        }}>
                                                            {appt.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </section>
                    )}

                    {activeTab === 'booking' && (
                        <section className="panel-section active">
                            <h2>Book Appointment</h2>
                            <div className="glass-card" style={{ maxWidth: '600px' }}>
                                <form onSubmit={handleBooking}>
                                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                                        <label>Select Hospital Network</label>
                                        <select required value={bookingData.hospitalId} onChange={handleHospitalSelect} style={{ marginBottom: '1rem', width: '100%', padding: '8px' }}>
                                            <option value="">-- Choose Facility --</option>
                                            {hospitals.map(h => (
                                                <option key={h._id} value={h._id}>{h.name} ({h.city?.name || 'Local'})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                                        <label>Select Department Option</label>
                                        <select required value={bookingData.department} onChange={(e) => setBookingData({...bookingData, department: e.target.value})} style={{ marginBottom: '1rem', width: '100%', padding: '8px' }}>
                                            <option>General Medicine</option>
                                            <option>Cardiology</option>
                                            <option>Dermatology</option>
                                            <option>Pediatrics</option>
                                        </select>
                                    </div>
                                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                                        <label>Select Available Doctor</label>
                                        <select required disabled={!bookingData.hospitalId || doctors.length === 0} value={bookingData.doctorId} onChange={(e) => setBookingData({...bookingData, doctorId: e.target.value})} style={{ marginBottom: '1rem', width: '100%', padding: '8px' }}>
                                            {doctors.length === 0 ? <option value="">No doctors available</option> : null}
                                            {doctors.map(d => (
                                                <option key={d._id} value={d._id}>{d.name} ({d.specialty})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <div className="form-group" style={{ flex: 1 }}>
                                            <label>Date</label>
                                            <input type="date" required value={bookingData.date} onChange={(e) => setBookingData({...bookingData, date: e.target.value})} style={{ marginBottom: '1rem', width: '100%', padding: '8px' }} />
                                        </div>
                                        <div className="form-group" style={{ flex: 1 }}>
                                            <label>Time Slot</label>
                                            <select required value={bookingData.timeSlot} onChange={(e) => setBookingData({...bookingData, timeSlot: e.target.value})} style={{ marginBottom: '1rem', width: '100%', padding: '8px' }}>
                                                <option>10:00 AM - 10:30 AM</option>
                                                <option>10:30 AM - 11:00 AM</option>
                                                <option>11:00 AM - 11:30 AM</option>
                                                <option>02:00 PM - 02:30 PM</option>
                                                <option>04:00 PM - 04:30 PM</option>
                                            </select>
                                        </div>
                                    </div>
                                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Confirm Booking via GHID</button>
                                </form>
                            </div>
                        </section>
                    )}

                    {activeTab === 'services' && (
                        <section className="panel-section active">
                            <h2>Hospital Medical Services</h2>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Catalog of treatments, diagnostics, and services offered at <strong>{selectedHospitalName || 'the selected hospital'}</strong>.</p>
                            
                            {!selectedHospitalId ? (
                                <div className="glass-card text-center" style={{ padding: '3rem 1rem' }}>
                                    <i className="fas fa-hospital" style={{ fontSize: '3rem', color: '#BDC3C7', marginBottom: '1rem' }}></i>
                                    <p>Please select a hospital portal first on the homepage to view its local services catalog.</p>
                                </div>
                            ) : hospitalServices.length === 0 ? (
                                <div className="glass-card text-center" style={{ padding: '3rem 1rem' }}>
                                    <i className="fas fa-folder-open" style={{ fontSize: '3rem', color: '#BDC3C7', marginBottom: '1rem' }}></i>
                                    <p>No services registered for this hospital facility yet.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                                    {hospitalServices.map(serv => (
                                        <div key={serv._id} className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderTop: '4px solid var(--primary-teal)' }}>
                                            <div>
                                                <h4 style={{ color: 'var(--text-dark)', fontWeight: 'bold', fontSize: '1.1rem', margin: '0 0 0.5rem 0' }}>{serv.name}</h4>
                                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.4', marginBottom: '1rem' }}>{serv.description || 'No description provided.'}</p>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F0FDF4', paddingTop: '0.8rem' }}>
                                                <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 500 }}>ESTIMATED PRICE</span>
                                                <span style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0F766E' }}>Rs. {serv.price}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    )}

                    {activeTab === 'schedule' && (
                        <section className="panel-section active">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h2>Doctors Network Status</h2>
                                {selectedHospitalId && (
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', background: '#F8FAFC', padding: '0.4rem 0.8rem', borderRadius: '4px', border: '1px solid #E2E8F0', fontSize: '0.9rem' }}>
                                        <input type="checkbox" checked={filterByHosp} onChange={(e) => setFilterByHosp(e.target.checked)} />
                                        Only show {selectedHospitalName} doctors
                                    </label>
                                )}
                            </div>
                            <div style={{ marginTop: '1rem' }}>
                                {doctorsGlobal.filter(doc => !filterByHosp || !selectedHospitalId || doc.hospital?._id === selectedHospitalId || doc.hospital === selectedHospitalId).length === 0 ? <p>No doctors found matching the filter.</p> : null}
                                {doctorsGlobal.filter(doc => !filterByHosp || !selectedHospitalId || doc.hospital?._id === selectedHospitalId || doc.hospital === selectedHospitalId).map(doc => (
                                    <div key={doc._id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'white', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid #E2E8F0', marginBottom: '1rem' }}>
                                        <div style={{ width: '50px', height: '50px', background: '#eee', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <i className="fas fa-user-md" style={{ fontSize: '1.5rem', color: 'var(--primary-teal)' }}></i>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <h4 style={{ margin: 0 }}>{doc.name}</h4>
                                            <p className="text-muted" style={{ margin: '0.2rem 0 0' }}>{doc.specialty} — {doc.hospital?.name || 'Unassigned Facility'}</p>
                                        </div>
                                        {doc.dutyStatus === 'On Duty' ? (
                                            <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600, background: '#DCFCE7', color: '#166534' }}>On Duty</span>
                                        ) : doc.dutyStatus === 'In Consultation' ? (
                                            <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600, background: '#FEF08A', color: '#854D0E' }}>In Consultation</span>
                                        ) : (
                                            <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600, background: '#F1F5F9', color: '#64748B' }}>Off Duty</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {activeTab === 'chats' && (
                        <section className="panel-section active">
                            <h2>Consult Doctor</h2>
                            <div className="glass-card">
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Select Doctor to Message</label>
                                <select 
                                    value={selectedDoctorId} 
                                    onChange={(e) => setSelectedDoctorId(e.target.value)} 
                                    style={{ width: '100%', padding: '10px', marginBottom: '1rem' }}
                                >
                                    <option value="">-- Choose a Doctor --</option>
                                    {doctorsGlobal.filter(doc => !selectedHospitalId || doc.hospital?._id === selectedHospitalId || doc.hospital === selectedHospitalId).map(d => (
                                        <option key={d._id} value={d._id}>{d.name} ({d.specialty})</option>
                                    ))}
                                </select>

                                {selectedDoctorId && (
                                    <div style={{ border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden' }}>
                                        <div style={{ background: 'var(--primary-bg)', padding: '1rem', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <strong>Chat Stream with Dr. {doctorsGlobal.find(d => d._id === selectedDoctorId)?.name}</strong>
                                            <button onClick={startVideoCall} className="btn btn-sm" style={{ background: '#2563EB', color: 'white', border: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                <i className="fas fa-video"></i> Start Video Consultation
                                            </button>
                                        </div>
                                        <div style={{ height: '300px', overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '10px', background: 'white' }}>
                                            {messages.length === 0 && <p style={{ textAlign: 'center', color: '#888' }}>Send a message to start the consultation.</p>}
                                            {messages.map((m, i) => {
                                                const isMyMsg = m.senderRole === 'Patient';
                                                return (
                                                    <div key={i} style={{ 
                                                        alignSelf: isMyMsg ? 'flex-end' : 'flex-start',
                                                        background: isMyMsg ? 'var(--primary-teal)' : '#f0f0f0',
                                                        color: isMyMsg ? 'white' : 'black',
                                                        padding: '10px 15px', borderRadius: '15px', maxWidth: '70%'
                                                    }}>
                                                        {m.text}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                        <form onSubmit={handleSendMessage} style={{ display: 'flex', borderTop: '1px solid #eee', padding: '1rem', background: 'white' }}>
                                            <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." style={{ flex: 1, padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }} />
                                            <button type="submit" className="btn btn-primary" style={{ marginLeft: '10px' }}>Send</button>
                                        </form>
                                    </div>
                                )}
                            </div>
                        </section>
                    )}

                    {activeTab === 'prescriptions' && (
                        <section className="panel-section active">
                            <h2>Smart Prescription Assistance</h2>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Upload doctor prescriptions for instant AI usage guidelines, drug caution flag breakdown, and direct chat clarification requests.</p>
                            
                            {!selectedHospitalId ? (
                                <div className="glass-card text-center" style={{ padding: '3rem 1rem' }}>
                                    <i className="fas fa-hospital" style={{ fontSize: '3rem', color: '#BDC3C7', marginBottom: '1rem' }}></i>
                                    <p>Please select a hospital portal first on the homepage to upload and analyze prescriptions.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem', alignItems: 'start' }}>
                                    
                                    {/* Left Side: Upload & List */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                        <div className="glass-card" style={{ padding: '1.5rem' }}>
                                            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}><i className="fas fa-cloud-upload-alt"></i> Upload New Prescription</h3>
                                            <form onSubmit={handlePrescriptionUpload}>
                                                <div className="form-group" style={{ marginBottom: '1rem' }}>
                                                    <input 
                                                        id="prescription-file-input"
                                                        type="file" 
                                                        accept=".jpg,.jpeg,.png,.pdf" 
                                                        onChange={(e) => setPrescriptionFile(e.target.files[0])} 
                                                        style={{ width: '100%', padding: '5px', border: '1px dashed #A5F3FC', borderRadius: '4px', background: '#F8FAFC' }} 
                                                        required
                                                    />
                                                </div>
                                                <div className="form-group" style={{ marginBottom: '1rem' }}>
                                                    <label style={{ fontSize: '0.85rem', color: '#64748B', display: 'block', marginBottom: '0.3rem' }}>Prescription Text / Notes (Optional)</label>
                                                    <textarea 
                                                        placeholder="Type/paste handwritten text if file is an image, for higher accuracy..." 
                                                        value={prescriptionText} 
                                                        onChange={(e) => setPrescriptionText(e.target.value)} 
                                                        style={{ width: '100%', height: '80px', padding: '8px', border: '1px solid #CBD5E1', borderRadius: '4px', resize: 'none', fontSize: '0.9rem' }}
                                                    />
                                                </div>
                                                <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={uploadingPres}>
                                                    {uploadingPres ? <i className="fas fa-spinner fa-spin"></i> : "Upload Prescription"}
                                                </button>
                                            </form>
                                        </div>
                                        
                                        <div className="glass-card" style={{ padding: '1.5rem' }}>
                                            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}><i className="fas fa-prescription"></i> Your Prescriptions</h3>
                                            {myPrescriptions.length === 0 ? <p style={{ color: '#64748B', fontSize: '0.9rem' }}>No prescriptions uploaded yet.</p> : (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', maxHeight: '300px', overflowY: 'auto' }}>
                                                    {myPrescriptions.map(pres => (
                                                        <div 
                                                            key={pres._id} 
                                                            onClick={() => setSelectedPres(pres)}
                                                            style={{ 
                                                                padding: '10px', border: selectedPres?._id === pres._id ? '2px solid var(--primary-teal)' : '1px solid #E2E8F0', 
                                                                borderRadius: '6px', cursor: 'pointer', background: selectedPres?._id === pres._id ? '#F0FDF4' : 'white',
                                                                transition: 'all 0.2s', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                                            }}
                                                        >
                                                            <div>
                                                                <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#1F2937' }}>{pres.originalFileName}</div>
                                                                <div style={{ fontSize: '0.8rem', color: '#64748B' }}>{new Date(pres.createdAt).toLocaleDateString()}</div>
                                                            </div>
                                                            <i className="fas fa-chevron-right" style={{ color: '#94A3B8' }}></i>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Right Side: Analysis & Chat */}
                                    <div className="glass-card" style={{ padding: '1.5rem', minHeight: '400px' }}>
                                        {!selectedPres ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '350px', color: '#94A3B8' }}>
                                                <i className="fas fa-file-medical-alt" style={{ fontSize: '4rem', marginBottom: '1rem' }}></i>
                                                <p>Select a prescription file from the list to view explanation and initiate doctor clarification request.</p>
                                            </div>
                                        ) : (
                                            <div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                                                    <div>
                                                        <h3 style={{ margin: 0, color: '#1E293B' }}>{selectedPres.originalFileName}</h3>
                                                        <span style={{ fontSize: '0.85rem', color: '#64748B' }}>Uploaded: {new Date(selectedPres.createdAt).toLocaleString()}</span>
                                                    </div>
                                                    <a href={`http://localhost:5000${selectedPres.filePath}`} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline">
                                                        <i className="fas fa-external-link-alt"></i> View File
                                                    </a>
                                                </div>
                                                
                                                {/* AI explanation segment */}
                                                <div style={{ marginBottom: '1.5rem' }}>
                                                    {!selectedPres.aiExplanation?.plainSummary ? (
                                                        <div style={{ background: '#F8FAFC', padding: '1.5rem', borderRadius: '8px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                                                            <i className="fas fa-brain" style={{ fontSize: '2rem', color: 'var(--primary-teal)', marginBottom: '0.5rem' }}></i>
                                                            <h4 style={{ color: '#334155' }}>AI Summary Not Generated</h4>
                                                            <p style={{ color: '#64748B', fontSize: '0.9rem', margin: '0.5rem 0 1rem' }}>Analyze the uploaded file to view simple medication guidelines and side effect warnings.</p>
                                                            <button 
                                                                className="btn btn-primary" 
                                                                onClick={() => handleGetAiExplanation(selectedPres._id)}
                                                                disabled={explainingPres}
                                                            >
                                                                {explainingPres ? <i className="fas fa-spinner fa-spin"></i> : "Generate AI Explanation"}
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '1.2rem', borderRadius: '8px' }}>
                                                            <h4 style={{ color: '#15803D', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem' }}>
                                                                <i className="fas fa-robot"></i> CareSync AI Prescription Analysis
                                                            </h4>
                                                            
                                                            <div style={{ marginBottom: '1rem' }}>
                                                                <strong style={{ color: '#1E293B', fontSize: '0.95rem' }}>Plain Summary</strong>
                                                                <p style={{ margin: '0.2rem 0 0', color: '#475569', fontSize: '0.9rem', lineHeight: '1.4' }}>{selectedPres.aiExplanation.plainSummary}</p>
                                                            </div>
                                                            
                                                            {selectedPres.aiExplanation.dosageInstructions?.length > 0 && (
                                                                <div style={{ marginBottom: '1rem' }}>
                                                                    <strong style={{ color: '#1E293B', fontSize: '0.95rem' }}>Dosage & Schedule</strong>
                                                                    <ul style={{ margin: '0.2rem 0 0', paddingLeft: '1.2rem', color: '#475569', fontSize: '0.9rem' }}>
                                                                        {selectedPres.aiExplanation.dosageInstructions.map((ins, index) => (
                                                                            <li key={index} style={{ marginBottom: '0.2rem' }}>{ins}</li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            )}
                                                            
                                                            {selectedPres.aiExplanation.cautionFlags?.length > 0 && (
                                                                <div style={{ marginBottom: '1rem' }}>
                                                                    <strong style={{ color: '#DC2626', fontSize: '0.95rem' }}><i className="fas fa-exclamation-triangle"></i> Cautions & Warnings</strong>
                                                                    <ul style={{ margin: '0.2rem 0 0', paddingLeft: '1.2rem', color: '#991B1B', fontSize: '0.9rem' }}>
                                                                        {selectedPres.aiExplanation.cautionFlags.map((flag, index) => (
                                                                            <li key={index} style={{ marginBottom: '0.2rem' }}>{flag}</li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            )}
                                                            
                                                            {selectedPres.aiExplanation.suggestedFollowUp && (
                                                                <div>
                                                                    <strong style={{ color: '#1E293B', fontSize: '0.95rem' }}>Suggested Follow-up</strong>
                                                                    <p style={{ margin: '0.2rem 0 0', color: '#475569', fontSize: '0.9rem' }}>{selectedPres.aiExplanation.suggestedFollowUp}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                {/* Doctor Clarification Thread */}
                                                <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '1.5rem' }}>
                                                    <h4 style={{ color: '#1E293B', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <i className="fas fa-user-md"></i> Request Doctor Clarification
                                                    </h4>
                                                    
                                                    {selectedPres.clarifications?.length > 0 && (
                                                        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '1rem', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                                                            {selectedPres.clarifications.map((cl, idx) => (
                                                                <div key={idx} style={{ padding: '8px', background: 'white', borderRadius: '4px', border: '1px solid #F1F5F9', fontSize: '0.85rem' }}>
                                                                    <div style={{ fontWeight: 'bold', color: '#0F766E', marginBottom: '2px' }}>{cl.senderRole} Query:</div>
                                                                    <div style={{ color: '#334155' }}>{cl.text}</div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    
                                                    <form onSubmit={handleSendClarifyRequest} style={{ display: 'flex', gap: '10px' }}>
                                                        <input 
                                                            type="text" 
                                                            placeholder="Ask your doctor a question about this prescription..." 
                                                            value={clarifyText}
                                                            onChange={(e) => setClarifyText(e.target.value)}
                                                            style={{ flex: 1, padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '4px', fontSize: '0.9rem' }}
                                                            required
                                                        />
                                                        <button type="submit" className="btn btn-primary" disabled={sendingClarify}>
                                                            {sendingClarify ? <i className="fas fa-spinner fa-spin"></i> : "Submit"}
                                                        </button>
                                                    </form>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    
                                </div>
                            )}
                        </section>
                    )}

                    {activeTab === 'history' && (
                        <section className="panel-section active">
                            <h2>Medical History</h2>
                            <div className="glass-card">
                                {myAppointments.length === 0 ? (
                                    <p>No prior medical visit records available yet.</p>
                                ) : (
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid #eee' }}>
                                                <th style={{ padding: '10px' }}>Doctor</th>
                                                <th>Hospital</th>
                                                <th>Date</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {myAppointments.map((appt) => (
                                                <tr key={appt._id}>
                                                    <td style={{ padding: '10px' }}>{appt.doctorId?.name || 'Unknown'}</td>
                                                    <td>{appt.hospitalId?.name || 'Unknown'}</td>
                                                    <td>{appt.date ? new Date(appt.date).toLocaleDateString() : '-'}</td>
                                                    <td>{appt.status}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </section>
                    )}

                    {activeTab === 'reports' && (
                        <section className="panel-section active">
                            <h2>Lab Reports</h2>
                            <div className="glass-card">
                                {myReports.length === 0 ? (
                                    <p>No lab reports available yet.</p>
                                ) : (
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid #eee' }}>
                                                <th style={{ padding: '10px' }}>Report</th>
                                                <th>Test Type</th>
                                                <th>Uploaded</th>
                                                <th>AI Summary</th>
                                                <th>File</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {myReports.map((report) => (
                                                <tr key={report._id}>
                                                    <td style={{ padding: '10px' }}>{report.originalFileName}</td>
                                                    <td>{report.testType || 'N/A'}</td>
                                                    <td>{new Date(report.createdAt).toLocaleString()}</td>
                                                    <td>{report.aiSummary?.plainSummary ? 'Available' : 'Not generated'}</td>
                                                    <td><a href={`http://localhost:5000${report.filePath}`} target="_blank" rel="noreferrer">Open</a></td>
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

            {/* Video Call Modal Overlay */}
            {videoCallActive && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.95)', zIndex: 10000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                    <div style={{ width: '90%', maxWidth: '900px', background: '#1E293B', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '1rem', background: '#0F172A', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155' }}>
                            <span style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <i className="fas fa-circle" style={{ color: '#EF4444', animation: 'pulse 1.5s infinite' }}></i> CareSync Telehealth consultation
                            </span>
                            <span>Doctor: {doctorsGlobal.find(d => d._id === selectedDoctorId)?.name || 'Consultant'}</span>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', padding: '1.5rem', background: '#0F172A', minHeight: '400px' }}>
                            {/* Remote Doctor Stream */}
                            <div style={{ position: 'relative', background: '#334155', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <i className="fas fa-user-md" style={{ fontSize: '4rem', color: '#94A3B8', marginBottom: '1rem' }}></i>
                                    <h4 style={{ margin: 0 }}>Dr. {doctorsGlobal.find(d => d._id === selectedDoctorId)?.name || 'Consultant'}</h4>
                                    <p style={{ color: '#38BDF8', margin: '0.2rem 0' }}>Consultation in Progress</p>
                                </div>
                                <div style={{ position: 'absolute', bottom: '10px', left: '10px', background: 'rgba(0,0,0,0.6)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem' }}>
                                    Remote Feed (1080p, 60fps)
                                </div>
                            </div>
                            
                            {/* Local Patient Stream */}
                            <div style={{ position: 'relative', background: '#334155', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                {localStream ? (
                                    <video ref={el => { if (el) el.srcObject = localStream; }} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ textAlign: 'center' }}>
                                        <i className="fas fa-user" style={{ fontSize: '4rem', color: '#94A3B8', marginBottom: '1rem' }}></i>
                                        <h4 style={{ margin: 0 }}>You (Patient)</h4>
                                        <p style={{ color: '#F87171', margin: '0.2rem 0' }}>Camera is Off</p>
                                    </div>
                                )}
                                <div style={{ position: 'absolute', bottom: '10px', left: '10px', background: 'rgba(0,0,0,0.6)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem' }}>
                                    Local Feed
                                </div>
                            </div>
                        </div>

                        <div style={{ padding: '1.5rem', background: '#0F172A', borderTop: '1px solid #334155', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                            <button onClick={() => {
                                if (localStream) {
                                    localStream.getTracks().forEach(track => track.stop());
                                    setLocalStream(null);
                                } else {
                                    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => setLocalStream(stream)).catch(() => alert("Camera not available."));
                                }
                            }} className="btn" style={{ background: localStream ? '#475569' : '#10B981', color: 'white', border: 'none', padding: '0.8rem 1.5rem' }}>
                                <i className={localStream ? "fas fa-video-slash" : "fas fa-video"}></i> {localStream ? "Turn Video Off" : "Turn Video On"}
                            </button>
                            <button onClick={endVideoCall} className="btn" style={{ background: '#EF4444', color: 'white', border: 'none', padding: '0.8rem 2rem', fontWeight: 'bold' }}>
                                <i className="fas fa-phone-slash"></i> End Consultation
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientDashboard;
