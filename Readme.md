# Dikteh Khooneh

Dikteh Khooneh is an interactive educational web application designed for elementary school students.

The platform provides learning activities for dictation, mathematics, and science while giving students a simple and engaging environment to practice, play, and track their progress.

The project includes a complete frontend, a PHP REST API backend, MySQL database integration, authentication, user profiles, educational folders, game results, news content, and school/province data.

---

## Features

### Authentication

- Student registration
- Login and logout
- Persistent authenticated sessions
- Secure HttpOnly cookie authentication
- Session validation using the backend API
- Login rate limiting
- Protected API routes

### Student Profile

- View student profile
- Edit personal information
- Change password
- Upload profile avatar
- Delete profile avatar
- Secure avatar delivery through the backend API

### Educational Folders

Students can work with two types of folders:

- Dictation folders
- Science folders

The platform supports:

- Creating personal folders
- Editing personal folders
- Deleting personal folders
- Adding and managing dictation words
- Adding and managing science questions

### Grade-Based System Folders

The system contains predefined educational folders for grades 1 through 6.

Each grade includes:

- One predefined Dictation folder
- One predefined Science folder

A student automatically sees the system folders that belong to their selected grade.

System folders:

- Are shared application content
- Are not owned by individual users
- Cannot be edited or deleted by students
- Can be used directly in educational games

Current seed data includes:

- 12 system folders
- 60 dictation words
- 30 science questions and answers

---

## Educational Games

### Dictation Game

Students practice words from their selected dictation folder.

The game includes:

- Word-by-word practice
- Correct / incorrect answer handling
- Automatic round progression
- Final score calculation
- Game result persistence

### Mathematics Game

Interactive mathematics exercises with automatically generated questions.

### Science Game

Science questions are loaded from the selected science folder and evaluated during the game.

---

## Dashboard

The student dashboard provides:

- Total score
- Number of completed games
- Dictation score
- Mathematics score
- Science score
- User folders
- Grade-based system folders
- Educational content management
- Profile information

Dashboard statistics are loaded directly from the backend API.

---

## News

The application includes a complete news section with:

- News listing
- News detail pages
- News categories
- News gallery images
- Related news
- Publication dates

News content is stored in the database and served through the public API.

---

## Iran Schools Map

The About page contains an interactive map of Iran.

The map supports:

- Province selection
- Province statistics
- Partner school listing
- Student counts

Province SVG geometry remains in the frontend while province and school data are loaded from the backend API.

Current seed data includes:

- 31 provinces
- 9 sample partner schools

---

## Frontend

The frontend is built using:

- HTML5
- Tailwind CSS v4
- Vanilla JavaScript
- Responsive design
- RTL layout
- Custom design system

No frontend framework such as React, Vue, or Angular is used.

---

## Backend

The backend is implemented as a REST API using:

- PHP
- MySQL
- PDO
- Custom Router
- Controllers
- Models
- Services
- Middleware

The API is located under:

```txt
/api/v1
```

---

## Authentication Architecture

Authentication is implemented using secure HttpOnly cookies.

Login flow:

```txt
Login
  ↓
Backend validates credentials
  ↓
Authentication token is generated
  ↓
Token is stored in the database
  ↓
Backend sends HttpOnly session cookie
  ↓
Browser stores cookie
  ↓
Frontend sends requests using credentials: include
```

The authentication token is not stored in:

```txt
localStorage
sessionStorage
JavaScript variables
```

The frontend JavaScript cannot directly access the authentication cookie.

---

## Main API Endpoints

### Authentication

```http
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/logout
```

### Current User

```http
GET /api/v1/me
```

### Profile

```http
PATCH  /api/v1/profile
PATCH  /api/v1/profile/password
POST   /api/v1/profile/avatar
GET    /api/v1/profile/avatar
DELETE /api/v1/profile/avatar
```

### Folders

```http
GET    /api/v1/folders
POST   /api/v1/folders
PATCH  /api/v1/folders/{id}
DELETE /api/v1/folders/{id}
```

### Dictation Words

```http
GET    /api/v1/folders/{folderId}/words
POST   /api/v1/folders/{folderId}/words
PATCH  /api/v1/words/{id}
DELETE /api/v1/words/{id}
```

### Science Questions

```http
GET    /api/v1/folders/{folderId}/science-questions
POST   /api/v1/folders/{folderId}/science-questions
PATCH  /api/v1/science-questions/{id}
DELETE /api/v1/science-questions/{id}
```

### Game Results

```http
POST /api/v1/game-results
GET  /api/v1/game-results
```

### Dashboard

```http
GET /api/v1/dashboard/stats
```

### News

```http
GET /api/v1/news
GET /api/v1/news/{slug}
GET /api/v1/news/{slug}/related
```

### Iran Map

```http
GET /api/v1/iran-map/provinces
GET /api/v1/iran-map/provinces/{provinceCode}/schools
```

---

## Security

The project includes multiple backend security controls, including:

- HttpOnly authentication cookies
- SameSite cookie policy
- Secure cookies in production
- Login rate limiting
- Authentication middleware
- Protected API routes
- Password hashing
- Server-side score calculation
- Folder ownership validation
- Grade-based system folder access control
- File MIME validation for avatars
- Avatar size limitation
- Randomized avatar filenames
- CORS origin validation
- Credentialed CORS requests
- Security HTTP headers
- Sensitive backend errors hidden from users

---

## Data Architecture

The project does not use frontend mock data for application domain data.

All dynamic application data is loaded from the backend API.

Examples:

```txt
Users
Folders
Words
Science questions
Game results
Dashboard statistics
Profiles
News
Partner schools
```

Local browser storage is only used for non-sensitive UI preferences where required.

---

## Database

The application uses MySQL.

Database setup is managed through:

```txt
backend/database/migrations/
backend/database/seeds/
```

### Migrations

Run migration files in numeric order.

Example:

```txt
001_...
002_...
003_...
...
012_...
```

### Seeds

After migrations are complete, run the required seed files.

Seed data includes:

```txt
Grade-based system folders
Dictation words
Science questions
News
Iran provinces
Partner schools
```

---

## Avatar Storage

Uploaded profile avatars are stored outside the public web directory:

```txt
backend/storage/uploads/avatars/
```

Avatar files are not directly exposed by the web server.

They are served through the authenticated API endpoint:

```http
GET /api/v1/profile/avatar
```

User-uploaded avatar files are excluded from Git.

Only:

```txt
.gitkeep
```

is tracked.

---

## Project Structure

```txt
Dictation-home/
│
├── backend/
│   │
│   ├── app/
│   │   ├── Controllers/
│   │   ├── Core/
│   │   ├── Middleware/
│   │   ├── Models/
│   │   └── Services/
│   │
│   ├── database/
│   │   ├── migrations/
│   │   └── seeds/
│   │
│   ├── public/
│   │   └── index.php
│   │
│   ├── routes/
│   │   └── api.php
│   │
│   └── storage/
│       └── uploads/
│           └── avatars/
│
├── frontend/
│   │
│   ├── public/
│   │   ├── index.html
│   │   ├── auth.html
│   │   ├── dashboard.html
│   │   ├── game.html
│   │   ├── profile.html
│   │   ├── news.html
│   │   ├── newsdetail.html
│   │   ├── aboutus.html
│   │   ├── contactus.html
│   │   │
│   │   ├── js/
│   │   │   ├── components/
│   │   │   ├── modules/
│   │   │   ├── pages/
│   │   │   └── services/
│   │   │
│   │   └── styles/
│   │       └── style.css
│   │
│   └── src/
│       └── input.css
│
├── .gitignore
├── Dockerfile
├── docker-compose.yml
├── package.json
└── README.md
```

---

## Technologies Used

### Frontend

- HTML5
- Tailwind CSS v4
- Vanilla JavaScript
- CSS
- SVG

### Backend

- PHP
- MySQL
- PDO
- REST API

### Development & Deployment

- Git
- GitHub
- Docker
- Docker Compose
- Apache / PHP compatible web server

---

## Requirements

Depending on the development environment, you may need:

- Docker Desktop

or:

- PHP
- MySQL
- Apache
- Node.js

Node.js is primarily used for Tailwind CSS development and build tasks.

---

## Getting Started

Clone the repository:

```bash
git clone https://github.com/xAl1reza/Dictation-home.git
```

Enter the project directory:

```bash
cd Dictation-home
```

---

## Running the Frontend with Docker

Build and start the frontend:

```bash
docker compose up --build
```

Then open:

```txt
http://localhost:3000
```

---

## Local Backend Development

The backend must be served through a PHP-compatible web server.

Example local API address:

```txt
http://127.0.0.1/dictation-home/backend/public/api/v1
```

The frontend API client automatically uses the local development API configuration when running on localhost.

In production, the preferred API path is:

```txt
/api/v1
```

---

## Environment Configuration

Backend environment configuration should be based on:

```txt
.env.example
```

Real environment files must not be committed to Git.

Example:

```txt
.env
.env.local
.env.production
```

Production configuration should include the correct frontend origin.

Example:

```env
APP_ALLOWED_ORIGINS=https://example.com
APP_AUTH_COOKIE_SECURE=1
```

Cookie behavior can also be configured where required using:

```txt
APP_AUTH_COOKIE_PATH
APP_AUTH_COOKIE_SAMESITE
```

---

## Production Notes

Before production deployment:

1. Configure the production database.
2. Run all database migrations.
3. Run required seed files.
4. Configure backend environment variables.
5. Set the real frontend origin.
6. Enable secure authentication cookies.
7. Build the final Tailwind CSS output.
8. Verify avatar storage permissions.
9. Verify API routing.
10. Perform a production smoke test.

Recommended production authentication configuration:

```txt
HttpOnly = true
Secure = true
SameSite = Lax
```

---

## Git Ignore

The repository should exclude:

```txt
node_modules/
.env
.env.*
.vscode/
.idea/
backend/storage/uploads/avatars/*
```

While keeping:

```txt
.env.example
backend/storage/uploads/avatars/.gitkeep
```

---

## Current Project Status

The project currently includes:

```txt
Frontend UI                    Complete
Backend REST API               Complete
Frontend ↔ API Integration     Complete
Authentication                 Complete
Profile                        Complete
Avatar Management              Complete
Folders                        Complete
Dictation Words                Complete
Science Questions              Complete
Educational Games              Complete
Game Results                   Complete
Dashboard Statistics           Complete
Grade System Folders           Complete
News                           Complete
Iran Schools Map               Complete
Mock Data Removal              Complete
Database Migrations            Complete
Database Seeds                 Complete
Deployment Preparation         Complete
```

The project is ready for production deployment and final environment-specific verification.

---

## License

This project is developed as an educational platform.

All project source code, content, assets, and deployment rights are subject to the terms defined by the project owner.
