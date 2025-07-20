
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import PageTransition from '@/components/PageTransition';
import { isPast, isAfter } from 'date-fns';
import StudentProfile from '@/components/student/StudentProfile';
import AssessmentSummary from '@/components/student/AssessmentSummary';
import AssessmentsList from '@/components/student/AssessmentsList';

const StudentDashboard = () => {
  const { currentUser, logout, teachers, getStudentAssessments, getSubmission } = useAuth();
  
  // Find the teacher that created this student
  const teacher = teachers.find(t => t.id === currentUser?.createdBy);
  
  // Get assessments for this student - only from their specific teacher
  // This ensures no duplicate or unrelated assessments appear
  const studentAssessments = currentUser && teacher
    ? getStudentAssessments(currentUser.id).filter(assessment => {
        // Only show assessments created by the student's teacher
        // or Super Teacher assessments that are globally visible
        return assessment.createdBy === teacher.id || assessment.createdBySuperTeacher;
      })
    : [];

  console.log('Student assessments for', currentUser?.name, ':', studentAssessments);
  console.log('Student created by teacher:', teacher?.name);
  console.log('Filtered assessments count:', studentAssessments.length);
  
  // Filter assessments to only show those where start time has passed
  const now = new Date();
  const visibleAssessments = studentAssessments.filter(assessment => {
    const startDateTime = new Date(`${assessment.startDate}T${assessment.startTime || '00:00'}`);
    return !isAfter(startDateTime, now);
  });
  
  // Get upcoming (not yet visible) assessments
  const upcomingAssessments = studentAssessments.filter(assessment => {
    const startDateTime = new Date(`${assessment.startDate}T${assessment.startTime || '00:00'}`);
    return isAfter(startDateTime, now);
  });
  
  // Sort visible assessments by due date (upcoming first, then overdue)
  const sortedAssessments = [...visibleAssessments].sort((a, b) => {
    const dateA = new Date(a.dueDate);
    const dateB = new Date(b.dueDate);
    const nowDate = new Date();
    
    // If both are overdue or both are not overdue, sort by date
    if ((isPast(dateA) === isPast(dateB))) {
      return dateA.getTime() - dateB.getTime();
    }
    
    // Put non-overdue (upcoming) assessments first
    return isPast(dateA) ? 1 : -1;
  });

  if (!currentUser) {
    return null;
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4 sm:p-6 md:p-8">
        <div className="max-w-5xl mx-auto">
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900 mb-1">
                Student Dashboard
              </h1>
              <p className="text-gray-500">
                Welcome, {currentUser.name}
              </p>
              {/* Debug info - can be removed later */}
              <p className="text-xs text-gray-400 mt-1">
                Teacher: {teacher?.name || 'Unknown'} | Total Assessments: {studentAssessments.length}
              </p>
            </div>
            
            <Button variant="outline" onClick={logout} className="shrink-0">
              <LogOut className="h-4 w-4 mr-2" /> Sign Out
            </Button>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <StudentProfile 
              currentUser={currentUser}
              teacherName={teacher?.name || 'Unknown Teacher'}
            />

            <AssessmentSummary
              currentUser={currentUser}
              studentAssessments={studentAssessments}
              sortedAssessments={sortedAssessments}
              upcomingAssessments={upcomingAssessments}
              getSubmission={getSubmission}
            />
          </div>

          <AssessmentsList
            sortedAssessments={sortedAssessments}
            upcomingAssessments={upcomingAssessments}
            currentUser={currentUser}
            teacherName={teacher?.name || 'Unknown Teacher'}
            getSubmission={getSubmission}
          />
        </div>
      </div>
    </PageTransition>
  );
};

export default StudentDashboard;
