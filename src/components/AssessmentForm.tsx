import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, GripVertical, Check } from 'lucide-react';
import { toast } from 'sonner';
import { format, parse } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

type QuestionType = {
  id?: string;
  text: string;
  options?: string[];
  correctAnswer?: string;
  marks: number;
  type: 'text' | 'multiple-choice';
};

type AssessmentFormProps = {
  onSubmit: (
    title: string,
    description: string,
    startDate: string,
    startTime: string,
    dueDate: string,
    dueTime: string,
    questions: QuestionType[]
  ) => Promise<void>;
  onCancel: () => void;
  initialData?: any;
};

const AssessmentForm: React.FC<AssessmentFormProps> = ({ onSubmit, onCancel, initialData }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState('09:00');
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [dueTime, setDueTime] = useState('23:59');
  const [questions, setQuestions] = useState<QuestionType[]>([
    { text: '', type: 'text', marks: 1 }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description || '');
      
      if (initialData.startDate) {
        setStartDate(parse(initialData.startDate, 'yyyy-MM-dd', new Date()));
      }
      
      if (initialData.dueDate) {
        setDueDate(parse(initialData.dueDate, 'yyyy-MM-dd', new Date()));
      }
      
      setStartTime(initialData.startTime || '09:00');
      setDueTime(initialData.dueTime || '23:59');
      
      if (initialData.questions && initialData.questions.length > 0) {
        setQuestions(initialData.questions);
      }
    } else {
      setTitle('');
      setDescription('');
      setStartDate(undefined);
      setStartTime('09:00');
      setDueDate(undefined);
      setDueTime('23:59');
      setQuestions([{ text: '', type: 'text', marks: 1 }]);
    }
  }, [initialData]);

  const addQuestion = () => {
    setQuestions([...questions, { text: '', type: 'text', marks: 1 }]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      const newQuestions = [...questions];
      newQuestions.splice(index, 1);
      setQuestions(newQuestions);
    } else {
      toast.error('Assessment must have at least one question');
    }
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const newQuestions = [...questions];
    
    if (field === 'type') {
      if (value === 'multiple-choice') {
        newQuestions[index] = {
          ...newQuestions[index],
          [field]: value,
          options: ['Option 1', 'Option 2', 'Option 3'],
          correctAnswer: 'Option 1'
        };
      } else {
        const { options, correctAnswer, ...rest } = newQuestions[index];
        newQuestions[index] = {
          ...rest,
          [field]: value
        };
      }
    } else {
      newQuestions[index] = {
        ...newQuestions[index],
        [field]: value
      };
    }
    
    setQuestions(newQuestions);
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const newQuestions = [...questions];
    if (newQuestions[questionIndex].options) {
      const newOptions = [...(newQuestions[questionIndex].options || [])];
      newOptions[optionIndex] = value;
      newQuestions[questionIndex].options = newOptions;
      
      if (newQuestions[questionIndex].correctAnswer === questions[questionIndex].options?.[optionIndex]) {
        newQuestions[questionIndex].correctAnswer = value;
      }
      
      setQuestions(newQuestions);
    }
  };

  const addOption = (questionIndex: number) => {
    const newQuestions = [...questions];
    if (newQuestions[questionIndex].options) {
      newQuestions[questionIndex].options = [
        ...(newQuestions[questionIndex].options || []),
        `Option ${(newQuestions[questionIndex].options?.length || 0) + 1}`
      ];
      setQuestions(newQuestions);
    }
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const newQuestions = [...questions];
    if (newQuestions[questionIndex].options && newQuestions[questionIndex].options?.length > 2) {
      const newOptions = [...(newQuestions[questionIndex].options || [])];
      
      if (newQuestions[questionIndex].correctAnswer === questions[questionIndex].options?.[optionIndex]) {
        const remainingOptions = newOptions.filter((_, idx) => idx !== optionIndex);
        newQuestions[questionIndex].correctAnswer = remainingOptions[0];
      }
      
      newOptions.splice(optionIndex, 1);
      newQuestions[questionIndex].options = newOptions;
      
      setQuestions(newQuestions);
    } else {
      toast.error('Multiple choice questions must have at least 2 options');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    
    if (!startDate) {
      toast.error('Start date is required');
      return;
    }
    
    if (!dueDate) {
      toast.error('Due date is required');
      return;
    }
    
    const startDateTime = new Date(`${format(startDate, 'yyyy-MM-dd')}T${startTime}`);
    const dueDateTime = new Date(`${format(dueDate, 'yyyy-MM-dd')}T${dueTime}`);
    
    if (dueDateTime <= startDateTime) {
      toast.error('Due date must be after start date');
      return;
    }
    
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) {
        toast.error(`Question ${i + 1} text is required`);
        return;
      }
      
      if (q.type === 'multiple-choice') {
        const optionSet = new Set(q.options);
        if (optionSet.size !== q.options?.length) {
          toast.error(`Question ${i + 1} has duplicate options`);
          return;
        }
        
        if (q.options?.some(opt => !opt.trim())) {
          toast.error(`Question ${i + 1} has empty options`);
          return;
        }
        
        if (!q.correctAnswer || !q.options?.includes(q.correctAnswer)) {
          toast.error(`Question ${i + 1} doesn't have a valid correct answer`);
          return;
        }
      }
    }
    
    setIsSubmitting(true);
    
    try {
      await onSubmit(
        title,
        description,
        format(startDate, 'yyyy-MM-dd'),
        startTime,
        format(dueDate, 'yyyy-MM-dd'),
        dueTime,
        questions
      );
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-1">
            Assessment Title
          </label>
          <Input
            id="title"
            placeholder="Enter assessment title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        
        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-1">
            Description
          </label>
          <Textarea
            id="description"
            placeholder="Enter assessment description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div>
            <label htmlFor="startTime" className="block text-sm font-medium mb-1">
              Start Time
            </label>
            <Input
              id="startTime"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Due Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dueDate && "text-muted-foreground"
                  )}
                >
                  {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div>
            <label htmlFor="dueTime" className="block text-sm font-medium mb-1">
              Due Time
            </label>
            <Input
              id="dueTime"
              type="time"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
            />
          </div>
        </div>
      </div>
      
      <Separator />
      
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Questions</h3>
        </div>
        
        <div className="space-y-6">
          {questions.map((question, qIndex) => (
            <div key={qIndex} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  <GripVertical className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="font-medium">Question {qIndex + 1}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={question.type === 'multiple-choice' ? 'secondary' : 'outline'}>
                    {question.type === 'multiple-choice' ? 'Multiple Choice' : 'Text Answer'}
                  </Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeQuestion(qIndex)}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor={`question-${qIndex}`} className="block text-sm font-medium mb-1">
                    Question Text
                  </label>
                  <Textarea
                    id={`question-${qIndex}`}
                    placeholder="Enter your question"
                    value={question.text}
                    onChange={(e) => updateQuestion(qIndex, 'text', e.target.value)}
                    rows={2}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor={`question-${qIndex}-type`} className="block text-sm font-medium mb-1">
                      Question Type
                    </label>
                    <Select
                      value={question.type}
                      onValueChange={(value) => updateQuestion(qIndex, 'type', value)}
                    >
                      <SelectTrigger id={`question-${qIndex}-type`}>
                        <SelectValue placeholder="Select question type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text Answer</SelectItem>
                        <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label htmlFor={`question-${qIndex}-marks`} className="block text-sm font-medium mb-1">
                      Marks
                    </label>
                    <Input
                      id={`question-${qIndex}-marks`}
                      type="number"
                      min="1"
                      value={question.marks}
                      onChange={(e) => updateQuestion(qIndex, 'marks', parseInt(e.target.value) || 1)}
                    />
                  </div>
                </div>
                
                {question.type === 'multiple-choice' && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium">Options</label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addOption(qIndex)}
                        className="h-8"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Option
                      </Button>
                    </div>
                    
                    {question.options?.map((option, oIndex) => (
                      <div key={oIndex} className="flex items-center space-x-2 mb-2">
                        <div className="flex-1 flex items-center space-x-2">
                          <Input
                            value={option}
                            onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                            placeholder={`Option ${oIndex + 1}`}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeOption(qIndex, oIndex)}
                            className="h-8 w-8 p-0"
                            disabled={question.options?.length <= 2}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="radio"
                            id={`correct-${qIndex}-${oIndex}`}
                            name={`correct-${qIndex}`}
                            checked={question.correctAnswer === option}
                            onChange={() => updateQuestion(qIndex, 'correctAnswer', option)}
                            className="h-4 w-4 text-blue-500"
                          />
                          <label
                            htmlFor={`correct-${qIndex}-${oIndex}`}
                            className="ml-2 text-sm font-medium text-gray-700"
                          >
                            Correct
                          </label>
                        </div>
                      </div>
                    ))}
                    
                    <div className="mt-2 p-3 bg-blue-50 rounded-md">
                      <div className="flex items-center mb-1">
                        <Check className="h-4 w-4 text-blue-500 mr-2" />
                        <span className="text-sm font-medium text-blue-700">Correct Answer</span>
                      </div>
                      <p className="text-sm text-blue-600">
                        {question.correctAnswer || 'Select the correct answer by clicking the radio button'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          <Button
            type="button"
            variant="outline"
            onClick={addQuestion}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Question
          </Button>
        </div>
      </div>
      
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting 
            ? (initialData ? 'Updating Assessment...' : 'Creating Assessment...')
            : (initialData ? 'Update Assessment' : 'Create Assessment')}
        </Button>
      </div>
    </form>
  );
};

export { AssessmentForm };
