// App.tsx
import './App.css'
import Login from '@/pages/Login'
import SetInitialPassword from '@/pages/SetInitialPassword'
import Profile from '@/pages/Profile'
import ForgotPassword from '@/pages/ForgotPassword'
import Learn from '@/pages/Learn'
import Users from '@/pages/users/Users.tsx'
import Groups from '@/pages/groups/Groups'
import GroupEdit from '@/pages/groups/GroupEdit'
import Courses from '@/pages/Courses'
import VerifyPasswordReset from '@/pages/VerifyPasswordReset'
import ResetPassword from '@/pages/ResetPassword'
import Sidebar from '@/components/common/Sidebar'
import { BrowserRouter, Routes, Route, useLocation, Outlet, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/auth/AuthContext'
import { ThemeProvider, useTheme } from '@/components/common/ThemeContext'
import { PrivateRoute } from '@/auth/PrivateRoute'
import CourseLayout from "@/pages/course/CourseLayout"
import CourseContent from "@/pages/course/CourseContent"
import CourseTrainers from "@/pages/course/CourseTrainers"
import CourseGroups from "@/pages/course/CourseGroups"
import CourseStudents from "@/pages/course/CourseStudents"
import CourseReviews from "@/pages/course/CourseReviews"
import CourseEdit from "@/pages/course/edit/CourseEdit"
import CourseManageLayout from './pages/course/edit/CourseManagementLayout'
import CourseLessons from './pages/course/edit/CourseLessons'
import CourseCertificates from './pages/course/edit/CourseCertificates'
import CoursePoints from './pages/course/edit/CoursePoints'
import CourseTaskView from '@/pages/course/CourseTaskView'
import { useEffect } from 'react'
import Students from '@/pages/review/Students'
import StudentReview from '@/pages/review/StudentReview'
import { LanguageProvider } from '@/components/common/LanguageContext' // 👈 add
import PlagiarismDashboard from '@/pages/plagiarism/PlagiarismDashboard'
import PlagiarismReportDetail from '@/pages/plagiarism/PlagiarismReportDetail';


function About() { return <h1>About Page</h1> }
function Statistics() { return <h1>Statistics Page</h1> }
function News() { return <h1>News Page</h1> }

// Theme-aware layout component
function ThemeAwareLayout({ children }: { children: React.ReactNode }) {
    const { actualTheme } = useTheme();
    const location = useLocation();
    const hideSidebar =
        location.pathname === "/login" ||
        location.pathname === "/activate" ||
        location.pathname === "/forgot-password" ||
        location.pathname === "/forgot-password/verify" ||
        location.pathname === "/forgot-password/reset";

    // Apply theme class to body without clobbering other classes
    useEffect(() => {
        if (actualTheme) document.body.classList.add(actualTheme);
        return () => { if (actualTheme) document.body.classList.remove(actualTheme); };
    }, [actualTheme]);

    // Only prevent body scroll while this layout is mounted (protected pages)
    useEffect(() => {
        // save previous overflow so we can restore it
        const prevOverflow = document.body.style.overflow;
        // hide the outer scrollbar for the app shell (so inner container scrolls)
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = prevOverflow ?? '';
        };
    }, []);

    return (
        <div className={`flex h-screen overflow-hidden ${actualTheme}`}>
            {!hideSidebar && <Sidebar />}
            <div className="flex-1 min-h-0 px-2 overflow-y-auto bg-background text-foreground">
                {children}
            </div>
        </div>
    );
}

function AppShell() {
    return (
        <ThemeAwareLayout>
            <Outlet />
        </ThemeAwareLayout>
    );
}

export default function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <LanguageProvider>
                    <BrowserRouter>
                        <Routes>
                            {/* ---------- Public ---------- */}
                            <Route path="/login" element={<Login />} />
                            <Route path="/activate" element={<SetInitialPassword />} />
                            <Route path="/forgot-password" element={<ForgotPassword />} />
                            <Route path="/forgot-password/verify" element={<VerifyPasswordReset />} />
                            <Route path="/forgot-password/reset" element={<ResetPassword />} />

                            {/* ---------- Protected (Layout + Sidebar) ---------- */}
                            <Route element={<PrivateRoute><AppShell /></PrivateRoute>}>
                                {/* redirect home */}
                                <Route path="/" element={<Navigate to="/courses" replace />} />

                                {/* Courses index */}
                                <Route path="/courses" element={<Courses />} />

                                {/* Course detail with nested tabs */}
                                <Route path="/courses/:id" element={<CourseLayout />}>
                                    <Route index element={<CourseContent />} />
                                    <Route path="trainers" element={<CourseTrainers />} />
                                    <Route path="groups" element={<CourseGroups />} />
                                    <Route path="students" element={<CourseStudents />} />
                                    <Route path="reviews" element={<CourseReviews />} />
                                </Route>

                                {/* Manage */}
                                <Route path="/courses/:id" element={<CourseManageLayout />}>
                                    <Route path="edit" element={<CourseEdit />} />
                                    <Route path="lessons" element={<CourseLessons />} />
                                    <Route path="certificate" element={<CourseCertificates />} />
                                    <Route path="points" element={<CoursePoints />} />
                                </Route>

                                {/* Direct edit + tasks */}
                                <Route path="/courses/:id/edit" element={<CourseEdit />} />
                                <Route path="/tasks/:taskId" element={<CourseTaskView />} />

                                {/* Groups */}
                                <Route path="/groups" element={<Groups />} />
                                <Route path="/groups/:id" element={<GroupEdit />} />

                                {/* ---------- Teacher Checking ---------- */}
                                {/* Sidebar "Проверка" */}
                                <Route path="/checking" element={<Students />} />
                                {/* Aliases for backward compatibility */}
                                <Route path="/teacher/students" element={<Navigate to="/checking" replace />} />
                                <Route path="/checking/:studentId/review/:courseId" element={<StudentReview />} />
                                <Route path="/teacher/students/:studentId/review/:courseId" element={<StudentReview />} />
                                <Route path="/plagiarism" element={<PlagiarismDashboard />} />
                                <Route path="/plagiarism/reports/:id" element={<PlagiarismReportDetail />} />
                                
                                {/* Other protected pages */}
                                <Route path="/about" element={<About />} />
                                <Route path="/statistics" element={<Statistics />} />
                                <Route path="/learn" element={<Learn />} />
                                <Route path="/profile" element={<Profile />} />
                                <Route path="/news" element={<News />} />
                                <Route path="/users" element={<Users />} />
                            </Route>

                            {/* Fallback */}
                            <Route path="*" element={<Navigate to="/courses" replace />} />
                        </Routes>
                    </BrowserRouter>
                </LanguageProvider>
            </AuthProvider>
        </ThemeProvider>
    )
}
