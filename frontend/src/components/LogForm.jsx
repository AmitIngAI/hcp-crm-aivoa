import { useDispatch, useSelector } from 'react-redux';
import { resetForm, clearStatus, saveInteraction } from '../store/interactionSlice';

const C = {
  primary: '#2563eb',
  primaryLight: '#dbeafe',
  border: '#dee2e6',
  bg: '#ffffff',
  bgMuted: '#f8f9fa',
  bgAI: '#eff6ff',
  text: '#111827',
  muted: '#6b7280',
  success: '#059669',
  successBg: '#d1fae5',
  error: '#dc2626',
  errorBg: '#fee2e2',
};

const AIBadge = () => (
  <span style={{
    fontSize: '10px', padding: '1px 7px',
    backgroundColor: C.primaryLight, color: C.primary,
    borderRadius: '10px', fontWeight: '600', marginLeft: '8px',
  }}>
    ✨ AI
  </span>
);

const ReadField = ({ value, placeholder, multiline = false, highlight }) => {
  const filled = !!value;
  const style = {
    width: '100%',
    padding: '9px 13px',
    fontSize: '13.5px',
    fontFamily: 'Inter, sans-serif',
    color: filled ? '#1e40af' : '#9ca3af',
    backgroundColor: filled ? (highlight || C.bgAI) : '#fafafa',
    border: `1px solid ${filled ? '#93c5fd' : C.border}`,
    borderRadius: '6px',
    fontWeight: filled ? '500' : '400',
    lineHeight: '1.5',
    resize: 'none',
    outline: 'none',
    cursor: 'default',
    transition: 'all 0.3s',
  };

  return multiline ? (
    <textarea readOnly value={value} placeholder={placeholder} rows={3} style={style} />
  ) : (
    <input readOnly type="text" value={value} placeholder={placeholder} style={style} />
  );
};

const Label = ({ children, show }) => (
  <label style={{
    display: 'block', fontSize: '12.5px',
    fontWeight: '500', color: C.muted, marginBottom: '5px',
  }}>
    {children}
    {show && <AIBadge />}
  </label>
);

const sentimentStyle = (s) => {
  const map = {
    positive: { bg: '#d1fae5', color: '#065f46', border: '#6ee7b7', emoji: '😊' },
    negative: { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5', emoji: '😞' },
    neutral:  { bg: '#f3f4f6', color: '#374151', border: '#d1d5db', emoji: '😐' },
  };
  return map[s] || map.neutral;
};

const LogForm = () => {
  const dispatch = useDispatch();
  const { form, materialsList, saveLoading, successMessage, error } =
    useSelector((s) => s.interaction);

  const ss = sentimentStyle(form.sentiment);

  return (
    <div style={{
      width: '60%', backgroundColor: C.bg,
      borderRight: `1px solid ${C.border}`,
      display: 'flex', flexDirection: 'column',
      height: '100%', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '18px 26px 14px',
        borderBottom: `1px solid ${C.border}`,
        background: 'linear-gradient(135deg,#fff 0%,#eff6ff 100%)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '10px', height: '10px', borderRadius: '50%',
            backgroundColor: form.hcp_name ? '#10b981' : '#d1d5db',
            transition: 'background 0.4s',
          }} />
          <h1 style={{ fontSize: '19px', fontWeight: '700', color: C.text, margin: 0 }}>
            Log HCP Interaction
          </h1>
        </div>
        <p style={{ fontSize: '12px', color: C.muted, marginTop: '3px', paddingLeft: '20px' }}>
          {form.hcp_name
            ? '✅ Form auto-filled by AI — review and save'
            : '👉 Use the AI Assistant on the right to fill this form'}
        </p>

        {successMessage && (
          <div style={{
            marginTop: '10px', padding: '9px 13px',
            backgroundColor: C.successBg, border: '1px solid #6ee7b7',
            borderRadius: '6px', fontSize: '13px', color: C.success,
            display: 'flex', justifyContent: 'space-between',
          }}>
            <span>{successMessage}</span>
            <button onClick={() => dispatch(clearStatus())}
              style={{ background:'none',border:'none',cursor:'pointer',color:C.success,fontSize:'16px' }}>
              ×
            </button>
          </div>
        )}
        {error && (
          <div style={{
            marginTop: '10px', padding: '9px 13px',
            backgroundColor: C.errorBg, border: '1px solid #fca5a5',
            borderRadius: '6px', fontSize: '13px', color: C.error,
          }}>
            {error}
          </div>
        )}
      </div>

      {/* Empty State Banner */}
      {!form.hcp_name && (
        <div style={{
          margin: '16px 26px 0',
          padding: '18px 20px',
          backgroundColor: '#eff6ff',
          border: '2px dashed #93c5fd',
          borderRadius: '10px',
          textAlign: 'center',
          flexShrink: 0,
        }}>
          <div style={{ fontSize: '28px', marginBottom: '6px' }}>🤖</div>
          <p style={{ color: '#1d4ed8', fontSize: '13.5px', fontWeight: '600', margin: '0 0 2px' }}>
            Waiting for AI input...
          </p>
          <p style={{ color: '#3b82f6', fontSize: '12px', margin: 0 }}>
            Describe your HCP meeting in the chat →
          </p>
        </div>
      )}

      {/* Form Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 26px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

          {/* HCP Name */}
          <div style={{ gridColumn: '1 / -1' }}>
            <Label show={!!form.hcp_name}>HCP Name</Label>
            <ReadField value={form.hcp_name} placeholder="Will be auto-filled by AI..." />
          </div>

          {/* Interaction Type */}
          <div>
            <Label show={!!form.interaction_type}>Interaction Type</Label>
            <div style={{
              padding: '9px 13px', fontSize: '13.5px', fontWeight: '500',
              backgroundColor: form.interaction_type ? C.bgAI : '#fafafa',
              color: form.interaction_type ? '#1e40af' : '#9ca3af',
              border: `1px solid ${form.interaction_type ? '#93c5fd' : C.border}`,
              borderRadius: '6px',
            }}>
              {form.interaction_type || 'Will be auto-filled...'}
            </div>
          </div>

          {/* Sentiment */}
          <div>
            <Label show={!!form.sentiment}>Sentiment</Label>
            <div style={{
              padding: '9px 13px', fontSize: '13.5px', fontWeight: '600',
              backgroundColor: ss.bg, color: ss.color,
              border: `1px solid ${ss.border}`, borderRadius: '6px',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              {ss.emoji} {form.sentiment.charAt(0).toUpperCase() + form.sentiment.slice(1)}
            </div>
          </div>

          {/* Date */}
          <div>
            <Label show={!!form.date}>Date</Label>
            <ReadField value={form.date} placeholder="Auto-filled by AI..." />
          </div>

          {/* Time */}
          <div>
            <Label show={!!form.time}>Time</Label>
            <ReadField value={form.time} placeholder="Auto-filled by AI..." />
          </div>

          {/* Attendees */}
          <div style={{ gridColumn: '1 / -1' }}>
            <Label show={!!form.attendees}>Attendees</Label>
            <ReadField value={form.attendees} placeholder="Auto-filled by AI..." />
          </div>

          {/* Topics */}
          <div style={{ gridColumn: '1 / -1' }}>
            <Label show={!!form.topics_discussed}>Topics Discussed</Label>
            <ReadField
              value={form.topics_discussed}
              placeholder="Auto-filled by AI..."
              multiline
            />
          </div>

          {/* Materials - Chips */}
          <div style={{ gridColumn: '1 / -1' }}>
            <Label show={materialsList.length > 0}>Materials Shared</Label>
            <div style={{
              border: `1px solid ${materialsList.length > 0 ? '#93c5fd' : C.border}`,
              borderRadius: '6px', padding: '8px 12px', minHeight: '44px',
              backgroundColor: materialsList.length > 0 ? C.bgAI : '#fafafa',
              display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center',
            }}>
              {materialsList.length > 0 ? (
                materialsList.map((mat, i) => (
                  <span key={i} style={{
                    padding: '3px 11px', backgroundColor: C.primaryLight,
                    color: C.primary, borderRadius: '20px',
                    fontSize: '12px', fontWeight: '600',
                  }}>
                    📄 {mat}
                  </span>
                ))
              ) : (
                <span style={{ fontSize: '13px', color: '#9ca3af' }}>
                  Auto-filled by AI...
                </span>
              )}
            </div>
          </div>

          {/* Summary - only show if filled */}
          {form.summary && (
            <div style={{ gridColumn: '1 / -1' }}>
              <Label show>AI Summary</Label>
              <ReadField
                value={form.summary}
                placeholder=""
                multiline
                highlight="#fffbeb"
              />
            </div>
          )}

          {/* Follow up - only show if filled */}
          {form.follow_up && (
            <div style={{ gridColumn: '1 / -1' }}>
              <Label show>Follow-up Actions</Label>
              <ReadField
                value={form.follow_up}
                placeholder=""
                multiline
                highlight="#f0fdf4"
              />
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: '13px 26px', borderTop: `1px solid ${C.border}`,
        display: 'flex', gap: '10px', flexShrink: 0, backgroundColor: C.bgMuted,
      }}>
        <button
          onClick={() => dispatch(saveInteraction(form))}
          disabled={saveLoading || !form.hcp_name}
          style={{
            flex: 1, padding: '11px', fontSize: '14px', fontWeight: '600',
            fontFamily: 'Inter, sans-serif', color: 'white',
            backgroundColor: saveLoading || !form.hcp_name ? '#93c5fd' : C.primary,
            border: 'none', borderRadius: '6px',
            cursor: saveLoading || !form.hcp_name ? 'not-allowed' : 'pointer',
          }}
        >
          {saveLoading ? '⏳ Saving...' : '💾 Save Interaction'}
        </button>
        <button
          onClick={() => dispatch(resetForm())}
          style={{
            padding: '11px 20px', fontSize: '14px', fontWeight: '500',
            fontFamily: 'Inter, sans-serif', color: C.muted,
            backgroundColor: C.bg, border: `1px solid ${C.border}`,
            borderRadius: '6px', cursor: 'pointer',
          }}
        >
          🔄 Reset
        </button>
      </div>
    </div>
  );
};

export default LogForm;
