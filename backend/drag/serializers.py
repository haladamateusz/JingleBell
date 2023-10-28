from rest_framework import serializers

class QuestionSerializer(serializers.Serializer):
    question = serializers.CharField()
    userId = serializers.CharField()

class FeedbackSerializer(serializers.Serializer):
    previousQuestion = serializers.CharField()
    previousResults = serializers.JSONField()
    feedback = serializers.ChoiceField(choices=['OKAY', 'BAD_GPT', 'BAD_DOCUMENTS'])
    userId = serializers.CharField()
