from rest_framework import viewsets, status
from rest_framework.response import Response
from .serializers import QuestionSerializer, FeedbackSerializer
from .my_llama_index import MyLlamaIndex
import os

my_llama_index = MyLlamaIndex(
    os.environ.get("LLAMA_INDEX_DATA_DIRECTORY")
    , os.environ.get("LLAMA_INDEX_METADATA_PATH"))

def query_model(question, user_id):
    return my_llama_index.get_response(question, user_id)

def handle_feedback(feedback, previousQuestion, previousResults):
    # Replace this with the actual implementation
    return [{'status': 'received'}]

class AskQuestionViewSet(viewsets.ViewSet):
    def create(self, request):
        serializer = QuestionSerializer(data=request.data)
        if serializer.is_valid():
            data = serializer.validated_data
            response_data = query_model(data['question'])
            return Response(response_data, status=status.HTTP_200_OK)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class SendFeedbackViewSet(viewsets.ViewSet):
    def create(self, request):
        serializer = FeedbackSerializer(data=request.data)
        if serializer.is_valid():
            data = serializer.validated_data
            response_data = handle_feedback(data['feedback'], data['previousQuestion'], data['previousResults'])
            return Response(response_data, status=status.HTTP_200_OK)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
