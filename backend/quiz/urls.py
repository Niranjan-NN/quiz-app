from django.urls import path
from .views import create_quiz, get_quiz, submit_quiz, attempt_history, attempt_detail

urlpatterns = [
    path("create/", create_quiz),
    path("<uuid:quiz_id>/", get_quiz),
    path("<uuid:quiz_id>/submit/", submit_quiz),
    path("history/", attempt_history),
    path("attempt/<uuid:attempt_id>/", attempt_detail),
]
