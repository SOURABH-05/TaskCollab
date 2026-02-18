import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as boardService from '../../services/boardService';
import { createTask, updateTask, deleteTask } from './taskSlice';
import { createList, deleteList } from './listSlice';

const initialState = {
    boards: [],
    currentBoard: null,
    isLoading: false,
    isError: false,
    message: '',
};

// Get all boards
export const getBoards = createAsyncThunk(
    'board/getAll',
    async (_, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            return await boardService.getBoards(token);
        } catch (error) {
            const message =
                (error.response && error.response.data && error.response.data.message) ||
                error.message ||
                error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Get single board
export const getBoard = createAsyncThunk(
    'board/getOne',
    async (boardId, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            return await boardService.getBoard(boardId, token);
        } catch (error) {
            const message =
                (error.response && error.response.data && error.response.data.message) ||
                error.message ||
                error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Create board
export const createBoard = createAsyncThunk(
    'board/create',
    async (boardData, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            return await boardService.createBoard(boardData, token);
        } catch (error) {
            const message =
                (error.response && error.response.data && error.response.data.message) ||
                error.message ||
                error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Update board
export const updateBoard = createAsyncThunk(
    'board/update',
    async ({ boardId, boardData }, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            return await boardService.updateBoard(boardId, boardData, token);
        } catch (error) {
            const message =
                (error.response && error.response.data && error.response.data.message) ||
                error.message ||
                error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Delete board
export const deleteBoard = createAsyncThunk(
    'board/delete',
    async (boardId, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            await boardService.deleteBoard(boardId, token);
            return boardId;
        } catch (error) {
            const message =
                (error.response && error.response.data && error.response.data.message) ||
                error.message ||
                error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

export const boardSlice = createSlice({
    name: 'board',
    initialState,
    reducers: {
        reset: (state) => initialState,
        updateBoardRealtime: (state, action) => {
            if (state.currentBoard && state.currentBoard._id === action.payload._id) {
                state.currentBoard = action.payload;
            }
        },
        // Socket: task updated by ANOTHER user
        taskUpdatedInBoard: (state, action) => {
            if (state.currentBoard && state.currentBoard.lists) {
                state.currentBoard.lists.forEach(list => {
                    if (list.tasks) {
                        const taskIndex = list.tasks.findIndex(t => t._id === action.payload._id);
                        if (taskIndex !== -1) {
                            list.tasks[taskIndex] = action.payload;
                        }
                    }
                });
            }
        },
        // Socket: task created by ANOTHER user
        taskCreatedInBoard: (state, action) => {
            if (state.currentBoard && state.currentBoard.lists) {
                const list = state.currentBoard.lists.find(l => l._id === action.payload.listId);
                if (list) {
                    if (!list.tasks) list.tasks = [];
                    const taskExists = list.tasks.some(t => t._id === action.payload._id);
                    if (!taskExists) {
                        list.tasks.push(action.payload);
                    }
                }
            }
        },
        // Socket: task deleted by ANOTHER user
        taskDeletedFromBoard: (state, action) => {
            if (state.currentBoard && state.currentBoard.lists) {
                state.currentBoard.lists.forEach(list => {
                    if (list.tasks) {
                        list.tasks = list.tasks.filter(t => t._id !== action.payload);
                    }
                });
            }
        },
        // Socket: list created by ANOTHER user
        listCreatedInBoard: (state, action) => {
            if (state.currentBoard) {
                if (!state.currentBoard.lists) state.currentBoard.lists = [];
                const listExists = state.currentBoard.lists.some(l => l._id === action.payload._id);
                if (!listExists) {
                    state.currentBoard.lists.push({ ...action.payload, tasks: [] });
                }
            }
        },
        // Socket: list deleted by ANOTHER user
        listDeletedFromBoard: (state, action) => {
            if (state.currentBoard && state.currentBoard.lists) {
                state.currentBoard.lists = state.currentBoard.lists.filter(l => l._id !== action.payload);
            }
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(getBoards.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getBoards.fulfilled, (state, action) => {
                state.isLoading = false;
                state.boards = action.payload;
            })
            .addCase(getBoards.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            .addCase(getBoard.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getBoard.fulfilled, (state, action) => {
                state.isLoading = false;
                state.currentBoard = action.payload;
            })
            .addCase(getBoard.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            .addCase(createBoard.fulfilled, (state, action) => {
                state.boards.unshift(action.payload);
            })
            .addCase(updateBoard.fulfilled, (state, action) => {
                const index = state.boards.findIndex(b => b._id === action.payload._id);
                if (index !== -1) {
                    state.boards[index] = action.payload;
                }
                if (state.currentBoard && state.currentBoard._id === action.payload._id) {
                    state.currentBoard = action.payload;
                }
            })
            .addCase(deleteBoard.fulfilled, (state, action) => {
                state.boards = state.boards.filter(b => b._id !== action.payload);
            })
            // ====== TASK THUNK HANDLERS ======
            // When THIS user creates a task, add it to the board's list
            .addCase(createTask.fulfilled, (state, action) => {
                if (state.currentBoard && state.currentBoard.lists) {
                    const list = state.currentBoard.lists.find(l => l._id === action.payload.listId);
                    if (list) {
                        if (!list.tasks) list.tasks = [];
                        const taskExists = list.tasks.some(t => t._id === action.payload._id);
                        if (!taskExists) {
                            list.tasks.push(action.payload);
                        }
                    }
                }
            })
            // When THIS user updates a task, update it in the board's list
            .addCase(updateTask.fulfilled, (state, action) => {
                if (state.currentBoard && state.currentBoard.lists) {
                    state.currentBoard.lists.forEach(list => {
                        if (list.tasks) {
                            const taskIndex = list.tasks.findIndex(t => t._id === action.payload._id);
                            if (taskIndex !== -1) {
                                list.tasks[taskIndex] = action.payload;
                            }
                        }
                    });
                }
            })
            // When THIS user deletes a task, remove it from the board's list
            .addCase(deleteTask.fulfilled, (state, action) => {
                if (state.currentBoard && state.currentBoard.lists) {
                    state.currentBoard.lists.forEach(list => {
                        if (list.tasks) {
                            list.tasks = list.tasks.filter(t => t._id !== action.payload);
                        }
                    });
                }
            })
            // ====== LIST THUNK HANDLERS ======
            // When THIS user creates a list, add it to the board
            .addCase(createList.fulfilled, (state, action) => {
                if (state.currentBoard) {
                    if (!state.currentBoard.lists) state.currentBoard.lists = [];
                    const listExists = state.currentBoard.lists.some(l => l._id === action.payload._id);
                    if (!listExists) {
                        state.currentBoard.lists.push({ ...action.payload, tasks: [] });
                    }
                }
            })
            // When THIS user deletes a list, remove it from the board
            .addCase(deleteList.fulfilled, (state, action) => {
                if (state.currentBoard && state.currentBoard.lists) {
                    state.currentBoard.lists = state.currentBoard.lists.filter(l => l._id !== action.payload);
                }
            });
    },
});

export const { reset, updateBoardRealtime, taskUpdatedInBoard, taskCreatedInBoard, taskDeletedFromBoard, listCreatedInBoard, listDeletedFromBoard } = boardSlice.actions;
export default boardSlice.reducer;
