# API Documentation

Complete API reference for the TaskCollab platform. All endpoints require JWT authentication unless marked as public.

## Base URL

```
Development: http://localhost:5000/api
Production: https://your-api-domain.com/api
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

Tokens are obtained from login/register endpoints and are valid for 30 days.

---

## Authentication Endpoints

### Register User

Create a new user account.

**Endpoint:** `POST /auth/register`

**Access:** Public

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "avatar": "https://example.com/avatar.jpg" // optional
}
```

**Success Response (201):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "email": "john@example.com",
  "avatar": "https://example.com/avatar.jpg",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- `400` - Missing required fields or user already exists

---

### Login User

Authenticate and receive JWT token.

**Endpoint:** `POST /auth/login`

**Access:** Public

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Success Response (200):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "email": "john@example.com",
  "avatar": "https://example.com/avatar.jpg",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- `400` - Missing email or password
- `401` - Invalid credentials

---

### Get Current User

Retrieve authenticated user's information.

**Endpoint:** `GET /auth/me`

**Access:** Protected

**Success Response (200):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "email": "john@example.com",
  "avatar": "https://example.com/avatar.jpg",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Error Responses:**
- `401` - Not authorized

---

## Board Endpoints

### Get All Boards

Retrieve all boards where user is owner or member.

**Endpoint:** `GET /boards`

**Access:** Protected

**Success Response (200):**
```json
[
  {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "title": "Project Management",
    "description": "Main project board",
    "owner": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "avatar": "https://example.com/avatar.jpg"
    },
    "members": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Jane Smith",
        "email": "jane@example.com",
        "avatar": "https://example.com/avatar2.jpg"
      }
    ],
    "lists": ["list_id_1", "list_id_2"],
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-16T14:20:00.000Z"
  }
]
```

---

### Get Single Board

Retrieve detailed board information with populated lists and tasks.

**Endpoint:** `GET /boards/:id`

**Access:** Protected (must be owner or member)

**Success Response (200):**
```json
{
  "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
  "title": "Project Management",
  "description": "Main project board",
  "owner": { /* user object */ },
  "members": [ /* array of user objects */ ],
  "lists": [
    {
      "_id": "list_id_1",
      "title": "To Do",
      "order": 0,
      "tasks": [
        {
          "_id": "task_id_1",
          "title": "Design homepage",
          "description": "Create wireframes",
          "status": "todo",
          "priority": "high",
          "assignedUsers": [ /* user objects */ ],
          "dueDate": "2024-01-20T00:00:00.000Z",
          "createdBy": { /* user object */ },
          "createdAt": "2024-01-15T10:30:00.000Z"
        }
      ]
    }
  ],
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-16T14:20:00.000Z"
}
```

**Error Responses:**
- `404` - Board not found
- `403` - Not authorized to access this board

---

### Create Board

Create a new board.

**Endpoint:** `POST /boards`

**Access:** Protected

**Request Body:**
```json
{
  "title": "New Project Board",
  "description": "Project description", // optional
  "members": ["user_id_1", "user_id_2"] // optional, array of user IDs
}
```

**Success Response (201):**
```json
{
  "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
  "title": "New Project Board",
  "description": "Project description",
  "owner": { /* populated user object */ },
  "members": [ /* populated user objects */ ],
  "lists": [],
  "createdAt": "2024-01-17T09:00:00.000Z",
  "updatedAt": "2024-01-17T09:00:00.000Z"
}
```

**Error Responses:**
- `400` - Missing title

---

### Update Board

Update board details.

**Endpoint:** `PUT /boards/:id`

**Access:** Protected (must be owner)

**Request Body:**
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "members": ["user_id_1", "user_id_3"] // replaces entire members array
}
```

**Success Response (200):**
```json
{
  /* updated board object */
}
```

**Error Responses:**
- `404` - Board not found
- `403` - Not authorized (not the owner)

---

### Delete Board

Delete a board and all its lists and tasks.

**Endpoint:** `DELETE /boards/:id`

**Access:** Protected (must be owner)

**Success Response (200):**
```json
{
  "message": "Board deleted successfully"
}
```

**Error Responses:**
- `404` - Board not found
- `403` - Not authorized (not the owner)

---

## List Endpoints

### Create List

Create a new list in a board.

**Endpoint:** `POST /lists`

**Access:** Protected (must be board owner or member)

**Request Body:**
```json
{
  "title": "In Progress",
  "boardId": "65a1b2c3d4e5f6g7h8i9j0k1",
  "order": 1 // optional, defaults to end of board
}
```

**Success Response (201):**
```json
{
  "_id": "list_id_new",
  "title": "In Progress",
  "boardId": "65a1b2c3d4e5f6g7h8i9j0k1",
  "order": 1,
  "tasks": [],
  "createdAt": "2024-01-17T10:00:00.000Z",
  "updatedAt": "2024-01-17T10:00:00.000Z"
}
```

**Error Responses:**
- `400` - Missing title or boardId
- `404` - Board not found
- `403` - Not authorized

---

### Update List

Update list title or order.

**Endpoint:** `PUT /lists/:id`

**Access:** Protected

**Request Body:**
```json
{
  "title": "Completed",
  "order": 3
}
```

**Success Response (200):**
```json
{
  /* updated list object */
}
```

---

### Delete List

Delete a list and all its tasks.

**Endpoint:** `DELETE /lists/:id`

**Access:** Protected

**Success Response (200):**
```json
{
  "message": "List deleted successfully"
}
```

---

## Task Endpoints

### Get Tasks

Retrieve tasks with optional search and filters.

**Endpoint:** `GET /tasks`

**Access:** Protected

**Query Parameters:**
- `boardId` (required) - Board ID
- `search` (optional) - Search term for title
- `assignedUser` (optional) - User ID to filter by
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Results per page (default: 50)

**Example:**
```
GET /tasks?boardId=65a1b2c3d4e5f6g7h8i9j0k1&search=design&page=1&limit=20
```

**Success Response (200):**
```json
{
  "tasks": [
    {
      "_id": "task_id_1",
      "title": "Design homepage",
      /* ...other task fields */
    }
  ],
  "totalPages": 3,
  "currentPage": 1,
  "total": 47
}
```

---

### Create Task

Create a new task.

**Endpoint:** `POST /tasks`

**Access:** Protected

**Request Body:**
```json
{
  "title": "Implement authentication",
  "description": "Add JWT-based auth", // optional
  "listId": "list_id_1",
  "boardId": "65a1b2c3d4e5f6g7h8i9j0k1",
  "priority": "high", // optional: low, medium, high, urgent
  "dueDate": "2024-01-25T00:00:00.000Z", // optional
  "assignedUsers": ["user_id_1", "user_id_2"] // optional
}
```

**Success Response (201):**
```json
{
  "_id": "new_task_id",
  "title": "Implement authentication",
  "description": "Add JWT-based auth",
  "status": "todo",
  "priority": "high",
  "assignedUsers": [ /* populated user objects */ ],
  "dueDate": "2024-01-25T00:00:00.000Z",
  "listId": "list_id_1",
  "boardId": "65a1b2c3d4e5f6g7h8i9j0k1",
  "order": 0,
  "activityLogs": [],
  "createdBy": { /* populated user object */ },
  "createdAt": "2024-01-17T11:00:00.000Z",
  "updatedAt": "2024-01-17T11:00:00.000Z"
}
```

---

### Update Task

Update task details or move between lists.

**Endpoint:** `PUT /tasks/:id`

**Access:** Protected

**Request Body:**
```json
{
  "title": "Updated title",
  "description": "Updated description",
  "status": "in-progress",
  "priority": "urgent",
  "assignedUsers": ["user_id_1"],
  "dueDate": "2024-01-26T00:00:00.000Z",
  "listId": "list_id_2", // to move task
  "order": 3
}
```

**Success Response (200):**
```json
{
  /* updated task object */
}
```

**Note:** Automatically creates activity logs for changes

---

### Delete Task

Delete a task.

**Endpoint:** `DELETE /tasks/:id`

**Access:** Protected

**Success Response (200):**
```json
{
  "message": "Task deleted successfully"
}
```

---

## Activity Endpoints

### Get Task Activity

Retrieve activity timeline for a task.

**Endpoint:** `GET /activity/:taskId`

**Access:** Protected

**Success Response (200):**
```json
[
  {
    "_id": "activity_id_1",
    "actionType": "task_created",
    "userId": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "avatar": "https://example.com/avatar.jpg"
    },
    "taskId": "task_id",
    "boardId": "board_id",
    "message": "John Doe created task \"Design homepage\"",
    "metadata": {},
    "createdAt": "2024-01-17T11:00:00.000Z"
  },
  {
    "_id": "activity_id_2",
    "actionType": "priority_changed",
    "userId": { /* user object */ },
    "message": "John Doe changed priority to high",
    "createdAt": "2024-01-17T11:15:00.000Z"
  }
]
```

---

### Get Board Activity

Retrieve recent activity for an entire board.

**Endpoint:** `GET /activity/board/:boardId`

**Access:** Protected

**Query Parameters:**
- `limit` (optional) - Number of activities (default: 50)

**Success Response (200):**
```json
[
  {
    "_id": "activity_id",
    "actionType": "task_created",
    "userId": { /* user object */ },
    "taskId": {
      "_id": "task_id",
      "title": "Design homepage"
    },
    "boardId": "board_id",
    "message": "John Doe created task \"Design homepage\"",
    "createdAt": "2024-01-17T11:00:00.000Z"
  }
  /* ...more activities */
]
```

---

## Error Responses

All endpoints may return these common errors:

### 400 Bad Request
```json
{
  "message": "Please provide all required fields"
}
```

### 401 Unauthorized
```json
{
  "message": "Not authorized, no token"
}
```

### 403 Forbidden
```json
{
  "message": "Not authorized to access this resource"
}
```

### 404 Not Found
```json
{
  "message": "Resource not found"
}
```

### 500 Server Error
```json
{
  "message": "Internal server error",
  "stack": "..." // only in development
}
```

---

## Rate Limiting

**Not yet implemented** - Recommended limits:
- 100 requests per 15 minutes per IP
- 1000 requests per day per user

## Pagination

Paginated endpoints return:
```json
{
  "data": [ /* array of items */ ],
  "totalPages": 5,
  "currentPage": 1,
  "total": 94
}
```

---

This API follows RESTful principles and returns JSON responses for all endpoints.
