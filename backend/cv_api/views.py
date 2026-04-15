from __future__ import annotations

# A view is the function that handles an HTTP request and returns a response — the middle layer:
# URL → view → serializer → DB
# URL ← view ← serializer ← DB
# When React fetches /api/cv/ — Django routes it to cv_view
# This function decides what to do based on whether it's a GET or POST

from rest_framework import status  # HTTP status codes — 200 OK, 404 Not Found, 400 Bad Request etc
from rest_framework.authentication import SessionAuthentication
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication

from .models import CV
from .serializers import CVSerializer


class CsrfExemptSessionAuthentication(SessionAuthentication):
    """SessionAuthentication with CSRF enforcement disabled for cross-origin API use."""
    def enforce_csrf(self, request: Request) -> None:
        return  # skip CSRF check


@api_view(['GET', 'POST'])
@authentication_classes([JWTAuthentication, CsrfExemptSessionAuthentication])
@permission_classes([AllowAny])
def cv_view(request: Request) -> Response:
    """Retrieve or create/update the CV for the authenticated user."""
    if request.method == 'GET':
        # block unauthenticated users — can't load a CV without being logged in
        if not request.user.is_authenticated:
            return Response(
                {'detail': 'Login to load your CV'},
                status=status.HTTP_401_UNAUTHORIZED
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
            serializer = CVSerializer(cv, data=request.data)
        except CV.DoesNotExist:
            # no CV yet — don't pass instance → calls create()
            serializer = CVSerializer(data=request.data)

        if serializer.is_valid():
            # save() calls create() or update() depending on whether instance was passed above
            # user=request.user is passed as extra kwargs — merged into validated_data
            # this is how the CV gets linked to the logged in user
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            # validation failed — return dict of what went wrong
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # Unreachable — @api_view(['GET', 'POST']) returns 405 for other methods
    return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)
