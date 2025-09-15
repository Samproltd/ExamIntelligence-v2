# ExamIntelligence - Online Exam Portal

A fully-featured online examination platform built with Next.js and TypeScript, providing comprehensive exam management for educational institutions.

## Features

- **User Authentication**

  - Secure JWT-based authentication
  - Role-based access control (Admin and Student)
  - Protected routes based on user roles

- **Admin Management**

  - Subject creation and management
  - Course creation within subjects
  - Exam creation with configurable parameters
  - Question bank management for MCQs
  - Student batch management
  - Performance analytics and reporting

- **Student Experience**

  - Interactive dashboard to browse subjects and courses
  - Timed exam taking with auto-save functionality
  - Immediate exam results and feedback
  - Certificate generation and download
  - Performance history and analytics

- **Examination System**

  - MCQ-based assessments with automatic grading
  - Configurable exam duration and passing criteria
  - Auto-save progress during exams
  - Time-bound submission enforcement

- **Certificate Management**
  - Automatic certificate generation for passed exams
  - Multiple download options (PDF, HTML)
  - Secure certificate verification

## Tech Stack

- **Frontend**: Next.js with TypeScript
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose ODM
- **State Management**: Redux with @reduxjs/toolkit
- **Styling**: Tailwind CSS
- **Authentication**: JWT
- **PDF Generation**: Puppeteer

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. Clone the repository

```bash
git clone https://github.com/your-username/ExamIntelligence.git
cd ExamIntelligence
```

2. Install dependencies

```bash
npm install
# or
yarn install
```

3. Create environment variables

Create a `.env` file in the root directory with the following variables:

```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
NEXT_PUBLIC_API_URL=http://localhost:5050/api

# Default admin credentials
ADMIN_NAME=Administrator
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=Admin@123
```

4. Run the development server

```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:5050](http://localhost:5050) in your browser

### Building for Production

```bash
npm run build
npm start
# or
yarn build
yarn start
```

## Project Structure

- `/components` - Reusable UI components
- `/models` - MongoDB schemas and models
- `/pages` - Next.js pages and API routes
- `/store` - Redux store configuration and slices
- `/utils` - Utility functions and helpers

## Default Admin Access

The system automatically creates a default admin user on startup if no admin exists:

- Email: admin@example.com (or as configured in .env)
- Password: Admin@123 (or as configured in .env)

## License

ISC
