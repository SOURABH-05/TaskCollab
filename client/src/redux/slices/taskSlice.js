import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as taskService from '../../services/taskService';

const initialState = {
    tasks: [],
    currentTask: null,
    isLoading: false,
    isError: false,
    message: '',
};

// Get tasks
export const getTasks = createAsyncThunk(
    'task/getAll',
    async (params, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            return await taskService.getTasks(params, token);
        } catch (error) {
            const message =
                (error.response && error.response.data && error.response.data.message) ||
                error.message ||
                error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Create task
export const createTask = createAsyncThunk(
    'task/create',
    async (taskData, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            return await taskService.createTask(taskData, token);
        } catch (error) {
            const message =
                (error.response && error.response.data && error.response.data.message) ||
                error.message ||
                error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Update task
export const updateTask = createAsyncThunk(
    'task/update',
    async ({ taskId, taskData }, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            return await taskService.updateTask(taskId, taskData, token);
        } catch (error) {
            const message =
                (error.response && error.response.data && error.response.data.message) ||
                error.message ||
                error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Delete task
export const deleteTask = createAsyncThunk(
    'task/delete',
    async (taskId, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            await taskService.deleteTask(taskId, token);
            return taskId;
        } catch (error) {
            const message =
                (error.response && error.response.data && error.response.data.message) ||
                error.message ||
                error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Add comment
export const addTaskComment = createAsyncThunk(
    'task/addComment',
    async ({ taskId, text }, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            return await taskService.addTaskComment(taskId, text, token);
        } catch (error) {
            const message =
                (error.response && error.response.data && error.response.data.message) ||
                error.message ||
                error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Delete comment
export const deleteTaskComment = createAsyncThunk(
    'task/deleteComment',
    async ({ taskId, commentId }, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            await taskService.deleteTaskComment(taskId, commentId, token);
            return commentId;
        } catch (error) {
            const message =
                (error.response && error.response.data && error.response.data.message) ||
                error.message ||
                error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

export const taskSlice = createSlice({
    name: 'task',
    initialState,
    reducers: {
        reset: (state) => initialState,
        setCurrentTask: (state, action) => {
            state.currentTask = action.payload;
        },
        addTaskRealtime: (state, action) => {
            state.tasks.push(action.payload);
        },
        updateTaskRealtime: (state, action) => {
            const index = state.tasks.findIndex(t => t._id === action.payload._id);
            if (index !== -1) {
                state.tasks[index] = action.payload;
            }
            if (state.currentTask && state.currentTask._id === action.payload._id) {
                state.currentTask = action.payload;
            }
        },
        deleteTaskRealtime: (state, action) => {
            state.tasks = state.tasks.filter(t => t._id !== action.payload);
            if (state.currentTask && state.currentTask._id === action.payload) {
                state.currentTask = null;
            }
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(getTasks.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getTasks.fulfilled, (state, action) => {
                state.isLoading = false;
                state.tasks = action.payload.tasks;
            })
            .addCase(getTasks.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            .addCase(createTask.fulfilled, (state, action) => {
                state.tasks.push(action.payload);
            })
            .addCase(updateTask.fulfilled, (state, action) => {
                const index = state.tasks.findIndex(t => t._id === action.payload._id);
                if (index !== -1) {
                    state.tasks[index] = action.payload;
                }
                if (state.currentTask && state.currentTask._id === action.payload._id) {
                    state.currentTask = action.payload;
                }
            })
            .addCase(deleteTask.fulfilled, (state, action) => {
                state.tasks = state.tasks.filter(t => t._id !== action.payload);
            })
            .addCase(addTaskComment.fulfilled, (state, action) => {
                const comment = action.payload;
                // Currently we don't need to do much here since comments are inside tasks
                // But if we had a currentTask with comments, we'd update it
                // For now, let's just ensure no error
                state.isError = false;
            })
            .addCase(deleteTaskComment.fulfilled, (state, action) => {
                state.isError = false;
            });
    },
});

export const {
    reset,
    setCurrentTask,
    addTaskRealtime,
    updateTaskRealtime,
    deleteTaskRealtime,
} = taskSlice.actions;
export default taskSlice.reducer;
