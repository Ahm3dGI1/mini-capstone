import json
import time
from openai import OpenAI
from dotenv import load_dotenv
import os

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

MODEL = "gpt-4o-mini"  # cheap and fast; swap to "gpt-4o" if you want higher quality

CHECKPOINT_SYSTEM_PROMPT = """You are an expert educational content designer. Given a video transcript with timestamps, generate multiple-choice questions that test comprehension of the key concepts."""

CHECKPOINT_USER_PROMPT = """Here is a video transcript with timestamps:

{transcript}

Generate {num_questions} multiple-choice checkpoint questions. For each question, choose a timestamp (in seconds) that is shortly AFTER the concept being tested was explained. Distribute questions throughout the video, not clustered at the start.

Return ONLY a valid JSON array with no markdown, no explanation, no code fences. Each object must have:
- "timestamp_seconds" (integer): when to pause the video
- "question" (string): the multiple-choice question  
- "options" (array of exactly 4 strings): answer choices
- "correct_option" (string): "A", "B", "C", or "D"
- "explanation" (string): 1-2 sentence explanation of the correct answer

Example format:
[{{"timestamp_seconds": 60, "question": "What is X?", "options": ["Option A", "Option B", "Option C", "Option D"], "correct_option": "A", "explanation": "A is correct because..."}}]"""

TUTOR_SYSTEM_PROMPT = """You are a helpful, concise tutor for a student watching a YouTube video. You have full access to the video transcript below. Answer only questions related to the video content. Reference approximate timestamps when helpful (e.g., "around the 3:00 mark"). Be friendly and clear. If the student asks something unrelated to the video, politely redirect them.

Video Transcript:
{transcript}

Current video position: {current_time} seconds"""


def _call_openai(messages, temperature=0.7, max_tokens=4096, retries=3):
    """Call OpenAI API with retry logic."""
    for attempt in range(retries):
        try:
            response = client.chat.completions.create(
                model=MODEL,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            print(f"[openai] Attempt {attempt + 1}/{retries} failed: {e}")
            if attempt < retries - 1:
                wait = 2 ** attempt
                print(f"[openai] Retrying in {wait}s...")
                time.sleep(wait)
            else:
                raise


def generate_checkpoints(transcript_text, num_questions=7):
    """Generate checkpoint questions from a video transcript using OpenAI."""
    try:
        prompt = CHECKPOINT_USER_PROMPT.format(
            transcript=transcript_text[:50000],
            num_questions=num_questions,
        )

        messages = [
            {"role": "system", "content": CHECKPOINT_SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ]

        raw_text = _call_openai(messages, temperature=0.7, max_tokens=4096)

        # Clean up any markdown code fences
        if raw_text.startswith("```"):
            raw_text = raw_text.split("\n", 1)[1] if "\n" in raw_text else raw_text[3:]
        if raw_text.endswith("```"):
            raw_text = raw_text[:-3]
        raw_text = raw_text.strip()

        checkpoints = json.loads(raw_text)

        # Validate structure
        validated = []
        for cp in checkpoints:
            if all(k in cp for k in ["timestamp_seconds", "question", "options", "correct_option", "explanation"]):
                if len(cp["options"]) == 4 and cp["correct_option"] in ["A", "B", "C", "D"]:
                    validated.append(cp)

        # Sort by timestamp
        validated.sort(key=lambda x: x["timestamp_seconds"])
        return validated

    except Exception as e:
        print(f"Error generating checkpoints: {e}")
        return []


def chat_with_tutor(transcript_text, current_time, conversation_history, user_message):
    """Chat with the AI tutor about the video content."""
    try:
        system = TUTOR_SYSTEM_PROMPT.format(
            transcript=transcript_text[:50000],
            current_time=current_time,
        )

        messages = [{"role": "system", "content": system}]

        # Add conversation history (last 20 messages)
        for msg in conversation_history[-20:]:
            messages.append({"role": msg["role"], "content": msg["content"]})

        # Add current user message
        messages.append({"role": "user", "content": user_message})

        return _call_openai(messages, temperature=0.7, max_tokens=1024)

    except Exception as e:
        print(f"Error in tutor chat: {e}")
        return "I'm sorry, I encountered an error. Please try again."
