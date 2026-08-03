from rest_framework import serializers
from .models import CampusCheckin
from authentication.models import Student
import pytz
from datetime import datetime

# Helper function to convert UTC datetime to NZST for display
def to_nzst(dt):
    if dt is None:
        return None
    nzst = pytz.timezone('Pacific/Auckland')
    return dt.astimezone(nzst).strftime('%Y-%m-%d %H:%M:%S')

# CampusCheckinSerializer - serializes the CampusCheckin model, including student name and ID, check-in and check-out times, total hours, and photo URL.
class CampusCheckinSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(
        source='student.full_name',
        read_only=True
    )
    student_id = serializers.CharField(
        source='student.student_id',
        read_only=True
    )
    # Custom fields to return times in NZST instead of UTC
    checkin_time_nzst = serializers.SerializerMethodField()
    checkout_time_nzst = serializers.SerializerMethodField()
    
    def get_checkin_time_nzst(self, obj):
        return to_nzst(obj.checkin_time)
    
    def get_checkout_time_nzst(self, obj):
        return to_nzst(obj.checkout_time)
    
    class Meta:
        model = CampusCheckin
        fields = [
            'id',
            'student_name',
            'student_id',
            'date',
            'checkin_time_nzst',
            'checkout_time_nzst',
            'total_hours',
            'photo_url'
        ]
        read_only_fields = ['total_hours']

# CheckinRequestSerializer - validates incoming check-in requests from scanner device
class CheckinRequestSerializer(serializers.Serializer):
    student_id = serializers.CharField()
    photo = serializers.ImageField(required=False)