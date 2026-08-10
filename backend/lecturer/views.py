from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from datetime import date
from authentication.models import Lecturer, Student
from attendance.models import CampusCheckin
from attendance.serializers import CampusCheckinSerializer

# Helper function to check if user is a lecturer
def is_lecturer(user):
    try:
        return Lecturer.objects.get(user=user)
    except Lecturer.DoesNotExist:
        return None

# Get daily check-ins list
@api_view(['GET'])
@permission_classes([IsAuthenticated])    
def daily_checkin_list(request):
    lecturer = is_lecturer(request.user)
    if not lecturer:
        return Response({'error': 'Lecture profile not found'}, 
                        status=status.HTTP_403_FORBIDDEN
        )

    # Get data from query parameters
    date_str = request.query_params.get('date', None)
    if date_str:
        try:
            from datetime import datetime
            target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return Response({'error': 'Invalid date format. Use YYYY-MM-DD.'}, 
                            status=status.HTTP_400_BAD_REQUEST
            )
    else:
        target_date = date.today()  

    # Get all check-ins for the specified date
    checkins = CampusCheckin.objects.filter(date=target_date) . select_related('student', 'student__user')

    # Build response data
    checkin_data = []
    for checkin in checkins:
        checkin_data.append ({
            'student_id': checkin.student.id,
            'student_name': checkin.student.user.get_full_name(),
            'checkin_time': str(checkin.checkin_time),
            'checkout_time': str(checkin.checkout_time) if checkin.checkout_time else None,
            'total_hours': checkin.total_hours,
            'photo_url': checkin.photo.url if checkin.photo else None,
        })

    return Response({
        'date': str(target_date),
        'total_checkins': len(checkin_data),
        'checkins': checkin_data
    })

# Weekly attendance summary
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_attendance_overview(request):
    lecturer = is_lecturer(request.user)
    if not lecturer:
        return Response({'error': 'Lecture profile not found'}, 
                        status=status.HTTP_404_NOT_FOUND
        )

    from datetime import timedelta
    today = date.today()
    week_start = today - timedelta(days=today.weekday())

    Students = Student.objects.all()
    overview = []

    for student in Students:
        records = CampusCheckin.objects.filter(
            student=student, 
            date__gte=week_start,
            date__lte=today
        )

        total_hours = sum(float(r.total_hours) for r in records)
        if total_hours >= 20:
            attendance_status = "Compliant"
        elif total_hours >= 16:
            attendance_status = "At- Risk"
        else:
            attendance_status = "Non - Compliant"

        overview.append({
            'student_id': student.student_id,
            'student_name': student.user.get_full_name(),
            'total_hours': round(total_hours, 2),
            'status': attendance_status
        })

    return Response({
        'week_start': str(week_start),
        'total_students': len(overview),
        'students': overview
    })      