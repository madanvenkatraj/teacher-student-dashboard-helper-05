
import React, { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowDown, ArrowUp, Filter, Crown, User, Users, CalendarIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useParams } from 'react-router-dom';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, isAfter, isBefore, isEqual } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';

type SortDirection = 'asc' | 'desc';
type TeacherType = 'all' | 'super' | 'normal';

// Define the department options as a constant
const DEPARTMENT_OPTIONS = [
  'IT',
  'CSE',
  'AI&DS',
  'ECE',
  'EEE',
  'MECH',
  'AGRI',
  'CIVIL',
  'R&D'
];

type ScoreSectionProps = {
  assessmentId?: string;
};

const ScoreSection = ({ assessmentId }: ScoreSectionProps) => {
  // Removing getAssessments from the context destructuring since it doesn't exist in the type
  const { getStudentScores, teachers, getAssessmentById, currentUser } = useAuth();
  const [departmentFilter, setDepartmentFilter] = useState<string | null>(null);
  const [marksSortDirection, setMarksSortDirection] = useState<SortDirection>('desc');
  const [teacherTypeFilter, setTeacherTypeFilter] = useState<TeacherType>('all');
  const [dateFilter, setDateFilter] = useState<Date | null>(null);
  const [dateFilterType, setDateFilterType] = useState<'before' | 'after' | 'on'>('on');
  
  const allScores = getStudentScores();
  
  // Since getAssessments doesn't exist in the context, we'll extract assessment data from scores
  const allAssessments = useMemo(() => {
    const assessmentsMap = new Map();
    
    allScores.forEach(score => {
      if (score.assessmentId && !assessmentsMap.has(score.assessmentId)) {
        // Get full assessment details
        const assessment = getAssessmentById(score.assessmentId);
        if (assessment) {
          assessmentsMap.set(score.assessmentId, assessment);
        }
      }
    });
    
    return Array.from(assessmentsMap.values());
  }, [allScores, getAssessmentById]);
  
  // Apply filters and sorting
  const filteredScores = useMemo(() => {
    let filtered = [...allScores];
    
    // If assessmentId is provided, only show scores for that assessment
    if (assessmentId) {
      filtered = filtered.filter(score => score.assessmentId === assessmentId);
    } else {
      // Filter based on teacher type (Super Teacher or Normal Teacher)
      if (teacherTypeFilter === 'super') {
        // Show only Super Teacher assessments
        filtered = filtered.filter(score => score.createdBySuperTeacher === true);
      } else if (teacherTypeFilter === 'normal') {
        // Show only normal teacher assessments
        filtered = filtered.filter(score => score.createdBySuperTeacher !== true);
      }
      // 'all' doesn't need filtering as it shows everything
    }
    
    // Filter by department if needed
    if (departmentFilter && departmentFilter !== 'all') {
      filtered = filtered.filter(score => score.department === departmentFilter);
    }
    
    // Filter by date if needed
    if (dateFilter) {
      filtered = filtered.filter(score => {
        // Find assessment in extracted assessments data
        const assessment = allAssessments.find(a => a.id === score.assessmentId);
        if (!assessment || !assessment.dueDate || !assessment.dueTime) return false;
        
        const assessmentDate = new Date(`${assessment.dueDate}T${assessment.dueTime}`);
        
        if (dateFilterType === 'before') {
          return isBefore(assessmentDate, dateFilter);
        } else if (dateFilterType === 'after') {
          return isAfter(assessmentDate, dateFilter);
        } else { // 'on'
          // Compare only dates, not times
          const filterDateOnly = new Date(dateFilter.getFullYear(), dateFilter.getMonth(), dateFilter.getDate());
          const assessmentDateOnly = new Date(assessmentDate.getFullYear(), assessmentDate.getMonth(), assessmentDate.getDate());
          return isEqual(assessmentDateOnly, filterDateOnly);
        }
      });
    }
    
    // Sort by marks
    filtered.sort((a, b) => {
      const aPercentage = (a.marksAwarded / a.totalMarks) * 100;
      const bPercentage = (b.marksAwarded / b.totalMarks) * 100;
      
      return marksSortDirection === 'asc' 
        ? aPercentage - bPercentage 
        : bPercentage - aPercentage;
    });
    
    return filtered;
  }, [allScores, departmentFilter, marksSortDirection, teacherTypeFilter, dateFilter, dateFilterType, assessmentId, allAssessments]);
  
  // Toggle marks sorting
  const toggleSortDirection = () => {
    setMarksSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };
  
  // Reset all filters
  const resetFilters = () => {
    setDepartmentFilter(null);
    setMarksSortDirection('desc');
    setTeacherTypeFilter('all');
    setDateFilter(null);
    setDateFilterType('on');
  };
  
  // Get assessment details if assessmentId is provided
  const assessment = assessmentId ? getAssessmentById(assessmentId) : null;
  
  // Check if we're in the admin dashboard
  const isAdmin = currentUser?.role === 'admin';
  
  return (
    <div>
      {assessment && (
        <div className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">{assessment.title}</h2>
          <p className="text-gray-500 mb-4">{assessment.description}</p>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="bg-gray-50">
              {assessment.questions.length} Questions
            </Badge>
            {assessment.createdBySuperTeacher && (
              <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200">
                <Crown className="h-3 w-3 mr-1 text-amber-500" /> Super Teacher Assessment
              </Badge>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <div className="flex items-center">
          <Filter className="mr-2 h-4 w-4" />
          <span className="mr-2">Filters:</span>
        </div>
        
        {/* Department Filter */}
        <Select 
          value={departmentFilter || "all"} 
          onValueChange={(value) => setDepartmentFilter(value === "all" ? null : value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {DEPARTMENT_OPTIONS.map(dept => (
              <SelectItem key={dept} value={dept}>{dept}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* Teacher Type Filter */}
        <ToggleGroup type="single" value={teacherTypeFilter} onValueChange={(value: TeacherType) => {
          if (value) { // Prevent deselection
            setTeacherTypeFilter(value);
          }
        }} className="ml-2">
          <ToggleGroupItem value="all" aria-label="All Teachers" className="flex items-center gap-1">
            <Users className="h-4 w-4" /> All Teachers
          </ToggleGroupItem>
          <ToggleGroupItem value="super" aria-label="Super Teacher" className="flex items-center gap-1">
            <Crown className="h-4 w-4" /> Super Teacher
          </ToggleGroupItem>
          <ToggleGroupItem value="normal" aria-label="Normal Teachers" className="flex items-center gap-1">
            <User className="h-4 w-4" /> Normal Teachers
          </ToggleGroupItem>
        </ToggleGroup>
        
        {/* Date Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex items-center gap-1">
              <CalendarIcon className="h-4 w-4 mr-1" />
              {dateFilter ? (
                `${dateFilterType === 'before' ? 'Before' : dateFilterType === 'after' ? 'After' : 'On'} ${format(dateFilter, 'PP')}`
              ) : (
                'Due Date Filter'
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-4" align="start">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Filter by Due Date</h4>
                <Select 
                  value={dateFilterType} 
                  onValueChange={(v: 'before' | 'after' | 'on') => setDateFilterType(v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select filter type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="before">Before</SelectItem>
                    <SelectItem value="on">On</SelectItem>
                    <SelectItem value="after">After</SelectItem>
                  </SelectContent>
                </Select>
                <div className="pt-2">
                  <Calendar
                    mode="single"
                    selected={dateFilter || undefined}
                    onSelect={setDateFilter}
                    className="pointer-events-auto"
                  />
                </div>
              </div>
              <div className="flex justify-between">
                <Button variant="outline" size="sm" onClick={() => setDateFilter(null)}>
                  Clear
                </Button>
                <Button size="sm" onClick={() => document.body.click()}>
                  Apply
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        
        {/* Marks Sorting */}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={toggleSortDirection}
          className="flex items-center gap-1"
        >
          {marksSortDirection === 'desc' ? (
            <>
              <ArrowDown className="h-4 w-4" /> Marks High to Low
            </>
          ) : (
            <>
              <ArrowUp className="h-4 w-4" /> Marks Low to High
            </>
          )}
        </Button>
        
        {/* Reset Filters */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={resetFilters}
          className="ml-auto"
        >
          Reset Filters
        </Button>
      </div>
      
      {filteredScores.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Teacher</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Assessment</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Percentage</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredScores.map((score, index) => {
              const percentage = Math.round((score.marksAwarded / score.totalMarks) * 100);
              const assessmentDetails = allAssessments.find(a => a.id === score.assessmentId);
              const dueDate = assessmentDetails && assessmentDetails.dueDate && assessmentDetails.dueTime ? 
                format(new Date(`${assessmentDetails.dueDate}T${assessmentDetails.dueTime}`), 'PPP') : 
                'Not set';
              
              return (
                <TableRow key={`${score.studentId}-${score.assessmentId}-${index}`}>
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      {score.teacherName}
                      {teachers.find(t => t.id === score.teacherId)?.isSuperTeacher && (
                        <Badge variant="outline" className="ml-2 flex items-center gap-1">
                          <Crown className="h-3 w-3 text-amber-500" />
                          <span className="text-xs">Super</span>
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{score.department || 'Not assigned'}</TableCell>
                  <TableCell>{score.studentName}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {score.assessmentTitle}
                      {score.createdBySuperTeacher && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Crown className="h-3 w-3 text-amber-500" />
                          <span className="text-xs">Super</span>
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{dueDate}</TableCell>
                  <TableCell>{score.marksAwarded} / {score.totalMarks}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <span className={`font-medium ${
                        percentage >= 70 ? 'text-green-600' :
                        percentage >= 40 ? 'text-amber-600' :
                        'text-red-600'
                      }`}>
                        {percentage}%
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          {allScores.length === 0 ? (
            "No scores available yet. Students need to complete assessments to see scores here."
          ) : (
            "No scores match the current filters. Try adjusting your filters."
          )}
        </div>
      )}
    </div>
  );
};

export default ScoreSection;
