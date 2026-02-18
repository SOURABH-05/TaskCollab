import api from './api';

export const getTasks = async (params, token) => {
    const response = await api.get('/tasks', {
        params,
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};

export const createTask = async (taskData, token) => {
    const response = await api.post('/tasks', taskData, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};

export const updateTask = async (taskId, taskData, token) => {
    const response = await api.put(`/tasks/${taskId}`, taskData, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};

export const deleteTask = async (taskId, token) => {
    const response = await api.delete(`/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};

export const getTaskActivity = async (taskId, token) => {
    const response = await api.get(`/activity/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};

export const addTaskComment = async (taskId, text, token) => {
    const response = await api.post(`/tasks/${taskId}/comments`, { text }, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};

export const deleteTaskComment = async (taskId, commentId, token) => {
    const response = await api.delete(`/tasks/${taskId}/comments/${commentId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};
