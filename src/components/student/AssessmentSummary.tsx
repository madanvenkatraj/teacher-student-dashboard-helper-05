
import { FileText, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AnimatedCard from '@/components/AnimatedCard';
import { format, isPast } from 'date-fns';
import { Link } from 'react-router-dom';
import { Assessment, Submission, User } from '@/contexts/AuthContext';

interface AssessmentSummaryProps {
  currentUser: User;
  studentAssessments: Assessment[];
  sortedAssessments: Assessment[];
  upcomingAssessments: Assessment[];
  getSubmission: (assessmentId: string, studentId: string) => Submission | undefined;
}

const AssessmentSummary = ({ 
  currentUser, 
  studentAssessments, 
  sortedAssessments, 
  upcomingAssessments, 
  getSubmission 
}: AssessmentSummaryProps) => {
  return (
    <AnimatedCard
      delay={0.2}
      header={
        <div className="flex items-center">
          <FileText className="h-5 w-5 mr-2 text-primary" />
          <h2 className="text-xl font-medium">Assessment Summary</h2>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-blue-700">
              {studentAssessments.length}
            </p>
            <p className="text-sm text-blue-600">Total Assessments</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-green-700">
              {sortedAssessments.filter(a => {
                const submission = getSubmission(a.id, currentUser.id);
                return submission?.isCompleted;
              }).length}
            </p>
            <p className="text-sm text-green-600">Completed</p>
          </div>
        </div>
        
        {/* Upcoming assessments section */}
        {upcomingAssessments.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Scheduled Assessments</p>
            <div className="space-y-2">
              {upcomingAssessments
                .slice(0, 2)
                .map(assessment => {
                  const startDateTime = new Date(`${assessment.startDate}T${assessment.startTime || '00:00'}`);
                  
                  return (
                    <div 
                      key={assessment.id}
                      className="bg-white border rounded-md p-3 flex justify-between items-center"
                    >
                      <div>
                        <p className="font-medium line-clamp-1">{assessment.title}</p>
                        <div className="flex items-center text-sm text-gray-500">
                          <CalendarIcon className="h-3 w-3 mr-1" />
                          <span>Starts: {format(startDateTime, 'PP pp')}</span>
                        </div>
                      </div>
                      
                      <Badge className="bg-blue-100 text-blue-800">Upcoming</Badge>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
        
        {/* Active assessments */}
        {sortedAssessments.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Active Assessments</p>
            <div className="space-y-2">
              {sortedAssessments
                .filter(a => !isPast(new Date(a.dueDate)))
                .slice(0, 2)
                .map(assessment => {
                  const submission = getSubmission(assessment.id, currentUser.id);
                  
                  return (
                    <div 
                      key={assessment.id}
                      className="bg-white border rounded-md p-3 flex justify-between items-center"
                    >
                      <div>
                        <p className="font-medium line-clamp-1">{assessment.title}</p>
                        <div className="flex items-center text-sm text-gray-500">
                          <CalendarIcon className="h-3 w-3 mr-1" />
                          <span>Due: {format(new Date(assessment.dueDate), 'PP')}</span>
                        </div>
                      </div>
                      
                      {submission?.isCompleted ? (
                        <Badge className="bg-green-100 text-green-800">Completed</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-800">Pending</Badge>
                      )}
                    </div>
                  );
                })}
              
              {sortedAssessments.filter(a => !isPast(new Date(a.dueDate))).length === 0 && (
                <p className="text-gray-500 text-sm italic">No active assessments</p>
              )}
            </div>
          </div>
        )}
        
        <Button 
          asChild 
          variant="outline" 
          className="w-full"
        >
          <Link to="#assessments">
            View All Assessments
          </Link>
        </Button>
      </div>
    </AnimatedCard>
  );
};

export default AssessmentSummary;
