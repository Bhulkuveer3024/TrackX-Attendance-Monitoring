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


class TeamsImportSession(models.Model):
    lecturer = models.ForeignKey('authentication.Lecturer', on_delete=models.CASCADE)
    import_date = models.DateField()
    class_start_time = models.TimeField(null=True, blank=True)
    class_end_time = models.TimeField(null=True, blank=True)
    teams_students_found = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-import_date']

class TeamsImportResult(models.Model):
    STATUS_CHOICES = [
        ('present', 'Present'),
        ('discrepancy_campus_only', 'Discrepancy - Campus Only'),
        ('discrepancy_teams_only', 'Discrepancy - Teams Only'),
        ('absent', 'Absent'),
    ]
    
    session = models.ForeignKey(TeamsImportSession, on_delete=models.CASCADE, related_name='results')
    student = models.ForeignKey('authentication.Student', on_delete=models.CASCADE)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES)
    action = models.TextField()
    on_campus = models.BooleanField(default=False)
    in_teams = models.BooleanField(default=False)

    class Meta:
        ordering = ['student__full_name']