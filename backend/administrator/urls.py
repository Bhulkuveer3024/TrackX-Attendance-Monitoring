from django.urls import path
from . import views

urlpatterns = [
    path('students/', views.all_student_records, name='all_student_records'),
    path('override/', views.override_attendance, name='override_attendance'),
    path('summary/', views.attendance_summary, name='attendance_summary'),
    path('reset-password/', views.reset_password, name='reset_password'),
]