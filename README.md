
---

# 🎓 Virtual Classroom Platform

A modern, full-stack web application for online learning with role-based access for students and teachers. Built with Next.js 15, Firebase, and Tailwind CSS.

![Virtual Classroom](https://img.shields.io/badge/Next.js-15.5.4-black)
![Firebase](https://img.shields.io/badge/Firebase-12.4.0-orange)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8)

## ✨ Features

### 👨‍🎓 For Students
- **Interactive Quizzes**: Take quizzes with instant feedback and auto-grading
- **Performance Tracking**: View quiz results with letter grades
- **GPA/CGPA Calculation**: Automatic computation based on quiz scores
    - GPA: Average of last 5 quizzes (4.0 scale)
    - CGPA: Overall average across all quizzes
- **Attendance History**: Track your class attendance records
- **Announcements Board**: Stay updated with teacher announcements
- **Class Timetable**: View weekly schedule at a glance

### 👨‍🏫 For Teachers
- **Quiz Management**: Create quizzes with multiple-choice questions
- **Attendance Marking**: Mark student attendance by date
- **Student Results**: View and analyze quiz performance
- **Announcements**: Post updates and notices to all students
- **File Uploads**: Share notes and assignments via Firebase Storage
- **Dashboard Analytics**: Track class performance metrics

### 🎨 General Features
- **Dark/Light Mode**: Theme toggle with system preference support
- **Responsive Design**: Mobile-first approach, works on all devices
- **Real-time Updates**: Firebase Firestore for instant data sync
- **Secure Authentication**: Email/password authentication via Firebase Auth
- **Analytics Tracking**: Firebase Analytics integration for user insights
- **Accessible UI**: ARIA labels and keyboard navigation support

---

## 🚀 Tech Stack

| Category | Technology |
|----------|-----------|
| **Frontend** | Next.js 15.5.4 (App Router), React 19, TypeScript |
| **Styling** | Tailwind CSS 4, CSS Variables for theming |
| **Backend** | Firebase (Auth, Firestore, Storage, Analytics) |
| **State Management** | React Hooks (useState, useEffect) |
| **Icons** | Lucide React |
| **Date Handling** | date-fns |
| **Notifications** | react-hot-toast |
| **Deployment** | Vercel |

---

## 📋 Prerequisites

- Node.js 18.x or higher
- npm or yarn package manager
- Firebase account ([console.firebase.google.com](https://console.firebase.google.com))
- Vercel account (optional, for deployment)

---

## 🛠️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/virtual-classroom.git
cd virtual-classroom
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Firebase Setup

#### Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project" and name it `virtual-classroom`
3. Enable Google Analytics (optional but recommended)

#### Enable Services

**Authentication:**
- Navigate to **Authentication** → **Sign-in method**
- Enable **Email/Password** provider

**Firestore Database:**
- Navigate to **Firestore Database**
- Click **Create Database** → Start in **production mode**

**Storage:**
- Navigate to **Storage**
- Click **Get Started** → Use default settings

**Analytics:**
- Already enabled during project creation

#### Security Rules

**Firestore Rules** (`Firestore Database` → `Rules`):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    match /quizzes/{quizId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'teacher';
      match /questions/{questionId} {
        allow read: if request.auth != null;
        allow write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'teacher';
      }
    }
    match /results/{resultId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    match /attendance/{attendanceId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'teacher';
    }
    match /announcements/{announcementId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'teacher';
    }
  }
}
```

**Storage Rules** (`Storage` → `Rules`):
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /notes/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.role == 'teacher';
    }
  }
}
```

### 4. Environment Variables

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

**Get these values:**
1. Firebase Console → Project Settings (⚙️)
2. Scroll to "Your apps" → Web app
3. Copy the `firebaseConfig` values

### 5. Create Firestore Indexes

Run the app and perform these actions to auto-generate indexes (Firebase will prompt you):

1. **Student Dashboard** → View quiz results
2. **Student Dashboard** → View attendance
3. **Announcements Board** → Load announcements

Or manually create these indexes in Firebase Console → Firestore → Indexes:

| Collection | Fields | Order |
|------------|--------|-------|
| `results` | `studentUid`, `completedAt` | Ascending, Descending |
| `attendance` | `studentUid`, `classDate` | Ascending, Descending |
| `announcements` | `createdAt` | Descending |

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
virtual-classroom/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout with providers
│   │   ├── page.tsx            # Landing page
│   │   ├── globals.css         # Global styles & CSS variables
│   │   ├── login/              # Login page
│   │   ├── register/           # Registration page
│   │   └── dashboard/          # Protected dashboard
│   ├── components/
│   │   ├── ui/                 # Reusable UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   └── ...
│   │   ├── Auth/               # Authentication components
│   │   ├── Dashboard/          # Role-based dashboards
│   │   ├── Quiz/               # Quiz management
│   │   ├── Attendance/         # Attendance tracking
│   │   ├── Announcements/      # Announcements board
│   │   ├── Timetable/          # Class schedule
│   │   ├── FileUpload/         # File upload component
│   │   └── ThemeToggle.tsx     # Dark/light mode toggle
│   ├── lib/
│   │   ├── firebase.ts         # Firebase initialization
│   │   └── utils.ts            # Utility functions
│   └── types/
│       └── index.ts            # TypeScript interfaces
├── .env.local                  # Environment variables
├── next.config.js              # Next.js configuration
├── tailwind.config.ts          # Tailwind CSS config
├── postcss.config.mjs          # PostCSS config
├── tsconfig.json               # TypeScript config
└── package.json                # Dependencies
```

---

## 🗄️ Database Schema

### Collections

#### `users`
```typescript
{
  uid: string;              // Auth UID (document ID)
  name: string;
  email: string;
  role: 'student' | 'teacher';
  createdAt: Timestamp;
}
```

#### `quizzes`
```typescript
{
  id: string;               // Auto-generated
  teacherUid: string;       // Reference to users.uid
  title: string;
  createdAt: Timestamp;
}
```

#### `quizzes/{quizId}/questions` (subcollection)
```typescript
{
  id: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: 'a' | 'b' | 'c' | 'd';
}
```

#### `results`
```typescript
{
  id: string;
  quizId: string;           // Reference to quizzes.id
  studentUid: string;       // Reference to users.uid
  score: number;            // 0-100
  completedAt: Timestamp;
}
```

#### `attendance`
```typescript
{
  id: string;
  studentUid: string;       // Reference to users.uid
  classDate: string;        // YYYY-MM-DD format
  status: 'Present' | 'Absent';
}
```

#### `announcements`
```typescript
{
  id: string;
  teacherUid: string;       // Reference to users.uid
  title: string;
  content: string;
  createdAt: Timestamp;
}
```

---

## 🎯 Usage Guide

### For Students

1. **Register/Login**
    - Create account with role: "Student"
    - Use email/password authentication

2. **Dashboard Overview**
    - View GPA, CGPA, and quiz statistics
    - See available quizzes and results

3. **Take a Quiz**
    - Click "Take Quiz" on any available quiz
    - Answer all questions (radio buttons)
    - Submit for instant grading

4. **View Results**
    - See scores and letter grades
    - Track performance over time

5. **Check Attendance**
    - View attendance history with dates
    - See Present/Absent status

### For Teachers

1. **Register/Login**
    - Create account with role: "Teacher"

2. **Create a Quiz**
    - Click "Create Quiz" card
    - Add title and questions
    - Specify correct answers
    - Submit to publish

3. **Mark Attendance**
    - Select date
    - Toggle Present/Absent for each student
    - Bulk submit attendance

4. **Post Announcements**
    - Enter title and content
    - Post to notify all users

5. **Upload Files**
    - Select file (PDF, DOC, PPT, etc.)
    - Add title/description
    - Upload to Firebase Storage

---

## 🚀 Deployment to Vercel

### Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/virtual-classroom)

### Manual Deployment

1. **Push to GitHub**
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. **Deploy on Vercel**
    - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
    - Click "New Project"
    - Import your GitHub repository
    - Add environment variables from `.env.local`
    - Click "Deploy"

3. **Post-Deployment**
    - Update Firebase Auth → Authorized Domains
    - Add your Vercel domain (e.g., `your-app.vercel.app`)

---

## 🧪 Testing Checklist

- [ ] User registration (student & teacher)
- [ ] User login/logout
- [ ] Student dashboard loads
- [ ] Teacher dashboard loads
- [ ] Quiz creation (teacher)
- [ ] Quiz taking (student)
- [ ] Quiz auto-grading
- [ ] GPA/CGPA calculation
- [ ] Attendance marking (teacher)
- [ ] Attendance viewing (student)
- [ ] Announcements posting (teacher)
- [ ] Announcements viewing (all users)
- [ ] File upload (teacher)
- [ ] Dark/light mode toggle
- [ ] Responsive design (mobile/tablet/desktop)
- [ ] Firebase Analytics events

---

## 📊 Analytics Events

The app tracks the following Firebase Analytics events:

| Event Name | Triggered When | Parameters |
|------------|----------------|------------|
| `login` | User logs in | `method: 'email'` |
| `sign_up` | User registers | `method: 'email'`, `user_role` |
| `logout` | User logs out | None |
| `dashboard_view` | Dashboard loads | `user_role` |
| `create_quiz` | Teacher creates quiz | `quiz_title`, `question_count` |
| `complete_quiz` | Student submits quiz | `quiz_id`, `score`, `correct_answers`, `total_questions` |
| `mark_attendance` | Teacher marks attendance | `date`, `total_students`, `present_count` |
| `post_announcement` | Teacher posts announcement | `title_length`, `content_length` |
| `upload_file` | Teacher uploads file | `file_name`, `file_size`, `file_type` |

---

## 🔧 Configuration

### Grading Scale

Grades are calculated in `src/lib/utils.ts`:

```typescript
90-100% → A (4.0)
80-89%  → B (3.0)
70-79%  → C (2.0)
60-69%  → D (1.0)
0-59%   → F (0.0)
```

### Color Scheme

Customizable via CSS variables in `src/app/globals.css`:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  /* ... more colors */
}
```

---

## 🐛 Troubleshooting

### Build Errors

**Issue**: ESLint errors during build
```bash
npm run lint
```
Fix unused imports and type errors

**Issue**: Tailwind CSS not working
- Check `postcss.config.mjs` exists
- Verify `tailwind.config.ts` paths
- Clear `.next` folder: `rm -rf .next`

### Firebase Errors

**Issue**: "Missing or insufficient permissions"
- Check Firestore security rules
- Verify user is authenticated
- Ensure user document has `role` field

**Issue**: "Index not found"
- Click the error link to auto-create index
- Or manually create in Firebase Console

**Issue**: Analytics not tracking
- Verify `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` is set
- Check browser console for errors
- Ensure Analytics is enabled in Firebase

### Authentication Issues

**Issue**: Can't register/login
- Check Firebase Auth is enabled
- Verify email/password provider is active
- Check network tab for API errors

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Authors

- **Hackerslord** - *Fullstack* - [YourGitHub](https://github.com/hackerslord561)

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Firebase](https://firebase.google.com/) - Backend services
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Lucide](https://lucide.dev/) - Icon library
- [Vercel](https://vercel.com/) - Deployment platform

---

## 📧 Support

For support, email hackerslordstudios@gmail.com or open an issue on GitHub.

---

## 🗺️ Roadmap

- [ ] Real-time chat between students and teachers
- [ ] Video conferencing integration
- [ ] Assignment submissions with file attachments
- [ ] Gradebook with weighted categories
- [ ] Parent portal for monitoring student progress
- [ ] Calendar integration for class schedules
- [ ] Push notifications for announcements
- [ ] Multi-language support (i18n)
- [ ] Advanced analytics dashboard
- [ ] Export data (PDF reports, CSV)

---

**Made with ❤️ using Next.js and Firebase**