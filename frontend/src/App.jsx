import { useState } from 'react';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { store } from './store/store';
import LogForm from './components/LogForm';
import ChatPanel from './components/ChatPanel';
import { fetchInteractions } from './store/interactionSlice';
import axios from 'axios';

const API = 'http://localhost:8000';

function AppContent() {
  const dispatch = useDispatch();
  const { interactions, successMessage } = useSelector((s) => s.interaction);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [allInteractions, setAllInteractions] = useState([]);

  const handleShowHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await axios.get(`${API}/api/interactions`);
      setAllInteractions(res.data);
    } catch (e) {
      console.error(e);
    }
    setLoadingHistory(false);
    setShowHistory(true);
  };

  const getSentimentStyle = (s) => {
    const map = {
      positive: { bg: '#d1fae5', color: '#065f46', emoji: '😊' },
      negative: { bg: '#fee2e2', color: '#991b1b', emoji: '😞' },
      neutral:  { bg: '#f3f4f6', color: '#374151', emoji: '😐' },
    };
    return map[s] || map.neutral;
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100vh', width: '100vw', overflow: 'hidden',
      fontFamily: 'Inter, sans-serif',
    }}>

      {/* ── Top Bar ── */}
      <div style={{
        height: '48px', backgroundColor: '#1e3a5f',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px', flexShrink: 0,
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '7px',
            background: 'linear-gradient(135deg,#2563eb,#7c3aed)',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '14px',
          }}>🏥</div>
          <span style={{ color: 'white', fontWeight: '700', fontSize: '15px' }}>
            HCP CRM
          </span>
          <span style={{
            fontSize: '10px', padding: '2px 8px',
            backgroundColor: 'rgba(255,255,255,0.15)',
            color: '#93c5fd', borderRadius: '10px', fontWeight: '500',
          }}>
            AI-First
          </span>
        </div>

        {/* Right side buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Saved count badge */}
          {interactions.length > 0 && (
            <span style={{
              fontSize: '11px', padding: '3px 10px',
              backgroundColor: 'rgba(16,185,129,0.2)',
              color: '#6ee7b7', borderRadius: '10px', fontWeight: '500',
            }}>
              ✅ {interactions.length} saved this session
            </span>
          )}

          {/* View History Button */}
          <button
            onClick={handleShowHistory}
            style={{
              padding: '6px 16px', fontSize: '13px', fontWeight: '600',
              color: 'white', backgroundColor: '#2563eb',
              border: 'none', borderRadius: '6px', cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}
          >
            📋 View Saved Interactions
          </button>
        </div>
      </div>

      {/* ── Main Split Screen ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <LogForm />
        <ChatPanel />
      </div>

      {/* ── History Modal ── */}
      {showHistory && (
        <div style={{
          position: 'fixed', inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 1000, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          padding: '20px',
        }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowHistory(false); }}
        >
          <div style={{
            backgroundColor: 'white', borderRadius: '14px',
            width: '100%', maxWidth: '800px',
            maxHeight: '85vh', display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px 16px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', flexShrink: 0,
            }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', margin: 0 }}>
                  📋 Saved Interactions
                </h2>
                <p style={{ fontSize: '12px', color: '#6b7280', margin: '3px 0 0' }}>
                  {allInteractions.length} total interactions in database
                </p>
              </div>
              <button
                onClick={() => setShowHistory(false)}
                style={{
                  width: '32px', height: '32px', borderRadius: '8px',
                  border: '1px solid #e5e7eb', backgroundColor: '#f9fafb',
                  cursor: 'pointer', fontSize: '16px', color: '#6b7280',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >×</button>
            </div>

            {/* Modal Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
              {loadingHistory ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                  ⏳ Loading...
                </div>
              ) : allInteractions.length === 0 ? (
                <div style={{
                  textAlign: 'center', padding: '50px 20px',
                  color: '#6b7280',
                }}>
                  <div style={{ fontSize: '40px', marginBottom: '12px' }}>📭</div>
                  <p style={{ fontSize: '15px', fontWeight: '500' }}>No interactions saved yet</p>
                  <p style={{ fontSize: '13px', marginTop: '4px' }}>
                    Use AI chat to log your first interaction!
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {allInteractions.map((item) => {
                    const ss = getSentimentStyle(item.sentiment);
                    return (
                      <div key={item.id} style={{
                        border: '1px solid #e5e7eb', borderRadius: '10px',
                        padding: '16px 18px', backgroundColor: '#fafafa',
                        transition: 'box-shadow 0.2s',
                      }}
                        onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)'}
                        onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
                      >
                        {/* Card Header */}
                        <div style={{
                          display: 'flex', justifyContent: 'space-between',
                          alignItems: 'flex-start', marginBottom: '10px',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {/* Avatar */}
                            <div style={{
                              width: '38px', height: '38px', borderRadius: '50%',
                              background: 'linear-gradient(135deg,#2563eb,#7c3aed)',
                              display: 'flex', alignItems: 'center',
                              justifyContent: 'center', color: 'white',
                              fontSize: '16px', fontWeight: '700', flexShrink: 0,
                            }}>
                              {item.hcp_name ? item.hcp_name.charAt(item.hcp_name.indexOf(' ') + 1) || item.hcp_name.charAt(0) : '?'}
                            </div>
                            <div>
                              <div style={{ fontWeight: '700', fontSize: '15px', color: '#111827' }}>
                                {item.hcp_name || 'Unknown HCP'}
                              </div>
                              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                ID #{item.id} • {item.interaction_type} • {item.date || 'Date N/A'}
                              </div>
                            </div>
                          </div>

                          {/* Sentiment Badge */}
                          <span style={{
                            padding: '4px 12px', borderRadius: '20px',
                            fontSize: '12px', fontWeight: '600',
                            backgroundColor: ss.bg, color: ss.color,
                          }}>
                            {ss.emoji} {item.sentiment}
                          </span>
                        </div>

                        {/* Card Details */}
                        <div style={{
                          display: 'grid', gridTemplateColumns: '1fr 1fr',
                          gap: '8px',
                        }}>
                          {item.topics_discussed && (
                            <div style={{ gridColumn: '1 / -1' }}>
                              <span style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Topics
                              </span>
                              <p style={{ fontSize: '13px', color: '#374151', margin: '2px 0 0', lineHeight: '1.4' }}>
                                {item.topics_discussed.length > 120
                                  ? item.topics_discussed.slice(0, 120) + '...'
                                  : item.topics_discussed}
                              </p>
                            </div>
                          )}

                          {item.materials_shared && (
                            <div>
                              <span style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Materials
                              </span>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '3px' }}>
                                {item.materials_shared.split(',').map((m, i) => (
                                  <span key={i} style={{
                                    padding: '2px 9px', backgroundColor: '#dbeafe',
                                    color: '#1d4ed8', borderRadius: '10px',
                                    fontSize: '11px', fontWeight: '500',
                                  }}>
                                    📄 {m.trim()}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {item.attendees && (
                            <div>
                              <span style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Attendees
                              </span>
                              <p style={{ fontSize: '13px', color: '#374151', margin: '2px 0 0' }}>
                                {item.attendees}
                              </p>
                            </div>
                          )}

                          {item.summary && (
                            <div style={{ gridColumn: '1 / -1' }}>
                              <span style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Summary
                              </span>
                              <p style={{ fontSize: '13px', color: '#374151', margin: '2px 0 0', lineHeight: '1.4' }}>
                                {item.summary}
                              </p>
                            </div>
                          )}

                          {item.follow_up && (
                            <div style={{ gridColumn: '1 / -1' }}>
                              <span style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Follow-up
                              </span>
                              <p style={{ fontSize: '13px', color: '#374151', margin: '2px 0 0', lineHeight: '1.4' }}>
                                {item.follow_up}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Card Footer */}
                        <div style={{
                          marginTop: '10px', paddingTop: '10px',
                          borderTop: '1px solid #f3f4f6',
                          display: 'flex', justifyContent: 'space-between',
                          alignItems: 'center',
                        }}>
                          <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                            🕒 Saved: {item.created_at
                              ? new Date(item.created_at).toLocaleString()
                              : 'N/A'}
                          </span>
                          <span style={{
                            fontSize: '11px', padding: '2px 8px',
                            backgroundColor: '#f0fdf4', color: '#16a34a',
                            borderRadius: '8px', fontWeight: '500',
                          }}>
                            ✅ Saved to DB
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '14px 24px', borderTop: '1px solid #e5e7eb',
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', flexShrink: 0,
              backgroundColor: '#f9fafb', borderRadius: '0 0 14px 14px',
            }}>
              <span style={{ fontSize: '12px', color: '#6b7280' }}>
                💡 Use AI chat to log, edit, search interactions
              </span>
              <button
                onClick={() => setShowHistory(false)}
                style={{
                  padding: '8px 20px', fontSize: '13px', fontWeight: '600',
                  color: '#374151', backgroundColor: 'white',
                  border: '1px solid #d1d5db', borderRadius: '6px',
                  cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

export default App;