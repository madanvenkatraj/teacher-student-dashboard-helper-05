
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Calendar, CheckCircle, Clock, FileText, AlertTriangle, Award, Maximize } from 'lucide-react';
import AnimatedCard from '@/components/AnimatedCard';
import PageTransition from '@/components/PageTransition';
import { useParams, Link, Navigate, useNavigate } from 'react-router-dom';
import { format, isPast, differenceInSeconds } from 'date-fns';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from "@/components/ui/alert";

const StudentAssessment = () => {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const { 
    currentUser, 
    getAssessmentById, 
    getSubmission,
    submitAssessment,
    canStudentTakeAssessment,
    isAssessmentActive
  } = useAuth();
  
  const [answers, setAnswers] = useState<{ [questionId: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showTabWarning, setShowTabWarning] = useState(false);
  const [autoSubmitted, setAutoSubmitted] = useState(false);
  const [screenSizeViolation, setScreenSizeViolation] = useState(false);
  const [showScreenWarning, setShowScreenWarning] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showFullscreenPrompt, setShowFullscreenPrompt] = useState(false);
  const [fullscreenAttempts, setFullscreenAttempts] = useState(0);
  const [initialWindowSize, setInitialWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const originalWindowWidth = useRef<number>(window.innerWidth);
  const originalWindowHeight = useRef<number>(window.innerHeight);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fullscreenCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const assessmentContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  if (!currentUser || currentUser.role !== 'student') {
    return <Navigate to="/unauthorized" />;
  }

  const assessment = assessmentId ? getAssessmentById(assessmentId) : undefined;
  
  if (!assessment) {
    return <Navigate to="/student-dashboard" />;
  }
  
  const submission = getSubmission(assessment.id, currentUser.id);
  
  const isActive = isAssessmentActive(assessment);
  
  const dueDateTime = new Date(`${assessment.dueDate}T${assessment.dueTime}`);
  const startDateTime = new Date(`${assessment.startDate}T${assessment.startTime}`);
  const now = new Date();
  
  const isPastDue = now > dueDateTime;
  const notStartedYet = now < startDateTime;
  
  const canTake = canStudentTakeAssessment(assessment.id, currentUser.id);
  const isCompleted = submission?.isCompleted || false;
  
  if (!canTake && !isCompleted) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4 sm:p-6 md:p-8">
          <div className="max-w-4xl mx-auto">
            <AnimatedCard delay={0.1}>
              <div className="flex flex-col items-center py-6">
                <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
                <h2 className="text-xl font-bold mb-2">
                  {submission?.tabSwitched 
                    ? 'Assessment Auto-Submitted' 
                    : (submission?.screenSizeViolation
                      ? 'Assessment Auto-Submitted Due to Screen Size Violation'
                      : 'Cannot Take Assessment')}
                </h2>
                <p className="text-gray-500 mb-4 text-center">
                  {submission?.tabSwitched 
                    ? 'This assessment was auto-submitted due to tab switching or navigating away.'
                    : (submission?.screenSizeViolation
                      ? 'This assessment was auto-submitted because you minimized or split your screen.'
                      : notStartedYet
                        ? `This assessment will start on ${format(startDateTime, 'PPP')} at ${format(startDateTime, 'p')}.`
                        : isPastDue
                          ? 'This assessment is past its due date.'
                          : 'You have already completed this assessment or you are not eligible to take it.')}
                </p>
                <Button asChild className="mt-6">
                  <Link to="/student-dashboard">
                    Return to Dashboard
                  </Link>
                </Button>
              </div>
            </AnimatedCard>
          </div>
        </div>
      </PageTransition>
    );
  }
  
  const totalPossibleMarks = assessment.questions.reduce(
    (total, question) => total + question.marks, 
    0
  );
  
  const totalMcqMarks = assessment.questions
    .filter(q => q.type === 'multiple-choice')
    .reduce((total, q) => total + q.marks, 0);
  
  const totalTextMarks = assessment.questions
    .filter(q => q.type === 'text')
    .reduce((total, q) => total + q.marks, 0);
  
  useEffect(() => {
    if (submission) {
      const existingAnswers: { [questionId: string]: string } = {};
      submission.answers.forEach(ans => {
        existingAnswers[ans.questionId] = ans.answer;
      });
      setAnswers(existingAnswers);
    }
  }, [submission]);
  
  useEffect(() => {
    if (isCompleted || !isActive) return;
    
    const secondsRemaining = differenceInSeconds(dueDateTime, now);
    if (secondsRemaining > 0) {
      setTimeRemaining(secondsRemaining);
      
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev === null || prev <= 1) {
            if (timerRef.current) {
              clearInterval(timerRef.current);
            }
            handleSubmit(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setTimeRemaining(0);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [assessment, isCompleted, isActive]);
  
  // Function to enter fullscreen mode
  const enterFullscreen = () => {
    const element = assessmentContainerRef.current || document.documentElement;
    
    if (element.requestFullscreen) {
      element.requestFullscreen();
    } else if ((element as any).webkitRequestFullscreen) {
      (element as any).webkitRequestFullscreen();
    } else if ((element as any).mozRequestFullScreen) {
      (element as any).mozRequestFullScreen();
    } else if ((element as any).msRequestFullscreen) {
      (element as any).msRequestFullscreen();
    }
    setIsFullScreen(true);
    setShowFullscreenPrompt(false);
    setFullscreenAttempts(prev => prev + 1);
  };
  
  // Check and enforce fullscreen mode
  const checkAndEnforceFullscreen = () => {
    const isCurrentlyFullScreen = !!(document.fullscreenElement || 
      (document as any).webkitFullscreenElement || 
      (document as any).mozFullScreenElement || 
      (document as any).msFullscreenElement);
    
    // If not in fullscreen and assessment is active, try to force it
    if (!isCurrentlyFullScreen && isActive && !autoSubmitted && fullscreenAttempts < 3) {
      enterFullscreen();
    } else if (!isCurrentlyFullScreen && isActive && !autoSubmitted && fullscreenAttempts >= 3) {
      // If multiple attempts failed, treat as violation
      handleScreenSizeViolation();
    }
  };
  
  // Handle screen size violation
  const handleScreenSizeViolation = () => {
    if (!autoSubmitted && !screenSizeViolation) {
      setScreenSizeViolation(true);
      setShowScreenWarning(true);
      
      const answersArray = Object.entries(answers)
        .filter(([_, value]) => value.trim() !== '')
        .map(([questionId, answer]) => ({
          questionId,
          answer
        }));
      
      setTimeout(() => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
        
        submitAssessment(
          assessment.id,
          currentUser.id,
          answersArray,
          false,
          true
        ).then(() => {
          toast.error('Assessment auto-submitted due to screen size violation');
          navigate('/student-dashboard');
        });
      }, 3000);
    }
  };
  
  useEffect(() => {
    if (isCompleted || !isActive) return;
    
    // Store initial window size when component mounts
    setInitialWindowSize({
      width: window.innerWidth,
      height: window.innerHeight
    });
    
    originalWindowWidth.current = window.innerWidth;
    originalWindowHeight.current = window.innerHeight;
    
    // Check if browser supports fullscreen
    const isFullscreenAvailable = document.fullscreenEnabled || 
      (document as any).webkitFullscreenEnabled || 
      (document as any).mozFullScreenEnabled || 
      (document as any).msFullscreenEnabled;
    
    // Force fullscreen when component mounts
    if (!isCompleted && isActive) {
      enterFullscreen();
      
      // Set up interval to periodically check and enforce fullscreen
      fullscreenCheckInterval.current = setInterval(() => {
        checkAndEnforceFullscreen();
      }, 2000); // Check every 2 seconds
    }
    
    // Handle fullscreen change
    const handleFullscreenChange = () => {
      const isCurrentlyFullScreen = !!(document.fullscreenElement || 
        (document as any).webkitFullscreenElement || 
        (document as any).mozFullScreenElement || 
        (document as any).msFullscreenElement);
      
      setIsFullScreen(isCurrentlyFullScreen);
      
      // If user exits fullscreen mode and assessment is active
      if (!isCurrentlyFullScreen && isActive && !autoSubmitted) {
        // Try to re-enter fullscreen once
        if (fullscreenAttempts < 2) {
          enterFullscreen();
        } else {
          handleScreenSizeViolation();
        }
      }
    };
    
    // Tab visibility and window blur/focus monitoring
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setTabSwitchCount(prev => prev + 1);
        setShowTabWarning(true);
        
        if (!autoSubmitted) {
          setAutoSubmitted(true);
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
          
          const answersArray = Object.entries(answers)
            .filter(([_, value]) => value.trim() !== '')
            .map(([questionId, answer]) => ({
              questionId,
              answer
            }));
          
          submitAssessment(
            assessment.id,
            currentUser.id,
            answersArray,
            true
          ).then(() => {
            toast.error('Assessment auto-submitted due to tab switching');
            navigate('/student-dashboard');
          });
        }
      }
    };
    
    // Window resizing monitoring
    const handleResize = () => {
      const currentWidth = window.innerWidth;
      const currentHeight = window.innerHeight;
      
      // Calculate percentage of original size
      const widthPercentage = (currentWidth / initialWindowSize.width) * 100;
      const heightPercentage = (currentHeight / initialWindowSize.height) * 100;
      
      // If window size reduced significantly (below 90% of original)
      const significantReduction = widthPercentage < 90 || heightPercentage < 90;
      
      if (significantReduction && !autoSubmitted && !screenSizeViolation) {
        // If not in fullscreen, try to enforce it once before treating as violation
        if (!isFullScreen && fullscreenAttempts < 2) {
          enterFullscreen();
        } else {
          handleScreenSizeViolation();
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleVisibilityChange);
    window.addEventListener('resize', handleResize);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
      return '';
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Force initial fullscreen
    setTimeout(() => {
      enterFullscreen();
    }, 500);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleVisibilityChange);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      if (fullscreenCheckInterval.current) {
        clearInterval(fullscreenCheckInterval.current);
      }
    };
  }, [isCompleted, isActive, answers, assessment, currentUser, submitAssessment, autoSubmitted, screenSizeViolation, isFullScreen, fullscreenAttempts, initialWindowSize]);
  
  const formatTimeRemaining = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };
  
  const handleSubmit = async (finalSubmit: boolean) => {
    setIsSubmitting(true);
    
    try {
      const answersArray = Object.entries(answers)
        .filter(([_, value]) => value.trim() !== '')
        .map(([questionId, answer]) => ({
          questionId,
          answer
        }));
      
      await submitAssessment(
        assessment.id,
        currentUser.id,
        answersArray,
        false
      );
      
      toast.success('Assessment submitted successfully');
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      // Exit fullscreen when assessment is submitted
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
      
      navigate('/student-dashboard');
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleExit = () => {
    setShowExitWarning(true);
  };
  
  const confirmExit = () => {
    // Exit fullscreen when leaving assessment
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if ((document as any).webkitExitFullscreen) {
      (document as any).webkitExitFullscreen();
    } else if ((document as any).mozCancelFullScreen) {
      (document as any).mozCancelFullScreen();
    } else if ((document as any).msExitFullscreen) {
      (document as any).msExitFullscreen();
    }
    
    navigate('/student-dashboard');
  };

  const answeredQuestions = Object.keys(answers).length;
  const totalQuestions = assessment.questions.length;
  const progress = Math.round((answeredQuestions / totalQuestions) * 100);

  const getTextAnswerMarks = () => {
    if (!submission || submission.marksAwarded === undefined || submission.autoGradedMarks === undefined) {
      return undefined;
    }
    
    return Math.max(0, submission.marksAwarded - submission.autoGradedMarks);
  };
  
  const textAnswerMarks = getTextAnswerMarks();

  const canSeeResults = isPastDue && isCompleted;

  const renderQuestionResults = (question: any, userAnswer: string | undefined) => {
    if (!canSeeResults) return null;
    
    if (question.type === 'multiple-choice' && userAnswer) {
      const isCorrect = userAnswer === question.correctAnswer;
      return (
        <div className={`mt-4 p-2 rounded-md ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className="flex items-center">
            <div className={`w-2 h-2 rounded-full mr-2 ${isCorrect ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <p className={`text-sm font-medium ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
              {isCorrect ? 'Correct' : 'Incorrect'}
            </p>
          </div>
          {!isCorrect && (
            <p className="text-sm mt-1">
              Correct answer: <span className="font-medium">{question.correctAnswer}</span>
            </p>
          )}
        </div>
      );
    }
    
    return null;
  };

  return (
    <PageTransition>
      <div 
        ref={assessmentContainerRef} 
        className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4 sm:p-6 md:p-8"
      >
        <div className="max-w-4xl mx-auto">
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleExit}
                  className="h-8 px-2"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Exit
                </Button>
                <h1 className="text-3xl font-semibold text-gray-900">
                  {assessment.title}
                </h1>
              </div>
              <p className="text-gray-500">
                {assessment.description || "No description provided"}
              </p>
            </div>
            
            <div className="space-y-2 sm:space-y-0 sm:space-x-2 flex flex-col sm:flex-row">
              <div className="flex items-center text-sm text-gray-700 bg-gray-100 px-3 py-1 rounded-md">
                <Calendar className="h-4 w-4 mr-2" />
                <span>
                  Due: {format(dueDateTime, 'PPP p')}
                </span>
              </div>
              
              <div className="flex items-center text-sm text-gray-700 bg-gray-100 px-3 py-1 rounded-md">
                <FileText className="h-4 w-4 mr-2" />
                <span>Total Marks: {totalPossibleMarks}</span>
              </div>
            </div>
          </header>

          {isCompleted ? (
            <AnimatedCard delay={0.1}>
              <div className="flex flex-col items-center py-6">
                <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                <h2 className="text-xl font-bold mb-2">Assessment Completed</h2>
                <p className="text-gray-500 mb-4 text-center">
                  {submission?.tabSwitched 
                    ? 'This assessment was auto-submitted due to tab switching or navigating away.'
                    : submission?.screenSizeViolation
                      ? 'This assessment was auto-submitted because you minimized or split your screen.'
                      : 'You have successfully completed this assessment.'}
                </p>
                
                <div className="mt-4 text-center w-full max-w-md">
                  <h3 className="text-lg font-medium mb-4">Your Results</h3>
                  
                  {totalMcqMarks > 0 && (
                    <div className="mb-6 p-4 bg-white border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">Multiple Choice Questions</h4>
                        <Badge variant="outline" className="bg-blue-50">
                          Auto-graded
                        </Badge>
                      </div>
                      <div className="text-2xl font-bold">
                        {submission?.autoGradedMarks ?? 0} / {totalMcqMarks}
                      </div>
                      <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${submission?.autoGradedMarks ? (submission.autoGradedMarks / totalMcqMarks) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  
                  {totalTextMarks > 0 && textAnswerMarks !== undefined && (
                    <div className="mb-6 p-4 bg-white border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">Text Answers</h4>
                        <Badge variant="outline" className="bg-purple-50">
                          Teacher-graded
                        </Badge>
                      </div>
                      <div className="text-2xl font-bold">
                        {textAnswerMarks} / {totalTextMarks}
                      </div>
                      <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-purple-500 rounded-full"
                          style={{ width: `${textAnswerMarks !== undefined && totalTextMarks > 0 ? 
                            (textAnswerMarks / totalTextMarks) * 100 : 0}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  )}
                  
                  {submission?.marksAwarded !== undefined ? (
                    <div className="p-4 bg-white border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">Total Score</h4>
                        <Award className="h-5 w-5 text-yellow-500" />
                      </div>
                      <div className="text-3xl font-bold">
                        {submission.marksAwarded} / {totalPossibleMarks}
                      </div>
                      <p className="text-gray-500 mt-2">
                        {Math.round((submission.marksAwarded / totalPossibleMarks) * 100)}% Score
                      </p>
                    </div>
                  ) : totalTextMarks > 0 ? (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                      <p className="text-yellow-700">
                        Text answers are being evaluated by your teacher. Check back later for your full results.
                      </p>
                    </div>
                  ) : null}
                </div>
                
                {!canSeeResults && (
                  <div className="mt-4 text-center">
                    <p className="text-gray-500">
                      Results will be available after the due date: {format(dueDateTime, 'PPP p')}
                    </p>
                  </div>
                )}
                
                <Button asChild className="mt-6">
                  <Link to="/student-dashboard">
                    Return to Dashboard
                  </Link>
                </Button>
              </div>
            </AnimatedCard>
          ) : notStartedYet ? (
            <AnimatedCard delay={0.1} className="mt-6">
              <div className="flex flex-col items-center py-10">
                <Clock className="h-12 w-12 text-blue-500 mb-4" />
                <h2 className="text-xl font-bold mb-2">Assessment Will Start Soon</h2>
                <p className="text-gray-500 mb-4 text-center">
                  This assessment will be available on {format(startDateTime, 'PPP')} at {format(startDateTime, 'p')}.
                </p>
                <Button asChild className="mt-4">
                  <Link to="/student-dashboard">
                    Return to Dashboard
                  </Link>
                </Button>
              </div>
            </AnimatedCard>
          ) : (
            <>
              {!isFullScreen && isActive && (
                <Alert variant="destructive" className="mb-6">
                  <AlertTitle>Full-screen Required</AlertTitle>
                  <AlertDescription className="flex flex-col gap-3">
                    <p>
                      This assessment must be taken in full-screen mode. Please click the button below to enter full-screen.
                    </p>
                    <Button 
                      onClick={enterFullscreen} 
                      className="w-full sm:w-auto flex items-center gap-2"
                    >
                      <Maximize className="h-4 w-4" />
                      Enter Full-Screen Mode
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
            
              {isActive && (
                <div className="mb-6">
                  <div className="bg-white rounded-lg p-4 border flex flex-col sm:flex-row justify-between items-center">
                    <div className="flex items-center mb-4 sm:mb-0">
                      <Clock className="h-5 w-5 text-blue-500 mr-2" />
                      <div>
                        <h3 className="font-medium">Your Progress</h3>
                        <p className="text-sm text-gray-500">
                          {answeredQuestions} of {totalQuestions} questions answered
                        </p>
                      </div>
                    </div>
                    
                    {timeRemaining !== null && (
                      <div className="flex flex-col items-end">
                        <p className="text-sm text-gray-500 mb-1">Time Remaining</p>
                        <p className="font-mono font-medium text-lg">
                          {formatTimeRemaining(timeRemaining)}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-3">
                    <Progress value={progress} className="h-2" />
                  </div>
                </div>
              )}
              
              <Alert variant="destructive" className="mb-6">
                <AlertTitle>Important</AlertTitle>
                <AlertDescription>
                  Do not exit full-screen mode, minimize your window, or split your screen during this assessment. 
                  Doing so will result in automatic submission with a score of 0.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-6 mb-6">
                {assessment.questions.map((question, index) => (
                  <AnimatedCard key={question.id} delay={0.1 * (index + 1)}>
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium text-lg">
                          Question {index + 1}
                          <span className="ml-2 text-sm text-gray-500">
                            {question.marks} {question.marks === 1 ? 'mark' : 'marks'}
                          </span>
                        </h3>
                        <Badge variant="outline">
                          {question.type === 'multiple-choice' ? 'Multiple Choice' : 'Text Answer'}
                        </Badge>
                      </div>
                      
                      <p>{question.text}</p>
                      
                      {question.type === 'multiple-choice' && question.options ? (
                        <div className="space-y-2 mt-3">
                          {question.options.map((option, i) => (
                            <div
                              key={i}
                              className={`p-3 border rounded-md cursor-pointer transition-colors ${
                                answers[question.id] === option
                                  ? 'bg-blue-50 border-blue-200'
                                  : 'hover:bg-gray-50'
                              }`}
                              onClick={() => handleAnswerChange(question.id, option)}
                            >
                              <div className="flex items-center">
                                <div
                                  className={`w-4 h-4 rounded-full border mr-2 flex items-center justify-center ${
                                    answers[question.id] === option
                                      ? 'border-blue-500'
                                      : 'border-gray-300'
                                  }`}
                                >
                                  {answers[question.id] === option && (
                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                  )}
                                </div>
                                <span>{option}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <Textarea
                          placeholder="Type your answer here..."
                          value={answers[question.id] || ''}
                          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                          className="min-h-[120px]"
                        />
                      )}
                      
                      {renderQuestionResults(question, answers[question.id])}
                    </div>
                  </AnimatedCard>
                ))}
              </div>
              
              <div className="flex justify-end space-x-3">
                <Button
                  variant="default"
                  onClick={() => handleSubmit(true)}
                  disabled={isSubmitting}
                >
                  Submit Assessment
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
      
      <AlertDialog open={showExitWarning} onOpenChange={setShowExitWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Exit Assessment?</AlertDialogTitle>
            <AlertDialogDescription>
              Your progress will be saved, but the assessment will not be submitted. You can return to complete it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmExit}>Exit</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <AlertDialog open={showTabWarning} onOpenChange={setShowTabWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Warning: Tab Switching Detected</AlertDialogTitle>
            <AlertDialogDescription>
              You switched tabs or navigated away from this assessment. Further tab switching may result in automatic submission.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowTabWarning(false)}>
              I Understand
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <AlertDialog open={showScreenWarning} onOpenChange={setShowScreenWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Screen Size Violation Detected</AlertDialogTitle>
            <AlertDialogDescription>
              You have minimized, split your screen, or exited full-screen mode during the assessment. 
              This violates assessment integrity rules. Your assessment will be auto-submitted with 0 marks.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowScreenWarning(false)}>
              I Understand
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <AlertDialog open={showFullscreenPrompt} onOpenChange={setShowFullscreenPrompt}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Full-Screen Mode Required</AlertDialogTitle>
            <AlertDialogDescription>
              This assessment must be taken in full-screen mode to ensure academic integrity. 
              Exiting full-screen mode during the assessment will result in automatic submission with 0 marks.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => navigate('/student-dashboard')}>
              Return to Dashboard
            </AlertDialogCancel>
            <AlertDialogAction onClick={enterFullscreen}>
              Enter Full-Screen Mode
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageTransition>
  );
};

export default StudentAssessment;
