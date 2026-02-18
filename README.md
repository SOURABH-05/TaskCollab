# TaskCollab - Real-Time Task Collaboration Platform

A full-stack MERN (MongoDB, Express.js, React, Node.js) application that combines Trello's Kanban board functionality with real-time collaboration features. This platform enables teams to manage tasks across boards with drag-and-drop interfaces, live updates powered by Socket.io, and comprehensive activity tracking.

![Tech Stack](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

## ✨ Features

### 🔐 Authentication & Authorization
- JWT-based authentication with secure password hashing (bcryptjs)
- Protected routes and API endpoints
- Persistent login sessions

### 📋 Board Management
- Create multiple boards for different projects
- Update board details (title, description)
- Add/remove team members to boards
- Delete boards with cascading deletion of lists and tasks

### 📝 List & Task Management
- Create unlimited lists within boards (Kanban columns)
- Add, edit, and delete tasks
- Drag-and-drop tasks between lists
- Real-time position persistence

### 🎯 Task Features
- **Priority Levels**: Low, Medium, High, Urgent
- **Status Tracking**: Todo, In Progress, Done
- **Due Dates**: Set deadlines for tasks
- **User Assignment**: Assign multiple team members
- **Descriptions**: Add detailed task descriptions
- **Comments**: Real-time discussions on tasks
- **Activity Timeline**: Complete history of all task changes

### ⚡ Real-Time Collaboration
- Live updates across all connected clients
- Instant task creation/updates/deletion sync
- Real-time drag-and-drop synchronization
- **Team Chat**: Real-time group messaging for every board
- Socket.io room-based broadcasting per board

### 📊 Activity Tracking
- Automatic logging of all task actions
- User attribution for every change
- Timestamp tracking
- Activity timeline in task detail view

### 🔍 Search & Filters
- Search tasks by title
- Filter tasks by assigned users
- Filter tasks by assigned users
- Pagination support for large datasets

## 🏗️ System Architecture

The application follows a monolithic client-server architecture with real-time capabilities:

1.  **Client Layer (Frontend)**:
    -   **React.js** SPA (Single Page Application)
    -   **Redux Toolkit** for complex state management (Boards, Lists, Tasks, Auth)
    -   **Socket.io Client** for listening to real-time events (`taskUpdated`, `taskMoved`, etc.)
    -   **Tailwind CSS** for responsive styling

2.  **API Layer (Backend)**:
    -   **Node.js & Express** REST API for CRUD operations
    -   **Socket.io Server** for bidirectional event-based communication
    -   **JWT Middleware** for secure request authentication

3.  **Data Layer**:
    -   **MongoDB** for flexible, document-based storage
    -   **Mongoose** schemas for data validation and relationships (User -> Board -> List -> Task)

## 🛠️ Tech Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **Socket.io** - Real-time bidirectional communication
- **JWT** - JSON Web Tokens for authentication
- **bcryptjs** - Password hashing

### Frontend
- **React** - UI library
- **Redux Toolkit** - State management
- **React Router** - Client-side routing
- **Socket.io Client** - Real-time updates
- **react-beautiful-dnd** - Drag and drop functionality
- **Axios** - HTTP client
- **Tailwind CSS** - Utility-first CSS framework

## 📁 Project Structure

```
collrabration/
├── client/                    # React frontend
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   │   ├── ActivityTimeline.js
│   │   │   ├── BoardCard.js
│   │   │   ├── BoardList.js
│   │   │   ├── CreateBoardModal.js
│   │   │   ├── CreateListButton.js
│   │   │   ├── Navbar.js
│   │   │   ├── ProtectedRoute.js
│   │   │   ├── TaskCard.js
│   │   │   └── TaskDetailModal.js
│   │   ├── hooks/           # Custom React hooks
│   │   │   └── useSocket.js
│   │   ├── pages/           # Page components
│   │   │   ├── Board.js
│   │   │   ├── Dashboard.js
│   │   │   ├── Login.js
│   │   │   └── Register.js
│   │   ├── redux/           # Redux state management
│   │   │   ├── slices/
│   │   │   │   ├── authSlice.js
│   │   │   │   ├── boardSlice.js
│   │   │   │   ├── listSlice.js
│   │   │   │   └── taskSlice.js
│   │   │   └── store.js
│   │   ├── services/        # API service calls
│   │   │   ├── api.js
│   │   │   ├── authService.js
│   │   │   ├── boardService.js
│   │   │   ├── listService.js
│   │   │   └── taskService.js
│   │   ├── App.js
│   │   ├── index.css
│   │   └── index.js
│   ├── .env.example
│   ├── package.json
│   ├── postcss.config.js
│   └── tailwind.config.js
├── server/                   # Express backend
│   ├── config/
│   │   └── db.js            # MongoDB connection
│   ├── controllers/         # Route controllers
│   │   ├── activityController.js
│   │   ├── authController.js
│   │   ├── boardController.js
│   │   ├── listController.js
│   │   └── taskController.js
│   ├── middleware/          # Express middleware
│   │   ├── auth.js
│   │   └── errorHandler.js
│   ├── models/              # Mongoose schemas
│   │   ├── Activity.js
│   │   ├── Board.js
│   │   ├── List.js
│   │   ├── Task.js
│   │   └── User.js
│   ├── routes/              # API routes
│   │   ├── activityRoutes.js
│   │   ├── authRoutes.js
│   │   ├── boardRoutes.js
│   │   ├── listRoutes.js
│   │   └── taskRoutes.js
│   ├── seed/                # Database seeding
│   │   └── seedData.js
│   ├── socket/              # Socket.io handlers
│   │   └── socketHandler.js
│   ├── utils/               # Utility functions
│   │   └── activityLogger.js
│   ├── .env.example
│   ├── package.json
│   └── server.js            # Entry point
├── docs/                     # Documentation
│   ├── API_DOCUMENTATION.md
│   ├── ARCHITECTURE.md
│   ├── DATABASE_SCHEMA.md
│   ├── REALTIME_SYNC.md
│   └── SCALABILITY.md
├── .gitignore
├── package.json             # Root package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v14 or higher)
- **MongoDB** (v4.4 or higher)
- **npm** or **yarn**

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd collrabration
   ```

2. **Install dependencies for all packages**
   ```bash
   npm run install-all
   ```

   This will install dependencies for:
   - Root (concurrently)
   - Server (backend)
   - Client (frontend)

3. **Set up environment variables**

   **Backend** (`server/.env`):
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/task-collaboration
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
   NODE_ENV=development
   CLIENT_URL=http://localhost:3000
   ```

   **Frontend** (`client/.env`):
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   REACT_APP_SOCKET_URL=http://localhost:5000
   ```

4. **Start MongoDB**
   ```bash
   # On Windows
   net start MongoDB

   # On macOS (using Homebrew)
   brew services start mongodb-community

   # On Linux
   sudo systemctl start mongod
   ```

5. **Seed the database with demo data** (Optional but recommended)
   ```bash
   npm run seed
   ```

   This creates:
   - 3 demo users
   - 1 sample board with 3 lists
   - 7 sample tasks

6. **Run the application**
   ```bash
   npm run dev
   ```

   This will start:
   - Backend server on `http://localhost:5000`
   - Frontend React app on `http://localhost:3000`

## 🔑 Demo Credentials

After seeding the database, you can login with:

| Email | Password | Role |
|-------|----------|------|
| demo@example.com | Demo123! | Admin |
| john@example.com | Demo123! | Member |
| jane@example.com | Demo123! | Member |

## 📖 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (Protected)

### Boards
- `GET /api/boards` - Get all user boards (Protected)
- `GET /api/boards/:id` - Get single board (Protected)
- `POST /api/boards` - Create board (Protected)
- `PUT /api/boards/:id` - Update board (Protected)
- `DELETE /api/boards/:id` - Delete board (Protected)

### Lists
- `POST /api/lists` - Create list (Protected)
- `PUT /api/lists/:id` - Update list (Protected)
- `DELETE /api/lists/:id` - Delete list (Protected)

### Tasks
- `GET /api/tasks` - Get tasks with filters (Protected)
- `POST /api/tasks` - Create task (Protected)
- `PUT /api/tasks/:id` - Update task (Protected)
- `DELETE /api/tasks/:id` - Delete task (Protected)

### Activity
- `GET /api/activity/:taskId` - Get task activity logs (Protected)
- `GET /api/activity/board/:boardId` - Get board activity logs (Protected)

For detailed API documentation, see [docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)

## 🎨 Key Features Demonstration

### 1. **Real-Time Collaboration**
   - Open the same board in multiple browser windows
   - Create, update, or move a task in one window
   - Watch it instantly update in all other windows

### 2. **Drag and Drop**
   - Click and drag any task card
   - Move it to a different list
   - Changes are saved automatically and synced in real-time

### 3. **Activity Timeline**
   - Click on any task to open the detail modal
   - Scroll to the Activity section
   - See a complete history of all changes made to the task

### 4. **Task Management**
   - Set priority levels with color-coded badges
   - Assign multiple team members
   - Add due dates with visual indicators
   - Update status from todo → in-progress → done

- **[API Documentation](docs/API_DOCUMENTATION.md)** - Complete API reference with examples
- **[Database Schema](docs/DATABASE_SCHEMA.md)** - MongoDB schema design and relationships

## 🧪 Testing

Run backend tests:
```bash
cd server
npm test
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License.

## 🐛 Known Issues & Future Enhancements

### Planned Features
- [ ] Email notifications
- [ ] File attachments to tasks
- [ ] Email notifications
- [ ] File attachments to tasks
- [ ] Board templates
- [ ] Board templates
- [ ] Calendar view
- [ ] Task labels/tags
- [ ] Advanced search with filters
- [ ] Mobile responsive improvements
- [ ] Dark mode
- [ ] Bulk task operations

#

---

**Built with ❤️ using the MERN Stack**
