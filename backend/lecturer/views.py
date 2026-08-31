import csv 
import io
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
    import pytz
    nzst = pytz.timezone('Pacific/Auckland')

    checkin_data = []
    for checkin in checkins:
        checkin_time_nzst = checkin.checkin_time.astimezone(nzst).strftime('%H:%M') if checkin.checkin_time else None
        checkin_data.append({
             'student_id': checkin.student.student_id,
             'student_name': checkin.student.full_name,
             'checkin_time': checkin_time_nzst,
             'checkout_time': str(checkin.checkout_time) if checkin.checkout_time else None,
             'total_hours': checkin.total_hours,
             'photo_url': checkin.photo_url.url if checkin.photo_url else None,
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


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def import_teams_csv(request):
    lecturer = is_lecturer(request.user)
    if not lecturer:
        return Response(
            {'error': 'Lecturer profile not found'},
            status=status.HTTP_403_FORBIDDEN
        )

    if 'file' not in request.FILES:
        return Response(
            {'error': 'No file uploaded'},
            status=status.HTTP_400_BAD_REQUEST
        )

    uploaded_file = request.FILES['file']
    today = date.today()

    try:
       raw = uploaded_file.read()
       content = raw.decode('utf-8-sig')
    except UnicodeDecodeError:
         try:
            content = raw.decode('utf-16')
         except UnicodeDecodeError:
            content = raw.decode('utf-8', errors='ignore')
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    # Parse CSV using proper reader to handle quoted fields
    teams_students = set()
    reader = csv.reader(io.StringIO(content))
    in_participants_section = False

    for row in reader:
        if row and row[0].strip() == '2. Participants':
            in_participants_section = True
            continue
        
        if in_participants_section and row and row[0].strip().startswith('3.'):
            break
        
        if row and row[0].strip() == 'Name':
            continue
        
        if in_participants_section and len(row) >= 5:
            email = row[4].strip()
            if '@tertiary.ac.nz' in email:
                student_id = email.split('@')[0]
                teams_students.add(student_id)

    if not teams_students:
        return Response(
            {'error': 'No valid institutional emails found in file'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Get today's campus check-ins
    from attendance.models import CampusCheckin
    from authentication.models import Student

    campus_checkins = CampusCheckin.objects.filter(
        date=today
    ).select_related('student')

    campus_students = {
        checkin.student.student_id: checkin
        for checkin in campus_checkins
    }

    all_students = Student.objects.all()

    # Apply cross-referencing logic
    results = []

    for student in all_students:
        sid = student.student_id
        on_campus = sid in campus_students
        in_teams = sid in teams_students

        if on_campus and in_teams:
            cross_status = 'present'
            action = 'No action required'
        elif on_campus and not in_teams:
            cross_status = 'discrepancy_campus_only'
            action = 'Student on campus but absent from class'
        elif not on_campus and in_teams:
            cross_status = 'discrepancy_teams_only'
            action = 'Student in Teams but not on campus - does not satisfy attendance requirement'
        else:
            cross_status = 'absent'
            action = 'Student absent from both campus and class'

        results.append({
            'student_id': sid,
            'student_name': student.full_name,
            'on_campus': on_campus,
            'in_teams': in_teams,
            'status': cross_status,
            'action': action
        })

    summary = {
        'present': len([r for r in results if r['status'] == 'present']),
        'discrepancy_campus_only': len([r for r in results if r['status'] == 'discrepancy_campus_only']),
        'discrepancy_teams_only': len([r for r in results if r['status'] == 'discrepancy_teams_only']),
        'absent': len([r for r in results if r['status'] == 'absent']),
        'total': len(results)
    }

    return Response({
        'date': str(today),
        'teams_students_found': len(teams_students),
        'summary': summary,
        'results': results
    })