import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, FileText, LogOut, Plus, Search, Trash, TrashIcon, Users } from 'lucide-react';
import AnimatedCard from '@/components/AnimatedCard';
import PageTransition from '@/components/PageTransition';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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

const TeacherDashboard = () => {
  const { currentUser, students, logout, createStudent, deleteStudent } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentPassword, setNewStudentPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  const teacherStudents = students.filter(
    student => student.createdBy === currentUser?.id
  );

  const filteredStudents = teacherStudents.filter(
    student => 
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await createStudent(newStudentName, newStudentEmail, newStudentPassword);
      setNewStudentName('');
      setNewStudentEmail('');
      setNewStudentPassword('');
      setIsDialogOpen(false);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStudent = async () => {
    if (!studentToDelete) return;
    
    setIsDeleting(true);
    try {
      await deleteStudent(studentToDelete);
      setStudentToDelete(null);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsDeleting(false);
    }
  };

  const copyToClipboard = (text: string, studentId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(studentId);
    toast.success('Copied to clipboard');
    
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const handleDeleteAllStudents = async () => {
    if (!currentUser || teacherStudents.length === 0) {
      toast.error('No students to delete');
      return;
    }
    
    // Prevent deletion if only one student is present
    if (teacherStudents.length === 1) {
      toast.error('Cannot delete all students when only one student is present');
      return;
    }
    
    console.log('Starting to delete all students for teacher:', currentUser.id);
    console.log('Students to delete:', teacherStudents.map(s => ({ id: s.id, name: s.name })));
    
    setIsDeletingAll(true);
    
    try {
      let deletedCount = 0;
      
      // Delete students one by one to ensure proper cleanup
      for (const student of teacherStudents) {
        console.log('Deleting student:', student.name, student.id);
        try {
          await deleteStudent(student.id);
          deletedCount++;
          console.log('Successfully deleted student:', student.name);
        } catch (studentError) {
          console.error('Failed to delete student:', student.name, studentError);
          // Continue with other students even if one fails
        }
      }
      
      setShowDeleteAllConfirm(false);
      
      if (deletedCount === teacherStudents.length) {
        toast.success(`Successfully deleted all ${deletedCount} students`);
      } else if (deletedCount > 0) {
        toast.success(`Deleted ${deletedCount} of ${teacherStudents.length} students`);
      } else {
        toast.error('Failed to delete any students');
      }
      
    } catch (error) {
      console.error('Error in deleteAllStudents:', error);
      toast.error((error as Error).message || 'Failed to delete students');
    } finally {
      setIsDeletingAll(false);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4 sm:p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900 mb-1">
                Teacher Dashboard
              </h1>
              <p className="text-gray-500">
                Welcome back, {currentUser?.name || 'Teacher'}
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                asChild 
                className="shrink-0"
              >
                <Link to="/teacher-assessments">
                  <FileText className="h-4 w-4 mr-2" /> Assessments
                </Link>
              </Button>
              
              <Button variant="outline" onClick={logout} className="shrink-0">
                <LogOut className="h-4 w-4 mr-2" /> Sign Out
              </Button>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <AnimatedCard
              header={
                <div className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-primary" />
                  <h2 className="text-xl font-medium">Students</h2>
                </div>
              }
              delay={0.1}
            >
              <div className="text-3xl font-bold">{teacherStudents.length}</div>
              <p className="text-gray-500">Total students created</p>
            </AnimatedCard>
          </div>

          <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search students"
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="shrink-0">
                    <Plus className="h-4 w-4 mr-2" /> Create Student
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Student</DialogTitle>
                    <DialogDescription>
                      Add a new student to your classroom. You'll need to provide their login credentials.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <form onSubmit={handleCreateStudent}>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={newStudentName}
                          onChange={(e) => setNewStudentName(e.target.value)}
                          placeholder="John Doe"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          value={newStudentEmail}
                          onChange={(e) => setNewStudentEmail(e.target.value)}
                          placeholder="john.doe@example.com"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="text"
                          value={newStudentPassword}
                          onChange={(e) => setNewStudentPassword(e.target.value)}
                          placeholder="Enter password"
                          required
                          minLength={4}
                        />
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Creating...' : 'Create Student'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
              
              {teacherStudents.length > 1 && (
                <Button 
                  variant="destructive"
                  onClick={() => setShowDeleteAllConfirm(true)}
                  className="shrink-0"
                  disabled={isDeletingAll}
                >
                  <TrashIcon className="h-4 w-4 mr-2" /> 
                  {isDeletingAll ? 'Deleting...' : 'Delete All Students'}
                </Button>
              )}
            </div>
          </div>

          <AnimatedCard contentClassName="p-0" delay={0.2}>
            {filteredStudents.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Password</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id} className="reveal" style={{animationDelay: '0.1s'}}>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm mr-2">
                            {student.password}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyToClipboard(student.password, student.id)}
                            className="h-8 w-8"
                          >
                            <Copy className={`h-4 w-4 ${copiedId === student.id ? 'text-green-500' : ''}`} />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const credentials = `Email: ${student.email}\nPassword: ${student.password}`;
                              copyToClipboard(credentials, student.id);
                            }}
                          >
                            Copy Credentials
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setStudentToDelete(student.id)}
                          >
                            <Trash className="h-3 w-3 mr-1" /> Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <Users className="h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No students found</h3>
                <p className="text-gray-500 mb-4">
                  {searchQuery
                    ? "No students match your search criteria"
                    : "You haven't created any students yet"}
                </p>
                {searchQuery ? (
                  <Button variant="outline" onClick={() => setSearchQuery('')}>
                    Clear Search
                  </Button>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button onClick={() => setIsDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" /> Create Student
                    </Button>
                  </div>
                )}
              </div>
            )}
          </AnimatedCard>
        </div>
      </div>

      <AlertDialog open={!!studentToDelete} onOpenChange={(open) => !open && setStudentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Student</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this student? This action cannot be undone.
              All their assessment submissions will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteStudent}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <AlertDialog open={showDeleteAllConfirm} onOpenChange={setShowDeleteAllConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete All Students</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete ALL {teacherStudents.length} students? This action cannot be undone.
              All student assessment submissions will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingAll}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAllStudents}
              disabled={isDeletingAll}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeletingAll ? 'Deleting...' : `Delete All ${teacherStudents.length} Students`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageTransition>
  );
};

export default TeacherDashboard;
