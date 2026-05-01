import { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { sendChatMessage } from '../store/interactionSlice';

const C = {
  primary: '#2563eb',
  primaryLight: '#dbeafe',
  border: '#dee2e6',
  bg: '#f0f4f8',
  text: '#111827',
  muted: '#6b7280',
};

const TOOL_INFO = {
  log_interaction_tool:      { label: '📝 Log Interaction',   color: '#dbeafe', text: '#1d4ed8' },
  edit_interaction_tool:     { label: '✏️ Edit Interaction',  color: '#fef3c7', text: '#92400e' },
  summarize_interaction_tool:{ label: '📋 Summarize',         color: '#f0fdf4', text: '#065f46' },
  suggest_followup_tool:     { label: '📅 Follow-up',         color: '#fdf4ff', text: '#7e22ce' },
  search_interactions_tool:  { label: '🔍 Search',            color: '#fff7ed', text: '#9a3412' },
};

const QUICK = [
  "Today I met Dr. Priya Patel at Fortis Hospital. We discussed Neurovit efficacy data. Sentiment was positive. I shared the product brochure and sample pack.",
  "Sorry, the name was actually Dr. John Smith and the sentiment was negative",
  "Summarize this interaction",
  "What should be my follow-up steps?",
  "Show me all logged interactions",
];

const Bubble = ({ msg }) => {
  if (msg.type === 'system') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
        <div style={{
          maxWidth: '96%', padding: '14px 16px',
          backgroundColor: '#dbeafe', borderRadius: '10px',
          fontSize: '13px', color: '#1e40af', lineHeight: '1.6',
          whiteSpace: 'pre-wrap', textAlign: 'left',
        }}>
          {msg.text}
        </div>
      </div>
    );
  }

  if (msg.type === 'user') {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
        <div style={{
          maxWidth: '82%', padding: '11px 14px',
          backgroundColor: '#ffffff',
          borderLeft: '3px solid #2563eb',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
          fontSize: '13.5px', color: '#111827', lineHeight: '1.5',
          whiteSpace: 'pre-wrap',
        }}>
          {msg.text}
        </div>
      </div>
    );
  }

  if (msg.type === 'bot') {
    const tool = TOOL_INFO[msg.tool_used] || null;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginBottom: '14px', gap: '4px' }}>
        {tool && (
          <span style={{
            fontSize: '10.5px', padding: '2px 9px',
            backgroundColor: tool.color, color: tool.text,
            borderRadius: '10px', fontWeight: '600',
          }}>
            {tool.label}
          </span>
        )}
        <div style={{
          maxWidth: '88%', padding: '11px 14px',
          backgroundColor: '#d1fae5', borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
          fontSize: '13.5px', color: '#064e3b', lineHeight: '1.6',
          whiteSpace: 'pre-wrap',
        }}>
          {msg.text}
        </div>
        <span style={{ fontSize: '10px', color: '#9ca3af', paddingLeft: '2px' }}>
          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    );
  }
  return null;
};

const ChatPanel = () => {
  const dispatch = useDispatch();
  const { chatMessages, chatLoading, currentInteractionId } =
    useSelector((s) => s.interaction);

  const [input, setInput] = useState('');
  const [showQuick, setShowQuick] = useState(false);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatLoading]);

  const send = () => {
    if (!input.trim() || chatLoading) return;
    dispatch(sendChatMessage({ message: input.trim(), interaction_id: currentInteractionId }));
    setInput('');
    setShowQuick(false);
  };

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div style={{
      width: '40%', backgroundColor: C.bg,
      display: 'flex', flexDirection: 'column',
      height: '100%', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '18px 22px 14px', borderBottom: `1px solid ${C.border}`,
        backgroundColor: '#ffffff', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '38px', height: '38px', borderRadius: '10px',
            background: 'linear-gradient(135deg,#2563eb,#7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px',
          }}>🤖</div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: C.text, margin: 0 }}>
              AI Assistant
            </h2>
            <p style={{ fontSize: '11.5px', color: C.muted, margin: 0 }}>
              Log Interaction details here via chat
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#10b981' }} />
            <span style={{ fontSize: '11px', color: '#10b981', fontWeight: '500' }}>Online</span>
          </div>
        </div>

        {/* Tool Pills */}
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '10px' }}>
          {Object.values(TOOL_INFO).map((t, i) => (
            <span key={i} style={{
              fontSize: '10px', padding: '2px 8px',
              backgroundColor: t.color, color: t.text,
              borderRadius: '10px', fontWeight: '500',
            }}>
              {t.label}
            </span>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px' }}>
        {chatMessages.map((msg, i) => <Bubble key={i} msg={msg} />)}

        {chatLoading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '12px' }}>
            <div style={{
              padding: '11px 16px', backgroundColor: '#d1fae5',
              borderRadius: '8px', fontSize: '13px', color: '#065f46',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <span>
                {[0,1,2].map(i => (
                  <span key={i} style={{
                    display: 'inline-block',
                    width: '6px', height: '6px', borderRadius: '50%',
                    backgroundColor: '#10b981', margin: '0 2px',
                    animation: `bounce 1.2s ease-in-out ${i*0.2}s infinite`,
                  }} />
                ))}
              </span>
              AI is thinking...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick Prompts */}
      {showQuick && (
        <div style={{
          padding: '10px 18px', borderTop: `1px solid ${C.border}`,
          backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column', gap: '5px',
        }}>
          <p style={{ fontSize: '10.5px', fontWeight: '600', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Quick Prompts
          </p>
          {QUICK.map((q, i) => (
            <button key={i} onClick={() => { setInput(q); setShowQuick(false); textareaRef.current?.focus(); }}
              style={{
                textAlign: 'left', padding: '7px 11px', fontSize: '12px',
                color: C.text, backgroundColor: C.bg,
                border: `1px solid ${C.border}`, borderRadius: '6px',
                cursor: 'pointer', fontFamily: 'Inter, sans-serif',
              }}
            >
              {q.length > 70 ? q.slice(0, 70) + '...' : q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{
        padding: '13px 18px', borderTop: `1px solid ${C.border}`,
        backgroundColor: '#ffffff', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
          <button
            onClick={() => setShowQuick(!showQuick)}
            style={{
              padding: '9px', fontSize: '15px',
              backgroundColor: showQuick ? C.primaryLight : C.bg,
              border: `1px solid ${showQuick ? C.primary : C.border}`,
              borderRadius: '6px', cursor: 'pointer', flexShrink: 0,
            }}
            title="Quick Prompts"
          >💡</button>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            placeholder="Describe your HCP interaction..."
            rows={2}
            style={{
              flex: 1, padding: '9px 13px', fontSize: '13.5px',
              fontFamily: 'Inter, sans-serif', color: C.text,
              backgroundColor: C.bg, border: `1px solid ${C.border}`,
              borderRadius: '6px', outline: 'none', resize: 'none', lineHeight: '1.5',
            }}
            onFocus={(e) => e.target.style.borderColor = C.primary}
            onBlur={(e) => e.target.style.borderColor = C.border}
          />

          <button
            onClick={send}
            disabled={chatLoading || !input.trim()}
            style={{
              padding: '9px 18px', fontSize: '14px', fontWeight: '600',
              fontFamily: 'Inter, sans-serif', color: 'white',
              backgroundColor: chatLoading || !input.trim() ? '#93c5fd' : C.primary,
              border: 'none', borderRadius: '6px',
              cursor: chatLoading || !input.trim() ? 'not-allowed' : 'pointer',
              flexShrink: 0, alignSelf: 'flex-end',
            }}
          >
            Log
          </button>
        </div>
        <p style={{ fontSize: '10.5px', color: C.muted, marginTop: '5px' }}>
          Enter to send • Shift+Enter for new line
        </p>
      </div>

      <style>{`
        @keyframes bounce {
          0%,80%,100%{transform:scale(0.6);opacity:0.5}
          40%{transform:scale(1);opacity:1}
        }
      `}</style>
    </div>
  );
};

export default ChatPanel;
