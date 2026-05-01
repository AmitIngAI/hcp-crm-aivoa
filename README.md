# HCP CRM — AI-First Log Interaction Screen

## 🎯 Project Overview
AI-native CRM system for pharmaceutical field representatives to log
Healthcare Professional (HCP) interactions via structured form OR
conversational AI chat interface.

## 🏗️ Tech Stack
- **Frontend:** React + Vite + Redux Toolkit (Google Inter font)
- **Backend:** Python FastAPI
- **AI Agent:** LangGraph + Groq API (llama-3.3-70b-versatile)
- **Database:** PostgreSQL + SQLAlchemy ORM

## 🤖 LangGraph Agent - 5 Tools

### Tool 1: log_interaction_tool (Mandatory)
- User types natural language description of HCP meeting
- LLM extracts: hcp_name, date, sentiment, topics, materials
- Auto-fills the form on the left panel
- Saves to PostgreSQL database

### Tool 2: edit_interaction_tool (Mandatory)
- User says what to change (e.g., "change name to Dr. John")
- LLM identifies only changed fields
- Updates only those specific fields (merge, not replace)
- Form updates instantly on left panel

### Tool 3: summarize_interaction_tool
- Generates 3-4 line professional summary
- Based on logged interaction data from DB
- Fills summary field in form

### Tool 4: suggest_followup_tool
- AI suggests 3 specific follow-up actions
- Time-bound and actionable recommendations
- Based on interaction sentiment and topics

### Tool 5: search_interactions_tool
- Search past interactions by HCP name or topic
- Returns matching records from PostgreSQL
- Displays in chat with key details

---
## 📁 Project Structure
hcp-crm/
├── backend/
│ ├── main.py # FastAPI app + CORS
│ ├── database.py # SQLAlchemy PostgreSQL setup
│ ├── models.py # Interaction model
│ ├── schemas.py # Pydantic schemas
│ ├── agent.py # LangGraph agent + 5 tools
│ ├── routes.py # API endpoints
│ └── .env # Environment variables
└── frontend/
├── index.html # Google Inter font
└── src/
├── App.jsx # Main layout + History modal
├── main.jsx
├── store/
│ ├── store.js
│ └── interactionSlice.js # Redux state
└── components/
├── LogForm.jsx # Left panel (read-only)
└── ChatPanel.jsx # Right panel (AI chat)

---
## ⚙️ Setup Instructions

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL
- Groq API Key (https://console.groq.com/)

### 1. Database Setup
```sql
CREATE DATABASE hcp_crm;
\c hcp_crm
CREATE TABLE interactions (
    id SERIAL PRIMARY KEY,
    hcp_name VARCHAR(255) DEFAULT '',
    interaction_type VARCHAR(100) DEFAULT 'Meeting',
    date VARCHAR(50) DEFAULT '',
    time VARCHAR(50) DEFAULT '',
    attendees TEXT DEFAULT '',
    topics_discussed TEXT DEFAULT '',
    materials_shared TEXT DEFAULT '',
    sentiment VARCHAR(50) DEFAULT 'neutral',
    summary TEXT DEFAULT '',
    follow_up TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

2. Backend Setup
cd backend
python -m venv venv
venv\Scripts\activate
pip install fastapi uvicorn sqlalchemy psycopg2-binary python-dotenv langgraph langchain langchain-groq langchain-core pydantic python-multipart

3. Environment Variables
Create backend/.env:
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/hcp_crm
GROQ_API_KEY=your_groq_api_key_here

4. Run Backend
cd backend
venv\Scripts\activate
python -m uvicorn main:app --reload --port 8000

5. Frontend Setup
cd frontend
npm install
npm run dev

🌐 API Endpoints
Method	Endpoint	Description
POST	/api/chat	AI chat - LangGraph agent
POST	/api/interactions	Save interaction
GET	/api/interactions	List all interactions
GET	/api/interactions/{id}	Get single interaction
PUT	/api/interactions/{id}	Update interaction
DELETE	/api/interactions/{id}	Delete interaction

🚀 How to Use
Open http://localhost:5173
Type in AI chat (right panel)
Form auto-fills (left panel)
Click "Save Interaction"
Click "View Saved Interactions" to see history

💬 Test Prompts
# Log:
"Today I met Dr. Priya Patel at Apollo Hospital Mumbai.
We discussed Cardiomax tablet efficacy. Sentiment was
positive. I shared product brochure and sample pack."

# Edit:
"Sorry, the name was Dr. John Smith and sentiment was negative"

# Summarize:
"Summarize this interaction"

# Follow-up:
"What should be my follow-up steps?"

# Search:
"Show me all interactions with Dr. Priya"
