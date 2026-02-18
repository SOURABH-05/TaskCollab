import api from './api';

export const createList = async (listData, token) => {
    const response = await api.post('/lists', listData, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};

export const updateList = async (listId, listData, token) => {
    const response = await api.put(`/lists/${listId}`, listData, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};

export const deleteList = async (listId, token) => {
    const response = await api.delete(`/lists/${listId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};
