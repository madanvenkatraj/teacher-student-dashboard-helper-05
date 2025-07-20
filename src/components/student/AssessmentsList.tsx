
import { FileText } from 'lucide-react';
import AnimatedCard from '@/components/AnimatedCard';
import UpcomingAssessments from './UpcomingAssessments';
import ActiveAssessments from './ActiveAssessments';
import { Assessment, Submission, User } from '@/contexts/AuthContext';

interface AssessmentsListProps {
  sortedAssessments: Assessment[];
  upcomingAssessments: Assessment[];
  currentUser: User;
  teacherName: string;
  getSubmission: (assessmentId: string, studentId: string) => Submission | undefined;
}

const AssessmentsList = ({ 
  sortedAssessments, 
  upcomingAssessments, 
  currentUser, 
  teacherName, 
  getSubmission 
}: AssessmentsListProps) => {
  const hasAnyAssessments = sortedAssessments.length > 0 || upcomingAssessments.length > 0;

  return (
    <AnimatedCard
      delay={0.3}
      id="assessments"
      header={
        <div className="flex items-center">
          <FileText className="h-5 w-5 mr-2 text-primary" />
          <h2 className="text-xl font-medium">Your Assessments</h2>
        </div>
      }
    >
      {hasAnyAssessments ? (
        <div className="space-y-6">
          <UpcomingAssessments 
            upcomingAssessments={upcomingAssessments}
            teacherName={teacherName}
          />
          
          <ActiveAssessments
            sortedAssessments={sortedAssessments}
            currentUser={currentUser}
            teacherName={teacherName}
            getSubmission={getSubmission}
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <FileText className="h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No assessments yet</h3>
          <p className="text-gray-500 mb-2">
            Your teacher hasn't assigned any assessments yet.
          </p>
          <p className="text-xs text-gray-400">
            Teacher: {teacherName}
          </p>
        </div>
      )}
    </AnimatedCard>
  );
};

export default AssessmentsList;
