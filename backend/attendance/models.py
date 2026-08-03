from django.db import models
from authentication.models import User, Student


# This model represents the campus check-in record for a student, including fields for the student, date, check-in time, check-out time, total hours spent on campus, and an optional photo URL.
class CampusCheckin(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    date = models.DateField(auto_now_add=False)
    checkin_time = models.DateTimeField(null=True, blank=True)
    checkout_time = models.DateTimeField(null=True, blank=True)
    total_hours = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    photo_url = models.ImageField(upload_to='checkins/', null=True, blank=True)

    # Meta class prevents duplicate check-in record for same student on same date
    class Meta:
        unique_together = ['student', 'date']

    # Calculates total hours
    def calculate_hours(self):
        if self.checkin_time and self.checkout_time:
            diff = self.checkout_time - self.checkin_time
            self.total_hours = round(diff.total_seconds() / 3600, 2)
            self.save()
        return self.total_hours
    
    def __str__(self):
        return f"{self.student.full_name} - {self.date}"