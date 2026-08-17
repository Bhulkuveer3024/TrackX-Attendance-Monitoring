# TrackX-Attendance-Monitoring

A cross-platform mobile attendance tracking application built for tertiary education institutions. TrackX provides real-time attendance visibility for students, automated at-risk notifications, and streamlined attendance management for lecturers and administrators.

## Tech Stack

**Frontend**
- React Native with Expo
- Axios for API communication
- AsyncStorage for JWT token persistence
- Expo Notifications for push alerts

**Backend**
- Django 6.0 with Django REST Framework
- PostgreSQL hosted on Railway
- JWT authentication via djangorestframework-simplejwt
- Faker for synthetic data generation

## Project Structure
TrackX-Attendance-Monitoring/
├── backend/ # Django REST Framework API
│ ├── authentication/ # User auth, JWT, account lockout
│ ├── attendance/ # Check-in, checkout, QR, history
│ ├── lecturer/ # Lecturer dashboard endpoints
│ ├── administrator/ # Admin dashboard endpoints
│ └── trackx/ # Django project settings
├── frontend/
│ └── TrackX/ # React Native Expo application
│ ├── app/ # Screens (login, student, lecturer, admin)
│ └── services/ # API and notification services
└── README.md

## Prerequisites

- Python 3.12+
- Node.js 18+
- Expo CLI
- PostgreSQL database (Railway recommended)

## Backend Setup

**1. Clone the repository**
```bash
git clone https://github.com/Bhulkuveer3024/TrackX-Attendance-Monitoring.git
cd TrackX-Attendance-Monitoring/backend
```

**2. Create and activate virtual environment**
```bash
python -m venv venv
source venv/bin/activate  # Mac/Linux
venv\Scripts\activate     # Windows
```

**3. Install dependencies**
```bash
pip install -r requirements.txt
```

**4. Configure environment variables**

Create a `.env` file in the `backend` folder:
SECRET_KEY=your_django_secret_key
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_HOST=your_database_host
DB_PORT=your_database_port
DEBUG=True

**5. Run migrations**
```bash
python manage.py migrate
```

**6. Generate synthetic data**
```bash
python manage.py generate_synthetic_data
```

**7. Start the server**
```bash
python manage.py runserver
```

## Frontend Setup

**1. Navigate to frontend**
```bash
cd frontend/TrackX
```

**2. Install dependencies**
```bash
npm install
```

**3. Configure API URL**

In `services/api.js` update `BASE_URL`:
```javascript
// Android emulator
const BASE_URL = 'http://10.0.2.2:8000/api';

// iOS simulator or physical device
const BASE_URL = 'http://YOUR_MAC_IP:8000/api';

// Production
const BASE_URL = 'https://your-railway-url.railway.app/api';
```

**4. Start Expo**
```bash
npx expo start
```

## Test Credentials

After running `generate_synthetic_data`:

| Role | Email | Password |
|---|---|---|
| Admin | admin@tertiary.ac.nz | admin123 |
| Student | 2026001@tertiary.ac.nz | 2026001 |
| Lecturer | 2026l001@tertiary.ac.nz | 2026L001 |

## API Endpoints

| Endpoint | Method | Role | Description |
|---|---|---|---|
| `/api/auth/login/` | POST | Public | Authenticate and receive JWT tokens |
| `/api/auth/logout/` | POST | All | Invalidate refresh token |
| `/api/auth/me/` | GET | All | Get current user details |
| `/api/auth/push-token/` | POST | All | Register push notification token |
| `/api/attendance/checkin/` | POST | Scanner | Record student check-in |
| `/api/attendance/checkout/` | POST | Scanner | Record student check-out |
| `/api/attendance/today/` | GET | Student | Today's attendance record |
| `/api/attendance/weekly/` | GET | Student | Current week hours and status |
| `/api/attendance/history/` | GET | Student | Last 4 weeks attendance |
| `/api/attendance/qr/` | GET | Student | Generate personal QR code |
| `/api/lecturer/checkins/` | GET | Lecturer | Daily campus check-in list |
| `/api/admin/students/` | GET | Admin | All student records |
| `/api/admin/override/` | PUT | Admin | Override attendance record |
| `/api/admin/summary/` | GET | Admin | Student attendance summary |
| `/api/admin/reset-password/` | POST | Admin | Reset user password |

## Management Commands

```bash
# Generate synthetic data (wipes existing)
python manage.py generate_synthetic_data

# Send weekly warning notifications
python manage.py send_weekly_warnings

# Force send notifications (any day)
python manage.py send_weekly_warnings --force
```

## Security

- JWT access tokens expire after 24 hours
- Refresh tokens expire after 7 days
- Account lockout after 3 consecutive failed login attempts (15 minutes)
- All sensitive credentials stored in `.env` file — never committed to version control
- Role-based access control enforced on all API endpoints
- HTTPS required for production deployment

## Known Limitations

- Teams CSV import pending confirmation of file format from technical supervisor
- Push notifications require a development build (not supported in Expo Go SDK 53+)
- Admin dashboard student list may be slow with large datasets due to N+1 query issue (planned optimisation)
- QR loophole: students can check in and leave campus — acknowledged as known constraint

## Development Notes

- Android emulator uses `10.0.2.2` to reach host machine localhost
- Physical iOS devices require Mac's local network IP address
- Run `generate_synthetic_data` after any database reset to restore test data