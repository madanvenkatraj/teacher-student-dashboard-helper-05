
import { Calendar as CalendarIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Assessment } from '@/contexts/AuthContext';

interface UpcomingAssessmentsProps {
  upcomingAssessments: Assessment[];
  teacherName: string;
}

const UpcomingAssessments = ({ upcomingAssessments, teacherName }: UpcomingAssessmentsProps) => {
  if (upcomingAssessments.length === 0) return null;

  return (
    <div>
      <h3 className="text-lg font-medium mb-3">Upcoming Assessments</h3>
      <div className="space-y-4">
        {upcomingAssessments.map(assessment => {
          const startDateTime = new Date(`${assessment.startDate}T${assessment.startTime || '00:00'}`);
          
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
                  
                  <Badge className="bg-blue-100 text-blue-800">
                    Upcoming
                  </Badge>
                </div>
                
                <div className="flex items-center text-sm text-gray-500 mb-2 mt-4">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  <span>
                    Starts: {format(startDateTime, 'PPP p')}
                  </span>
                </div>
                
                <div className="p-3 bg-gray-50 rounded-md mt-4">
                  <p className="text-sm text-gray-600">
                    This assessment will be available to take when it starts.
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UpcomingAssessments;
