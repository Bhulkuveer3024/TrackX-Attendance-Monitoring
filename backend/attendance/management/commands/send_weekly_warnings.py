from django.core.management.base import BaseCommand
from datetime import date, timedelta
from attendance.models import CampusCheckin
from authentication.models import Student
import requests

class Command(BaseCommand):
    help = 'Send weekly attendance warning notifications to students'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force run regardless of day',
        )

    def handle(self, *args, **options):
        today = date.today()

        # Check if today is Thursday or --force flag used
        if today.weekday() != 3 and not options['force']:
            self.stdout.write(
                self.style.WARNING('Today is not Thursday. Use --force to override.')
            )
            return

        # Calculate start of current week (Monday)
        week_start = today - timedelta(days=today.weekday())
        self.stdout.write(f'Running weekly warnings for week starting {week_start}')

        students = Student.objects.all()
        notifications_sent = 0
        skipped = 0

        for student in students:
            # Skip students with no push token
            if not student.user.push_token:
                skipped += 1
                continue

            # Calculate weekly hours
            records = CampusCheckin.objects.filter(
                student=student,
                date__gte=week_start,
                date__lte=today
            )
            total_hours = sum(float(r.total_hours) for r in records)
            hours_remaining = max(0, 20 - total_hours)

            if total_hours >= 20:
                title = 'Weekly Attendance'
                message = f'Great work! You have completed {total_hours:.1f} hours this week.'
            elif hours_remaining <= 4:
                title = 'Attendance Warning'
                message = f'You need {hours_remaining:.1f} more hours. Please attend campus today.'
            else:
                title = 'Attendance Reminder'
                message = f'You have completed {total_hours:.1f} of 20 hours. {hours_remaining:.1f} hours remaining.'


            response = self.send_push_notification(
                student.user.push_token,
                title,
                message
            )
            print(f'Expo response for {student.full_name}:', response)
            notifications_sent += 1
            self.stdout.write(f'Sent to {student.full_name}: {message}')

        self.stdout.write(f'Skipped {skipped} students with no push token')
        self.stdout.write(
            self.style.SUCCESS(
                f'Done. Sent {notifications_sent} notifications. Skipped {skipped} students.'
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