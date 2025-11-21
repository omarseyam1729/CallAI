# app/controllers/core/chat_controller.py
import re
import logging
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime

from app.core.database import SessionLocal
from app.controllers.core.ollama_controller import query_ollama

logger = logging.getLogger(__name__)

# Database schema description for LLM
# IMPORTANT: Table names are lowercase with underscores (SQLite convention)
DB_SCHEMA = """
Database Schema for Call Analytics (SQLite):

IMPORTANT: Use exact table names as shown (lowercase with underscores).

Tables:
1. call
   - id (String, primary key): Unique call identifier
   - filename (Text): Original audio filename
   - folder_path (Text): Path to call folder
   - upload_time (TIMESTAMP): When call was uploaded

2. call_data
   - id (Integer, primary key)
   - call_id (String, foreign key to call.id): Links to call table
   - call_name (String, nullable): User-assigned call name
   - call_description (Text, nullable): User-assigned description
   - agent_id (Integer, foreign key to agent.id, nullable): Associated agent
   - full_transcript (Text, nullable): Complete transcript text
   - llm_summary (Text, nullable): AI-generated summary
   - sentiment_label (String, nullable): Overall sentiment (e.g., "positive", "negative")
   - sentiment_confidence (Float, nullable): Confidence score
   - emotion_label (String, nullable): Overall emotion
   - emotion_confidence (Float, nullable): Confidence score

3. segment
   - id (Integer, primary key)
   - chunk_id (Integer, foreign key to audio_chunk.id): Parent chunk
   - speaker (String): Speaker identifier (e.g., "SPEAKER_00")
   - start (Float): Start time in seconds
   - end (Float): End time in seconds
   - text (Text, nullable): Transcribed text for this segment
   - sentiment_label (String, nullable): Segment sentiment
   - sentiment_confidence (Float, nullable)
   - emotion_label (String, nullable): Segment emotion
   - emotion_confidence (Float, nullable)

4. agent
   - id (Integer, primary key)
   - name (String): Agent name
   - description (Text, nullable): Agent description
   - age (Integer, nullable)
   - sex (String, nullable)

5. audio_chunk
   - id (Integer, primary key)
   - call_id (String, foreign key to call.id): Parent call
   - chunk_path (Text): Path to audio file
   - start_time (Float): Chunk start time in call
   - end_time (Float): Chunk end time in call
   - status (String): Processing status

Relationships:
- call has one call_data (one-to-one via call_data.call_id = call.id)
- call has many audio_chunk (one-to-many via audio_chunk.call_id = call.id)
- audio_chunk has many segment (one-to-many via segment.chunk_id = audio_chunk.id)
- call_data has one agent (many-to-one via call_data.agent_id = agent.id)

Example JOIN syntax:
- SELECT * FROM call INNER JOIN call_data ON call.id = call_data.call_id
- SELECT * FROM call INNER JOIN audio_chunk ON call.id = audio_chunk.call_id
- SELECT * FROM audio_chunk INNER JOIN segment ON audio_chunk.id = segment.chunk_id
"""

# Dangerous SQL keywords to block
DANGEROUS_KEYWORDS = [
    'DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 'CREATE', 
    'TRUNCATE', 'EXEC', 'EXECUTE', 'GRANT', 'REVOKE'
]

MAX_RESULT_ROWS = 1000


def build_text_to_sql_prompt(question: str, conversation_history: List[Dict]) -> str:
    """Build prompt for converting natural language to SQL."""
    history_text = ""
    if conversation_history:
        history_text = "\nPrevious conversation:\n"
        for msg in conversation_history[-5:]:  # Last 5 messages
            role = msg.get('role', 'user')
            content = msg.get('content', '')
            history_text += f"{role.capitalize()}: {content}\n"
    
    prompt = f"""You are a SQL query generator for a call analytics database. Convert the user's natural language question into a safe SELECT query.

{DB_SCHEMA}

{history_text}

User Question: {question}

Instructions:
1. Generate ONLY a SELECT query
2. Do NOT include any DROP, DELETE, UPDATE, INSERT, ALTER, CREATE, or TRUNCATE statements
3. Use EXACT table names: call, call_data, agent, audio_chunk, segment (lowercase with underscores)
4. Use proper JOINs when accessing related tables (e.g., call.id = call_data.call_id)
5. Use appropriate WHERE clauses for filtering
6. Return only the SQL query, no explanations or markdown formatting
7. If the question asks about counts, use COUNT(*)
8. If the question asks about aggregations, use appropriate SQL functions (SUM, AVG, MAX, MIN, etc.)
9. Always use lowercase table names with underscores (call, call_data, not Call, CallData)

SQL Query:"""
    
    return prompt


def validate_sql_safety(sql: str) -> bool:
    """Validate that SQL query is safe (SELECT only, no dangerous operations)."""
    sql_upper = sql.upper().strip()
    
    # Must start with SELECT
    if not sql_upper.startswith('SELECT'):
        return False
    
    # Check for dangerous keywords
    for keyword in DANGEROUS_KEYWORDS:
        if keyword in sql_upper:
            return False
    
    return True


def extract_sql_from_response(response: str) -> str:
    """Extract SQL query from LLM response (may include markdown or explanations)."""
    # Remove markdown code blocks
    sql = response.strip()
    
    # Remove ```sql or ``` markers
    sql = re.sub(r'^```(?:sql)?\s*\n?', '', sql, flags=re.IGNORECASE | re.MULTILINE)
    sql = re.sub(r'\n?```\s*$', '', sql, flags=re.IGNORECASE | re.MULTILINE)
    
    # Find SELECT statement
    select_match = re.search(r'SELECT.*?(?:;|$)', sql, re.IGNORECASE | re.DOTALL)
    if select_match:
        sql = select_match.group(0).strip()
        # Remove trailing semicolon
        sql = sql.rstrip(';')
    
    return sql.strip()


def convert_question_to_sql(question: str, conversation_history: List[Dict]) -> str:
    """Convert natural language question to SQL using LLM."""
    prompt = build_text_to_sql_prompt(question, conversation_history)
    
    logger.info(f"[CHAT] Converting question to SQL: {question[:50]}...")
    response = query_ollama(prompt)
    
    sql = extract_sql_from_response(response)
    
    if not validate_sql_safety(sql):
        raise ValueError(f"Generated SQL is not safe: {sql}")
    
    logger.info(f"[CHAT] Generated SQL: {sql}")
    return sql


def execute_sql_safely(sql: str, db: Session) -> List[Dict]:
    """Execute SQL query safely and return results as list of dicts."""
    if not validate_sql_safety(sql):
        raise ValueError("SQL query failed safety validation")
    
    try:
        # Execute query
        result = db.execute(text(sql))
        
        # Convert to list of dicts
        rows = []
        for row in result:
            row_dict = {}
            for key, value in row._mapping.items():
                # Convert datetime and other types to strings for JSON serialization
                if hasattr(value, 'isoformat'):
                    row_dict[key] = value.isoformat()
                else:
                    row_dict[key] = value
            rows.append(row_dict)
            
            # Limit result size
            if len(rows) >= MAX_RESULT_ROWS:
                logger.warning(f"[CHAT] Result limited to {MAX_RESULT_ROWS} rows")
                break
        
        return rows
    
    except Exception as e:
        logger.error(f"[CHAT] SQL execution error: {e}")
        raise ValueError(f"SQL execution failed: {str(e)}")


def format_answer_with_llm(sql_results: List[Dict], original_question: str, sql_query: str) -> str:
    """Format SQL results into natural language answer using LLM."""
    # Format results for prompt
    if not sql_results:
        results_text = "No results found."
    elif len(sql_results) == 1:
        results_text = f"Result: {sql_results[0]}"
    elif len(sql_results) <= 10:
        results_text = f"Results ({len(sql_results)} rows):\n"
        for i, row in enumerate(sql_results, 1):
            results_text += f"{i}. {row}\n"
    else:
        results_text = f"Results ({len(sql_results)} rows, showing first 10):\n"
        for i, row in enumerate(sql_results[:10], 1):
            results_text += f"{i}. {row}\n"
        results_text += f"... and {len(sql_results) - 10} more rows"
    
    prompt = f"""You are a helpful assistant. A user asked: "{original_question}"

The following SQL query was executed:
{sql_query}

Query Results:
{results_text}

Provide a clear, natural language answer based on these results. Be concise and accurate. If there are no results, explain that clearly. If there are many results, summarize the key findings."""
    
    logger.info(f"[CHAT] Formatting answer with LLM...")
    answer = query_ollama(prompt)
    
    return answer.strip()


def process_chat_message(message: str, conversation_history: List[Dict]) -> tuple[str, Optional[str]]:
    """Process a chat message: convert to SQL, execute, format answer."""
    db = SessionLocal()
    try:
        # Step 1: Convert question to SQL
        sql_query = convert_question_to_sql(message, conversation_history)
        
        # Step 2: Execute SQL safely
        sql_results = execute_sql_safely(sql_query, db)
        
        # Step 3: Format answer with LLM
        answer = format_answer_with_llm(sql_results, message, sql_query)
        
        return answer, sql_query
    
    except Exception as e:
        logger.error(f"[CHAT] Error processing message: {e}")
        error_msg = f"I encountered an error while processing your question: {str(e)}. Please try rephrasing your question."
        return error_msg, None
    
    finally:
        db.close()

