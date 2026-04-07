# A view is the function that handles an HTTP request and returns a response — the middle layer:
# URL → view → serializer → DB
# URL ← view ← serializer ← DB
# When React fetches /api/cv/ — Django routes it to cv_view
# This function decides what to do based on whether it's a GET or POST


from django.views.decorators.csrf import csrf_exempt
from rest_framework import status  # HTTP status codes — 200 OK, 404 Not Found, 400 Bad Request etc
from rest_framework.authentication import SessionAuthentication
from rest_framework.decorators import api_view, authentication_classes, permission_classes # decorator — tells DRF which HTTP methods this view accepts
from rest_framework.permissions import AllowAny
from rest_framework.response import Response  # DRF response object — auto converts Python dict to JSON

from .models import CV
from .serializers import CVSerializer

class CsrfExemptSessionAuthentication(SessionAuthentication):
    def enforce_csrf(self, request):
        return  # skip CSRF check

@api_view(['GET', 'POST']) #request.data stops working without this decorator, would have to manully parse the JSON body, like:
#import json 
#data = json.loads(request.body) vs just: request.data. Also Method filtering stops working, any http method would be accepted - GET,POST,DELETE,PUT,PATCH etc and would have to handle or reject them manually. And response 
# removed @permission_classes([IsAuthenticated])
# this allows unauthenticated users to hit the endpoint (e.g. for future public features)
# but GET and POST still require login to interact with the DB
#plain function → you handle everything yourself
#@api_view      → DRF handles the boring stuff, I write the logic
@authentication_classes([CsrfExemptSessionAuthentication])
@permission_classes([AllowAny])
def cv_view(request): #this is tied to cv_api/urls.py in urlpatterns = [path('cv/', views.cv_view, name='cv')]
    #1. Someone visits /api/cv/
#2. Django matches it to cv_view via urlpatterns
#3. Django builds a request object from the HTTP request
#  (method, headers, body, user, cookies etc)
#4. Django calls cv_view(request) — passing that object in
#5. Your function runs with request available
    # request contains everything about the incoming HTTP request:
    # request.user   — the logged in user (or AnonymousUser if not logged in)
    # request.method — 'GET' or 'POST'
    # request.data   — the JSON body sent by React (for POST)

    if request.method == 'GET':
        # block unauthenticated users — can't load a CV without being logged in
        if not request.user.is_authenticated:
            return Response(
                {'detail': 'Login to load your CV'},
                status=status.HTTP_401_UNAUTHORIZED #status is a keyword argument
            )
        try:
            # fetch the CV belonging to the logged in user
            # .get() returns exactly one object or raises CV.DoesNotExist
            cv = CV.objects.get(user=request.user)
            # serialize CV object → Python dict → DRF auto converts to JSON
            serializer = CVSerializer(cv)
            return Response(serializer.data)
        except CV.DoesNotExist:
            # user is logged in but has no CV yet — return 404
            # React uses this to know to show the Sherlock demo instead
            return Response(
                {'detail': 'No CV found for this user'},
                status=status.HTTP_404_NOT_FOUND
            )

    if request.method == 'POST':
        # block unauthenticated users — can't save a CV without being logged in
        if not request.user.is_authenticated:
            return Response(
                {'detail': 'Login to save your CV'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        try:
            # try to find an existing CV for this user
            cv = CV.objects.get(user=request.user)
            # CV exists — pass instance to serializer → calls update()
            # CVSerializer(instance, data) → update path
            serializer = CVSerializer(cv, data=request.data)
        except CV.DoesNotExist:
            # no CV yet — don't pass instance → calls create()
            # CVSerializer(data) → create path
            serializer = CVSerializer(data=request.data)

        if serializer.is_valid():
            # save() calls create() or update() depending on whether instance was passed above
            # user=request.user is passed as extra kwargs — merged into validated_data
            # this is how the CV gets linked to the logged in user
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            # validation failed — return dict of what went wrong
            # e.g. {'email': ['Enter a valid email address']}
            # React can use these to show field-level error messages
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)