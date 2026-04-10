"""
URL configuration for core project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.contrib.auth import logout
from django.shortcuts import redirect
from django.urls import path, include

def logout_view(request):
    logout(request)
    return redirect('http://localhost:5173')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('accounts/logout/', logout_view, name='logout'), #(route, view/what to run, optional nickname so can reference this url elsewhere without hardcoding the string), logout_view is function defined above using the built in logout(request) imported utility function at the top
    
    #   must come BEFORE path('accounts/') — Django checks top to bottom,
#   first match wins. If accounts/ came first it would swallow logout/ before
#   this line is ever checked.

    path('accounts/', include('allauth.urls')), #reverse('logout') would return '/accounts/logout/'. include accepts either a string or an actual module, when you pass a string, Django does the import internally for you, no need to do it yourself at the top (which is more verbose like: 
    
    #from allauth import urls as allauth_urls
    #path('accounts/', include(allauth_urls))
    
#   /accounts/* → delegated to allauth's bundled urls.py (inside .venv).
#   'accounts/' is just a prefix/namespace, not a view itself — hitting
#   /accounts/ alone would 404. The actual views live inside allauth:
#       /accounts/google/login/          → allauth's GoogleLoginView
#       /accounts/google/login/callback/ → allauth's OAuth callback view
#       /accounts/login/                 → allauth's login view
#   'allauth.urls' is a Python import path — find the urls module
#   inside the allauth package, same as `import allauth` would.
    
    path('api/', include('cv_api.urls')), #include means dont handle this here, delegate it to another urls.py file. any request starting with /api/ hand off to cv_api/urls.py
]