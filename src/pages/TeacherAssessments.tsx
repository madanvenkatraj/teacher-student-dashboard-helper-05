import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Calendar, FileText, ListChecks, Users, CheckSquare, Type, Trash, Upload, Pencil, Crown } from 'lucide-react';
import AnimatedCard from '@/components/AnimatedCard';
import PageTransition from '@/components/PageTransition';
import { AssessmentForm } from '@/components/AssessmentForm';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
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

const TeacherAssessments = () => {
  const { currentUser, getTeacherAssessments, createAssessment, deleteAssessment, updateAssessment } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [assessmentToDelete, setAssessmentToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [assessmentToEdit, setAssessmentToEdit] = useState<any | null>(null);

  const teacherAssessments = currentUser 
    ? getTeacherAssessments(currentUser.id)
    : [];

  const filteredAssessments = teacherAssessments.filter(
    assessment => 
      assessment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assessment.description.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const sortedAssessments = [...filteredAssessments].sort((a, b) => {
    const startDateA = new Date(`${a.startDate}T${a.startTime || '00:00'}`);
    const startDateB = new Date(`${b.startDate}T${b.startTime || '00:00'}`);
    return startDateA.getTime() - startDateB.getTime();
  });

  const handleCreateAssessment = async (
    title: string,
    description: string,
    startDate: string,
    startTime: string,
    dueDate: string,
    dueTime: string,
    questions: any[]
  ) => {
    try {
      if (assessmentToEdit) {
        await updateAssessment(
          assessmentToEdit.id,
          title,
          description,
          startDate,
          startTime,
          dueDate,
          dueTime,
          questions
        );
        setAssessmentToEdit(null);
      } else {
        await createAssessment(title, description, startDate, startTime, dueDate, dueTime, questions);
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error with assessment:", error);
    }
  };
  
  const handleDeleteAssessment = async () => {
    if (!assessmentToDelete) return;
    
    setIsDeleting(true);
    try {
      await deleteAssessment(assessmentToDelete);
      setAssessmentToDelete(null);
    } catch (error) {
      console.error("Error deleting assessment:", error);
    } finally {
      setIsDeleting(false);
    }
  };
  
  const handleEditAssessment = (assessment: any) => {
    if (assessment.createdBy !== currentUser?.id && assessment.createdBySuperTeacher) {
      toast.error("You can only edit your own Super Teacher assessments.");
      return;
    }
    
    if (!currentUser?.isSuperTeacher && assessment.createdBySuperTeacher) {
      toast.error("Super Teacher assessments cannot be edited by regular teachers.");
      return;
    }

    setAssessmentToEdit(assessment);
    setIsDialogOpen(true);
  };
  
  const handleCloseDialog = () => {
    setAssessmentToEdit(null);
    setIsDialogOpen(false);
  };

  const getAssessmentStatus = (assessment: any) => {
    const startDateTime = new Date(`${assessment.startDate}T${assessment.startTime || '00:00'}`);
    const dueDateTime = new Date(`${assessment.dueDate}T${assessment.dueTime || '23:59'}`);
    const now = new Date();
    
    if (startDateTime > now) {
      return { status: 'upcoming', class: 'bg-blue-100 text-blue-800', text: 'Upcoming' };
    } else if (now >= startDateTime && now <= dueDateTime) {
      return { status: 'active', class: 'bg-green-100 text-green-800', text: 'Active' };
    } else {
      return { status: 'completed', class: 'bg-gray-100 text-gray-800', text: 'Completed' };
    }
  };

  const getQuestionTypeCounts = (assessment: any) => {
    const mcqCount = assessment.questions.filter((q: any) => q.type === 'multiple-choice').length;
    const textCount = assessment.questions.filter((q: any) => q.type === 'text').length;
    return { mcqCount, textCount };
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    setIsUploading(true);
    
    try {
      const data = await readExcelFile(file);
      if (!data || data.length === 0) {
        throw new Error('No data found in the Excel file');
      }
      
      await processAssessmentData(data);
      
      e.target.value = '';
      setIsUploadDialogOpen(false);
      toast.success('Assessment created successfully from Excel');
    } catch (error) {
      toast.error(`Error uploading file: ${(error as Error).message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const readExcelFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(worksheet);
          resolve(json);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = (error) => {
        reject(error);
      };
      
      reader.readAsArrayBuffer(file);
    });
  };

  const processAssessmentData = async (data: any[]): Promise<void> => {
    if (!data[0].Title || !data[0].StartDate || !data[0].DueDate) {
      throw new Error('Missing required fields in Excel (Title, StartDate, DueDate)');
    }
    
    const assessmentDetails = data[0];
    const title = assessmentDetails.Title;
    const description = assessmentDetails.Description || '';
    
    const startDate = assessmentDetails.StartDate;
    const startTime = assessmentDetails.StartTime || '09:00';
    const dueDate = assessmentDetails.DueDate;
    const dueTime = assessmentDetails.DueTime || '17:00';
    
    const questions = data.slice(1).map((row: any, index: number) => {
      if (!row.QuestionText) {
        throw new Error(`Question ${index + 1} is missing text`);
      }
      
      const question: any = {
        text: row.QuestionText,
        marks: Number(row.Marks) || 1,
        type: row.Type?.toLowerCase() === 'multiple-choice' ? 'multiple-choice' : 'text'
      };
      
      if (question.type === 'multiple-choice') {
        if (!row.Options) {
          throw new Error(`Question ${index + 1} is missing options`);
        }
        
        question.options = row.Options.split(/[;,]/).map((opt: string) => opt.trim());
        question.correctAnswer = row.CorrectAnswer?.toString() || question.options[0];
      }
      
      return question;
    });
    
    await createAssessment(
      title,
      description,
      startDate,
      startTime,
      dueDate,
      dueTime,
      questions
    );
  };

  const downloadSampleTemplate = () => {
    const worksheet = XLSX.utils.json_to_sheet([
      { 
        Title: 'Sample Assessment',
        Description: 'This is a sample assessment created from Excel',
        StartDate: '2023-06-01',
        StartTime: '09:00',
        DueDate: '2023-06-30',
        DueTime: '17:00'
      },
      {
        QuestionText: 'What is 2+2?',
        Type: 'multiple-choice',
        Options: '1, 2, 3, 4',
        CorrectAnswer: '4',
        Marks: 1
      },
      {
        QuestionText: 'Explain the concept of gravity.',
        Type: 'text',
        Marks: 5
      }
    ]);
    
    const wscols = [
      { wch: 40 },
      { wch: 40 },
      { wch: 15 },
      { wch: 10 },
      { wch: 15 },
      { wch: 10 }
    ];
    worksheet['!cols'] = wscols;
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Assessment');
    
    XLSX.writeFile(workbook, 'assessment_template.xlsx');
    
    toast.success('Sample template downloaded');
  };

  const canEditOrDeleteAssessment = (assessment: any) => {
    if (currentUser?.isSuperTeacher) {
      return assessment.createdBy === currentUser.id;
    }
    
    if (assessment.createdBySuperTeacher) {
      return false;
    }
    
    return assessment.createdBy === currentUser?.id;
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4 sm:p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900 mb-1">
                Assessments
              </h1>
              <p className="text-gray-500">
                Create and manage assessments for your students
              </p>
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <Button 
                variant="outline" 
                asChild 
                className="shrink-0"
              >
                <Link to="/teacher-dashboard">
                  <Users className="h-4 w-4 mr-2" /> Students
                </Link>
              </Button>
              
              <Button onClick={() => setIsDialogOpen(true)} className="shrink-0">
                <FileText className="h-4 w-4 mr-2" /> Create Assessment
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => setIsUploadDialogOpen(true)} 
                className="shrink-0"
              >
                <Upload className="h-4 w-4 mr-2" /> Import Assessment
              </Button>
            </div>
          </header>

          <div className="mb-6">
            <div className="relative w-full sm:w-80">
              <Input
                placeholder="Search assessments"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <AnimatedCard contentClassName="p-0" delay={0.2}>
            {sortedAssessments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                {sortedAssessments.map((assessment) => {
                  const { status, class: statusClass, text: statusText } = getAssessmentStatus(assessment);
                  const { mcqCount, textCount } = getQuestionTypeCounts(assessment);
                  const startDateTime = new Date(`${assessment.startDate}T${assessment.startTime || '00:00'}`);
                  const dueDateTime = new Date(`${assessment.dueDate}T${assessment.dueTime || '23:59'}`);
                  const isSuperTeacherAssessment = assessment.createdBySuperTeacher;
                  const canModify = canEditOrDeleteAssessment(assessment);
                  
                  return (
                    <div 
                      key={assessment.id} 
                      className={`border rounded-lg overflow-hidden bg-white hover:shadow-md transition-shadow ${isSuperTeacherAssessment ? 'border-amber-300' : ''}`}
                    >
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-1">
                            <h3 className="font-medium text-lg truncate pr-2">{assessment.title}</h3>
                            {isSuperTeacherAssessment && (
                              <Crown className="h-4 w-4 text-amber-500" aria-label="Super Teacher Assessment" />
                            )}
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${statusClass}`}>
                            {statusText}
                          </span>
                        </div>
                        
                        {isSuperTeacherAssessment && (
                          <Badge variant="outline" className="mb-2 bg-amber-50 text-amber-800 border-amber-200">
                            <Crown className="h-3 w-3 mr-1 text-amber-500" /> Super Teacher Assessment
                          </Badge>
                        )}
                        
                        <p className="text-gray-500 text-sm line-clamp-2 mb-4">
                          {assessment.description || "No description provided"}
                        </p>
                        
                        <div className="flex items-center text-sm text-gray-500 mb-2">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span>
                            Starts: {format(startDateTime, 'PPP p')}
                          </span>
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-500 mb-2">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span className={`${status === 'completed' ? 'text-red-500' : ''}`}>
                            Due: {format(dueDateTime, 'PPP p')}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-3 text-sm text-gray-500 mb-4">
                          <div className="flex items-center">
                            <ListChecks className="h-4 w-4 mr-1" />
                            <span>{assessment.questions.length} Questions</span>
                          </div>
                          
                          {mcqCount > 0 && (
                            <Badge variant="outline" className="bg-blue-50">
                              <CheckSquare className="h-3 w-3 mr-1" /> {mcqCount} MCQ
                            </Badge>
                          )}
                          
                          {textCount > 0 && (
                            <Badge variant="outline" className="bg-purple-50">
                              <Type className="h-3 w-3 mr-1" /> {textCount} Text
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          <Button 
                            asChild 
                            className="flex-1"
                          >
                            <Link to={`/assessment/${assessment.id}`}>
                              View Assessment
                            </Link>
                          </Button>
                          
                          {canModify && (
                            <Button
                              variant="secondary"
                              size="icon"
                              onClick={() => handleEditAssessment(assessment)}
                              className="shrink-0"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {canModify && (
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => setAssessmentToDelete(assessment.id)}
                              className="shrink-0"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <FileText className="h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No assessments found</h3>
                <p className="text-gray-500 mb-4">
                  {searchQuery
                    ? "No assessments match your search criteria"
                    : "You haven't created any assessments yet"}
                </p>
                {searchQuery ? (
                  <Button variant="outline" onClick={() => setSearchQuery('')}>
                    Clear Search
                  </Button>
                ) : (
                  <Button onClick={() => setIsDialogOpen(true)}>
                    Create Your First Assessment
                  </Button>
                )}
              </div>
            )}
          </AnimatedCard>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{assessmentToEdit ? 'Edit Assessment' : 'Create New Assessment'}</DialogTitle>
          </DialogHeader>
          
          <AssessmentForm 
            onSubmit={handleCreateAssessment}
            onCancel={handleCloseDialog}
            initialData={assessmentToEdit}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Assessment from Excel</DialogTitle>
            <DialogDescription>
              Upload an Excel file (.xlsx) with assessment details and questions.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="assessment-file-upload">Excel File</Label>
              <Input
                id="assessment-file-upload"
                type="file"
                accept=".xlsx"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
              <p className="text-xs text-gray-500 mt-1">
                The Excel file should have assessment details in the first row and questions in subsequent rows.
              </p>
            </div>
            
            <div className="pt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={downloadSampleTemplate}
                className="w-full"
              >
                Download Sample Template
              </Button>
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setIsUploadDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!assessmentToDelete} onOpenChange={(open) => !open && setAssessmentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Assessment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this assessment? This action cannot be undone.
              All student submissions for this assessment will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAssessment}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageTransition>
  );
};

export default TeacherAssessments;
