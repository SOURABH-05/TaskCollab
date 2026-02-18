import api from './api';

export const getBoards = async (token) => {
    const response = await api.get('/boards', {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};

export const getBoard = async (boardId, token) => {
    const response = await api.get(`/boards/${boardId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};

export const createBoard = async (boardData, token) => {
    const response = await api.post('/boards', boardData, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};

export const updateBoard = async (boardId, boardData, token) => {
    const response = await api.put(`/boards/${boardId}`, boardData, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};

export const deleteBoard = async (boardId, token) => {
    const response = await api.delete(`/boards/${boardId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};
