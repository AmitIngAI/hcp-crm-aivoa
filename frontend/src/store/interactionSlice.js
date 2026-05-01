import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API = 'http://localhost:8000';

export const sendChatMessage = createAsyncThunk(
  'interaction/sendChat',
  async ({ message, interaction_id }, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${API}/api/chat`, { message, interaction_id });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Chat failed. Check backend.');
    }
  }
);

export const saveInteraction = createAsyncThunk(
  'interaction/save',
  async (data, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${API}/api/interactions`, data);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Save failed.');
    }
  }
);

export const fetchInteractions = createAsyncThunk(
  'interaction/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API}/api/interactions`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Fetch failed.');
    }
  }
);

const initialForm = {
  hcp_name: '',
  interaction_type: 'Meeting',
  date: '',
  time: '',
  attendees: '',
  topics_discussed: '',
  materials_shared: '',
  sentiment: 'neutral',
  summary: '',
  follow_up: '',
};

const initialState = {
  form: { ...initialForm },
  materialsList: [],
  chatMessages: [
    {
      type: 'system',
      text:
        '👋 Hello! I am your AI Assistant.\n\n' +
        'I control the form on the left — you cannot fill it manually.\n\n' +
        '💡 Try:\n"Today I met Dr. Smith at Apollo Hospital. We discussed Product X efficacy. Sentiment was positive. I shared the product brochure and sample pack."',
      timestamp: new Date().toISOString(),
    },
  ],
  interactions: [],
  currentInteractionId: null,
  chatLoading: false,
  saveLoading: false,
  error: null,
  successMessage: null,
  toolUsed: null,
};

const interactionSlice = createSlice({
  name: 'interaction',
  initialState,

  reducers: {
    resetForm: (state) => {
      state.form = { ...initialForm };
      state.materialsList = [];
      state.currentInteractionId = null;
      state.successMessage = null;
      state.error = null;
    },
    clearStatus: (state) => {
      state.error = null;
      state.successMessage = null;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(sendChatMessage.pending, (state, action) => {
        state.chatLoading = true;
        state.error = null;
        state.chatMessages.push({
          type: 'user',
          text: action.meta.arg.message,
          timestamp: new Date().toISOString(),
        });
      })

      .addCase(sendChatMessage.fulfilled, (state, action) => {
        state.chatLoading = false;
        const { message, extracted_data, tool_used } = action.payload;
        state.toolUsed = tool_used;

        state.chatMessages.push({
          type: 'bot',
          text: message,
          tool_used,
          timestamp: new Date().toISOString(),
        });

        if (extracted_data && Object.keys(extracted_data).length > 0) {
          const formFields = [
            'hcp_name','interaction_type','date','time',
            'attendees','topics_discussed','materials_shared',
            'sentiment','summary','follow_up',
          ];

          if (tool_used === 'edit_interaction_tool') {
            // MERGE - only update changed fields
            formFields.forEach((field) => {
              if (
                extracted_data[field] !== undefined &&
                extracted_data[field] !== null &&
                extracted_data[field] !== ''
              ) {
                state.form[field] = extracted_data[field];
              }
            });
          } else {
            // FULL populate
            formFields.forEach((field) => {
              if (extracted_data[field] !== undefined && extracted_data[field] !== null) {
                state.form[field] = extracted_data[field];
              }
            });
          }

          // Materials chips
          if (extracted_data.materials_shared) {
            state.materialsList = extracted_data.materials_shared
              .split(',').map((m) => m.trim()).filter(Boolean);
          }
        }
      })

      .addCase(sendChatMessage.rejected, (state, action) => {
        state.chatLoading = false;
        state.chatMessages.push({
          type: 'bot',
          text: `❌ ${action.payload}`,
          timestamp: new Date().toISOString(),
        });
      });

    builder
      .addCase(saveInteraction.pending, (state) => { state.saveLoading = true; })
      .addCase(saveInteraction.fulfilled, (state, action) => {
        state.saveLoading = false;
        state.currentInteractionId = action.payload.id;
        state.successMessage = `✅ Saved! ID: ${action.payload.id}`;
        state.interactions.unshift(action.payload);
      })
      .addCase(saveInteraction.rejected, (state, action) => {
        state.saveLoading = false;
        state.error = action.payload;
      });
  },
});

export const { resetForm, clearStatus } = interactionSlice.actions;
export default interactionSlice.reducer;