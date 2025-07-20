
import { GraduationCap } from 'lucide-react';
import AnimatedCard from '@/components/AnimatedCard';
import { User } from '@/contexts/AuthContext';

interface StudentProfileProps {
  currentUser: User;
  teacherName: string;
}

const StudentProfile = ({ currentUser, teacherName }: StudentProfileProps) => {
  return (
    <AnimatedCard
      delay={0.1}
      header={
        <div className="flex items-center">
          <GraduationCap className="h-5 w-5 mr-2 text-primary" />
          <h2 className="text-xl font-medium">Your Profile</h2>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-500">Full Name</p>
          <p className="font-medium">{currentUser.name}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Email Address</p>
          <p className="font-medium">{currentUser.email}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Teacher</p>
          <p className="font-medium">{teacherName}</p>
        </div>
      </div>
    </AnimatedCard>
  );
};

export default StudentProfile;
