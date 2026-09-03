import pytz
from rest_framework import serializers
from .models import CampusCheckin

# Helper functions to convert UTC datetime to NZST for display
def to_nzst_date(dt):
    if dt is None:
        return None
    nzst = pytz.timezone('Pacific/Auckland')
    return dt.astimezone(nzst).strftime('%d %B %Y')

def to_nzst_time(dt):
    if dt is None:
        return None
    nzst = pytz.timezone('Pacific/Auckland')
    return dt.astimezone(nzst).strftime('%H:%M')

# CampusCheckinSerializer - serializes the CampusCheckin model, including student name and ID, 
# check-in and check-out times separated into date and time, total hours, and photo URL.
class CampusCheckinSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(
        source='student.full_name',
        read_only=True
    )
    student_id = serializers.CharField(
        source='student.student_id',
        read_only=True
    )
    # Separate date and time fields in NZST
    checkin_date = serializers.SerializerMethodField()
    checkin_time_nzst = serializers.SerializerMethodField()
    checkout_time_nzst = serializers.SerializerMethodField()
    
    def get_checkin_date(self, obj):
        return to_nzst_date(obj.checkin_time)
    
    def get_checkin_time_nzst(self, obj):
        return to_nzst_time(obj.checkin_time)
    
    def get_checkout_time_nzst(self, obj):
        return to_nzst_time(obj.checkout_time)
    
    class Meta:
        model = CampusCheckin
        fields = [
            'id',
            'student_name',
            'student_id',
            'date',
            'checkin_date',
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