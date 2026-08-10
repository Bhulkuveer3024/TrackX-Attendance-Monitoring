from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import date, timedelta
from attendance.models import CampusCheckin
from authentication.models import Student
import requests

class Command(BaseCommand):
    help = 'Send weekly attendance warnings notifications to students '

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force run regardless of day',
        )

    def handle(self, *args, **options):
        today = date.today()

# Check if today is Thursday (weekday 3) or if --force is used
        if today.weekday() != 3 and not options['force']:
            self.stdout.write(
                self.style.WARNING('Today is not Thursday. Use --force to override.')
            )
            return
        
        # calculate start of the current week, i.e., Monday
        week_start = today - timedelta(days=today.weekday())

        self.stdout.write(f'Running weekly warnings for the week starting {week_start}')

        # Get all students
        students = Student.objects.all()
        notification_sent = 0

        for student in students:
            # Get the student's hours for the current week
            records = CampusCheckin.objects.filter(
                student=student, 
                date__gte=week_start,
                date__lte=today
            )

            total_hours = sum(float(r.total_hours) for r in records)
            hours_remaining = max(0, 20 - total_hours)

            #Skip if no push token is stored
            if not student.user.push_token:
                self.stdout.write(f'Skipping student {student.id} - no push token')
                continue

            # Build personalised message based on hours remaining   
            if total_hours >= 20:
                title = "Weekly Attendance"
                message = f"Great job! You've completed {total_hours} hours this week. Keep up the good work!"
            elif hours_remaining <= 4:
                title = "Weekly Attendance Warning"
                message = f"Warning! You have only {hours_remaining} hours remaining to meet the 20-hour requirement this week. Please attend campus today."
            else:
                title = " Attendance Reminder"
                message = f"You have completed {total_hours} hours this week. You need {hours_remaining} more hours to meet the 20-hour requirement."

                # Send push notification using the stored push token
                
                self.send_push_notification(
                    student.user.push_token,
                    title, 
                    message)
                notification_sent += 1
                self.stdout.write(f'Sent notification to student {student.id} - {title}: {message}')

        self.stdout.write(
            self.style.SUCCESS(f'Successfully sent {notification_sent} notifications for the week starting {week_start}'
            )
        )

    def send_push_notification(self, token, title, message):
        payload = {
            'to': token,
            'title': title,
            'body': message,
            'sound': 'default'
        }

        response = requests.post(  
            'https://exp.host/--/api/v2/push/send',
            json=payload,
            headers={
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        )
        return response.json()