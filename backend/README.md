# Notes App Backend

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL

### Installation

1. Clone the repository
2. Navigate to the backend directory
3. Install dependencies:
   ```
   npm install
   ```
4. Create a `.env` file based on `.env.example`
5. Set up your PostgreSQL database and update the DATABASE_URL in `.env`
6. Generate Prisma client and run migrations:
   ```
   npx prisma migrate dev --name init
   ```
7. Start the development server:
   ```
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

## Testing with Postman or cURL

### Register a user (Postman)
- Method: POST
- URL: http://localhost:5000/api/auth/register
- Headers: Content-Type: application/json
- Body (raw JSON):
  ```json
  {
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }
  ```

### Register a user (cURL)
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
```

### Login (Postman)
- Method: POST
- URL: http://localhost:5000/api/auth/login
- Headers: Content-Type: application/json
- Body (raw JSON):
  ```json
  {
    "email": "test@example.com",
    "password": "password123"
  }
  ```

### Login (cURL)
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Create a note (Postman)
- Method: POST
- URL: http://localhost:5000/api/notes
- Headers: 
  - Content-Type: application/json
  - Authorization: Bearer YOUR_TOKEN_HERE
- Body (raw JSON):
  ```json
  {
    "title": "Test Note",
    "content": "This is a test note",
    "tags": ["test", "example"]
  }
  ```

### Create a note (cURL)
```bash
curl -X POST http://localhost:5000/api/notes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"title":"Test Note","content":"This is a test note","tags":["test","example"]}'
```
