from flask import Flask, request, jsonify, send_from_directory
from pathlib import Path
from datetime import datetime, timezone
import json
import threading
import os

BASE = Path(__file__).resolve().parent
DATA = BASE / "data"
DATA.mkdir(exist_ok=True)

QUESTIONS_FILE = DATA / "questions.json"
SCORES_FILE = DATA / "scores.json"

ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "2009")

app = Flask(__name__, static_folder="static")
lock = threading.Lock()

DEFAULT_QUESTIONS = [
    {
        "question": "스윗의 아이디는?",
        "options": ["kkwo130", "kkwo310", "sweet130", "swit130"],
        "answer": 0
    },
    {
        "question": "스윗의 팬 수는?",
        "options": ["53", "63", "73", "83"],
        "answer": 2
    },
    {
        "question": "스윗은 평일 방송을 할까요?",
        "options": ["네", "아니요", "가끔만", "상황에 따라"],
        "answer": 1
    },
    {
        "question": "스윗의 주 방송 요일은?",
        "options": ["월화수", "수목금", "금토일", "토일월"],
        "answer": 2
    },
    {
        "question": "스윗의 주 방송 시간은?",
        "options": ["30분 이내", "1시간-2시간", "2시간-3시간", "3시간 이상"],
        "answer": 1
    },
    {
        "question": "금토일 방송을 못 하면 어떻게 할까요?",
        "options": ["그냥 넘어감", "평일로 방송대체", "다음 주에 두 번 방송", "방송 시간을 늘림"],
        "answer": 1
    },
    {
        "question": "평일에 대체 방송을 한다면 무슨 요일에 하나요?",
        "options": ["월요일", "화요일", "수요일", "목요일"],
        "answer": 1
    },
    {
        "question": "스윗의 첫방송일은?",
        "options": ["2026/1/13", "2026/1/20", "2026/1/23", "2026/1/30"],
        "answer": 2
    },
    {
        "question": "스윗의 좋아요 리액션은?",
        "options": ["아구좋아~", "너무좋아~", "좋아요~", "아구 고마워~"],
        "answer": 0
    },
    {
        "question": "스윗의 직업은?",
        "options": ["간호사", "심리상담사", "교사", "개발자"],
        "answer": 1
    }
]

def read_json(path, default):
    if not path.exists():
        write_json(path, default)
        return default
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return default

def write_json(path, data):
    path.parent.mkdir(exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

if not QUESTIONS_FILE.exists():
    write_json(QUESTIONS_FILE, DEFAULT_QUESTIONS)

if not SCORES_FILE.exists():
    write_json(SCORES_FILE, [])

@app.get("/")
def home():
    return send_from_directory(BASE, "index.html")

@app.get("/api/questions")
def get_questions():
    questions = read_json(QUESTIONS_FILE, DEFAULT_QUESTIONS)
    return jsonify(questions)

@app.post("/api/admin/login")
def admin_login():
    data = request.get_json(silent=True) or {}
    password = str(data.get("password", ""))
    if password == ADMIN_PASSWORD:
        return jsonify({"ok": True})
    return jsonify({"ok": False})

@app.post("/api/questions")
def save_questions():
    data = request.get_json(silent=True)
    if not isinstance(data, list):
        return jsonify({"ok": False, "error": "문제 데이터가 올바르지 않습니다."}), 400

    for question in data:
        if not isinstance(question, dict):
            return jsonify({"ok": False, "error": "문제 형식이 잘못되었습니다."}), 400
        if not question.get("question"):
            return jsonify({"ok": False, "error": "문제를 입력해주세요."}), 400
        options = question.get("options")
        if not isinstance(options, list) or len(options) != 4:
            return jsonify({"ok": False, "error": "보기는 4개가 필요합니다."}), 400
        if question.get("answer") not in [0, 1, 2, 3]:
            return jsonify({"ok": False, "error": "정답을 선택해주세요."}), 400

    write_json(QUESTIONS_FILE, data)
    return jsonify({"ok": True})

@app.post("/api/scores")
def save_score():
    data = request.get_json(silent=True) or {}
    nickname = str(data.get("nickname", "")).strip()
    score = data.get("score")
    total = data.get("total")

    if not nickname or len(nickname) > 30:
        return jsonify({"ok": False, "error": "닉네임을 올바르게 입력해주세요."}), 400
    if not isinstance(score, int) or not isinstance(total, int):
        return jsonify({"ok": False, "error": "점수가 올바르지 않습니다."}), 400

    result = {
        "nickname": nickname,
        "score": score,
        "total": total,
        "created_at": datetime.now(timezone.utc).isoformat()
    }

    with lock:
        scores = read_json(SCORES_FILE, [])
        scores.append(result)
        write_json(SCORES_FILE, scores)

    return jsonify({"ok": True})

@app.get("/api/scores")
def get_scores():
    scores = read_json(SCORES_FILE, [])
    scores.sort(key=lambda x: (-x["score"], x.get("created_at", "")))
    return jsonify(scores)

@app.get("/health")
def health():
    return "OK"

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)