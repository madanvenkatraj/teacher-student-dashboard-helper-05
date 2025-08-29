import React, { createContext, useState, useContext, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

export type User = {
  id: string;
  name: string;
  email: string;
  role: 'teacher' | 'student' | 'admin';
  createdBy?: string;
  department?: string;
  isSuperTeacher?: boolean;
};

export type Student = {
  id: string;
  name: string;
  email: string;
  password: string;
  createdBy: string;
};

export type Question = {
  id: string;
  text: string;
  options?: string[];
  correctAnswer?: string;
  marks: number;
  type: 'text' | 'multiple-choice';
};

export type Assessment = {
  id: string;
  title: string;
  description: string;
  createdBy: string;
  startDate: string;
  startTime: string;
  dueDate: string;
  dueTime: string;
  questions: Question[];
  createdAt: string;
  createdBySuperTeacher?: boolean;
};

export type Submission = {
  id: string;
  assessmentId: string;
  studentId: string;
  answers: {
    questionId: string;
    answer: string;
  }[];
  submittedAt: string;
  isCompleted: boolean;
  marksAwarded?: number;
  autoGradedMarks?: number;
  tabSwitched?: boolean;
  screenSizeViolation?: boolean;
};

export type Score = {
  studentId: string;
  studentName: string;
  assessmentId: string;
  assessmentTitle: string;
  marksAwarded: number;
  totalMarks: number;
  teacherId: string;
  teacherName: string;
  department?: string;
  createdBySuperTeacher?: boolean;
};

type AuthContextType = {
  currentUser: User | null;
  students: Student[];
  teachers: User[];
  assessments: Assessment[];
  submissions: Submission[];
  loading: boolean;
  teacherPasswords: Record<string, string>;
  login: (email: string, password: string, requiredRole?: 'student' | 'teacher' | 'admin') => Promise<boolean>;
  logout: () => void;
  createStudent: (name: string, email: string, password: string) => Promise<Student>;
  deleteStudent: (studentId: string) => Promise<void>;
  addTeacher: (name: string, email: string, password: string) => Promise<void>;
  createTeacher: (name: string, email: string, password: string, department?: string, isSuperTeacher?: boolean) => Promise<void>;
  deleteTeacher: (teacherId: string, newTeacherId?: string) => Promise<void>;
  createAssessment: (
    title: string,
    description: string,
    startDate: string,
    startTime: string,
    dueDate: string,
    dueTime: string,
    questions: Omit<Question, 'id'>[]
  ) => Promise<Assessment>;
  updateAssessment: (
    assessmentId: string,
    title: string,
    description: string,
    startDate: string,
    startTime: string,
    dueDate: string,
    dueTime: string,
    questions: Question[]
  ) => Promise<Assessment>;
  getTeacherAssessments: (teacherId: string) => Assessment[];
  getStudentAssessments: (studentId: string) => Assessment[];
  getSuperTeacherAssessments: () => Assessment[];
  submitAssessment: (
    assessmentId: string,
    studentId: string,
    answers: {
      questionId: string;
      answer: string;
    }[],
    tabSwitched?: boolean,
    screenSizeViolation?: boolean
  ) => Promise<void>;
  getSubmission: (assessmentId: string, studentId: string) => Submission | undefined;
  getAssessmentSubmissions: (assessmentId: string) => Submission[];
  awardMarks: (submissionId: string, marksAwarded: number) => Promise<void>;
  getAssessmentById: (assessmentId: string) => Assessment | undefined;
  getAllAssessments: () => Assessment[];
  getAllSubmissions: () => Submission[];
  getAllStudents: () => Student[];
  canStudentTakeAssessment: (assessmentId: string, studentId: string) => boolean;
  isAssessmentActive: (assessment: Assessment) => boolean;
  deleteAssessment: (assessmentId: string) => Promise<void>;
  reassignStudents: (fromTeacherId: string, toTeacherId: string) => Promise<number>;
  toggleSuperTeacher: (teacherId: string) => Promise<void>;
  hasSuperTeacher: () => boolean;
  getSuperTeacher: () => User | undefined;
  getStudentScores: () => Score[];
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const adminUser: User = { id: 'admin1', name: 'Admin User', email: 'admin@example.com', role: 'admin' };

const teacherPasswords: Record<string, string> = {
  'admin@example.com': 'adminpass',
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<User[]>([adminUser]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
    
    const savedStudents = localStorage.getItem('students');
    if (savedStudents) {
      setStudents(JSON.parse(savedStudents));
    }
    
    const savedAssessments = localStorage.getItem('assessments');
    if (savedAssessments) {
      setAssessments(JSON.parse(savedAssessments));
    }
    
    const savedSubmissions = localStorage.getItem('submissions');
    if (savedSubmissions) {
      setSubmissions(JSON.parse(savedSubmissions));
    }
    
    setLoading(false);
  }, []);

  useEffect(() => {
    if (students.length > 0) {
      localStorage.setItem('students', JSON.stringify(students));
    }
  }, [students]);
  
  useEffect(() => {
    if (assessments.length > 0) {
      localStorage.setItem('assessments', JSON.stringify(assessments));
    }
  }, [assessments]);
  
  useEffect(() => {
    if (submissions.length > 0) {
      localStorage.setItem('submissions', JSON.stringify(submissions));
    }
  }, [submissions]);

  useEffect(() => {
    const savedTeachers = localStorage.getItem('teachers');
    if (savedTeachers) {
      const parsedTeachers = JSON.parse(savedTeachers);
      if (!parsedTeachers.some((t: User) => t.email === adminUser.email)) {
        parsedTeachers.push(adminUser);
      }
      setTeachers(parsedTeachers);
    }
    
    const savedTeacherPasswords = localStorage.getItem('teacherPasswords');
    if (savedTeacherPasswords) {
      Object.assign(teacherPasswords, JSON.parse(savedTeacherPasswords));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('teachers', JSON.stringify(teachers));
  }, [teachers]);

  const login = async (email: string, password: string, requiredRole?: 'student' | 'teacher' | 'admin'): Promise<boolean> => {
    setLoading(true);
    
    try {
      const lowercaseEmail = email.toLowerCase();
      
      // If a specific role is required, validate against only that role
      if (requiredRole === 'admin') {
        // Check only admin credentials
        const adminUser = teachers.find(t => t.email.toLowerCase() === lowercaseEmail && t.role === 'admin');
        if (adminUser && teacherPasswords[adminUser.email] === password) {
          setCurrentUser(adminUser);
          localStorage.setItem('currentUser', JSON.stringify(adminUser));
          toast.success(`Welcome back, ${adminUser.name}`);
          return true;
        }
        toast.error('Invalid admin credentials');
        return false;
      }
      
      if (requiredRole === 'teacher') {
        // Check only teacher credentials (excluding admin)
        const teacherUser = teachers.find(t => t.email.toLowerCase() === lowercaseEmail && t.role === 'teacher');
        if (teacherUser && teacherPasswords[teacherUser.email] === password) {
          setCurrentUser(teacherUser);
          localStorage.setItem('currentUser', JSON.stringify(teacherUser));
          toast.success(`Welcome back, ${teacherUser.name}`);
          return true;
        }
        toast.error('Invalid teacher credentials');
        return false;
      }
      
      if (requiredRole === 'student') {
        // Check only student credentials
        const student = students.find(s => s.email.toLowerCase() === lowercaseEmail && s.password === password);
        if (student) {
          const studentUser: User = {
            id: student.id,
            name: student.name,
            email: student.email,
            role: 'student',
            createdBy: student.createdBy
          };
          setCurrentUser(studentUser);
          localStorage.setItem('currentUser', JSON.stringify(studentUser));
          toast.success(`Welcome, ${student.name}`);
          return true;
        }
        toast.error('Invalid student credentials');
        return false;
      }
      
      // Fallback: if no specific role required, check all (for backward compatibility)
      const user = teachers.find(t => t.email.toLowerCase() === lowercaseEmail);
      if (user && teacherPasswords[user.email] === password) {
        setCurrentUser(user);
        localStorage.setItem('currentUser', JSON.stringify(user));
        toast.success(`Welcome back, ${user.name}`);
        return true;
      }
      
      const student = students.find(s => s.email.toLowerCase() === lowercaseEmail && s.password === password);
      if (student) {
        const studentUser: User = {
          id: student.id,
          name: student.name,
          email: student.email,
          role: 'student',
          createdBy: student.createdBy
        };
        setCurrentUser(studentUser);
        localStorage.setItem('currentUser', JSON.stringify(studentUser));
        toast.success(`Welcome, ${student.name}`);
        return true;
      }
      
      toast.error('Invalid email or password');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    toast.info('You have been logged out');
  };

  const createStudent = async (name: string, email: string, password: string): Promise<Student> => {
    if (!currentUser || currentUser.role !== 'teacher') {
      throw new Error('Only teachers can create students');
    }
    
    const lowercaseEmail = email.toLowerCase();
    
    if (students.some(s => s.email.toLowerCase() === lowercaseEmail)) {
      throw new Error('A student with this email already exists');
    }
    
    const newStudent: Student = {
      id: Date.now().toString(),
      name,
      email: lowercaseEmail,
      password,
      createdBy: currentUser.id,
    };
    
    setStudents(prev => [...prev, newStudent]);
    toast.success(`Student ${name} created successfully`);
    return newStudent;
  };

  const deleteStudent = async (studentId: string): Promise<void> => {
    if (!currentUser || (currentUser.role !== 'teacher' && currentUser.role !== 'admin')) {
      throw new Error('Only teachers and admins can delete students');
    }
    
    const studentToDelete = students.find(s => s.id === studentId);
    
    if (!studentToDelete) {
      throw new Error('Student not found');
    }
    
    if (currentUser.role === 'teacher' && studentToDelete.createdBy !== currentUser.id) {
      throw new Error('You can only delete students you created');
    }
    
    const updatedSubmissions = submissions.filter(s => s.studentId !== studentId);
    setSubmissions(updatedSubmissions);
    
    const updatedStudents = students.filter(s => s.id !== studentId);
    setStudents(updatedStudents);
    
    toast.success(`Student ${studentToDelete.name} deleted successfully`);
  };

  const addTeacher = async (name: string, email: string, password: string): Promise<void> => {
    const lowercaseEmail = email.toLowerCase();
    
    if (teachers.some(t => t.email.toLowerCase() === lowercaseEmail)) {
      throw new Error('A teacher with this email already exists');
    }
    
    const newTeacher: User = {
      id: Date.now().toString(),
      name,
      email: lowercaseEmail,
      role: 'teacher',
    };
    
    teacherPasswords[lowercaseEmail] = password;
    
    setTeachers(prev => [...prev, newTeacher]);
    
    localStorage.setItem('teachers', JSON.stringify([...teachers, newTeacher]));
    localStorage.setItem('teacherPasswords', JSON.stringify(teacherPasswords));
    
    toast.success(`Teacher ${name} added successfully`);
  };

  const createTeacher = async (
    name: string, 
    email: string, 
    password: string, 
    department?: string, 
    isSuperTeacher?: boolean
  ): Promise<void> => {
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('Only admin can create teachers');
    }
    
    const lowercaseEmail = email.toLowerCase();
    
    if (teachers.some(t => t.email.toLowerCase() === lowercaseEmail)) {
      throw new Error('A teacher with this email already exists');
    }
    
    if (isSuperTeacher && hasSuperTeacher()) {
      throw new Error('There can only be one Super Teacher. Please remove the existing Super Teacher role first.');
    }
    
    const newTeacher: User = {
      id: Date.now().toString(),
      name,
      email: lowercaseEmail,
      role: 'teacher',
      department,
      isSuperTeacher: isSuperTeacher || false,
    };
    
    teacherPasswords[lowercaseEmail] = password;
    
    setTeachers(prev => [...prev, newTeacher]);
    
    localStorage.setItem('teachers', JSON.stringify([...teachers, newTeacher]));
    localStorage.setItem('teacherPasswords', JSON.stringify(teacherPasswords));
    
    toast.success(`Teacher ${name} created successfully${isSuperTeacher ? ' as Super Teacher' : ''}`);
  };

  const createAssessment = async (
    title: string,
    description: string,
    startDate: string,
    startTime: string,
    dueDate: string,
    dueTime: string,
    questions: Omit<Question, 'id'>[]
  ): Promise<Assessment> => {
    if (!currentUser || currentUser.role !== 'teacher') {
      throw new Error('Only teachers can create assessments');
    }
    
    const questionsWithIds = questions.map(q => ({
      ...q,
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9)
    }));
    
    const isSuperTeacher = currentUser.isSuperTeacher || false;
    
    const newAssessment: Assessment = {
      id: Date.now().toString(),
      title,
      description,
      createdBy: currentUser.id,
      startDate,
      startTime,
      dueDate,
      dueTime,
      questions: questionsWithIds,
      createdAt: new Date().toISOString(),
      createdBySuperTeacher: isSuperTeacher
    };
    
    setAssessments(prev => [...prev, newAssessment]);
    toast.success(`Assessment "${title}" created successfully${isSuperTeacher ? ' as Super Teacher' : ''}`);
    return newAssessment;
  };

  const updateAssessment = async (
    assessmentId: string,
    title: string,
    description: string,
    startDate: string,
    startTime: string,
    dueDate: string,
    dueTime: string,
    questions: Question[]
  ): Promise<Assessment> => {
    if (!currentUser || currentUser.role !== 'teacher') {
      throw new Error('Only teachers can update assessments');
    }
    
    const assessmentToUpdate = assessments.find(a => a.id === assessmentId);
    
    if (!assessmentToUpdate) {
      throw new Error('Assessment not found');
    }
    
    if (assessmentToUpdate.createdBy !== currentUser.id) {
      throw new Error('You can only update assessments you created');
    }
    
    const processedQuestions = questions.map(q => {
      if (!q.id) {
        return {
          ...q,
          id: Date.now().toString() + Math.random().toString(36).substring(2, 9)
        };
      }
      return q;
    });
    
    const updatedAssessment: Assessment = {
      ...assessmentToUpdate,
      title,
      description,
      startDate,
      startTime,
      dueDate,
      dueTime,
      questions: processedQuestions,
    };
    
    setAssessments(prev => 
      prev.map(a => a.id === assessmentId ? updatedAssessment : a)
    );
    
    toast.success(`Assessment "${title}" updated successfully`);
    return updatedAssessment;
  };

  const getTeacherAssessments = (teacherId: string): Assessment[] => {
    const teacherAssessments = assessments.filter(assessment => assessment.createdBy === teacherId);
    
    const teacher = teachers.find(t => t.id === teacherId);
    if (teacher && !teacher.isSuperTeacher) {
      const superTeacherAssessments = getSuperTeacherAssessments();
      return [...teacherAssessments, ...superTeacherAssessments];
    }
    
    return teacherAssessments;
  };

  const getSuperTeacherAssessments = (): Assessment[] => {
    return assessments.filter(assessment => assessment.createdBySuperTeacher === true);
  };

  const getStudentAssessments = (studentId: string): Assessment[] => {
    const student = students.find(s => s.id === studentId);
    if (!student) return [];
    
    // Get all unique assessments that the student should see
    // This includes assessments from their teacher AND super teacher assessments
    const relevantAssessments = assessments.filter(assessment => 
      assessment.createdBy === student.createdBy || assessment.createdBySuperTeacher === true
    );
    
    return relevantAssessments;
  };

  const submitAssessment = async (
    assessmentId: string,
    studentId: string,
    answers: { questionId: string; answer: string }[],
    tabSwitched: boolean = false,
    screenSizeViolation: boolean = false
  ): Promise<void> => {
    const assessment = assessments.find(a => a.id === assessmentId);
    if (!assessment) {
      throw new Error('Assessment not found');
    }
    
    const isCompleted = tabSwitched || screenSizeViolation || answers.length > 0;
    
    let autoGradedMarks = 0;
    if (isCompleted && !screenSizeViolation) {
      assessment.questions.forEach(question => {
        if (question.type === 'multiple-choice' && question.correctAnswer) {
          const studentAnswer = answers.find(a => a.questionId === question.id)?.answer;
          if (studentAnswer === question.correctAnswer) {
            autoGradedMarks += question.marks;
          }
        }
      });
    }
    
    const totalMcqMarks = assessment.questions
      .filter(q => q.type === 'multiple-choice')
      .reduce((total, q) => total + q.marks, 0);
    
    const totalTextMarks = assessment.questions
      .filter(q => q.type === 'text')
      .reduce((total, q) => total + q.marks, 0);
    
    const existingSubmission = submissions.find(
      s => s.assessmentId === assessmentId && s.studentId === studentId
    );
    
    if (existingSubmission) {
      setSubmissions(prev => 
        prev.map(s => 
          s.id === existingSubmission.id 
            ? {
                ...s,
                answers,
                submittedAt: new Date().toISOString(),
                isCompleted,
                autoGradedMarks: isCompleted ? autoGradedMarks : undefined,
                marksAwarded: screenSizeViolation ? 0 : (
                  isCompleted && existingSubmission.marksAwarded !== undefined
                    ? autoGradedMarks + (existingSubmission.marksAwarded - (existingSubmission.autoGradedMarks || 0))
                    : (totalTextMarks > 0 ? undefined : autoGradedMarks)
                ),
                tabSwitched: tabSwitched || s.tabSwitched,
                screenSizeViolation: screenSizeViolation || s.screenSizeViolation
              }
            : s
        )
      );
    } else {
      const newSubmission: Submission = {
        id: Date.now().toString(),
        assessmentId,
        studentId,
        answers,
        submittedAt: new Date().toISOString(),
        isCompleted,
        autoGradedMarks: isCompleted ? autoGradedMarks : undefined,
        marksAwarded: screenSizeViolation ? 0 : (totalTextMarks > 0 ? undefined : autoGradedMarks),
        tabSwitched,
        screenSizeViolation
      };
      
      setSubmissions(prev => [...prev, newSubmission]);
    }
    
    let message = '';
    if (screenSizeViolation) {
      message = 'Assessment auto-submitted due to screen size violation. Score: 0';
    } else if (tabSwitched) {
      message = 'Assessment auto-submitted due to tab switching';
    } else if (isCompleted) {
      message = 'Assessment submitted successfully';
    } else {
      message = 'Assessment saved as draft';
    }
    
    toast.success(message);
  };

  const getSubmission = (assessmentId: string, studentId: string): Submission | undefined => {
    return submissions.find(
      s => s.assessmentId === assessmentId && s.studentId === studentId
    );
  };

  const getAssessmentSubmissions = (assessmentId: string): Submission[] => {
    return submissions.filter(s => s.assessmentId === assessmentId);
  };

  const awardMarks = async (submissionId: string, marksAwarded: number): Promise<void> => {
    const submission = submissions.find(s => s.id === submissionId);
    if (!submission) {
      throw new Error('Submission not found');
    }
    
    const assessment = assessments.find(a => a.id === submission.assessmentId);
    if (!assessment) {
      throw new Error('Assessment not found');
    }
    
    setSubmissions(prev => 
      prev.map(s => 
        s.id === submissionId 
          ? { ...s, marksAwarded } 
          : s
      )
    );
    
    toast.success('Marks awarded successfully');
  };

  const getAssessmentById = (assessmentId: string): Assessment | undefined => {
    return assessments.find(a => a.id === assessmentId);
  };

  const getAllAssessments = (): Assessment[] => {
    if (!currentUser || currentUser.role !== 'admin') {
      return [];
    }
    return assessments;
  };

  const getAllSubmissions = (): Submission[] => {
    if (!currentUser || currentUser.role !== 'admin') {
      return [];
    }
    return submissions;
  };

  const getAllStudents = (): Student[] => {
    if (!currentUser || currentUser.role !== 'admin') {
      return [];
    }
    return students;
  };

  const canStudentTakeAssessment = (assessmentId: string, studentId: string): boolean => {
    const submission = getSubmission(assessmentId, studentId);
    return !submission || (!submission.isCompleted && !submission.tabSwitched && !submission.screenSizeViolation);
  };

  const isAssessmentActive = (assessment: Assessment): boolean => {
    const now = new Date();
    
    const startDateTime = new Date(`${assessment.startDate}T${assessment.startTime}`);
    const endDateTime = new Date(`${assessment.dueDate}T${assessment.dueTime}`);
    
    return now >= startDateTime && now <= endDateTime;
  };

  const deleteAssessment = async (assessmentId: string): Promise<void> => {
    if (!currentUser || currentUser.role !== 'teacher') {
      throw new Error('Only teachers can delete assessments');
    }
    
    const assessmentToDelete = assessments.find(a => a.id === assessmentId);
    
    if (!assessmentToDelete) {
      throw new Error('Assessment not found');
    }
    
    if (assessmentToDelete.createdBy !== currentUser.id) {
      throw new Error('You can only delete assessments you created');
    }
    
    const updatedSubmissions = submissions.filter(s => s.assessmentId !== assessmentId);
    setSubmissions(updatedSubmissions);
    
    const updatedAssessments = assessments.filter(a => a.id !== assessmentId);
    setAssessments(updatedAssessments);
    
    localStorage.setItem('assessments', JSON.stringify(updatedAssessments));
    localStorage.setItem('submissions', JSON.stringify(updatedSubmissions));
    
    toast.success(`Assessment "${assessmentToDelete.title}" deleted successfully`);
  };

  const reassignStudents = async (fromTeacherId: string, toTeacherId: string): Promise<number> => {
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('Only admin can reassign students');
    }
    
    const teacherToDelete = teachers.find(t => t.id === fromTeacherId);
    const newTeacher = teachers.find(t => t.id === toTeacherId);
    
    if (!teacherToDelete) {
      throw new Error('Original teacher not found');
    }
    
    if (!newTeacher) {
      throw new Error('New teacher not found');
    }
    
    const teacherStudents = students.filter(s => s.createdBy === fromTeacherId);
    
    if (teacherStudents.length === 0) {
      return 0;
    }
    
    const updatedStudents = students.map(student => {
      if (student.createdBy === fromTeacherId) {
        return { ...student, createdBy: toTeacherId };
      }
      return student;
    });
    
    setStudents(updatedStudents);
    
    return teacherStudents.length;
  };

  const deleteTeacher = async (teacherId: string, newTeacherId?: string): Promise<void> => {
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('Only admin can delete teachers');
    }
    
    const teacherToDelete = teachers.find(t => t.id === teacherId);
    
    if (!teacherToDelete) {
      throw new Error('Teacher not found');
    }
    
    if (teacherToDelete.role === 'admin') {
      throw new Error('Cannot delete admin account');
    }
    
    if (newTeacherId) {
      await reassignStudents(teacherId, newTeacherId);
    }
    
    if (teacherToDelete.email in teacherPasswords) {
      const updatedPasswords = { ...teacherPasswords };
      delete updatedPasswords[teacherToDelete.email];
      Object.assign(teacherPasswords, updatedPasswords);
      localStorage.setItem('teacherPasswords', JSON.stringify(teacherPasswords));
    }
    
    const updatedTeachers = teachers.filter(t => t.id !== teacherId);
    setTeachers(updatedTeachers);
    
    localStorage.setItem('teachers', JSON.stringify(updatedTeachers));
    
    toast.success(`Teacher ${teacherToDelete.name} deleted successfully`);
  };

  const toggleSuperTeacher = async (teacherId: string): Promise<void> => {
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('Only admin can designate Super Teachers');
    }
    
    const teacherToUpdate = teachers.find(t => t.id === teacherId);
    
    if (!teacherToUpdate) {
      throw new Error('Teacher not found');
    }
    
    if (teacherToUpdate.role !== 'teacher') {
      throw new Error('Only teachers can be designated as Super Teachers');
    }
    
    if (!teacherToUpdate.isSuperTeacher) {
      const existingSuperTeacher = teachers.find(t => t.isSuperTeacher);
      
      if (existingSuperTeacher) {
        throw new Error(`There can only be one Super Teacher. ${existingSuperTeacher.name} is already a Super Teacher.`);
      }
    }
    
    const updatedTeachers = teachers.map(t => 
      t.id === teacherId 
        ? { ...t, isSuperTeacher: !t.isSuperTeacher } 
        : t
    );
    
    setTeachers(updatedTeachers);
    
    localStorage.setItem('teachers', JSON.stringify(updatedTeachers));
    
    toast.success(
      teacherToUpdate.isSuperTeacher 
        ? `${teacherToUpdate.name} is no longer a Super Teacher` 
        : `${teacherToUpdate.name} is now a Super Teacher`
    );
  };

  const hasSuperTeacher = (): boolean => {
    return teachers.some(t => t.isSuperTeacher);
  };

  const getSuperTeacher = (): User | undefined => {
    return teachers.find(t => t.isSuperTeacher);
  };

  const getStudentScores = (): Score[] => {
    const scores: Score[] = [];
    
    submissions.forEach(submission => {
      if (submission.isCompleted && submission.marksAwarded !== undefined) {
        const assessment = assessments.find(a => a.id === submission.assessmentId);
        const student = students.find(s => s.id === submission.studentId);
        
        if (assessment && student) {
          const teacher = teachers.find(t => t.id === student.createdBy);
          const assessmentCreator = teachers.find(t => t.id === assessment.createdBy);
          
          if (teacher) {
            const totalMarks = assessment.questions.reduce((sum, q) => sum + q.marks, 0);
            
            scores.push({
              studentId: student.id,
              studentName: student.name,
              assessmentId: assessment.id,
              assessmentTitle: assessment.title,
              marksAwarded: submission.marksAwarded,
              totalMarks,
              teacherId: teacher.id,
              teacherName: teacher.name,
              department: teacher.department,
              createdBySuperTeacher: assessment.createdBySuperTeacher || false
            });
          }
        }
      }
    });
    
    return scores;
  };

  const value = {
    currentUser,
    students,
    teachers,
    assessments,
    submissions,
    loading,
    teacherPasswords,
    login,
    logout,
    createStudent,
    deleteStudent,
    addTeacher,
    createTeacher,
    deleteTeacher,
    createAssessment,
    updateAssessment,
    getTeacherAssessments,
    getStudentAssessments,
    getSuperTeacherAssessments,
    submitAssessment,
    getSubmission,
    getAssessmentSubmissions,
    awardMarks,
    getAssessmentById,
    getAllAssessments,
    getAllSubmissions,
    getAllStudents,
    canStudentTakeAssessment,
    isAssessmentActive,
    deleteAssessment,
    reassignStudents,
    toggleSuperTeacher,
    hasSuperTeacher,
    getSuperTeacher,
    getStudentScores,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
