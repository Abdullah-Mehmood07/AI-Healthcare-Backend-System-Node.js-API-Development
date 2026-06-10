import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:5000/api';

const Home = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [cityId, setCityId] = useState('');
  const [hospital, setHospital] = useState('');
  const [hospitalId, setHospitalId] = useState('');
  const [hospitalObj, setHospitalObj] = useState(null);
  const [hospitalConfirmed, setHospitalConfirmed] = useState(false);
  const [cities, setCities] = useState([]);
  const [hospitals, setHospitals] = useState([]);

  const defaultImages = ['/assets/image 2.jpg', '/assets/image 4.jpg', '/assets/image 5.jpg'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const cityRes = await fetch(`${API_URL}/cities`);
        const cityData = await cityRes.json();
        setCities(cityData && !cityData.message ? cityData : []);

        const hospRes = await fetch(`${API_URL}/hospitals`);
        const hospData = await hospRes.json();
        setHospitals(hospData && !hospData.message ? hospData.filter(h => h.status === 'Active') : []);
      } catch (error) {
        console.error("Failed to fetch initial data", error);
      }
    };
    fetchData();

    const timer = setInterval(() => {
      setCurrentSlide((prev) => {
        // Find how many images we are currently displaying
        const count = hospitalObj && hospitalObj.images && hospitalObj.images.length > 0 ? hospitalObj.images.length : defaultImages.length;
        return (prev + 1) % count;
      });
    }, 4000);
    return () => clearInterval(timer);
  }, [hospitalObj]); // Add hospitalObj to dependency array so slider length recalculates

  const handleCityChange = (e) => {
    setCityId(e.target.value);
    setHospital('');
    setHospitalId('');
    setHospitalObj(null);
  };

  const handleConfirmHospital = async () => {
    if (hospitalId) {
      setHospitalConfirmed(true);
      localStorage.setItem('selectedHospital', hospital);
      localStorage.setItem('selectedHospitalName', hospital);
      localStorage.setItem('selectedHospitalId', hospitalId);
    }
  };

  const displayImages = hospitalObj && hospitalObj.images && hospitalObj.images.length > 0 ? hospitalObj.images : defaultImages;

  return (
    <>
      {!hospitalConfirmed ? (
        <section id="welcome-section" className="hero-section">
          <div className="hero-container">
            <div className="hero-content">
              <h1>Welcome to CareSync AI</h1>
              <p>Your connected multi-hospital healthcare ecosystem. Please select your location to begin.</p>

              <div className="selection-container glass-card">
                <div className="form-group">
                  <label htmlFor="city-select" style={{ display: 'block', textAlign: 'left', marginBottom: '0.5rem', fontWeight: '600' }}>Select City</label>
                  <select id="city-select" value={cityId} onChange={handleCityChange}>
                    <option value="">-- Choose City --</option>
                    {cities.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="hospital-select" style={{ display: 'block', textAlign: 'left', marginBottom: '0.5rem', fontWeight: '600' }}>Select Hospital</label>
                  <select id="hospital-select" value={hospitalId} onChange={(e) => {
                    const id = e.target.value;
                    setHospitalId(id);
                    const hObj = hospitals.find(h => h._id === id);
                    setHospital(hObj ? hObj.name : '');
                    setHospitalObj(hObj || null);
                  }} disabled={!cityId}>
                    <option value="">-- First Select City --</option>
                    {hospitals
                      .filter(h => h.city && (h.city._id === cityId || h.city === cityId))
                      .map(h => (
                        <option key={h._id} value={h._id}>{h.name} {h.type && h.type !== 'General' ? `(${h.type})` : ''}</option>
                      ))}
                  </select>
                </div>

                <button id="btn-confirm-hospital" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} onClick={handleConfirmHospital} disabled={!hospitalId}>
                  Enter Hospital Portal <i className="fas fa-arrow-right"></i>
                </button>
              </div>
            </div>

            <div className="hero-image-gallery">
               <img src="/assets/image 3.jpg" alt="Main Healthcare" className="gallery-img main-img" />
               <img src="/assets/image 1.jpg" alt="Nurse" className="gallery-img sub-img-1" />
               <img src="/assets/image 6.jpg" alt="Medical Team" className="gallery-img sub-img-2" />
               <div className="experience-badge glass-card">
                 <i className="fas fa-heartbeat"></i>
                 <span>Premium Care</span>
               </div>
            </div>
          </div>
        </section>
      ) : (
        <>
          <section className="hospital-banner text-center" style={{ padding: '1rem 1rem' }}>
            <h2 className="hospital-name-display" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{hospital}</h2>
            {hospitalObj && hospitalObj.address && (
                <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', marginBottom: '1.5rem' }}>
                  <i className="fas fa-map-marker-alt"></i> {hospitalObj.address}
                </p>
            )}
            <div className="slider-container">
              {displayImages.map((src, index) => (
                <img
                  key={index}
                  src={src}
                  className={`slide ${index === currentSlide ? 'active' : ''}`}
                  alt="Hospital Slider"
                />
              ))}
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', color: 'white', fontSize: '1.5rem', textShadow: '0 2px 4px rgba(0,0,0,0.5)', zIndex: -1 }}>
                Welcome to CareSync AI
              </div>
            </div>

            <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '2rem auto' }}>
              Experience state-of-the-art healthcare services tailored to your needs.
              Book appointments, view reports, and consult with doctors instantly.
            </p>
          </section>

          <section id="services">
            <div className="text-center">
              <h2>Our Premium Services</h2>
              <div style={{ width: '60px', height: '4px', background: 'var(--primary-teal)', margin: '0.5rem auto' }}></div>
            </div>

            <div className="services-grid">
              <div className="glass-card service-card" onClick={() => navigate('/login')} style={{ cursor: 'pointer' }}>
                <div className="service-icon"><i className="fas fa-user-md"></i></div>
                <h3>Smart Doctor Schedule</h3>
                <p>View real-time doctor availability and duty matrix.</p>
              </div>

              <div className="glass-card service-card" onClick={() => navigate('/emergency-public')} style={{ cursor: 'pointer', border: '1px solid #FECACA' }}>
                <div className="service-icon"><i className="fas fa-ambulance" style={{ color: '#DC2626' }}></i></div>
                <h3>Free Emergency Response</h3>
                <p>Instant access to emergency numbers and doctors. No login required.</p>
              </div>

              <div className="glass-card service-card" onClick={() => navigate('/login')} style={{ cursor: 'pointer' }}>
                <div className="service-icon"><i className="fas fa-robot"></i></div>
                <h3>AI Health Assistant</h3>
                <p>Get smart recommendations for your symptoms.</p>
              </div>

              <div className="glass-card service-card" onClick={() => navigate('/login')} style={{ cursor: 'pointer' }}>
                <div className="service-icon"><i className="fas fa-flask"></i></div>
                <h3>Smart Lab Reports</h3>
                <p>Instant SMS/Email alerts for your test results.</p>
              </div>
            </div>
          </section>

          <section className="testimonials-section">
            <div className="text-center">
              <h2>Patient Stories</h2>
              <p style={{ color: 'var(--text-muted)' }}>What our community says about us.</p>
            </div>
            <div className="testimonial-grid">
              <div className="testimonial-card">
                <p>"The AI Doctor Recommender saved me so much time. I was directed to Dr. Fatima immediately and got treated within an hour!"</p>
                <div className="testimonial-author"><i className="fas fa-user-circle"></i> Mrs. Zoya Khan</div>
              </div>
              <div className="testimonial-card">
                <p>"Booking an appointment for my father was seamless. The queue tracker let us arrive just in time."</p>
                <div className="testimonial-author"><i className="fas fa-user-circle"></i> Mr. Ali Raza</div>
              </div>
              <div className="testimonial-card">
                <p>"Clean interface and very easy to check lab reports online. Highly recommended!"</p>
                <div className="testimonial-author"><i className="fas fa-user-circle"></i> Ms. Hina Shah</div>
              </div>
            </div>
          </section>
        </>
      )}
    </>
  );
};

export default Home;
