import React, { useState, useRef, useEffect } from 'react';

const FloatingAI = () => {
    const API_BASE = 'http://localhost:5000/api';
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [messages, setMessages] = useState([
        { sender: 'ai', text: 'Hi there! I am your CareSync AI Assistant. How can I help you today?' }
    ]);
    const [isTyping, setIsTyping] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef(null);

    const openModal = () => setIsModalOpen(true);
    const closeModal = () => {
        setIsModalOpen(false);
        // Reset chat on close for demo purposes
        setTimeout(() => {
            setMessages([{ sender: 'ai', text: 'Hi there! I am your CareSync AI Assistant. How can I help you today?' }]);
        }, 300);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const callConversationApi = async (history) => {
        const token = localStorage.getItem('caresync_user_token');
        if (!token) {
            return {
                ok: false,
                message: 'Please login first to use the CareSync AI.'
            };
        }

        // Ideally, we fetch the user's hospitalId. For now, we'll try to extract it from a local variable if it exists, or pass null and let the backend handle it.
        const userStr = localStorage.getItem('caresync_user');
        let hospitalId = null;
        if (userStr) {
            try {
                const userObj = JSON.parse(userStr);
                hospitalId = userObj.hospitalId || null;
            } catch (e) {}
        }

        try {
            const res = await fetch(`${API_BASE}/ai/conversation`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    history: history,
                    hospitalId: hospitalId
                })
            });

            const data = await res.json();
            if (!res.ok) {
                return { ok: false, message: data.message || 'AI conversation failed.' };
            }

            return { ok: true, data };
        } catch (error) {
            return { ok: false, message: 'Failed to connect to AI service. Please try again.' };
        }
    };



    const handleOptionClick = (optionText, responseText) => {
        const newHistory = [...messages, { sender: 'user', text: optionText }];
        setMessages(newHistory);
        setIsTyping(true);
        
        setTimeout(() => {
            setMessages(prev => [...prev, { sender: 'ai', text: responseText }]);
            setIsTyping(false);
        }, 600);
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        const symptomsText = inputValue;
        const newHistory = [...messages, { sender: 'user', text: symptomsText }];
        setMessages(newHistory);
        setInputValue('');
        setIsTyping(true);

        const conversation = await callConversationApi(newHistory);
        setIsTyping(false);

        if (!conversation.ok) {
            setMessages(prev => [...prev, {
                sender: 'ai',
                text: conversation.message
            }]);
            return;
        }

        setMessages(prev => [...prev, {
            sender: 'ai',
            text: conversation.data.reply
        }]);
    };

    return (
        <>
            {/* Floating AI Button */}
            <div className="floating-ai" onClick={openModal}>
                <i className="fas fa-robot" style={{ fontSize: '24px' }}></i>
            </div>

            {/* AI Modal Chat Interface */}
            {isModalOpen && (
                <div className="modal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="modal-content" style={{ display: 'flex', flexDirection: 'column', height: '80vh', maxHeight: '600px', margin: '0', width: '90%', maxWidth: '400px' }}>
                        <div className="modal-header" style={{ flexShrink: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <i className="fas fa-robot" style={{ fontSize: '20px' }}></i>
                                <h3 style={{ margin: 0, color: 'white' }}>CareSync AI</h3>
                            </div>
                            <span className="close" onClick={closeModal} style={{ fontSize: '24px', lineHeight: '20px' }}>&times;</span>
                        </div>
                        
                        <div className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: '15px', display: 'flex', flexDirection: 'column', gap: '15px', background: '#f8fafc' }}>
                            {messages.map((msg, idx) => (
                                <div key={idx} style={{ 
                                    alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                                    background: msg.sender === 'user' ? 'var(--primary-teal)' : 'white',
                                    color: msg.sender === 'user' ? 'white' : 'var(--text-main)',
                                    padding: '10px 15px',
                                    borderRadius: msg.sender === 'user' ? '15px 15px 0 15px' : '15px 15px 15px 0',
                                    boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                                    maxWidth: '85%',
                                    fontSize: '0.95rem'
                                }}>
                                    {msg.text}
                                </div>
                            ))}
                            
                            {isTyping && (
                                <div style={{ 
                                    alignSelf: 'flex-start',
                                    background: 'white',
                                    padding: '10px 15px',
                                    borderRadius: '15px 15px 15px 0',
                                    boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                                    display: 'flex',
                                    gap: '4px'
                                }}>
                                    <span style={{ animation: 'fadeEffect 1s infinite', color: 'var(--primary-teal)' }}>●</span>
                                    <span style={{ animation: 'fadeEffect 1s infinite 0.2s', color: 'var(--primary-teal)' }}>●</span>
                                    <span style={{ animation: 'fadeEffect 1s infinite 0.4s', color: 'var(--primary-teal)' }}>●</span>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {messages.length === 1 && !isTyping && (
                            <div style={{ padding: '10px', background: 'white', borderTop: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <p style={{ margin: '0 0 5px 5px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>Suggested queries:</p>
                                <button className="btn btn-outline" style={{ fontSize: '0.85rem', padding: '8px', justifyContent: 'flex-start' }} 
                                    onClick={() => handleOptionClick('Symptom Checker', 'Please type your symptoms in one message (for example: fever, cough, shortness of breath). I will recommend the most relevant specialist.')}>
                                    <i className="fas fa-stethoscope"></i> Symptom Checker
                                </button>
                                <button className="btn btn-outline" style={{ fontSize: '0.85rem', padding: '8px', justifyContent: 'flex-start' }}
                                    onClick={() => handleOptionClick('Recommend a Doctor', 'Share your current symptoms and I will suggest which specialist you should consult first.')}>
                                    <i className="fas fa-user-md"></i> Recommend a Doctor
                                </button>
                                <button className="btn btn-outline" style={{ fontSize: '0.85rem', padding: '8px', justifyContent: 'flex-start' }}
                                    onClick={() => handleOptionClick('Health Insights & Reports', 'For lab insights, upload a report in the lab portal and use the AI summary endpoint from your dashboard.')}>
                                    <i className="fas fa-flask"></i> Health Insights & Reports
                                </button>
                            </div>
                        )}

                        <form onSubmit={handleSendMessage} style={{ display: 'flex', padding: '10px', background: 'white', borderTop: '1px solid #e2e8f0', gap: '10px' }}>
                            <input 
                                type="text" 
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="Type a message..."
                                style={{ flex: 1, padding: '10px', borderRadius: '20px', border: '1px solid #cbd5e1', outline: 'none' }}
                            />
                            <button type="submit" className="btn btn-primary" style={{ borderRadius: '50%', width: '40px', height: '40px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <i className="fas fa-paper-plane"></i>
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default FloatingAI;
