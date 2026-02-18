import api from './api';

export const register = async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
};

export const login = async (userData) => {
    const response = await api.post('/auth/login', userData);
    return response.data;
};

export const getMe = async (token) => {
    const response = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};
