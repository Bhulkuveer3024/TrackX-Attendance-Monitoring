import qrcode
import io
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.utils import timezone
from django.http import HttpResponse
from datetime import date
from .models import CampusCheckin
from .serializers import CampusCheckinSerializer, CheckinRequestSerializer
from authentication.models import Student



# checkin endpoint allows a student to check in for the day, creating a new CampusCheckin record with the current timestamp and optional photo.
@api_view(['POST'])
@permission_classes([AllowAny])
def checkin(request):
    serializer = CheckinRequestSerializer(data=request.data)
    if serializer.is_valid():
        student_id = serializer.validated_data['student_id']
        # Find student by student_id, return error if not found
        try:
            student = Student.objects.get(student_id=student_id)
        except Student.DoesNotExist:
            return Response(
                {'error': 'Student not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        today = date.today()
        # Check if the student has already checked in today
        checkin_record, created = CampusCheckin.objects.get_or_create(
            student=student,
            date=today,
            defaults={'checkin_time': timezone.now()}
        )
        
        if not created:
            return Response(
                {'error': 'Student already checked in today'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if 'photo' in request.FILES:
            checkin_record.photo_url = request.FILES['photo']
            checkin_record.save()
        
        return Response(
            CampusCheckinSerializer(checkin_record).data,
            status=status.HTTP_201_CREATED
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# checkout endpoint allows a student to check out for the day, updating the existing CampusCheckin record with the current timestamp and calculating total hours spent on campus.
@api_view(['POST'])
@permission_classes([AllowAny])
def checkout(request):
    student_id = request.data.get('student_id')
    try:
        student = Student.objects.get(student_id=student_id)
    except Student.DoesNotExist:
        return Response(
            {'error': 'Student not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    today = date.today()
    # Finds the check-in record for today, returns error if not found or if already checked out
    try:
        checkin_record = CampusCheckin.objects.get(
            student=student,
            date=today
        )
    except CampusCheckin.DoesNotExist:
        return Response(
            {'error': 'No check-in found for today'},
            status=status.HTTP_404_NOT_FOUND
        )
    # Prevents duplicate checkouts
    if checkin_record.checkout_time:
        return Response(
            {'error': 'Student already checked out today'},
            status=status.HTTP_400_BAD_REQUEST
        )
    # Updates the checkout time and calculates total hours spent on campus
    checkin_record.checkout_time = timezone.now()
    checkin_record.save()
    checkin_record.calculate_hours()
    
    return Response(CampusCheckinSerializer(checkin_record).data)


# today_attendance endpoint returns the attendance record for the current day for the authenticated student.
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def today_attendance(request):
    try:
        student = Student.objects.get(user=request.user)
    except Student.DoesNotExist:
        return Response(
            {'error': 'Student profile not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    today = date.today()
    try:
        checkin_record = CampusCheckin.objects.get(
            student=student,
            date=today
        )
        return Response(CampusCheckinSerializer(checkin_record).data)
    except CampusCheckin.DoesNotExist:
        return Response({'message': 'No check-in recorded today'})


# weekly_attendance endpoint returns the total hours spent on campus for the current week, along with a compliance status based on a predefined threshold.
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def weekly_attendance(request):
    try:
        student = Student.objects.get(user=request.user)
    except Student.DoesNotExist:
        return Response(
            {'error': 'Student profile not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    from datetime import timedelta
    today = date.today()
    week_start = today - timedelta(days=today.weekday())
    
    records = CampusCheckin.objects.filter(
        student=student,
        date__gte=week_start,
        date__lte=today
    )
    # Calculate total hours and determine compliance status based on a threshold of 20 hours per week
    total_hours = sum(float(r.total_hours) for r in records)
    threshold = 20
    percentage = (total_hours / threshold) * 100

    # Determine compliance status based on total hours
    if total_hours >= threshold:
        attendance_status = 'compliant'
    elif total_hours >= threshold * 0.8:
        attendance_status = 'at_risk'
    else:
        attendance_status = 'non_compliant'
    
    return Response({
        'total_hours': round(total_hours, 2),
        'threshold': threshold,
        'percentage': round(percentage, 2),
        'status': attendance_status,
        'records': CampusCheckinSerializer(records, many=True).data
    })


# attendance_history endpoint returns the attendance records for the past four weeks, grouped by week, along with total hours and compliance status for each week.
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def attendance_history(request):
    try:
        student = Student.objects.get(user=request.user)
    except Student.DoesNotExist:
        return Response(
            {'error': 'Student profile not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    from datetime import timedelta
    today = date.today()
    four_weeks_ago = today - timedelta(weeks=4)
    
    records = CampusCheckin.objects.filter(
        student=student,
        date__gte=four_weeks_ago,
        date__lte=today
    ).order_by('-date')
    
    # Group records by week and calculate total hours and compliance status for each week
    weeks = {}
    for record in records:
        week_start = record.date - timedelta(days=record.date.weekday())
        week_key = week_start.strftime('%Y-%m-%d')
        
        if week_key not in weeks:
            weeks[week_key] = {
                'week_starting': week_key,
                'total_hours': 0,
                'records': []
            }
        
        weeks[week_key]['total_hours'] += float(record.total_hours)
        weeks[week_key]['records'].append(
            CampusCheckinSerializer(record).data
        )
    
    # Add compliance status to each week
    for week in weeks.values():
        hours = week['total_hours']
        if hours >= 20:
            week['status'] = 'compliant'
        elif hours >= 16:
            week['status'] = 'at_risk'
        else:
            week['status'] = 'non_compliant'
        week['total_hours'] = round(hours, 2)
    
    return Response({
        'weeks': list(weeks.values())
    })


# generate_qr endpoint generates a QR code for the authenticated student, encoding their student ID, and returns it as a PNG image response.
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def generate_qr(request):
    try:
        student = Student.objects.get(user=request.user)
    except Student.DoesNotExist:
        return Response(
            {'error': 'Student profile not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Generate QR code from student_id
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(student.student_id)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Save to buffer and return as image response
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    
    return HttpResponse(buffer, content_type='image/png')