
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import TeacherDashboard from "./pages/TeacherDashboard";
import TeacherAssessments from "./pages/TeacherAssessments";
import AssessmentDetails from "./pages/AssessmentDetails";
import StudentDashboard from "./pages/StudentDashboard";
import StudentAssessment from "./pages/StudentAssessment";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminDashboard from "./pages/AdminDashboard";
import CreateTeacher from "./pages/CreateTeacher";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  {({ currentUser }) => 
                    currentUser?.role === 'teacher' ? (
                      <Navigate to="/teacher-dashboard" replace />
                    ) : currentUser?.role === 'student' ? (
                      <Navigate to="/student-dashboard" replace />
                    ) : currentUser?.role === 'admin' ? (
                      <Navigate to="/admin-dashboard" replace />
                    ) : null
                  }
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/teacher-dashboard" 
              element={
                <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                  <TeacherDashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/teacher-assessments" 
              element={
                <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                  <TeacherAssessments />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/assessment/:assessmentId" 
              element={
                <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                  <AssessmentDetails />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/student-dashboard" 
              element={
                <ProtectedRoute allowedRoles={['student', 'admin']}>
                  <StudentDashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/student-assessment/:assessmentId" 
              element={
                <ProtectedRoute allowedRoles={['student', 'admin']}>
                  <StudentAssessment />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/admin-dashboard" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/create-teacher" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <CreateTeacher />
                </ProtectedRoute>
              } 
            />
            
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
