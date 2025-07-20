
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Navigate, Link } from 'react-router-dom';
import { UserPlus, ArrowLeft, Crown } from 'lucide-react';
import PageTransition from '@/components/PageTransition';
import { toast } from '@/hooks/use-toast';
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const departments = [
  "IT", "CSE", "AI&DS", "ECE", "AGRI", "EEE", "MECH", "CIVIL", "R&A"
] as const;

const teacherSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  department: z.enum(departments, {
    required_error: "Please select a department",
  }),
  isSuperTeacher: z.boolean().default(false)
});

type TeacherFormValues = z.infer<typeof teacherSchema>;

const CreateTeacher = () => {
  const { currentUser, createTeacher, hasSuperTeacher } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingSuperTeacher] = useState<boolean>(hasSuperTeacher());
  
  // Use react-hook-form with zod validation
  const form = useForm<TeacherFormValues>({
    resolver: zodResolver(teacherSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      department: undefined,
      isSuperTeacher: false
    }
  });
  
  if (!currentUser || currentUser.role !== 'admin') {
    return <Navigate to="/unauthorized" />;
  }
  
  const onSubmit = async (data: TeacherFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Email will be converted to lowercase in the createTeacher function
      await createTeacher(data.name, data.email, data.password, data.department, data.isSuperTeacher);
      toast.success(`Teacher ${data.name} created successfully${data.isSuperTeacher ? ' as Super Teacher' : ''}`);
      
      // Navigate back to admin dashboard to see the newly created teacher
      navigate('/admin-dashboard');
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to create teacher');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <PageTransition>
      <div className="container mx-auto p-4 max-w-lg">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild className="mb-6">
            <Link to="/admin-dashboard" className="flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
            </Link>
          </Button>
          
          <div className="flex items-center mb-4">
            <UserPlus className="h-8 w-8 text-primary mr-3" />
            <div>
              <h1 className="text-2xl font-bold">Create New Teacher</h1>
              <p className="text-gray-500">Add a new teacher to the system</p>
            </div>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Teacher Information</CardTitle>
            <CardDescription>
              Enter the details for the new teacher. They will use these credentials to log in.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Teacher name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="teacher@example.com" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        This email will be used as the login ID
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select the department this teacher belongs to
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="Minimum 6 characters" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Create a secure password for the teacher
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="isSuperTeacher"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={existingSuperTeacher}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          <div className="flex items-center gap-2">
                            <span>Super Teacher</span>
                            <Crown className="h-4 w-4 text-amber-500" />
                          </div>
                        </FormLabel>
                        <FormDescription>
                          {existingSuperTeacher 
                            ? "There is already a Super Teacher. Only one Super Teacher can exist in the system."
                            : "Super Teachers can create assessments for all students across different teachers."}
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                
                <div className="pt-4">
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating Teacher...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <UserPlus className="mr-2 h-4 w-4" /> Create Teacher
                      </span>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
};

export default CreateTeacher;
