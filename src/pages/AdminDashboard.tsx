
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BarChart, Calendar, Crown, GraduationCap, Notebook, Users, UserPlus, Trash2, Eye, EyeOff } from 'lucide-react';
import { Navigate, Link } from 'react-router-dom';
import PageTransition from '@/components/PageTransition';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import ScoreSection from '@/components/ScoreSection';

const AdminDashboard = () => {
  const { 
    currentUser, 
    getAllAssessments, 
    getAllSubmissions, 
    getAllStudents, 
    teachers, 
    deleteTeacher, 
    teacherPasswords,
    toggleSuperTeacher, 
    hasSuperTeacher,
    getSuperTeacher
  } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingSuper, setIsTogglingSuper] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [replacementTeacherId, setReplacementTeacherId] = useState<string>('');
  
  if (!currentUser || currentUser.role !== 'admin') {
    return <Navigate to="/unauthorized" />;
  }
  
  const allAssessments = getAllAssessments();
  const allSubmissions = getAllSubmissions();
  const allStudents = getAllStudents();
  const superTeacher = getSuperTeacher();
  
  const filteredAssessments = allAssessments.filter(
    assessment => assessment.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const filteredSubmissions = allSubmissions.filter(
    submission => {
      const assessment = allAssessments.find(a => a.id === submission.assessmentId);
      return assessment?.title.toLowerCase().includes(searchTerm.toLowerCase());
    }
  );
  
  const filteredStudents = allStudents.filter(
    student => student.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const filteredTeachers = teachers.filter(
    teacher => teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) && teacher.role === 'teacher'
  );

  const availableReplacementTeachers = teachers.filter(
    teacher => teacher.role === 'teacher' && teacher.id !== selectedTeacherId
  );

  const handleDeleteTeacher = async (teacherId: string) => {
    setIsDeleting(true);
    try {
      const teacherStudents = allStudents.filter(s => s.createdBy === teacherId);
      const hasStudents = teacherStudents.length > 0;
      
      if (hasStudents && !replacementTeacherId) {
        throw new Error('Please select a replacement teacher for the students.');
      }
      
      await deleteTeacher(teacherId, hasStudents ? replacementTeacherId : undefined);
      
      toast({
        title: 'Teacher deleted',
        description: hasStudents 
          ? `Teacher removed and ${teacherStudents.length} students reassigned successfully.` 
          : 'Teacher removed successfully.',
        variant: 'default',
      });
    } catch (error) {
      if (error instanceof Error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to delete teacher',
          variant: 'destructive',
        });
      }
    } finally {
      setIsDeleting(false);
      setSelectedTeacherId(null);
      setReplacementTeacherId('');
    }
  };
  
  const handleToggleSuperTeacher = async (teacherId: string) => {
    setIsTogglingSuper(true);
    try {
      await toggleSuperTeacher(teacherId);
    } catch (error) {
      if (error instanceof Error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to toggle Super Teacher status',
          variant: 'destructive',
        });
      }
    } finally {
      setIsTogglingSuper(false);
    }
  };
  
  const togglePasswordVisibility = (email: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [email]: !prev[email]
    }));
  };
  
  return (
    <PageTransition>
      <div className="container mx-auto p-4 max-w-7xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-500">Manage all assessments, teachers, and students</p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-md py-1 px-3 rounded-full">
              Admin: {currentUser.name}
            </Badge>
            <Button asChild>
              <Link to="/login">Logout</Link>
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Teachers</p>
                  <p className="text-2xl font-bold">{teachers.filter(t => t.role === 'teacher').length}</p>
                </div>
                <div className="bg-primary/10 p-3 rounded-full">
                  <Users className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Students</p>
                  <p className="text-2xl font-bold">{allStudents.length}</p>
                </div>
                <div className="bg-primary/10 p-3 rounded-full">
                  <GraduationCap className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Assessments</p>
                  <p className="text-2xl font-bold">{allAssessments.length}</p>
                </div>
                <div className="bg-primary/10 p-3 rounded-full">
                  <Notebook className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Submissions</p>
                  <p className="text-2xl font-bold">{allSubmissions.length}</p>
                </div>
                <div className="bg-primary/10 p-3 rounded-full">
                  <BarChart className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            
            <Button asChild>
              <Link to="/create-teacher" className="flex items-center">
                <UserPlus className="mr-2 h-4 w-4" /> Add New Teacher
              </Link>
            </Button>
          </div>
          
          <Tabs defaultValue="assessments" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="assessments">Assessments</TabsTrigger>
              <TabsTrigger value="students">Students</TabsTrigger>
              <TabsTrigger value="teachers">Teachers</TabsTrigger>
              <TabsTrigger value="submissions">Submissions</TabsTrigger>
              <TabsTrigger value="scores">Scores</TabsTrigger>
            </TabsList>
            
            <TabsContent value="assessments" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>All Assessments</CardTitle>
                  <CardDescription>View all assessments created by teachers</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Created By</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead>Questions</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAssessments.length > 0 ? (
                          filteredAssessments.map((assessment) => {
                            const teacher = teachers.find(t => t.id === assessment.createdBy);
                            
                            return (
                              <TableRow key={assessment.id}>
                                <TableCell className="font-medium">
                                  <div className="flex items-center gap-2">
                                    {assessment.title}
                                    {assessment.createdBySuperTeacher && (
                                      <Badge variant="outline" className="flex items-center gap-1">
                                        <Crown className="h-3 w-3 text-amber-500" />
                                        <span className="text-xs">Super</span>
                                      </Badge>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>{teacher?.name || 'Unknown Teacher'}</TableCell>
                                <TableCell>
                                  {format(new Date(assessment.dueDate), 'PPP')}
                                </TableCell>
                                <TableCell>{assessment.questions.length}</TableCell>
                                <TableCell>
                                  <Button asChild size="sm" variant="outline">
                                    <Link to={`/assessment/${assessment.id}`}>
                                      View Details
                                    </Link>
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-4">
                              No assessments found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="students" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>All Students</CardTitle>
                  <CardDescription>View all students in the system</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Teacher</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredStudents.length > 0 ? (
                          filteredStudents.map((student) => {
                            const teacher = teachers.find(t => t.id === student.createdBy);
                            
                            return (
                              <TableRow key={student.id}>
                                <TableCell className="font-medium">{student.name}</TableCell>
                                <TableCell>{student.email}</TableCell>
                                <TableCell>{teacher?.name || 'Unknown Teacher'}</TableCell>
                              </TableRow>
                            );
                          })
                        ) : (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center py-4">
                              No students found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="teachers" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>All Teachers</CardTitle>
                  <CardDescription>View all teachers in the system</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Password</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Students</TableHead>
                        <TableHead>Assessments</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTeachers.length > 0 ? (
                        filteredTeachers.map((teacher) => {
                          const teacherStudents = allStudents.filter(s => s.createdBy === teacher.id);
                          const teacherAssessments = allAssessments.filter(a => a.createdBy === teacher.id);
                          const password = teacherPasswords?.[teacher.email] || '';
                          const isSuperTeacher = teacher.isSuperTeacher;
                          
                          return (
                            <TableRow key={teacher.id}>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  {teacher.name}
                                  {isSuperTeacher && (
                                    <Badge variant="outline" className="flex items-center gap-1">
                                      <Crown className="h-3 w-3 text-amber-500" />
                                      <span className="text-xs">Super</span>
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>{teacher.email}</TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <span>
                                    {showPasswords[teacher.email] ? password : '••••••••'}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => togglePasswordVisibility(teacher.email)}
                                  >
                                    {showPasswords[teacher.email] ? (
                                      <EyeOff className="h-4 w-4" />
                                    ) : (
                                      <Eye className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                              </TableCell>
                              <TableCell>{teacher.department || 'Not Assigned'}</TableCell>
                              <TableCell>{teacherStudents.length}</TableCell>
                              <TableCell>{teacherAssessments.length}</TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button 
                                        variant="destructive" 
                                        size="sm"
                                        onClick={() => setSelectedTeacherId(teacher.id)}
                                      >
                                        <Trash2 className="h-4 w-4 mr-1" /> Delete
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Teacher</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to delete {teacher.name}? This action will remove their login details and cannot be undone.
                                          {teacherStudents.length > 0 && (
                                            <div className="mt-2 space-y-3">
                                              <p className="text-amber-500">
                                                This teacher has {teacherStudents.length} student(s). 
                                                Please select a new teacher to transfer ownership:
                                              </p>
                                              
                                              {availableReplacementTeachers.length > 0 ? (
                                                <div className="mt-4">
                                                  <Label htmlFor="replacement-teacher">Reassign students to:</Label>
                                                  <Select 
                                                    value={replacementTeacherId} 
                                                    onValueChange={setReplacementTeacherId}
                                                  >
                                                    <SelectTrigger id="replacement-teacher" className="mt-1 w-full">
                                                      <SelectValue placeholder="Select a teacher" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                      {availableReplacementTeachers.map(t => (
                                                        <SelectItem key={t.id} value={t.id}>{t.name} ({t.email})</SelectItem>
                                                      ))}
                                                    </SelectContent>
                                                  </Select>
                                                </div>
                                              ) : (
                                                <p className="text-red-500">
                                                  Error: No available teachers for reassignment. Please create another teacher first.
                                                </p>
                                              )}
                                            </div>
                                          )}
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel onClick={() => {
                                          setSelectedTeacherId(null);
                                          setReplacementTeacherId('');
                                        }}>
                                          Cancel
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                          className="bg-red-500 hover:bg-red-600"
                                          onClick={() => handleDeleteTeacher(teacher.id)}
                                          disabled={isDeleting || (teacherStudents.length > 0 && (availableReplacementTeachers.length === 0 || !replacementTeacherId))}
                                        >
                                          {isDeleting ? "Deleting..." : "Delete"}
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                  
                                  <Button
                                    variant={isSuperTeacher ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => handleToggleSuperTeacher(teacher.id)}
                                    disabled={isTogglingSuper || (hasSuperTeacher() && !isSuperTeacher)}
                                    className="flex items-center gap-1"
                                  >
                                    <Crown className="h-4 w-4" />
                                    {isSuperTeacher ? "Remove Super" : "Make Super"}
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-4">
                            No teachers found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="submissions" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>All Submissions</CardTitle>
                  <CardDescription>View all assessment submissions</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Assessment</TableHead>
                          <TableHead>Student</TableHead>
                          <TableHead>Submitted At</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Score</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredSubmissions.length > 0 ? (
                          filteredSubmissions.map((submission) => {
                            const assessment = allAssessments.find(a => a.id === submission.assessmentId);
                            const student = allStudents.find(s => s.id === submission.studentId);
                            const totalMarks = assessment?.questions.reduce((sum, q) => sum + q.marks, 0) || 0;
                            
                            return (
                              <TableRow key={submission.id}>
                                <TableCell className="font-medium">
                                  <div className="flex items-center gap-2">
                                    {assessment?.title || 'Unknown Assessment'}
                                    {assessment?.createdBySuperTeacher && (
                                      <Badge variant="outline" className="flex items-center gap-1">
                                        <Crown className="h-3 w-3 text-amber-500" />
                                        <span className="text-xs">Super</span>
                                      </Badge>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>{student?.name || 'Unknown Student'}</TableCell>
                                <TableCell>
                                  {format(new Date(submission.submittedAt), 'PPP p')}
                                </TableCell>
                                <TableCell>
                                  {submission.isCompleted ? (
                                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-amber-600">In Progress</Badge>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {submission.marksAwarded !== undefined ? (
                                    `${submission.marksAwarded}/${totalMarks}`
                                  ) : (
                                    submission.autoGradedMarks !== undefined ? (
                                      `${submission.autoGradedMarks}/${totalMarks} (Auto)`
                                    ) : (
                                      'Not Graded'
                                    )
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Button asChild size="sm" variant="outline">
                                    <Link to={`/assessment/${assessment?.id}`}>
                                      View Assessment
                                    </Link>
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-4">
                              No submissions found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="scores" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Student Scores</CardTitle>
                  <CardDescription>
                    View and analyze student performance across all assessments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScoreSection />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </PageTransition>
  );
};

export default AdminDashboard;
