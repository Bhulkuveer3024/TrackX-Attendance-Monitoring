from django.urls import path
from . import views

urlpatterns = [
    path('checkin/', views.checkin, name='checkin'),
    path('checkout/', views.checkout, name='checkout'),
    path('today/', views.today_attendance, name='today_attendance'),
    path('weekly/', views.weekly_attendance, name='weekly_attendance'),
    path('history/', views.attendance_history, name='attendance_history'),
    path('qr/', views.generate_qr, name='generate_qr'),
]