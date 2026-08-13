from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from datetime import date, timedelta
from authentication.models import User, Student, Lecturer
from attendance.models import CampusCheckin


# Verifying the role
def is_admin(user):
    return user.role == 'admin'

# Getting all the records
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def all_student_records(request):
    if not is_admin(request.user):
        return Response(
            {'error': 'Unauthorized access'}, 
            status=status.HTTP_403_FORBIDDEN
            )


    status_filter = request.query_params.get('status', None)

    today = date.today()
    week_start = today - timedelta(days=today.weekday())
    students = Student.objects.all()
    records =[]

    for student in students:
        weekly_checkins = CampusCheckin.objects.filter(
        student=student,
        date__gte = week_start,
        date__lte = today
    )

        total_hours = sum(float(r.total_hours) for r in weekly_checkins)
        if total_hours >= 20:
            attendance_status = 'compliant'
        elif total_hours >= 16:
            attendance_status = 'at_risk'
        else:
            attendance_status = 'non_compliant'     


        if status_filter and attendance_status != status_filter:
              continue

        records.append({
             'student_id' : student.student_id,
             'student_name' : student.full_name,
             'total_hours' : round(total_hours, 2),
             'email': student.user.email,
             'status' : attendance_status,
        })

    return Response({
         'week_starting' : str(week_start),
         'total_students' : len(records),
         'students' : records
    })    


# Overriding attendance records
@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def override_attendance(request):
    if not is_admin(request.user):
        return Response(
            {'error': 'Admin access required'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    student_id = request.data.get('student_id')
    date_str = request.data.get('date')
    checkin_time = request.data.get('checkin_time')
    checkout_time = request.data.get('checkout_time')
    notes = request.data.get('notes', '')
    
    if not student_id or not date_str:
        return Response(
            {'error': 'student_id and date are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        student = Student.objects.get(student_id=student_id)
    except Student.DoesNotExist:
        return Response(
            {'error': 'Student not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    try:
        from datetime import datetime
        target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        record, created = CampusCheckin.objects.get_or_create(
            student=student,
            date=target_date
        )
        
        if checkin_time:
              record.checkin_time = datetime.strptime(checkin_time, '%Y-%m-%d %H:%M:%S')
        if checkout_time:
              record.checkout_time = datetime.strptime(checkout_time, '%Y-%m-%d %H:%M:%S')
              record.calculate_hours()
        
        record.save()
        
        return Response({
            'message': f'Attendance record {"created" if created else "updated"} successfully',
            'student': student.full_name,
            'date': date_str,
            'total_hours': record.total_hours,
            'notes': notes
        })
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )



# Generating attendance summary report

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def attendance_summary(request):
    if not is_admin(request.user):
        return Response(
            {'error': 'Admin access required'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    student_id = request.query_params.get('student_id')
    if not student_id:
        return Response(
            {'error': 'student_id is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        student = Student.objects.get(student_id=student_id)
    except Student.DoesNotExist:
        return Response(
            {'error': 'Student not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Get last 4 weeks of records
    today = date.today()
    four_weeks_ago = today - timedelta(weeks=4)
    
    records = CampusCheckin.objects.filter(
        student=student,
        date__gte=four_weeks_ago,
        date__lte=today
    ).order_by('date')
    
    total_hours = sum(float(r.total_hours) for r in records)
    
    return Response({
        'student_id': student.student_id,
        'student_name': student.full_name,
        'period': f'{four_weeks_ago} to {today}',
        'total_hours': round(total_hours, 2),
        'records': [
            {
                'date': str(r.date),
                'checkin_time': str(r.checkin_time),
                'checkout_time': str(r.checkout_time) if r.checkout_time else None,
                'total_hours': float(r.total_hours)
            }
            for r in records
        ]
    })


# Resetting user password
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reset_password(request):
    if not is_admin(request.user):
        return Response(
            {'error': 'Admin access required'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    email = request.data.get('email')
    new_password = request.data.get('new_password')
    
    if not email or not new_password:
        return Response(
            {'error': 'email and new_password are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        user = User.objects.get(email=email)
        user.set_password(new_password)
        # Reset lockout if account was locked
        user.failed_login_attempts = 0
        user.lockout_until = None
        user.save()
        
        return Response({
            'message': f'Password reset successfully for {email}'
        })
    except User.DoesNotExist:
        return Response(
            {'error': 'User not found'},
            status=status.HTTP_404_NOT_FOUND
        )

