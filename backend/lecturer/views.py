import csv 
import io
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from datetime import date
from authentication.models import Lecturer, Student
from attendance.models import CampusCheckin, TeamsImportResult
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
        checkin_date = checkin.checkin_time.astimezone(nzst).strftime('%d %B %Y')
        checkin_time_only = checkin.checkin_time.astimezone(nzst).strftime('%H:%M')

        checkin_data.append({
            'student_id': checkin.student.student_id,
            'student_name': checkin.student.full_name,
            'checkin_date': checkin_date,
            'checkin_time': checkin_time_only,
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

    # Read and decode file
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

    # Parse class start and end time from Summary section
    from datetime import datetime as dt
    class_start_time = None
    class_end_time = None

    reader_for_time = csv.reader(io.StringIO(content))
    for row in reader_for_time:
        if not row:
            continue
        if row[0].strip().startswith('2.'):
            break
        if row[0].strip() == 'Start time' and len(row) >= 2:
            try:
                start_str = row[1].strip().strip('"')
                parsed = dt.strptime(start_str, '%m/%d/%y, %I:%M:%S %p')
                class_start_time = parsed.time()
            except Exception:
                pass
        if row[0].strip() == 'End time' and len(row) >= 2:
            try:
                end_str = row[1].strip().strip('"')
                parsed = dt.strptime(end_str, '%m/%d/%y, %I:%M:%S %p')
                class_end_time = parsed.time()
            except Exception:
                pass

    # Parse participants section
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
    from attendance.models import CampusCheckin, TeamsImportSession, TeamsImportResult
    from authentication.models import Student
    import pytz

    nzst = pytz.timezone('Pacific/Auckland')

    campus_checkins = CampusCheckin.objects.filter(
        date=today
    ).select_related('student')

    # Build campus students dict with time-aware check
    campus_students = {}
    for checkin in campus_checkins:
        sid = checkin.student.student_id

        # If class time is available, check if student was on campus during class
        if class_start_time and class_end_time and checkin.checkin_time:
            checkin_local = checkin.checkin_time.astimezone(nzst).time()
            checkout_local = checkin.checkout_time.astimezone(nzst).time() if checkin.checkout_time else None

            # Student was on campus during class if:
            # They checked in before class ended AND checked out after class started (or still on campus)
            was_during_class = (
                checkin_local <= class_end_time and
                (checkout_local is None or checkout_local >= class_start_time)
            )
            if was_during_class:
                campus_students[sid] = checkin
        else:
            # No class time available use any check-in for today
            campus_students[sid] = checkin

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

    # Save import session to database
    session = TeamsImportSession.objects.create(
        lecturer=lecturer,
        import_date=today,
        class_start_time=class_start_time,
        class_end_time=class_end_time,
        teams_students_found=len(teams_students)
    )


    # Save all results in one database query using bulk_create
    student_map = {s.student_id: s for s in Student.objects.all()}
    result_objects = []
    for result in results:
        student_obj = student_map.get(result['student_id'])
        if student_obj:
            result_objects.append(TeamsImportResult(
                session=session,
                student=student_obj,
                status=result['status'],
                action=result['action'],
                on_campus=result['on_campus'],
                in_teams=result['in_teams']
                ))

    TeamsImportResult.objects.bulk_create(result_objects)



    summary = {
        'present': len([r for r in results if r['status'] == 'present']),
        'discrepancy_campus_only': len([r for r in results if r['status'] == 'discrepancy_campus_only']),
        'discrepancy_teams_only': len([r for r in results if r['status'] == 'discrepancy_teams_only']),
        'absent': len([r for r in results if r['status'] == 'absent']),
        'total': len(results)
    }

    return Response({
        'date': str(today),
        'class_start_time': str(class_start_time) if class_start_time else None,
        'class_end_time': str(class_end_time) if class_end_time else None,
        'teams_students_found': len(teams_students),
        'summary': summary,
        'results': results,
        'session_id': session.id
    })

# Endpoint for viewing historical import sessions
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def import_history(request):
    lecturer = is_lecturer(request.user)
    if not lecturer:
        return Response(
            {'error': 'Lecturer profile not found'},
            status=status.HTTP_403_FORBIDDEN
        )

    from attendance.models import TeamsImportSession

    sessions = TeamsImportSession.objects.filter(
        lecturer=lecturer
    ).order_by('-import_date')[:10]

    history = []
    for session in sessions:
        history.append({
            'session_id': session.id,
            'import_date': str(session.import_date),
            'class_start_time': str(session.class_start_time) if session.class_start_time else None,
            'class_end_time': str(session.class_end_time) if session.class_end_time else None,
            'teams_students_found': session.teams_students_found,
            'summary': {
                'present': session.results.filter(status='present').count(),
                'discrepancy_campus_only': session.results.filter(status='discrepancy_campus_only').count(),
                'discrepancy_teams_only': session.results.filter(status='discrepancy_teams_only').count(),
                'absent': session.results.filter(status='absent').count(),
            }
        })

    return Response({
        'total_sessions': len(history),
        'sessions': history
    })