from django.urls import path
from . import views

urlpatterns = [
    path('cv/', views.cv_view, name='cv'),
]