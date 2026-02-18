import api from './api';

export const getMessages = async (boardId, page = 1) => {
    const response = await api.get(`/chat/${boardId}`, {
        params: { page, limit: 50 },
    });
    return response.data;
};
