
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
  
  // Get assessments for this student - filtering is handled by getStudentAssessments
  const studentAssessments = currentUser ? getStudentAssessments(currentUser.id) : [];

  console.log('Student assessments for', currentUser?.name, ':', studentAssessments);
  console.log('Student created by teacher:', teacher?.name);
  console.log('Filtered assessments count:', studentAssessments.length);
  
  // Categorize assessments based on current time
  const now = new Date();
  
  // Get upcoming assessments (start time is in the future)
  const upcomingAssessments = studentAssessments.filter(assessment => {
    const startDateTime = new Date(`${assessment.startDate}T${assessment.startTime || '00:00'}`);
    return isAfter(startDateTime, now);
  });
  
  // Get active assessments (start time has passed)
  const activeAssessments = studentAssessments.filter(assessment => {
    const startDateTime = new Date(`${assessment.startDate}T${assessment.startTime || '00:00'}`);
    return !isAfter(startDateTime, now);
  });
  
  // Sort active assessments: ongoing first, then overdue
  const sortedAssessments = [...activeAssessments].sort((a, b) => {
    const dueDateTimeA = new Date(`${a.dueDate}T${a.dueTime || '23:59'}`);
    const dueDateTimeB = new Date(`${b.dueDate}T${b.dueTime || '23:59'}`);
    
    const isOverdueA = isPast(dueDateTimeA);
    const isOverdueB = isPast(dueDateTimeB);
    
    // If both are overdue or both are ongoing, sort by due date
    if (isOverdueA === isOverdueB) {
      return dueDateTimeA.getTime() - dueDateTimeB.getTime();
    }
    
    // Put ongoing assessments first
    return isOverdueA ? 1 : -1;
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
