import os
import json
import re
from typing import TypedDict, Annotated, Sequence, Optional
from dotenv import load_dotenv
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage
from langchain_groq import ChatGroq
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages

load_dotenv()

llm = ChatGroq(
    api_key=os.getenv("GROQ_API_KEY"),
    model_name="llama-3.3-70b-versatile",
    temperature=0.2,
)

class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], add_messages]
    extracted_data: dict
    current_tool: str
    interaction_id: Optional[int]
    user_input: str

def _get_db():
    from database import SessionLocal
    return SessionLocal()

def _clean_json(raw: str) -> str:
    raw = re.sub(r"```json\s*", "", raw)
    raw = re.sub(r"```\s*", "", raw)
    return raw.strip()

# ═══════════════════════════════════════════
# TOOL 1 - log_interaction_tool
# ═══════════════════════════════════════════
def log_interaction_tool(state: AgentState) -> AgentState:
    user_text = state["user_input"]

    from datetime import date
    today = date.today().strftime("%Y-%m-%d")

    system_prompt = f"""You are a pharmaceutical CRM AI assistant.
Extract HCP interaction details from the user text.
Today's date is {today}.

Return ONLY this exact JSON structure with no extra text:
{{
  "hcp_name": "full doctor name",
  "interaction_type": "Meeting or Call or Email or Visit",
  "date": "date in YYYY-MM-DD format, use {today} if not specified",
  "time": "time in HH:MM format or empty string",
  "attendees": "people present besides the HCP or empty string",
  "topics_discussed": "detailed topics discussed",
  "materials_shared": "brochures, samples, reports shared - comma separated or empty string",
  "sentiment": "positive or neutral or negative"
}}

Return ONLY valid JSON. No explanation. No markdown."""

    response = llm.invoke([
        SystemMessage(content=system_prompt),
        HumanMessage(content=user_text),
    ])

    raw = _clean_json(response.content)

    try:
        extracted = json.loads(raw)
    except Exception:
        match = re.search(r'\{.*\}', raw, re.DOTALL)
        if match:
            try:
                extracted = json.loads(match.group())
            except Exception:
                extracted = {
                    "hcp_name": "", "interaction_type": "Meeting",
                    "date": today, "time": "", "attendees": "",
                    "topics_discussed": user_text,
                    "materials_shared": "", "sentiment": "neutral"
                }
        else:
            extracted = {
                "hcp_name": "", "interaction_type": "Meeting",
                "date": today, "time": "", "attendees": "",
                "topics_discussed": user_text,
                "materials_shared": "", "sentiment": "neutral"
            }

    # Save to DB
    db = _get_db()
    interaction_id = None
    try:
        from models import Interaction
        interaction = Interaction(
            hcp_name=extracted.get("hcp_name", ""),
            interaction_type=extracted.get("interaction_type", "Meeting"),
            date=extracted.get("date", today),
            time=extracted.get("time", ""),
            attendees=extracted.get("attendees", ""),
            topics_discussed=extracted.get("topics_discussed", ""),
            materials_shared=extracted.get("materials_shared", ""),
            sentiment=extracted.get("sentiment", "neutral"),
        )
        db.add(interaction)
        db.commit()
        db.refresh(interaction)
        interaction_id = interaction.id
    except Exception as e:
        db.rollback()
    finally:
        db.close()

    hcp = extracted.get("hcp_name", "the HCP")
    sentiment_emoji = {"positive": "😊", "negative": "😞", "neutral": "😐"}.get(
        extracted.get("sentiment", "neutral"), "😐"
    )

    reply = (
        f"✅ Interaction with **{hcp}** logged!\n\n"
        f"📋 Extracted Details:\n"
        f"• Type: {extracted.get('interaction_type', 'Meeting')}\n"
        f"• Date: {extracted.get('date', today)}\n"
        f"• Topics: {extracted.get('topics_discussed', 'N/A')[:80]}...\n"
        f"• Materials: {extracted.get('materials_shared', 'None') or 'None'}\n"
        f"• Sentiment: {sentiment_emoji} {extracted.get('sentiment', 'neutral').capitalize()}\n\n"
        f"The form on the left has been auto-filled! ✨"
    )

    return {
        **state,
        "extracted_data": extracted,
        "current_tool": "log_interaction_tool",
        "interaction_id": interaction_id,
        "messages": [AIMessage(content=reply)],
    }

# ═══════════════════════════════════════════
# TOOL 2 - edit_interaction_tool
# ═══════════════════════════════════════════
def edit_interaction_tool(state: AgentState) -> AgentState:
    user_text = state["user_input"]
    interaction_id = state.get("interaction_id")

    db = _get_db()
    try:
        from models import Interaction

        id_match = re.search(r'\b(\d+)\b', user_text)
        if id_match and not interaction_id:
            interaction_id = int(id_match.group(1))

        if not interaction_id:
            interaction = db.query(Interaction).order_by(
                Interaction.created_at.desc()
            ).first()
        else:
            interaction = db.query(Interaction).filter(
                Interaction.id == interaction_id
            ).first()

        if not interaction:
            reply = (
                "❌ No interaction found to edit.\n"
                "Please log an interaction first!"
            )
            return {
                **state,
                "current_tool": "edit_interaction_tool",
                "messages": [AIMessage(content=reply)],
            }

        existing = {
            "hcp_name": interaction.hcp_name,
            "interaction_type": interaction.interaction_type,
            "date": interaction.date,
            "time": interaction.time,
            "attendees": interaction.attendees,
            "topics_discussed": interaction.topics_discussed,
            "materials_shared": interaction.materials_shared,
            "sentiment": interaction.sentiment,
        }

        system_prompt = f"""You are editing an HCP CRM interaction record.

Current record:
{json.dumps(existing, indent=2)}

User request: "{user_text}"

Identify ONLY the fields the user wants to change and return them as JSON.
Do NOT include unchanged fields.
Do NOT include empty strings.

Example - if user says "change name to Dr. John and sentiment to negative":
{{"hcp_name": "Dr. John", "sentiment": "negative"}}

Return ONLY valid JSON. No explanation. No markdown."""

        response = llm.invoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_text),
        ])

        raw = _clean_json(response.content)

        try:
            changed_fields = json.loads(raw)
        except Exception:
            match = re.search(r'\{.*\}', raw, re.DOTALL)
            changed_fields = json.loads(match.group()) if match else {}

        changed_fields = {k: v for k, v in changed_fields.items() if v}

        if not changed_fields:
            reply = (
                "🤔 I couldn't identify what to change.\n"
                "Please be specific. Example:\n"
                "'Change the name to Dr. John and sentiment to negative'"
            )
            return {
                **state,
                "current_tool": "edit_interaction_tool",
                "messages": [AIMessage(content=reply)],
            }

        for field, value in changed_fields.items():
            if hasattr(interaction, field):
                setattr(interaction, field, value)

        db.commit()
        db.refresh(interaction)

        changes_text = "\n".join([
            f"  • {k}: '{existing.get(k, '')}' → '{v}'"
            for k, v in changed_fields.items()
        ])

        reply = (
            f"✅ Interaction updated!\n\n"
            f"**Changes applied:**\n{changes_text}\n\n"
            f"All other fields remain unchanged. ✨"
        )

        return {
            **state,
            "extracted_data": changed_fields,
            "current_tool": "edit_interaction_tool",
            "interaction_id": interaction.id,
            "messages": [AIMessage(content=reply)],
        }

    except Exception as e:
        db.rollback()
        return {
            **state,
            "current_tool": "edit_interaction_tool",
            "messages": [AIMessage(content=f"❌ Error: {str(e)}")],
        }
    finally:
        db.close()

# ═══════════════════════════════════════════
# TOOL 3 - summarize_interaction_tool
# ═══════════════════════════════════════════
def summarize_interaction_tool(state: AgentState) -> AgentState:
    user_text = state["user_input"]
    interaction_id = state.get("interaction_id")

    db = _get_db()
    context = user_text
    try:
        from models import Interaction
        id_match = re.search(r'\b(\d+)\b', user_text)
        if id_match:
            interaction_id = int(id_match.group(1))
        if interaction_id:
            interaction = db.query(Interaction).filter(
                Interaction.id == interaction_id
            ).first()
            if interaction:
                context = (
                    f"HCP: {interaction.hcp_name}\n"
                    f"Type: {interaction.interaction_type}\n"
                    f"Date: {interaction.date}\n"
                    f"Topics: {interaction.topics_discussed}\n"
                    f"Materials: {interaction.materials_shared}\n"
                    f"Sentiment: {interaction.sentiment}\n"
                    f"Attendees: {interaction.attendees}"
                )
    except Exception:
        pass
    finally:
        db.close()

    system_prompt = """You are a pharmaceutical CRM expert.
Write a concise 3-4 sentence professional summary of this HCP interaction.
Focus on key outcomes, products discussed, and HCP sentiment.
Be professional and clear."""

    response = llm.invoke([
        SystemMessage(content=system_prompt),
        HumanMessage(content=context),
    ])

    summary_text = response.content.strip()
    reply = f"📝 **Summary:**\n\n{summary_text}"

    return {
        **state,
        "extracted_data": {"summary": summary_text},
        "current_tool": "summarize_interaction_tool",
        "messages": [AIMessage(content=reply)],
    }

# ═══════════════════════════════════════════
# TOOL 4 - suggest_followup_tool
# ═══════════════════════════════════════════
def suggest_followup_tool(state: AgentState) -> AgentState:
    user_text = state["user_input"]
    extracted = state.get("extracted_data", {})
    interaction_id = state.get("interaction_id")

    db = _get_db()
    try:
        from models import Interaction
        if interaction_id:
            interaction = db.query(Interaction).filter(
                Interaction.id == interaction_id
            ).first()
            if interaction:
                extracted = {
                    "hcp_name": interaction.hcp_name,
                    "topics_discussed": interaction.topics_discussed,
                    "materials_shared": interaction.materials_shared,
                    "sentiment": interaction.sentiment,
                    "interaction_type": interaction.interaction_type,
                }
    except Exception:
        pass
    finally:
        db.close()

    context = json.dumps(extracted) if extracted else user_text

    system_prompt = """You are a pharmaceutical sales strategy expert.
Based on this HCP interaction, suggest exactly 3 specific follow-up actions.
Each must be specific, actionable, and time-bound.
Format as numbered list:
1. [Action] within [timeframe]
2. [Action] by [date/timeframe]
3. [Action] next [timeframe]"""

    response = llm.invoke([
        SystemMessage(content=system_prompt),
        HumanMessage(content=f"Interaction: {context}"),
    ])

    suggestions = response.content.strip()
    reply = f"📅 **Follow-up Actions:**\n\n{suggestions}"

    return {
        **state,
        "extracted_data": {"follow_up": suggestions},
        "current_tool": "suggest_followup_tool",
        "messages": [AIMessage(content=reply)],
    }

# ═══════════════════════════════════════════
# TOOL 5 - search_interactions_tool
# ═══════════════════════════════════════════
def search_interactions_tool(state: AgentState) -> AgentState:
    user_text = state["user_input"]

    db = _get_db()
    try:
        from models import Interaction
        from sqlalchemy import or_

        words = re.findall(r'\b[A-Za-z]{3,}\b', user_text)
        stop = {"find","search","show","all","the","for","me","get","list","fetch","interactions","interaction","with","and"}
        keywords = [w for w in words if w.lower() not in stop][:4]

        interactions = []
        if keywords:
            for kw in keywords:
                results = db.query(Interaction).filter(
                    or_(
                        Interaction.hcp_name.ilike(f"%{kw}%"),
                        Interaction.topics_discussed.ilike(f"%{kw}%"),
                        Interaction.interaction_type.ilike(f"%{kw}%"),
                    )
                ).limit(5).all()
                interactions.extend(results)

        seen = set()
        unique = []
        for i in interactions:
            if i.id not in seen:
                seen.add(i.id)
                unique.append(i)

        if not unique:
            unique = db.query(Interaction).order_by(
                Interaction.created_at.desc()
            ).limit(5).all()

        if not unique:
            reply = "🔍 No interactions found yet. Log some interactions first!"
            return {
                **state,
                "current_tool": "search_interactions_tool",
                "messages": [AIMessage(content=reply)],
            }

        sentiment_emoji = {"positive": "😊", "negative": "😞", "neutral": "😐"}

        results_text = "\n\n".join([
            f"**#{i.id} — {i.hcp_name}**\n"
            f"• {i.interaction_type} on {i.date}\n"
            f"• Topics: {(i.topics_discussed or '')[:80]}...\n"
            f"• Sentiment: {sentiment_emoji.get(i.sentiment, '😐')} {i.sentiment}"
            for i in unique
        ])

        reply = f"🔍 **Found {len(unique)} interaction(s):**\n\n{results_text}"

        return {
            **state,
            "extracted_data": {
                "search_results": [
                    {"id": i.id, "hcp_name": i.hcp_name,
                     "date": i.date, "sentiment": i.sentiment}
                    for i in unique
                ]
            },
            "current_tool": "search_interactions_tool",
            "messages": [AIMessage(content=reply)],
        }

    except Exception as e:
        return {
            **state,
            "current_tool": "search_interactions_tool",
            "messages": [AIMessage(content=f"❌ Search error: {str(e)}")],
        }
    finally:
        db.close()

# ═══════════════════════════════════════════
# ROUTER
# ═══════════════════════════════════════════
def router_node(state: AgentState) -> AgentState:
    text = state["user_input"].lower()

    log_kw = ["log","met with","visited","meeting with","called","had a meeting",
              "i met","i visited","discussed with","today i","yesterday i",
              "spoke with","talked to","i called","i had","we met","we discussed"]
    edit_kw = ["edit","update","change","modify","correct","fix","revise",
               "actually","mistake","wrong","sorry"]
    summary_kw = ["summarize","summary","summarise","recap","what happened","brief"]
    followup_kw = ["follow up","followup","follow-up","next steps","what should",
                   "suggest","recommendation","action items"]
    search_kw = ["find","search","show me","list","get all","fetch","look up",
                 "show all","display","retrieve","past interactions"]

    if any(k in text for k in log_kw):
        tool = "log"
    elif any(k in text for k in edit_kw):
        tool = "edit"
    elif any(k in text for k in summary_kw):
        tool = "summarize"
    elif any(k in text for k in followup_kw):
        tool = "followup"
    elif any(k in text for k in search_kw):
        tool = "search"
    else:
        tool = "log"

    return {**state, "current_tool": tool}

def route_to_tool(state: AgentState) -> str:
    return {
        "log": "log_interaction_tool",
        "edit": "edit_interaction_tool",
        "summarize": "summarize_interaction_tool",
        "followup": "suggest_followup_tool",
        "search": "search_interactions_tool",
    }.get(state["current_tool"], "log_interaction_tool")

# ═══════════════════════════════════════════
# BUILD GRAPH
# ═══════════════════════════════════════════
def build_graph():
    graph = StateGraph(AgentState)

    graph.add_node("router", router_node)
    graph.add_node("log_interaction_tool", log_interaction_tool)
    graph.add_node("edit_interaction_tool", edit_interaction_tool)
    graph.add_node("summarize_interaction_tool", summarize_interaction_tool)
    graph.add_node("suggest_followup_tool", suggest_followup_tool)
    graph.add_node("search_interactions_tool", search_interactions_tool)

    graph.set_entry_point("router")

    graph.add_conditional_edges(
        "router",
        route_to_tool,
        {
            "log_interaction_tool": "log_interaction_tool",
            "edit_interaction_tool": "edit_interaction_tool",
            "summarize_interaction_tool": "summarize_interaction_tool",
            "suggest_followup_tool": "suggest_followup_tool",
            "search_interactions_tool": "search_interactions_tool",
        },
    )

    for node in ["log_interaction_tool","edit_interaction_tool",
                 "summarize_interaction_tool","suggest_followup_tool",
                 "search_interactions_tool"]:
        graph.add_edge(node, END)

    return graph.compile()

agent_graph = build_graph()

def run_agent(message: str, interaction_id: int = None) -> dict:
    initial_state: AgentState = {
        "messages": [HumanMessage(content=message)],
        "extracted_data": {},
        "current_tool": "",
        "interaction_id": interaction_id,
        "user_input": message,
    }

    result = agent_graph.invoke(initial_state)

    ai_messages = [m for m in result["messages"] if isinstance(m, AIMessage)]
    final_message = ai_messages[-1].content if ai_messages else "Request processed."

    return {
        "message": final_message,
        "extracted_data": result.get("extracted_data", {}),
        "tool_used": result.get("current_tool", ""),
    }