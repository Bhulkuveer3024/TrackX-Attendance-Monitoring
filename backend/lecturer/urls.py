from django.urls import path
from . import views

urlpatterns = [
    path('checkins/', views.daily_checkin_list, name='daily_checkin_list'),
    path('overview/', views.student_attendance_overview, name='student_attendance_overview'),
]