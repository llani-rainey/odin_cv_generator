from django.urls import path
from . import views

urlpatterns = [
    path('cv/', views.cv_view, name='cv'),
]


# React: fetch('/api/cv/')
#     ↓
# core/urls.py: path('api/', include('cv_api.urls'))
#     strips 'api/', passes 'cv/' to cv_api/urls.py
#     ↓
# cv_api/urls.py: path('cv/', views.cv_view, name='cv')
#     matches 'cv/' → runs cv_view function
#     ↓
# cv_api/views.py: def cv_view(request):
#     handles GET or POST, returns JSON response
#     ↓
# React receives the response

