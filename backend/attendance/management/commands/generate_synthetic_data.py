from django.core.management.base import BaseCommand
from authentication.models import User, Student, Lecturer
from attendance.models import CampusCheckin
from faker import Faker

fake = Faker()

class Command(BaseCommand):
    help = 'Generate synthetic data for TrackX using Faker - wipes existing data and creates fresh records'

    DEPARTMENTS = [
        'IT Software',
        'IT Networking',
        'Artificial Intelligence',
        'Creative Arts',
        'Graphic Design',
        'Business Technology',
    ]

    def handle(self, *args, **options):
        self.stdout.write('Wiping existing data...')

        # Delete existing data
        CampusCheckin.objects.all().delete()
        Student.objects.all().delete()
        Lecturer.objects.all().delete()
        User.objects.all().delete()

        self.stdout.write('Creating admin account...')
        self.create_admin()

        self.stdout.write('Creating 15 lecturers...')
        self.create_lecturers()

        self.stdout.write('Creating 100 students...')
        self.create_students()

        self.stdout.write(self.style.SUCCESS(
            'Done. Created 1 admin, 15 lecturers, and 100 students.'
        ))

    def create_admin(self):
        
        User.objects.create_user(
            username='admin@tertiary.ac.nz',
            email='admin@tertiary.ac.nz',
            password='admin123',
            role='admin'
        )
        self.stdout.write('  Admin: admin@tertiary.ac.nz / admin123')

    def create_lecturers(self):
        import random
        for i in range(1, 16):
            lecturer_id = f'2026L{i:03d}'
            email = f'{lecturer_id.lower()}@tertiary.ac.nz'
            full_name = fake.name()
            department = random.choice(self.DEPARTMENTS)

            user = User.objects.create_user(
                username=email,
                email=email,
                password=lecturer_id,
                role='lecturer'
            )

            Lecturer.objects.create(
                user=user,
                lecturer_id=lecturer_id,
                full_name=full_name,
                department=department
            )
            self.stdout.write(f'  Lecturer: {full_name} | {email} | {department}')

    def create_students(self):
        for i in range(1, 101):
            student_id = f'2026{i:03d}'
            email = f'{student_id}@tertiary.ac.nz'
            full_name = fake.name()
            phone = fake.phone_number()[:10]
            user = User.objects.create_user(
                username=email,
                email=email,
                password=student_id,
                role='student'
            )

            Student.objects.create(
                user=user,
                student_id=student_id,
                full_name=full_name,
                phone=phone
            )
            self.stdout.write(f'  Student: {full_name} | {student_id} | {email}')