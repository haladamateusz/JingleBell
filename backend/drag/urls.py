from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AskQuestionViewSet, SendFeedbackViewSet

router = DefaultRouter()
router.register(r'askQuestion', AskQuestionViewSet, basename='ask-question')
router.register(r'sendFeedback', SendFeedbackViewSet, basename='send-feedback')

urlpatterns = [
    path('', include(router.urls)),
]
