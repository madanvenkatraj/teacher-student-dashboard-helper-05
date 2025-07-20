
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Shield } from 'lucide-react';
import PageTransition from '@/components/PageTransition';

const Unauthorized = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const goBack = () => {
    if (currentUser) {
      if (currentUser.role === 'teacher') {
        navigate('/teacher-dashboard');
      } else if (currentUser.role === 'student') {
        navigate('/student-dashboard');
      } else {
        navigate('/');
      }
    } else {
      navigate('/');
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
        <div className="max-w-md w-full text-center">
          <div className="mb-6">
            <Shield className="h-16 w-16 text-red-500 mx-auto" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Unauthorized Access</h1>
          <p className="text-gray-600 mb-8">
            You don't have permission to access this page. Please contact your administrator if you believe this is an error.
          </p>
          <Button onClick={goBack}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Return to Dashboard
          </Button>
        </div>
      </div>
    </PageTransition>
  );
};

export default Unauthorized;
