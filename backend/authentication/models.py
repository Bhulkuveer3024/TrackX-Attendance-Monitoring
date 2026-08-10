from django.contrib.auth.models import AbstractUser
from django.db import models

# Custom User model extending built-in AbstractUser with role field and lockout mechanism.
class User(AbstractUser):
    ROLE_CHOICES = (
        ('student', 'Student'),
        ('lecturer', 'Lecturer'),
        ('admin', 'Admin'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    failed_login_attempts = models.IntegerField(default=0)
    lockout_until = models.DateTimeField(null=True, blank=True)
    push_token = models.CharField(max_length=200, null=True, blank=True)

# The email field is set as the unique identifier for authentication, replacing the default username field.
    email = models.EmailField(unique=True)
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return f"{self.email} ({self.role})"

# Student model representing a student profile linked to the User model via a one-to-one relationship.
class Student(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    student_id = models.CharField(max_length=20, unique=True)
    full_name = models.CharField(max_length=100)
    phone = models.CharField(max_length=20, blank=True)
    
    def __str__(self):
        return self.full_name


# Lecturer model representing a lecturer profile linked to the User model via a one-to-one relationship.
class Lecturer(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    lecturer_id = models.CharField(max_length=20, unique=True)
    full_name = models.CharField(max_length=100)
    department = models.CharField(max_length=100, blank=True)
    
    def __str__(self):
        return self.full_name



