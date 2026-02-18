import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as listService from '../../services/listService';

const initialState = {
    lists: [],
    isLoading: false,
    isError: false,
    message: '',
};

// Create list
export const createList = createAsyncThunk(
    'list/create',
    async (listData, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            return await listService.createList(listData, token);
        } catch (error) {
            const message =
                (error.response && error.response.data && error.response.data.message) ||
                error.message ||
                error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Update list
export const updateList = createAsyncThunk(
    'list/update',
    async ({ listId, listData }, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            return await listService.updateList(listId, listData, token);
        } catch (error) {
            const message =
                (error.response && error.response.data && error.response.data.message) ||
                error.message ||
                error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Delete list
export const deleteList = createAsyncThunk(
    'list/delete',
    async (listId, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            await listService.deleteList(listId, token);
            return listId;
        } catch (error) {
            const message =
                (error.response && error.response.data && error.response.data.message) ||
                error.message ||
                error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

export const listSlice = createSlice({
    name: 'list',
    initialState,
    reducers: {
        reset: (state) => initialState,
        addListRealtime: (state, action) => {
            state.lists.push(action.payload);
        },
        updateListRealtime: (state, action) => {
            const index = state.lists.findIndex(l => l._id === action.payload._id);
            if (index !== -1) {
                state.lists[index] = action.payload;
            }
        },
        deleteListRealtime: (state, action) => {
            state.lists = state.lists.filter(l => l._id !== action.payload);
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(createList.fulfilled, (state, action) => {
                state.lists.push(action.payload);
            })
            .addCase(updateList.fulfilled, (state, action) => {
                const index = state.lists.findIndex(l => l._id === action.payload._id);
                if (index !== -1) {
                    state.lists[index] = action.payload;
                }
            })
            .addCase(deleteList.fulfilled, (state, action) => {
                state.lists = state.lists.filter(l => l._id !== action.payload);
            });
    },
});

export const { reset, addListRealtime, updateListRealtime, deleteListRealtime } = listSlice.actions;
export default listSlice.reducer;
