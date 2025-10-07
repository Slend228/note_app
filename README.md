# Notes App

A full-stack notes application featuring voice control for creating and managing notes, along with text formatting and folder organization.

## Features

- User authentication (register, login, password reset)
- Create, edit, and delete notes
- Text formatting (bold, italic, underline), color
- Organize notes in folders
- Move notes to trash and restore
- Voice commands (in Ukrainian)

## Tech Stack

### Frontend
- React with TypeScript
- Vite
- Tailwind CSS
- Radix UI components
- Axios for API calls

### Backend
- Node.js with Express
- TypeScript
- Prisma ORM
- PostgreSQL database
- JWT authentication
- Zod validation

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database
- npm or yarn

### Running Frontend and Backend Separately

**Frontend (port 5001)**
```bash
# In the root directory
npm run dev
```

**Backend (port 5000)**
```bash
# In the backend directory
cd backend
npm run dev
```


## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/request-password-reset` - Request password reset
- `GET /api/auth/me` - Get current user (requires authentication)

### Notes
- `GET /api/notes` - Get all notes for the current user
- `GET /api/notes/:id` - Get a specific note
- `POST /api/notes` - Create a new note
- `PUT /api/notes/:id` - Update a note
- `PUT /api/notes/:id/trash` - Move a note to trash
- `PUT /api/notes/:id/restore` - Restore a note from trash
- `DELETE /api/notes/:id` - Delete a note permanently
- `PUT /api/notes/:id/move` - Move a note to a folder

### Folders
- `GET /api/folders` - Get all folders for the current user
- `POST /api/folders` - Create a new folder
- `PUT /api/folders/:id` - Update a folder
- `DELETE /api/folders/:id` - Delete a folder
