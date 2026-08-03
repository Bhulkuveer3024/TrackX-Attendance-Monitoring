from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.utils import timezone
from .serializers import UserSerializer, LoginSerializer
from .models import User
import pytz


# Login endpoint accepts email and password, authenticates the user, and returns JWT tokens.
@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    # Validate input data using LoginSerializer
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        email = serializer.validated_data['email']
        password = serializer.validated_data['password']

        # Check if the user exists in the database
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {'error': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Check if account is locked
        if user.lockout_until and user.lockout_until > timezone.now():
           nzst = pytz.timezone('Pacific/Auckland')
           lockout_local = user.lockout_until.astimezone(nzst)
           return Response(
                 {'error': f'Account locked. Try again after {lockout_local.strftime("%H:%M")}'},
                 status=status.HTTP_403_FORBIDDEN
    )
        
        # Authenticates user against database
        auth_user = authenticate(request, username=email, password=password)
        
        if auth_user:
            # Resets failed attempts on successful login
            user.failed_login_attempts = 0
            user.lockout_until = None
            user.save()
            
            refresh = RefreshToken.for_user(user)
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'role': user.role,
                'user': UserSerializer(user).data
            })
        else:
            # Increment failed attempts
            user.failed_login_attempts += 1
            
            if user.failed_login_attempts >= 3:
                from datetime import timedelta
                user.lockout_until = timezone.now() + timedelta(minutes=15)
                user.failed_login_attempts = 0
                user.save()
                return Response(
                    {'error': 'Account locked for 15 minutes due to too many failed attempts'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            user.save()
            attempts_remaining = 3 - user.failed_login_attempts
            return Response(
                {'error': f'Invalid credentials. {attempts_remaining} attempts remaining'},
                status=status.HTTP_401_UNAUTHORIZED
            )
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Logout endpoint blacklists the refresh token, effectively logging the user out.
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    try:
        refresh_token = request.data['refresh']
        token = RefreshToken(refresh_token)
        token.blacklist()
        return Response({'message': 'Logged out successfully'})
    except Exception:
        return Response(
            {'error': 'Invalid token'}, 
            status=status.HTTP_400_BAD_REQUEST
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_user(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)