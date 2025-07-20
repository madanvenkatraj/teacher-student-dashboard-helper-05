
import { Calendar, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format, isPast } from 'date-fns';
import { Link } from 'react-router-dom';
import { Assessment, Submission, User } from '@/contexts/AuthContext';

interface ActiveAssessmentsProps {
  sortedAssessments: Assessment[];
  currentUser: User;
  teacherName: string;
  getSubmission: (assessmentId: string, studentId: string) => Submission | undefined;
}

const ActiveAssessments = ({ 
  sortedAssessments, 
  currentUser, 
  teacherName, 
  getSubmission 
}: ActiveAssessmentsProps) => {
  if (sortedAssessments.length === 0) return null;

  return (
    <div>
      <h3 className="text-lg font-medium mb-3">Active Assessments</h3>
      <div className="space-y-4">
        {sortedAssessments.map(assessment => {
          const submission = getSubmission(assessment.id, currentUser.id);
          const now = new Date();
          const dueDateTimeObj = new Date(`${assessment.dueDate}T${assessment.dueTime || '23:59'}`);
          const isOverdue = isPast(dueDateTimeObj);
          const isOngoing = !isOverdue;
          
          // Results are only visible after due date/time has passed
          const canViewResults = isPast(dueDateTimeObj);
          
          return (
            <div 
              key={assessment.id}
              className="border rounded-lg overflow-hidden bg-white hover:shadow-md transition-shadow"
            >
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-lg mb-1">{assessment.title}</h3>
                    <p className="text-gray-500 text-sm mb-2">
                      {assessment.description || "No description provided"}
                    </p>
                    <p className="text-xs text-gray-400">
                      Created by: {assessment.createdBySuperTeacher ? 'Super Teacher' : teacherName}
                    </p>
                  </div>
                  
                  {submission?.isCompleted ? (
                    canViewResults && submission?.marksAwarded !== undefined ? (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" /> Completed
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-600">
                        <Clock className="h-3 w-3 mr-1" /> Submitted
                      </Badge>
                    )
                  ) : isOverdue ? (
                    <Badge variant="destructive">
                      <XCircle className="h-3 w-3 mr-1" /> Overdue
                    </Badge>
                  ) : isOngoing ? (
                    submission ? (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-800">
                        <Clock className="h-3 w-3 mr-1" /> In Progress
                      </Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-800">
                        <Clock className="h-3 w-3 mr-1" /> Ongoing
                      </Badge>
                    )
                  ) : (
                    <Badge variant="outline">
                      <Clock className="h-3 w-3 mr-1" /> Not Started
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center text-sm text-gray-500 mb-2 mt-4">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span className={isOverdue ? 'text-red-500' : ''}>
                    Due: {format(dueDateTimeObj, 'PPP p')}
                  </span>
                </div>
                
                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <FileText className="h-4 w-4 mr-2" />
                  <span>{assessment.questions.length} Questions</span>
                </div>
                
                {submission?.marksAwarded !== undefined && canViewResults && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-md">
                    <p className="text-sm font-medium text-blue-800">Your Mark</p>
                    <p className="text-xl font-bold text-blue-900">
                      {submission.marksAwarded} / {assessment.questions.reduce((total, q) => total + q.marks, 0)}
                    </p>
                  </div>
                )}
                
                <Button 
                  asChild 
                  variant={submission?.isCompleted || isOverdue ? "outline" : "default"}
                  className="w-full"
                  disabled={submission?.isCompleted && !canViewResults}
                >
                  <Link to={`/student-assessment/${assessment.id}`}>
                    {submission?.isCompleted 
                      ? (canViewResults && submission?.marksAwarded !== undefined ? 'View Results' : 'Assessment Submitted') 
                      : (isOverdue ? 'View Assessment (Overdue)' : 'Start Assessment')}
                  </Link>
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ActiveAssessments;
