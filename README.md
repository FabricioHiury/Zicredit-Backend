# Zicredit Backend

Backend system for the Zicredit mobile application. It provides credit simulation data and business logic, developed using NestJS.

## 📁 Project Structure

```
Zicredit-Backend/
├── prisma/
│   ├── schema.prisma
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── credit/
│   ├── main.ts
├── test/
├── .dockerignore
├── .eslintrc.js
├── .gitignore
├── .prettierrc
├── Dockerfile
├── docker-compose.yml
├── docker-compose.database.yml
├── nest-cli.json
├── package-lock.json
├── package.json
├── tsconfig.build.json
├── tsconfig.json
└── README.md
```

## 🚀 Technologies Used

- **Node.js**: JavaScript runtime environment.
- **NestJS**: A progressive Node.js framework for building efficient and scalable server-side applications.
- **TypeScript**: A strongly typed programming language that builds on JavaScript.
- **PostgreSQL**: A powerful, open-source object-relational database system.
- **Prisma**: Next-generation Node.js and TypeScript ORM.
- **Docker**: Platform for developing, shipping, and running applications in containers.

## 🔐 Features

- **Credit Simulation Calculations**: Provides endpoints to perform credit simulations based on user input.
- **Interest Rates and Financial Data**: Fetches and processes relevant financial data for simulations.
- **User Authentication**: Secure user registration and login functionalities.
- **Modular Architecture**: Organized codebase with separation of concerns for scalability and maintainability.

## 🛠️ Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/en/) installed
- [Docker](https://www.docker.com/) installed
- [Docker Compose](https://docs.docker.com/compose/) installed

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/FabricioHiury/Zicredit-Backend.git
   cd Zicredit-Backend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up environment variables:**

   Create a `.env` file in the root directory and add the necessary environment variables:

   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/zicredit
   JWT_SECRET=your_jwt_secret
   ```

4. **Run database migrations:**

   ```bash
   npx prisma migrate dev --name init
   ```

5. **Start the development server:**

   ```bash
   npm run start:dev
   ```

   The server will start on `http://localhost:3000`.

## 🐳 Docker Setup

To run the application using Docker:

1. **Build and start the containers:**

   ```bash
   docker-compose up --build
   ```

2. **Apply database migrations inside the container:**

   ```bash
   docker exec -it zicredit-backend-app npx prisma migrate dev --name init
   ```
