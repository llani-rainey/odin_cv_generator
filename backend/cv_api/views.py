# A view is the function that handles an HTTP request and returns a response — the middle layer:
# URL → view → serializer → DB
# URL ← view ← serializer ← DB
# When React fetches /api/cv/ — Django routes it to cv_view
# This function decides what to do based on whether it's a GET or POST



from rest_framework import status  # HTTP status codes — 200 OK, 404 Not Found, 400 Bad Request etc
from rest_framework.authentication import SessionAuthentication
from rest_framework.decorators import api_view, authentication_classes, permission_classes # decorator — tells DRF which HTTP methods this view accepts
from rest_framework.permissions import AllowAny
from rest_framework.response import Response  # DRF response object — auto converts Python dict to JSON
from rest_framework_simplejwt.authentication import JWTAuthentication

from .models import CV
from .serializers import CVSerializer

class CsrfExemptSessionAuthentication(SessionAuthentication): #DRF ships with SessionAuthentication, a class that handles session cookie auth AND enforces CSRF, however we wanted session cookie auth but withotu CSRF enforcement. DRF doesn't provide that combination out of the box, so we inherited everything and then overrode the enforce_csrf that comes with it
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
@authentication_classes([JWTAuthentication, CsrfExemptSessionAuthentication])
@permission_classes([AllowAny]) #AllowAny - dont need to know who the user is to return the data, no login required. vs. IsAuthenticated (i.e GET /api/cv/ returns this user's CV, they must be logged in, otherwise 401.) vs. IsAdminUser, we whitelist all to access, but then restrict within the function below with custom messages etc
def cv_view(request): #this is tied to cv_api/urls.py in urlpatterns = [path('cv/', views.cv_view, name='cv')], could have called this banana but then also need to ensure cv_api/urls.py uses tha too: #django knows it needs to insert a request object it created here because its the function name used in cv_api.urls and it is a view fucntion meaning it is called with a request object when that url is hit, just convention to call the paramter request but could have called it anything but thats the object passed in
    # urlpatterns = [
#     path('cv/', views.cv_view/BANANA, name='cv'),  # must match the function name
# ]
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
            return Response( #impported from DRF at top, a DRF class, takes a python dict and converts to JSON to send to react
                {'detail': 'Login to load your CV'}, #detail is convention in DRF as the key for  error messages
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
        
    
# If wanted to introduce a delete functionality, would also have to add DELETE to the decorator    
# # if request.method == 'DELETE':
# #     if not request.user.is_authenticated:
# #         return Response(status=401)
# #     try:
# #         cv = CV.objects.get(user=request.user)
# #         cv.delete()  # Django ORM — deletes the CV and cascades to all children
# #         return Response({'detail': 'CV deleted'}, status=200)
# #     except CV.DoesNotExist:
# #         return Response({'detail': 'No CV to delete'}, status=404)


# GET    — fetch a CV, fetch a list of products, fetch a user profile
# POST   — create a new CV, submit a form, log in [we use post for create and update, technically should have used put/patch but used post for simpllicty 
# PUT    — replace entire CV with new version
# PATCH  — update just the email field on a CV
# DELETE — delete a CV, delete an account

# @api_view(['GET', 'POST'])
# # Q: which HTTP methods are allowed?
# # A: GET and POST only

# @authentication_classes([CsrfExemptSessionAuthentication])
# # Q: how do we know WHO is making the request?
# # A: read their session cookie, look them up in DB, set request.user vs these other  options:

        # @authentication_classes([SessionAuthentication])
        # # reads session cookie — standard for browser-based apps

        # @authentication_classes([TokenAuthentication])
        # # reads Authorization header: "Token abc123"
        # # common for mobile apps or third party API access

        # @authentication_classes([BasicAuthentication])
        # # reads username/password from Authorization header
        # # only for testing, never production

        # @authentication_classes([SessionAuthentication, TokenAuthentication])
        # # tries both — whichever works first wins
        # # useful if you have both browser users and API clients


# @permission_classes([AllowAny])
# # Q: is this user ALLOWED to access this view at all?
# # A: yes, everyone — we'll restrict inside the function