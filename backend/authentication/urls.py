from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.login, name='login'),
    path('logout/', views.logout, name='logout'),
    path('me/', views.get_current_user, name='current_user'),
    path('push-token/', views.save_push_token, name='save_push_token'),
]