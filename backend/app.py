import os
from datetime import datetime, timedelta

import bcrypt
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager, create_access_token, jwt_required, get_jwt_identity
)

from models import db, User, Session, Checkpoint, ChatMessage
from transcript import extract_video_id, fetch_transcript, format_transcript_for_ai, get_video_title
from ai_service import generate_checkpoints, chat_with_tutor

load_dotenv()

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL", "sqlite:///learntube.db")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "change-me")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(days=7)

CORS(app, supports_credentials=True)
jwt = JWTManager(app)
db.init_app(app)

with app.app_context():
    db.create_all()


# ──────────────────────────── AUTH ────────────────────────────

@app.route("/api/auth/register", methods=["POST"])
def register():
    data = request.get_json()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    name = data.get("name", "").strip()

    if not email or not password or not name:
        return jsonify({"error": "All fields are required"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already registered"}), 409

    hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    user = User(email=email, password_hash=hashed, name=name)
    db.session.add(user)
    db.session.commit()

    token = create_access_token(identity=str(user.id))
    return jsonify({"token": token, "user": user.to_dict()}), 201


@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    user = User.query.filter_by(email=email).first()
    if not user or not bcrypt.checkpw(password.encode("utf-8"), user.password_hash.encode("utf-8")):
        return jsonify({"error": "Invalid email or password"}), 401

    token = create_access_token(identity=str(user.id))
    return jsonify({"token": token, "user": user.to_dict()}), 200


@app.route("/api/auth/me", methods=["GET"])
@jwt_required()
def me():
    user = User.query.get(int(get_jwt_identity()))
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify({"user": user.to_dict()}), 200


@app.route("/api/auth/profile", methods=["PUT"])
@jwt_required()
def update_profile():
    user = User.query.get(int(get_jwt_identity()))
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json()
    if "name" in data:
        user.name = data["name"].strip()
    if "email" in data:
        new_email = data["email"].strip().lower()
        existing = User.query.filter_by(email=new_email).first()
        if existing and existing.id != user.id:
            return jsonify({"error": "Email already in use"}), 409
        user.email = new_email
    if "password" in data and data["password"]:
        user.password_hash = bcrypt.hashpw(data["password"].encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    db.session.commit()
    return jsonify({"user": user.to_dict()}), 200


@app.route("/api/auth/delete", methods=["DELETE"])
@jwt_required()
def delete_account():
    user = User.query.get(int(get_jwt_identity()))
    if not user:
        return jsonify({"error": "User not found"}), 404
    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": "Account deleted"}), 200


# ──────────────────────────── SESSIONS ────────────────────────────

@app.route("/api/sessions", methods=["POST"])
@jwt_required()
def create_session():
    user_id = int(get_jwt_identity())
    data = request.get_json()
    youtube_url = data.get("youtube_url", "").strip()

    if not youtube_url:
        return jsonify({"error": "YouTube URL is required"}), 400

    video_id = extract_video_id(youtube_url)
    if not video_id:
        return jsonify({"error": "Invalid YouTube URL"}), 400

    print(f"[session] Creating session for video_id={video_id}, url={youtube_url}")

    # Fetch transcript
    transcript_segments = fetch_transcript(video_id)
    if not transcript_segments:
        print(f"[session] Transcript fetch failed for video_id={video_id}")
        return jsonify({"error": "Could not fetch transcript. This video may not have captions available."}), 422

    print(f"[session] Got {len(transcript_segments)} transcript segments")
    formatted_transcript = format_transcript_for_ai(transcript_segments)
    video_title = get_video_title(video_id)
    print(f"[session] Video title: {video_title}")

    # Create session
    session = Session(
        user_id=user_id,
        youtube_url=youtube_url,
        video_id=video_id,
        video_title=video_title,
        transcript=formatted_transcript,
    )
    db.session.add(session)
    db.session.commit()

    # Generate checkpoints
    print(f"[session] Generating checkpoints via AI...")
    checkpoints_data = generate_checkpoints(formatted_transcript)
    print(f"[session] Generated {len(checkpoints_data)} checkpoints")

    for cp in checkpoints_data:
        checkpoint = Checkpoint(
            session_id=session.id,
            timestamp_seconds=cp["timestamp_seconds"],
            question=cp["question"],
            option_a=cp["options"][0],
            option_b=cp["options"][1],
            option_c=cp["options"][2],
            option_d=cp["options"][3],
            correct_option=cp["correct_option"],
            explanation=cp["explanation"],
        )
        db.session.add(checkpoint)

    db.session.commit()

    return jsonify({"session": session.to_dict(include_transcript=True, include_checkpoints=True)}), 201


@app.route("/api/sessions", methods=["GET"])
@jwt_required()
def list_sessions():
    user_id = int(get_jwt_identity())
    sessions = Session.query.filter_by(user_id=user_id).order_by(Session.created_at.desc()).all()
    result = []
    for s in sessions:
        d = s.to_dict(include_checkpoints=False)
        d["score"] = s.score
        result.append(d)
    return jsonify({"sessions": result}), 200


@app.route("/api/sessions/<int:session_id>", methods=["GET"])
@jwt_required()
def get_session(session_id):
    user_id = int(get_jwt_identity())
    session = Session.query.filter_by(id=session_id, user_id=user_id).first()
    if not session:
        return jsonify({"error": "Session not found"}), 404

    data = session.to_dict(include_transcript=True, include_checkpoints=True, include_chat=True)
    data["score"] = session.score
    return jsonify({"session": data}), 200


@app.route("/api/sessions/<int:session_id>", methods=["DELETE"])
@jwt_required()
def delete_session(session_id):
    user_id = int(get_jwt_identity())
    session = Session.query.filter_by(id=session_id, user_id=user_id).first()
    if not session:
        return jsonify({"error": "Session not found"}), 404
    db.session.delete(session)
    db.session.commit()
    return jsonify({"message": "Session deleted"}), 200


# ──────────────────────────── CHECKPOINT ANSWERS ────────────────────────────

@app.route("/api/sessions/<int:session_id>/answer", methods=["POST"])
@jwt_required()
def answer_checkpoint(session_id):
    user_id = int(get_jwt_identity())
    session = Session.query.filter_by(id=session_id, user_id=user_id).first()
    if not session:
        return jsonify({"error": "Session not found"}), 404

    data = request.get_json()
    checkpoint_id = data.get("checkpoint_id")
    answer = data.get("answer", "").upper()

    if answer not in ["A", "B", "C", "D"]:
        return jsonify({"error": "Invalid answer. Must be A, B, C, or D"}), 400

    checkpoint = Checkpoint.query.filter_by(id=checkpoint_id, session_id=session_id).first()
    if not checkpoint:
        return jsonify({"error": "Checkpoint not found"}), 404

    if checkpoint.user_answer is not None:
        return jsonify({"error": "Already answered"}), 409

    checkpoint.user_answer = answer
    checkpoint.answered_at = datetime.utcnow()
    db.session.commit()

    return jsonify({
        "correct": answer == checkpoint.correct_option,
        "correct_option": checkpoint.correct_option,
        "explanation": checkpoint.explanation,
        "checkpoint": checkpoint.to_dict(),
    }), 200


# ──────────────────────────── CHAT ────────────────────────────

@app.route("/api/sessions/<int:session_id>/chat", methods=["POST"])
@jwt_required()
def chat(session_id):
    user_id = int(get_jwt_identity())
    session = Session.query.filter_by(id=session_id, user_id=user_id).first()
    if not session:
        return jsonify({"error": "Session not found"}), 404

    data = request.get_json()
    user_message = data.get("message", "").strip()
    current_time = data.get("current_time", 0)

    if not user_message:
        return jsonify({"error": "Message is required"}), 400

    # Save user message
    user_msg = ChatMessage(session_id=session_id, role="user", content=user_message)
    db.session.add(user_msg)
    db.session.commit()

    # Get conversation history
    history = [{"role": m.role, "content": m.content} for m in session.chat_messages]

    # Get AI response
    ai_response = chat_with_tutor(session.transcript, current_time, history[:-1], user_message)

    # Save assistant message
    assistant_msg = ChatMessage(session_id=session_id, role="assistant", content=ai_response)
    db.session.add(assistant_msg)
    db.session.commit()

    return jsonify({
        "message": assistant_msg.to_dict(),
        "user_message": user_msg.to_dict(),
    }), 200


# ──────────────────────────── MAIN ────────────────────────────

if __name__ == "__main__":
    app.run(debug=True, port=5000)
