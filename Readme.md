# Dictation Home

Dictation Home is a simple educational web project designed for elementary school students to practice and improve their learning skills in an interactive environment.

The platform also helps parents monitor their children's educational progress and support their daily learning journey.

---

## Features

- Dictation and spelling practice
- Mathematics exercises and quizzes
- Science learning activities
- Literature and reading practice
- Parent supervision and progress monitoring
- Student-friendly educational environment
- Responsive and modern UI
- Built with Tailwind CSS
- Dockerized development and deployment setup

---

## Technologies Used

- HTML5
- Tailwind CSS v4
- JavaScript
- Docker
- Docker Compose

---

## Requirements

Before running the project, make sure you have the following installed on your system:

- Docker Desktop

Download Docker Desktop:

- Windows / Mac:
  https://www.docker.com/products/docker-desktop/

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

Run the project using Docker Compose:

```bash
docker compose up --build
```

---

## Application URL

After the container starts successfully, open:

```txt
http://localhost:3000
```

---

## Development Notes

- Tailwind CSS is automatically built during the Docker image build process.
- No manual `npm install` is required.
- The project is fully containerized for easy setup and portability.

---

## Project Structure

```txt
project/
│
├── public/
│   ├── index.html
│   └── styles/
│       └── style.css
│
├── src/
│   └── input.css
│
├── Dockerfile
├── docker-compose.yml
├── package.json
└── README.md
```

---

## License

This project is created for educational and learning purposes.
