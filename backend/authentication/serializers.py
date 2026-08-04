from rest_framework import serializers
from .models import User, Student, Lecturer


# Serializer for the User model, including fields for id, email, and role.
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'role']

# Serializer for the Login endpoint, validating email and password fields.
class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)