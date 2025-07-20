import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, Calendar, CheckCircle, Clock, Download, FileText, Search, XCircle 
} from 'lucide-react';
import AnimatedCard from '@/components/AnimatedCard';
import PageTransition from '@/components/PageTransition';
import { useParams, Link, Navigate } from 'react-router-dom';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

const AssessmentDetails = () => {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const { 
    currentUser, 
    getAssessmentById, 
    getAssessmentSubmissions,
    students, 
    awardMarks 
  } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null);
  const [marksToAward, setMarksToAward] = useState<string>('');
  
  if (!currentUser || (currentUser.role !== 'teacher' && currentUser.role !== 'admin')) {
    return <Navigate to="/unauthorized" />;
  }

  const assessment = assessmentId ? getAssessmentById(assessmentId) : undefined;
  
  if (!assessment) {
    return currentUser.role === 'admin' 
      ? <Navigate to="/admin-dashboard" /> 
      : <Navigate to="/teacher-assessments" />;
  }
  
  if (currentUser.role !== 'admin' && assessment.createdBy !== currentUser.id) {
    return <Navigate to="/unauthorized" />;
  }
  
  const submissions = getAssessmentSubmissions(assessment.id);
  
  const filteredStudents = currentUser.role === 'admin'
    ? students
    : students.filter(student => student.createdBy === currentUser.id);
  
  const studentSubmissions = filteredStudents.map(student => {
    const submission = submissions.find(s => s.studentId === student.id);
    return {
      student,
      submission
    };
  });
  
  const filteredStudentSubmissions = studentSubmissions.filter(
    ({ student }) => 
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
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
  
  const selectedSubmissionData = submissions.find(s => s.id === selectedSubmission);
  const selectedStudent = selectedSubmissionData
    ? students.find(s => s.id === selectedSubmissionData.studentId)
    : null;
  
  const handleAwardMarks = async () => {
    if (!selectedSubmission) return;
    
    try {
      const marks = parseInt(marksToAward);
      if (isNaN(marks) || marks < 0 || marks > totalPossibleMarks) {
        throw new Error(`Marks must be between 0 and ${totalPossibleMarks}`);
      }
      
      await awardMarks(selectedSubmission, marks);
      setSelectedSubmission(null);
    } catch (error) {
      console.error(error);
    }
  };

  const downloadExcel = () => {
    const data = filteredStudentSubmissions.map(({ student, submission }) => {
      const studentInfo: Record<string, any> = {
        'Student Name': student.name,
        'Email': student.email,
        'Status': submission 
          ? (submission.isCompleted ? 'Completed' : 'Incomplete') 
          : 'Not Started',
        'Submission Date': submission 
          ? format(new Date(submission.submittedAt), 'yyyy-MM-dd HH:mm') 
          : '-',
        'Marks': submission?.marksAwarded !== undefined 
          ? `${submission.marksAwarded}/${totalPossibleMarks}`
          : '-',
        'Auto-calculated Score': submission?.autoGradedMarks !== undefined 
          ? `${submission.autoGradedMarks}/${totalMcqMarks} MCQ marks`
          : '-',
      };
      
      if (submission) {
        studentInfo['Tab Switched'] = submission.tabSwitched ? 'Yes' : 'No';
      }
      
      assessment.questions.forEach((question, index) => {
        const questionText = question.text.length > 50 
          ? question.text.substring(0, 50) + '...' 
          : question.text;
        
        studentInfo[`Q${index+1} (${question.marks} mark${question.marks > 1 ? 's' : ''}) - ${questionText}`] = '';
        
        if (submission) {
          const answer = submission.answers.find(a => a.questionId === question.id);
          studentInfo[`Q${index+1} (${question.marks} mark${question.marks > 1 ? 's' : ''}) - ${questionText}`] = 
            answer ? answer.answer : 'Not answered';
        }
        
        if (question.type === 'multiple-choice' && question.correctAnswer) {
          studentInfo[`Q${index+1} Correct Answer`] = question.correctAnswer;
          
          if (submission) {
            const studentAnswer = submission.answers.find(a => a.questionId === question.id)?.answer;
            studentInfo[`Q${index+1} Correct?`] = studentAnswer === question.correctAnswer ? 'Yes' : 'No';
          }
        }
      });
      
      return studentInfo;
    });

    const ws = XLSX.utils.json_to_sheet(data);
    
    const colWidths = [
      { wch: 20 },
      { wch: 25 },
      { wch: 15 },
      { wch: 20 },
      { wch: 10 },
      { wch: 20 },
    ];
    
    ws['!cols'] = colWidths;
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Assessment Results');
    
    const fileName = `${assessment.title} - Results - ${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4 sm:p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  asChild 
                  className="h-8 px-2"
                >
                  <Link to={currentUser.role === 'admin' ? "/admin-dashboard" : "/teacher-assessments"}>
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back
                  </Link>
                </Button>
                <h1 className="text-3xl font-semibold text-gray-900">
                  {assessment.title}
                </h1>
              </div>
              <p className="text-gray-500">
                {assessment.description || "No description provided"}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center text-sm text-gray-700 bg-gray-100 px-3 py-1 rounded-md">
                <Calendar className="h-4 w-4 mr-2" />
                <span>Due: {format(new Date(`${assessment.dueDate}T${assessment.dueTime}`), 'PPP p')}</span>
              </div>
              
              <div className="flex items-center text-sm text-gray-700 bg-gray-100 px-3 py-1 rounded-md">
                <FileText className="h-4 w-4 mr-2" />
                <span>{assessment.questions.length} Questions</span>
              </div>
              
              <div className="flex items-center text-sm text-gray-700 bg-gray-100 px-3 py-1 rounded-md">
                <span>Total Marks: {totalPossibleMarks}</span>
              </div>
            </div>
          </header>

          <div className="mb-6 flex flex-wrap justify-between items-center gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search students"
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Button 
              variant="outline" 
              onClick={downloadExcel}
              disabled={filteredStudentSubmissions.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Download Detailed Excel Report
            </Button>
          </div>

          <AnimatedCard contentClassName="p-0" delay={0.2}>
            {filteredStudentSubmissions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submission Date</TableHead>
                    <TableHead>Auto-graded</TableHead>
                    <TableHead>Total Marks</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudentSubmissions.map(({ student, submission }) => (
                    <TableRow key={student.id} className="reveal" style={{animationDelay: '0.1s'}}>
                      <TableCell className="font-medium">
                        <div>
                          {student.name}
                          <div className="text-sm text-gray-500">{student.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {submission ? (
                          submission.isCompleted ? (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                              <CheckCircle className="h-3 w-3 mr-1" /> Completed
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-800 hover:bg-yellow-50">
                              <Clock className="h-3 w-3 mr-1" /> Incomplete
                            </Badge>
                          )
                        ) : (
                          <Badge variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-100">
                            <XCircle className="h-3 w-3 mr-1" /> Not Started
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {submission ? format(new Date(submission.submittedAt), 'PPP') : '-'}
                      </TableCell>
                      <TableCell>
                        {submission?.autoGradedMarks !== undefined 
                          ? `${submission.autoGradedMarks}/${totalMcqMarks}` 
                          : '-'
                        }
                      </TableCell>
                      <TableCell>
                        {submission?.marksAwarded !== undefined 
                          ? `${submission.marksAwarded}/${totalPossibleMarks}` 
                          : (submission ? 'Not graded' : '-')
                        }
                      </TableCell>
                      <TableCell className="text-right">
                        {submission && (
                          <Button 
                            variant="outline"
                            size="sm"
                            disabled={!submission.isCompleted}
                            onClick={() => {
                              setSelectedSubmission(submission.id);
                              setMarksToAward(submission.marksAwarded?.toString() || '');
                            }}
                          >
                            {submission.marksAwarded !== undefined ? 'Update Marks' : 'Award Marks'}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <FileText className="h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No students found</h3>
                <p className="text-gray-500 mb-4">
                  {searchQuery
                    ? "No students match your search criteria"
                    : "You haven't added any students yet"}
                </p>
                {searchQuery ? (
                  <Button variant="outline" onClick={() => setSearchQuery('')}>
                    Clear Search
                  </Button>
                ) : (
                  <Button asChild>
                    <Link to={currentUser.role === 'admin' ? "/admin-dashboard" : "/teacher-dashboard"}>
                      {currentUser.role === 'admin' ? 'Back to Dashboard' : 'Add Students'}
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </AnimatedCard>
        </div>
      </div>

      <Dialog open={!!selectedSubmission} onOpenChange={(open) => !open && setSelectedSubmission(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{totalTextMarks > 0 ? 'Grade Assessment' : 'Review Assessment'}</DialogTitle>
            <DialogDescription>
              {totalMcqMarks > 0 && selectedSubmissionData?.autoGradedMarks !== undefined ? (
                totalTextMarks > 0 ? (
                  <>
                    MCQ questions have been auto-graded: {selectedSubmissionData.autoGradedMarks} out of {totalMcqMarks} marks.
                    <br />
                    <b>You need to award the TOTAL marks (including both MCQ and text answers).</b>
                  </>
                ) : (
                  <>
                    This assessment contains only MCQ questions that have been auto-graded: 
                    {selectedSubmissionData.autoGradedMarks} out of {totalMcqMarks} marks.
                  </>
                )
              ) : (
                "Assign marks to this student's assessment"
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="mb-4">
              <p className="font-medium">{selectedStudent?.name}</p>
              <p className="text-gray-500 text-sm">{selectedStudent?.email}</p>
            </div>
            
            {totalMcqMarks > 0 && selectedSubmissionData?.autoGradedMarks !== undefined && (
              <div className="mb-4 p-3 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-700 font-medium">
                  Auto-graded MCQ score: {selectedSubmissionData.autoGradedMarks}/{totalMcqMarks}
                </p>
                {totalTextMarks > 0 && (
                  <p className="text-sm text-blue-700 mt-1">
                    Text answers (to be graded): {totalTextMarks} marks possible
                  </p>
                )}
              </div>
            )}
            
            {totalTextMarks > 0 && (
              <div className="space-y-4 mt-4">
                <h3 className="font-medium text-sm">Text Answers to Grade:</h3>
                {assessment.questions
                  .filter(q => q.type === 'text')
                  .map((question, idx) => {
                    const answer = selectedSubmissionData?.answers.find(a => a.questionId === question.id);
                    return (
                      <div key={question.id} className="border rounded-md p-3">
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">Question {idx + 1}</span>
                          <Badge variant="outline">
                            {question.marks} {question.marks === 1 ? 'mark' : 'marks'}
                          </Badge>
                        </div>
                        <p className="text-sm mb-2">{question.text}</p>
                        <div className="bg-gray-50 p-2 rounded-md min-h-[60px] text-sm">
                          {answer?.answer || "Not answered"}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
            
            <div className="space-y-2 mt-4">
              <label className="text-sm font-medium">
                Total Marks (out of {totalPossibleMarks})
              </label>
              <Input
                type="number"
                min="0"
                max={totalPossibleMarks}
                value={marksToAward}
                onChange={(e) => setMarksToAward(e.target.value)}
                disabled={totalTextMarks === 0 && selectedSubmissionData?.autoGradedMarks !== undefined}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedSubmission(null)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAwardMarks}
              disabled={totalTextMarks === 0 && selectedSubmissionData?.autoGradedMarks !== undefined}
            >
              {totalTextMarks > 0 ? 'Save Marks' : 'Close'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
};

export default AssessmentDetails;
