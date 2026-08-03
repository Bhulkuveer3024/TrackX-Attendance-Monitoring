from rest_framework import serializers
from .models import CampusCheckin
from authentication.models import Student


# CampusCheckinSerializer serializes the CampusCheckin model, including fields for student name, student ID, date, check-in time, check-out time, total hours spent on campus, and an optional photo URL.
class CampusCheckinSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(
        source='student.full_name', 
        read_only=True
    )
    student_id = serializers.CharField(
        source='student.student_id', 
        read_only=True
    )
    
    class Meta:
        model = CampusCheckin
        fields = [
            'id',
            'student_name',
            'student_id', 
            'date',
            'checkin_time',
            'checkout_time',
            'total_hours',
            'photo_url'
        ]
        read_only_fields = ['total_hours']

# CheckinRequestSerializer is used to validate the check-in request data, including the student ID and an optional photo.
class CheckinRequestSerializer(serializers.Serializer):
    student_id = serializers.CharField()
    photo = serializers.ImageField(required=False)