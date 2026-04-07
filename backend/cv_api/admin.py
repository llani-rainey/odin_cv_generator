from django.contrib import admin
from .models import CV, HeaderLink, Section, Entry, Bullet

admin.site.register(CV)
admin.site.register(HeaderLink)
admin.site.register(Section)
admin.site.register(Entry)
admin.site.register(Bullet)