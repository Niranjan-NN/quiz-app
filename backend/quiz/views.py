import os
import json
import re
from dotenv import load_dotenv
from django.utils import timezone

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from google import genai

from .models import Quiz, Question, QuizAttempt

load_dotenv()


# Clean Gemini markdown JSON 
def clean_json_text(text: str) -> str:
    if not text:
        return ""

    text = text.strip()
    text = re.sub(r"^```json\s*", "", text)
    text = re.sub(r"^```\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    return text.strip()


# CREATE QUIZ
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_quiz(request):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return Response({"error": "GEMINI_API_KEY missing in .env"}, status=500)

    topic = request.data.get("topic")
    difficulty = request.data.get("difficulty")

    try:
        num_questions = int(request.data.get("num_questions", 5))
        num_questions = max(5, min(num_questions, 20))
    except ValueError:
        return Response({"error": "num_questions must be integer"}, status=400)

    if not topic or not difficulty:
        return Response({"error": "topic and difficulty are required"}, status=400)

    prompt = f"""
Generate {num_questions} multiple-choice questions on the topic: {topic}.
Difficulty: {difficulty}.

Return ONLY valid JSON in this exact format:
{{
  "questions": [
    {{
      "question": "Question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option A"
    }}
  ]
}}
"""

    try:
        client = genai.Client(api_key=api_key)

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )

        raw_text = (response.text or "").strip()
        if not raw_text:
            return Response({"error": "AI returned empty response"}, status=500)

        raw_text = clean_json_text(raw_text)

        try:
            data = json.loads(raw_text)
        except json.JSONDecodeError:
            return Response(
                {"error": "Gemini returned invalid JSON", "raw": raw_text},
                status=500
            )

        questions = data.get("questions", [])
        if not questions:
            return Response({"error": "No questions generated"}, status=500)

        # Save quiz
        quiz = Quiz.objects.create(
            user=request.user,
            topic=topic,
            difficulty=difficulty,
            num_questions=num_questions,
        )

        # Save questions
        for q in questions:
            opts = q.get("options", [])

            # Ensure 4 options always
            if len(opts) < 4:
                opts += [""] * (4 - len(opts))

            Question.objects.create(
                quiz=quiz,
                question_text=q.get("question", ""),
                option_a=opts[0],
                option_b=opts[1],
                option_c=opts[2],
                option_d=opts[3],
                answer=q.get("correct_answer", opts[0]),
            )

        return Response({"quiz_id": str(quiz.id)}, status=201)

    except Exception as e:
        return Response({"error": str(e)}, status=500)


# GET QUIZ QUESTIONS
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_quiz(request, quiz_id):
    try:
        quiz = Quiz.objects.get(id=quiz_id, user=request.user)
    except Quiz.DoesNotExist:
        return Response({"error": "Quiz not found"}, status=404)

    questions = []
    for q in quiz.questions.all():
        questions.append({
            "id": str(q.id),
            "question": q.question_text,
            "options": [q.option_a, q.option_b, q.option_c, q.option_d],
            "answer": q.answer,  # shown after submit in frontend
        })

    return Response({
        "quiz_id": str(quiz.id),
        "topic": quiz.topic,
        "difficulty": quiz.difficulty,
        "num_questions": quiz.num_questions,
        "questions": questions,
    })


# SUBMIT QUIZ + SAVE ATTEMPT
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def submit_quiz(request, quiz_id):
    try:
        quiz = Quiz.objects.get(id=quiz_id, user=request.user)
    except Quiz.DoesNotExist:
        return Response({"error": "Quiz not found"}, status=404)

    answers = request.data.get("answers", {})

    if not isinstance(answers, dict):
        return Response({"error": "answers must be an object/dictionary"}, status=400)

    score = 0
    total = quiz.questions.count()

    for q in quiz.questions.all():
        selected = answers.get(str(q.id))
        if selected and selected == q.answer:
            score += 1

    attempt = QuizAttempt.objects.create(
        quiz=quiz,
        user=request.user,
        score=score,
        total=total,
        answers=answers,  # IMPORTANT
        completed_at=timezone.now(),
    )

    return Response({
        "message": "Quiz submitted successfully",
        "attempt_id": str(attempt.id),
        "score": score,
        "total": total,
    })


# DASHBOARD HISTORY
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def attempt_history(request):
    attempts = QuizAttempt.objects.filter(user=request.user).order_by("-completed_at")

    data = []
    for a in attempts:
        data.append({
            "attempt_id": str(a.id),
            "quiz_id": str(a.quiz.id),
            "topic": a.quiz.topic,
            "difficulty": a.quiz.difficulty,
            "score": a.score,
            "total": a.total,
            "completed_at": a.completed_at.isoformat() if a.completed_at else None,
        })

    return Response({"attempts": data})


# NEW: ATTEMPT DETAIL (for clicking dashboard attempt card)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def attempt_detail(request, attempt_id):
    try:
        attempt = QuizAttempt.objects.get(id=attempt_id, user=request.user)
    except QuizAttempt.DoesNotExist:
        return Response({"error": "Attempt not found"}, status=404)

    quiz = attempt.quiz
    saved_answers = attempt.answers or {}

    questions = []
    for q in quiz.questions.all():
        qid = str(q.id)
        selected = saved_answers.get(qid)

        is_correct = selected == q.answer if selected else False

        questions.append({
            "id": qid,
            "question": q.question_text,
            "options": [q.option_a, q.option_b, q.option_c, q.option_d],
            "correct_answer": q.answer,
            "selected_answer": selected,
            "is_correct": is_correct,
        })

    return Response({
        "attempt_id": str(attempt.id),
        "quiz_id": str(quiz.id),
        "topic": quiz.topic,
        "difficulty": quiz.difficulty,
        "score": attempt.score,
        "total": attempt.total,
        "completed_at": attempt.completed_at.isoformat() if attempt.completed_at else None,
        "questions": questions,
    })
