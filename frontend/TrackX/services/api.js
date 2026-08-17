import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';


const BASE_URL = 'http://10.0.2.2:8000/api';

// Creating an axios instance with base URL
const api = axios.create({
    baseURL: BASE_URL,
});

// Request interceptor automatically adds JWT token to every request
api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor - automatically refresh expired tokens
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            
            try {
                const refreshToken = await AsyncStorage.getItem('refresh_token');
                
                if (!refreshToken) {
                    // No refresh token - force logout
                    await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user_role']);
                    return Promise.reject(error);
                }
                
                // Get new access token using refresh token
                const response = await axios.post(
                    `${BASE_URL}/auth/refresh/`,
                    { refresh: refreshToken }
                );
                
                const newAccessToken = response.data.access;
                
                // Save new access token
                await AsyncStorage.setItem('access_token', newAccessToken);
                
                // Retry original request with new token
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return api(originalRequest);
                
            } catch (refreshError) {
                // Refresh failed - force logout
                await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user_role']);
                return Promise.reject(refreshError);
            }
        }
        
        return Promise.reject(error);
    }
);

// Auth functions
export const loginUser = async (email, password) => {
    const response = await api.post('/auth/login/', { email, password });
    await AsyncStorage.setItem('access_token', response.data.access);
    await AsyncStorage.setItem('refresh_token', response.data.refresh);
    await AsyncStorage.setItem('user_role', response.data.role);
    return response.data;
};

export const logoutUser = async () => {
    const refresh = await AsyncStorage.getItem('refresh_token');
    await api.post('/auth/logout/', { refresh });
    // Clearing all stored tokens
    await AsyncStorage.removeItem('access_token');
    await AsyncStorage.removeItem('refresh_token');
    await AsyncStorage.removeItem('user_role');
};

// Attendance functions
export const getTodayAttendance = async () => {
    const response = await api.get('/attendance/today/');
    return response.data;
};

export const getWeeklyAttendance = async () => {
    const response = await api.get('/attendance/weekly/');
    return response.data;
};

export const getAttendanceHistory = async () => {
    const response = await api.get('/attendance/history/');
    return response.data;
};

export const getQRCode = async () => {
    const response = await api.get('/attendance/qr/', {
        responseType: 'blob'
    });
    return response.data;
};

export const checkin = async (studentId) => {
    const response = await api.post('/attendance/checkin/', {
        student_id: studentId
    });
    return response.data;
};

export const checkout = async (studentId) => {
    const response = await api.post('/attendance/checkout/', {
        student_id: studentId
    });
    return response.data;
};

export default api;