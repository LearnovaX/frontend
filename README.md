# 🎓 LearnovaX Frontend - Complete Documentation

## 📋 Executive Summary

**LearnovaX Frontend** is a **modern, production-ready Learning Management System interface** built with React, TypeScript, and Tailwind CSS. It provides seamless integration with the Django backend, delivering a comprehensive user experience for students, teachers, and administrators. Features include real-time chat, multi-language support, role-based dashboards, advanced course management, student submission tracking, grading workflows, and responsive design optimized for all devices.

---

## 🛠️ Technology Stack

### **Core Framework & Build**
- ⚛️ **React 19.1.1** - Latest concurrent features for performance
- 🚀 **Vite 7.1.2** - Lightning-fast HMR & optimized production builds
- 🟦 **TypeScript 5.8.3** - Strongly typed architecture for safety
- 🌐 **React Router DOM 7.8.1** - Client-side routing with protected routes

### **Styling & UI Components**
- 🎨 **Tailwind CSS 4.1.13** - Utility-first CSS with dynamic styling
- 🪄 **Framer Motion 12.23.22** - Smooth animations & page transitions
- ✨ **Lucide React 0.540.0** - Beautiful, customizable icons
- 🧩 **clsx + tailwind-merge** - Safe className composition

### **State Management & Data**
- 📡 **Axios 1.11.0** - Centralized API communication with interceptors
- 🌐 **React Context API** - Auth, Theme, Language contexts
- 💾 **LocalStorage** - Persist tokens, preferences, user data
- 📊 **Recharts 3.1.2** - Beautiful charts for analytics & grades

### **Internationalization (i18n)**
- 🌍 **i18next 25.5.2** - Full translation framework
- 🗣️ **react-i18next 16.0.0** - React component integration
- 📝 **Language Support**: Russian (ru), English (en), Uzbek (uz)
- 🎯 **Smart Detection**: localStorage → query string → browser language

### **Rich Content & Utilities**
- 📝 **CKEditor 5 Build Classic 41.4.2** - WYSIWYG editor for course content
- 🛡️ **DOMPurify 3.2.6** - XSS protection for HTML rendering
- 📊 **XLSX 0.18.5** - Excel file export/import capabilities
- 📜 **react-scrollbars-custom** - Custom scrollbar styling

### **Development Tools**
- 📚 **ESLint 9.33.0** - Code quality & best practices
- 🔍 **TypeScript** - IDE autocomplete & type safety
- 🎯 **Component.json** - Shadcn UI component library setup

---

## ✨ Pages & Features

### 🔐 **Authentication & Account Management**

#### **Public Pages (No Auth Required)**

**[Login.tsx](frontend/src/pages/Login.tsx)** - Multi-Method Authentication
- Email/password login with email validation
- OAuth button for Google login
- 2FA OTP support (modal if enabled)
- Smart error handling:
  - Inactive account detection
  - Email verification required alerts
  - Initial password setup prompts
- Links to password reset & account setup
- Auto-redirect to /courses on success

**[SetInitialPassword.tsx](frontend/src/pages/SetInitialPassword.tsx)** - Account Activation
- Invitation token validation (uid + token params)
- Password strength indicator (5 levels)
- Minimum password length enforcement
- Prevents reusing already-activated links
- Success redirects to login

**[ForgotPassword.tsx](frontend/src/pages/ForgotPassword.tsx)** - Password Reset Request
- Email submission for reset initiation
- Redirects to verification with email in session storage
- Clean form with validation

**[VerifyPasswordReset.tsx](frontend/src/pages/VerifyPasswordReset.tsx)** - Reset Code Verification
- Verify 6-digit code from email
- 5-minute validity window
- Resend code capability
- Transitions to password entry form

**[ResetPassword.tsx](frontend/src/pages/ResetPassword.tsx)** - New Password Entry
- Set new password after code verification
- Password strength requirements
- Confirmation input matching
- Auto-redirect to login on success

**[OTPVerification.tsx](frontend/src/pages/OTPVerification.tsx)** - 2FA Code Entry
- 6-digit OTP input field
- 5-minute countdown timer
- Resend code functionality
- Error handling for expired/invalid codes

---

### 🎓 **Protected Pages (Auth Required)**

#### **Core Navigation Hub**

**[HomePage.tsx](frontend/src/pages/HomePage.tsx)** - Landing Dashboard
- Placeholder for future home page features
- Quick navigation to courses & learning

**[Courses.tsx](frontend/src/pages/Courses.tsx)** - Course Catalog & Management
- **Display Modes**: List view (table) & grid view (cards)
- **Search & Filter**:
  - Search by course name or description
  - Filter by category
  - Filter by status (active/inactive)
  - Filter by author (teacher)
  - Sort by name (A-Z), creation date
- **Course Statistics Display**:
  - Student count per course
  - Teacher count
  - Group count
  - Task count per course
- **Role-Based Actions**:
  - Teachers/Admins: Create, Edit, Delete courses
  - Students: View & Enroll
- **Additional Features**:
  - Status pills (Active/Inactive badges)
  - Course images with fallbacks
  - Pagination with customizable page size
  - Export to Excel (XLSX)
  - Real-time enrollment data

**[Learn.tsx](frontend/src/pages/Learn.tsx)** - Learning Dashboard
- Lightweight profile view with user info
- In-progress courses with:
  - Progress bars showing completion %
  - Course status indicators (completed, paused, in_progress)
- Achievement badges & tracking
- Trophy, Star, Award icons for achievements
- Motivational statistics

**[Profile.tsx](frontend/src/pages/Profile.tsx)** - User Account Management
- **Three-Tab Interface**:
  - **Manage Tab**:
    - Edit profile information (first name, last name, email)
    - Phone number & company
    - Birth date picker
    - Profile photo upload
    - Timezone selection (Asia/Tashkent default)
    - Interface language preference (en, ru, uz)
  - **Check Tab**: Email verification & status tracking
  - **Study Tab**: Learning progress overview
- **Account Actions**:
  - Change email (triggers verification workflow)
  - Toggle MFA enable/disable
  - View account status
  - See deactivation countdown if applicable
- **Synchronization**: Language preference syncs with i18n

---

#### **Course Management & Learning**

**[course/CourseLayout.tsx](frontend/src/pages/course/CourseLayout.tsx)** - Course Detail Wrapper
- Course banner with image/fallback
- **Tab Navigation**:
  - Content (course tasks)
  - Trainers (teachers list)
  - Groups (enrolled groups)
  - Students (student roster)
  - Reviews (course ratings/feedback)
- **Role Detection**:
  - Admin: Full management
  - Teacher: Edit & grading access
  - Student: Enrollment & submission access
  - Not Enrolled: Enrollment prompt
- Responsive layout with adaptive banner

**[course/CourseContent.tsx](frontend/src/pages/course/CourseContent.tsx)** - Task & Submission Management
- **Two-Pane Layout**:
  - Left: Task list with status badges
  - Right: Task detail & submission interface
- **Task Selection**:
  - Click to view task details
  - CKEditor rendering of rich content
  - Multimedia display (video, images, files)
- **Student Submission Workflow**:
  - Submit new answer to task
  - View answer status (in_review, approved, have_flaws, rejected)
  - Upload answer files
  - Manage uploaded attachments
  - View teacher feedback
- **Teacher Grading Interface**:
  - View submitted answers
  - Input numeric grade (0-100)
  - Add feedback comments
  - Automatic percentage & letter grade calculation
  - Save grade submission
  - Notify student of grading
- **File Management**:
  - Upload/download answer files
  - Remove individual files
  - Track file metadata (name, size)

**[course/CourseTaskView.tsx](frontend/src/pages/course/CourseTaskView.tsx)** - Full-Page Task Detail
- Complete task view with all multimedia
- Video, image, file attachments support
- CKEditor rendering of task description
- Answer submission interface
- File upload & download
- Grade display with percentage & letter grade
- Teacher feedback viewing
- Student/Teacher specific UI elements

**[course/CourseTrainers.tsx](frontend/src/pages/course/CourseTrainers.tsx)** - Teachers List
- Display all course instructors
- Teacher profile information
- Contact capabilities

**[course/CourseGroups.tsx](frontend/src/pages/course/CourseGroups.tsx)** - Groups In Course
- List all groups enrolled in course
- Group statistics (student count)
- Group schedule information
- Role-based management options

**[course/CourseStudents.tsx](frontend/src/pages/course/CourseStudents.tsx)** - Student Roster
- Display all enrolled students
- Student profiles with photos
- Filter & search capabilities
- Progress tracking per student

**[course/CourseReviews.tsx](frontend/src/pages/course/CourseReviews.tsx)** - Course Reviews & Ratings
- Course feedback & reviews
- Rating system
- Student comments
- Instructor responses

---

#### **Course Administration (Teachers/Admins)**

**[course/edit/CourseEdit.tsx](frontend/src/pages/course/edit/CourseEdit.tsx)** - Course Metadata Editor
- Edit course name & description
- Category selection with hierarchical dropdown
- Free order toggle
- Certificate enablement
- Deadline blocking setting
- Task management permission toggle (admin-only)
- Course image upload
- Publish/Archive course state
- Delete course with confirmation

**[course/edit/CourseManagementLayout.tsx](frontend/src/pages/course/edit/CourseManagementLayout.tsx)** - Admin Panel Wrapper
- Tab navigation for course admin views
- Lessons (task management)
- Certificates (certificate configuration)
- Points (grading/scoring setup)
- Analytics & reports

**[course/edit/CourseLessons.tsx](frontend/src/pages/course/edit/CourseLessons.tsx)** - Task Management
- Create new tasks/assignments
- Edit existing tasks
- Delete tasks
- Task ordering (number field)
- Rich text editor for descriptions
- Media/file attachment management
- Task status configuration
- Resubmission settings

**[course/edit/CourseCertificates.tsx](frontend/src/pages/course/edit/CourseCertificates.tsx)** - Certificate Setup
- Configure certificate requirements
- Certificate templates
- Completion criteria
- Distribution settings

**[course/edit/CoursePoints.tsx](frontend/src/pages/course/edit/CoursePoints.tsx)** - Scoring & Grading
- Configure grading scale
- Point distribution per task
- Letter grade mapping
- Weightage settings
- Passing score definition

---

#### **Group Management**

**[groups/Groups.tsx](frontend/src/pages/groups/Groups.tsx)** - Group Administration
- **List All Groups** with advanced filtering:
  - Filter by course
  - Search by group name
  - Sort by creation date
  - Pagination
- **Create Group Modal**:
  - Group name
  - Student limit configuration
  - Self-registration toggle
  - Days of week schedule
- **Group Management**:
  - Edit group details
  - Generate registration link (token)
  - Set token expiration date
  - Manage student enrollments
  - Delete group with confirmation
- **Display Info**:
  - Student count per group
  - Registration status
  - Token validity

**[groups/GroupEdit.tsx](frontend/src/pages/groups/GroupEdit.tsx)** - Single Group Editor
- Edit group metadata
- Update student limits
- Configure registration link
- Manage enrolled students
- View group statistics

---

#### **Teacher Review & Grading**

**[review/Students.tsx](frontend/src/pages/review/Students.tsx)** - Student List for Grading
- **Student Directory**:
  - Profile photos with fallbacks
  - Student name & email
  - Direct links to review interface
- **Advanced Filtering**:
  - Filter by course
  - Filter by group
  - Sort by "to_check" count (answers pending)
  - Sort by last updated
- **Status Tracking**:
  - Number of pending answers per student
  - Last activity timestamp
- **Navigation**:
  - Click student to open grading interface

**[review/StudentReview.tsx](frontend/src/pages/review/StudentReview.tsx)** - Grading Interface
- **Multi-Course Review**:
  - Switch between student's courses
  - View all tasks per course
- **Assignment Status Display**:
  - Status badges (in_review, approved, have_flaws, rejected)
  - Submission timestamps
  - File attachments
- **Grading Modal**:
  - Input numeric score (0-100)
  - Add feedback comments
  - Auto-calculate percentage & letter grade
  - Submit grade
  - Save changes
- **Media Resolution**:
  - Handle file:// protocol
  - Resolve relative paths
  - Display file previews

---

#### **User Management**

**[users/Users.tsx](frontend/src/pages/users/Users.tsx)** - Admin User Management
- **User Listing**:
  - Display all users with pagination
  - Show user roles (Student, Teacher, Admin)
  - Email verification status
  - Account active/inactive status
- **Filtering & Search**:
  - Search by email, name
  - Filter by role
  - Filter by status (active/deactivated)
  - Filter by verification status
- **Admin Actions**:
  - Create new users
  - Edit user details
  - Change user roles
  - Enable/disable accounts
  - Delete users
  - Bulk actions
- **User Statistics**:
  - Last login date
  - Creation date
  - Activity summary

---

### 🌐 **Internationalization & Theme**

**[components/common/LanguageContext.tsx](frontend/src/components/common/LanguageContext.tsx)** & **[components/common/LanguageSwitcher.tsx](frontend/src/components/common/LanguageSwitcher.tsx)**
- Multi-language support (en, ru, uz)
- Persistent language preference (localStorage)
- Dynamic text translation via i18next
- Language switcher in sidebar/header

**[components/common/ThemeContext.tsx](frontend/src/components/common/ThemeContext.tsx)** & **[components/common/ThemeToggle.tsx](frontend/src/components/common/ThemeToggle.tsx)**
- Dark/Light mode toggle
- CSS class-based theming
- Persistent preference (localStorage)
- System preference detection fallback
- Smooth theme transitions

---

## 🏗️ Architecture & Structure

```
src/
├── App.tsx                      # Main routing configuration
├── main.tsx                     # Entry point with React 19
├── i18n.ts                      # i18next configuration
├── index.css                    # Global styles
├── App.css                      # App-level styles
├── vite-env.d.ts               # Vite environment types
│
├── api/
│   └── api.ts                  # Axios instance with interceptors
│                               # Centralized API endpoints
│
├── auth/
│   ├── AuthContext.tsx          # JWT token management
│   │                             # Auto-refresh logic
│   │                             # Login/logout handlers
│   └── PrivateRoute.tsx         # Protected route wrapper
│
├── components/
│   ├── AppLayout.tsx            # Main layout with sidebar
│   │
│   ├── common/
│   │   ├── Sidebar.tsx          # Navigation sidebar
│   │   ├── Input.tsx            # Reusable input component
│   │   ├── ThemeContext.tsx     # Dark/light mode context
│   │   ├── ThemeToggle.tsx      # Theme switcher button
│   │   ├── LanguageContext.tsx  # i18n language context
│   │   ├── LanguageSwitcher.tsx # Language selector
│   │   └── ToggleDocument.tsx   # Generic toggle/accordion
│   │
│   ├── layout/
│   │   └── Header.tsx           # Page header component
│   │
│   ├── ui/
│   │   ├── button.tsx           # Styled button component
│   │   ├── RoundedCheckbox.tsx  # Custom checkbox
│   │   └── debugger.tsx         # Debug utility
│   │
│   └── admin/
│       ├── StudentCourseView.tsx     # Admin student view modal
│       ├── UserStudentViewModal.tsx  # Student detail modal
│       └── UserLanguageSelect.tsx    # User language selector
│
├── lib/
│   └── utils.ts                 # cn() class merging utility
│
├── pages/
│   ├── HomePage.tsx             # Home/dashboard
│   ├── Courses.tsx              # Course listing & management
│   ├── Learn.tsx                # Learning dashboard
│   ├── Profile.tsx              # User profile management
│   │
│   ├── Login.tsx                # Authentication login
│   ├── OTPVerification.tsx      # 2FA verification
│   ├── SetInitialPassword.tsx   # Account activation
│   ├── ForgotPassword.tsx       # Password reset request
│   ├── VerifyPasswordReset.tsx  # Reset code verification
│   ├── ResetPassword.tsx        # New password entry
│   │
│   ├── course/
│   │   ├── CourseLayout.tsx     # Course detail wrapper
│   │   ├── CourseContent.tsx    # Course tasks & submissions
│   │   ├── CourseTaskView.tsx   # Full task detail page
│   │   ├── CourseTrainers.tsx   # Teachers list
│   │   ├── CourseGroups.tsx     # Groups in course
│   │   ├── CourseStudents.tsx   # Student roster
│   │   ├── CourseReviews.tsx    # Course reviews
│   │   │
│   │   └── edit/
│   │       ├── CourseEdit.tsx   # Edit course metadata
│   │       ├── CourseManagementLayout.tsx  # Admin panel
│   │       ├── CourseLessons.tsx # Task management
│   │       ├── CourseCertificates.tsx # Certificate setup
│   │       └── CoursePoints.tsx # Grading configuration
│   │
│   ├── groups/
│   │   ├── Groups.tsx           # Group listing & management
│   │   └── GroupEdit.tsx        # Edit single group
│   │
│   ├── review/
│   │   ├── Students.tsx         # Student list for grading
│   │   └── StudentReview.tsx    # Grading interface
│   │
│   └── users/
│       └── Users.tsx            # Admin user management
│
├── utils/
│   └── url.tsx                  # URL utilities
│       └── ensureAbsoluteUrl()  # Convert relative to absolute URLs
│
├── assets/                      # Images, fonts
│
└── public/
    └── locales/
        ├── en/
        │   └── translation.json # English translations
        ├── ru/
        │   └── translation.json # Russian translations
        └── uz/
            └── translation.json # Uzbek translations
```

---

## 🔐 Authentication & Routing

### **JWT Token Management**
- **Token Refresh**: Automatic refresh before expiry
  - Access token default expiry: 60 days
  - Refresh window: Configurable (default 4 minutes before expiry)
  - Skew protection: 1 minute safety margin
  - Minimum delay: 10 seconds between attempts
- **Token Storage**: localStorage (access_token, refresh_token)
- **Login Flow**: Email → Validate → Check 2FA → OTP (if enabled) → Set tokens
- **Logout**: Server-side blacklist + client localStorage clear

### **Protected Routes**
- All pages under `/courses` require valid accessToken
- Redirect to `/login` if token missing or invalid
- Auto-refresh on route change

### **Complete Route Structure**

```
PUBLIC ROUTES:
├─ /login                      # Login page
├─ /activate                   # Set initial password (uid + token)
├─ /forgot-password            # Request password reset
├─ /forgot-password/verify     # Verify reset code
├─ /forgot-password/reset      # Set new password
├─ /otp-verification           # 2FA code entry

PROTECTED ROUTES (require JWT):
├─ /courses                    # Course listing & management
├─ /courses/:id                # Course detail view
│  ├─ /                        # Course content (default)
│  ├─ /trainers                # Teachers list
│  ├─ /groups                  # Enrolled groups
│  ├─ /students                # Student roster
│  └─ /reviews                 # Course reviews
│
├─ /courses/:id/edit           # Course metadata editor
├─ /courses/:id/lessons        # Task management
├─ /courses/:id/certificate    # Certificate configuration
├─ /courses/:id/points         # Grading setup
│
├─ /tasks/:taskId              # Full task detail page
│
├─ /groups                     # Group listing & management
├─ /groups/:id                 # Edit group
│
├─ /checking                   # Student list for grading
├─ /checking/:studentId/review/:courseId  # Grading interface
│
├─ /learn                      # Learning dashboard
├─ /profile                    # User profile management
├─ /users                      # Admin user management
│
└─ /about, /statistics, /news  # Placeholder pages
```

---

## 🌐 API Integration

### **Axios Configuration**
- Base URL: `VITE_API_URL` env or `http://127.0.0.1:8000/api/`
- Bearer token auto-attach to all requests
- Error interceptor for 401/403 handling
- Request/response logging in dev mode

### **API Endpoints Called**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `accounts/login/` | POST | Login with email/password |
| `accounts/login/` | POST | Submit OTP for 2FA |
| `accounts/login/refresh/` | POST | Refresh access token |
| `accounts/auth/logout/` | DELETE | Logout & blacklist |
| `accounts/user/profile/` | GET | Fetch user profile |
| `accounts/user/` | PUT/PATCH | Update profile |
| `accounts/user/request_email_change/` | POST | Request email change |
| `accounts/user/confirm_email_change/` | POST | Confirm with code |
| `course/courses/` | GET | List all courses |
| `course/courses/{id}/` | GET/PATCH/DELETE | Manage course |
| `course/courses/` | POST | Create course |
| `course/categories/` | GET | List categories |
| `course/tasks/` | GET/POST/PATCH | Manage tasks |
| `course/answers/` | GET/POST | Submit/view answers |
| `course/answers/{id}/check/` | POST | Grade answer |
| `course/groups/` | GET/POST/PATCH | Manage groups |
| `course/enrollments/` | GET | List enrollments |
| `chat/rooms/` | GET/POST | Manage chat rooms |
| `chat/messages/` | GET/POST | Messages |
| `notifications/` | GET | List notifications |
| `grades/` | GET/POST/PATCH | Manage grades |

---

## 💾 State Management

### **Context-Based Architecture**
- ✅ **Auth Context**: Manages JWT tokens, login/logout, token refresh
- ✅ **Theme Context**: Dark/light mode toggle with persistence
- ✅ **Language Context**: i18n language selection with persistence
- ✅ **Local State**: Component-level `useState` for UI state
- ✅ **URL State**: Query parameters for filters & selections (`?task=`, `?lng=`)
- ✅ **LocalStorage**: Persist tokens, theme, language preferences, temp data
- ✅ **SessionStorage**: Temporary data (reset email, verification flow)

### **No Global Store**
- Lightweight, no Redux/Zustand overhead
- React Context API for shared state
- Direct API calls via Axios
- Local component state for UI interactions

---

## 🚀 Build & Development

### **Environment Variables**
```env
# API Configuration
VITE_API_URL=http://127.0.0.1:8000/api/

# Authentication
VITE_MIN_PASSWORD_LENGTH=8
VITE_REFRESH_INTERVAL_MS=240000  # 4 minutes
VITE_REFRESH_SKEW_MS=60000       # 1 minute skew
```

### **Development Server**
```bash
npm install
npm run dev          # Start dev server on http://localhost:5173
npm run build        # Production build to dist/
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### **Vite Configuration**
- React plugin with Fast Refresh
- Tailwind CSS Vite plugin
- Path alias: `@` → `./src/`
- Dev server: LAN accessible

### **TypeScript Configuration**
- Target: ES2022 (modern browsers)
- Strict mode enabled
- No unused vars/parameters
- JSX: react-jsx (automatic)
- Path alias support

---

## 🎯 Key Features & User Flows

### **Student User Flow**
1. **Login** → 2FA (if enabled) → Auth context set
2. **Browse Courses** → Filter by category/author
3. **Enroll** in course via group registration token
4. **View Tasks** in course
5. **Submit Answers** with file attachments
6. **Receive Grades** from teachers
7. **Chat** with teachers in real-time
8. **Track Progress** in Learn dashboard
9. **Update Profile** with photo & preferences

### **Teacher User Flow**
1. **Login** → Auth context set
2. **Create Courses** & configure metadata
3. **Create Course Groups** with registration links
4. **Create Tasks** with rich text & multimedia
5. **View Student Submissions** pending review
6. **Grade Submissions** with score & feedback
7. **Chat** with students in real-time
8. **View Course Statistics** & student progress
9. **Manage Enrollments** & bulk operations

### **Admin User Flow**
1. **Login** → Auth context set
2. **Manage Users** - create, edit, delete
3. **Manage Courses** - full CRUD
4. **Create Categories** - hierarchical organization
5. **View System Statistics** - all users, courses, activities
6. **Configure Settings** - permissions, deadlines, etc.
7. **User Impersonation** - view as student/teacher
8. **System Monitoring** - logs, errors, performance

---

## 🎨 Component Library & UI

### **Reusable Components**
- **Input**: Text field with icon support, error states
- **Button**: Multiple variants, sizes, loading states
- **Checkbox**: Custom styled with Lucide icons
- **Modal**: Overlay with close button
- **Dropdown**: Select with search & filter
- **Pagination**: Pages navigation with size selector
- **Table**: Sortable, filterable data display
- **Card**: Flexible container component
- **Badge**: Status indicators & labels
- **Tooltip**: Hover information display

### **Styling System**
- **Tailwind Utilities**: sm, md, lg breakpoints
- **Dark Mode**: CSS class-based toggle
- **Color Scheme**: Brand colors + semantic colors
- **Typography**: Consistent font sizes & weights
- **Spacing**: 4px unit grid system

---

## 📊 Data Visualization

### **Recharts Integration**
- Progress bars for course completion
- Grade distribution charts
- Student performance analytics
- Enrollment trends
- Activity timelines

### **Tables & Lists**
- Sortable table headers
- Inline editing capabilities
- Quick actions (Edit, Delete, View)
- Batch selection & operations
- Status indicators

---

## 🔐 Security & Best Practices

### **Frontend Security**
- ✅ XSS Prevention: DOMPurify for HTML rendering
- ✅ CSRF Protection: Bearer token authentication
- ✅ Secure Storage: No passwords in localStorage
- ✅ HTTPS Ready: Configurable for production
- ✅ Input Validation: Client-side & server-side
- ✅ Content Security: Sanitized user input

### **Best Practices**
- ✅ Lazy loading for routes
- ✅ Code splitting per page
- ✅ Optimized bundle size
- ✅ Responsive design (mobile-first)
- ✅ Accessibility (ARIA labels, keyboard nav)
- ✅ Error boundaries (React error handling)
- ✅ Loading states & skeletons
- ✅ Empty states & 404 pages

---

## 📱 Responsive Design

- **Mobile First** - Built for small screens
- **Breakpoints**: sm (640px), md (768px), lg (1024px), xl (1280px)
- **Flexible Layouts** - Grid & flexbox
- **Touch-Friendly** - Larger tap targets
- **Viewport Meta** - Proper scaling
- **Sidebar Toggle** - Collapsible navigation

---

## 🌟 Performance Optimizations

- ✅ Code splitting per route
- ✅ Lazy loading images
- ✅ Memoization of components
- ✅ Debounced search/filter
- ✅ Vite's optimized bundle
- ✅ CSS minification
- ✅ JavaScript minification
- ✅ Tree shaking of unused code

---

## 📦 Production Build

```bash
npm run build

# Output: dist/ folder ready for deployment
# Features:
# - Minified assets
# - Source maps (optional)
# - CSS extraction
# - Asset hashing for cache busting
```

### **Deployment Ready**
- Static files hosting (Nginx, S3, CloudFront)
- SPA routing (index.html fallback)
- Gzip compression enabled
- Cache headers configured
- Environment variable injection

---

## 🎓 Key Learnings & Patterns

### **React 19 Features Used**
- Concurrent rendering for smoother UX
- Automatic batching of state updates
- Server component ready architecture

### **Tailwind CSS Strategies**
- Utility composition via `cn()` function
- Dark mode toggle with CSS classes
- Responsive variants for all components

### **i18next Best Practices**
- Namespace organization
- Lazy loading translations
- Language detection order
- Fallback language support

### **TypeScript Patterns**
- Type-safe API responses
- Interface segregation
- Generic component patterns
- Strict null checking

---

## 🚀 Future Enhancements

- WebSocket integration for real-time chat
- Offline mode support
- PWA capabilities
- Mobile app (React Native)
- Advanced analytics dashboard
- Video streaming optimization
- Collaborative editing
- More theme options

---

## 🌟 Conclusion

**LearnovaX Frontend** is a **modern, production-ready LMS interface** with:

- ⚛️ **React + TypeScript**: Type-safe, component-based architecture
- 🎨 **Tailwind CSS**: Beautiful, responsive design
- 🌍 **Internationalization**: Multi-language support (en, ru, uz)
- 🔐 **Security**: JWT auth, input validation, XSS prevention
- 📱 **Responsive**: Mobile-first design for all devices
- ⚡ **Performance**: Optimized builds, code splitting, caching
- 🎯 **User-Centric**: Intuitive flows, role-based dashboards
- 📚 **Accessibility**: ARIA labels, keyboard navigation

**This interface provides an exceptional learning experience for students, teachers, and administrators with real-time collaboration, comprehensive course management, and beautiful UI/UX.** 🎉

---

*Built with ❤️ using React 19, TypeScript, Tailwind CSS, Vite, and modern web technologies*
├── auth/               # Context Providers and PrivateWrapper logic
├── components/         # Reusable UI widgets and layout shells
├── lib/                # Utility toolings
├── pages/              # Primary route views
├── i18n.ts             # Internationalization config
└── main.tsx            # Application entrypoint

---

## ⚙️ Running Locally

1. **Install Dependencies:**
   cd frontend
   npm install

2. **Configure Environment:**
   Set VITE_API_URL=http://localhost:8000/api in .env

3. **Start Development Server:**
   npm run dev

4. **Build for Production:**
   npm run build
