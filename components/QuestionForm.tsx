import React, { useState } from 'react';
import Button from './Button';

interface Option {
  text: string;
  isCorrect: boolean;
}

interface QuestionFormProps {
  initialQuestion?: {
    id?: string;
    text: string;
    options: Option[];
  };
  onSubmit: (question: {
    id?: string;
    text: string;
    options: Option[];
  }) => void;
  onCancel: () => void;
}

const QuestionForm: React.FC<QuestionFormProps> = ({
  initialQuestion,
  onSubmit,
  onCancel,
}) => {
  const [questionText, setQuestionText] = useState(initialQuestion?.text || '');
  const [options, setOptions] = useState<Option[]>(
    initialQuestion?.options || [
      { text: '', isCorrect: true },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
    ]
  );
  const [error, setError] = useState('');

  const handleOptionTextChange = (index: number, text: string) => {
    const updatedOptions = [...options];
    updatedOptions[index].text = text;
    setOptions(updatedOptions);
  };

  const handleCorrectOptionChange = (index: number) => {
    const updatedOptions = options.map((option, i) => ({
      ...option,
      isCorrect: i === index,
    }));
    setOptions(updatedOptions);
  };

  const addOption = () => {
    if (options.length < 6) {
      setOptions([...options, { text: '', isCorrect: false }]);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = [...options];
      newOptions.splice(index, 1);
      
      // If we're removing the correct option, set the first option as correct
      if (options[index].isCorrect && newOptions.length > 0) {
        newOptions[0].isCorrect = true;
      }
      
      setOptions(newOptions);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!questionText.trim()) {
      setError('Question text is required');
      return;
    }
    
    const emptyOptions = options.some(option => !option.text.trim());
    if (emptyOptions) {
      setError('All options must have text');
      return;
    }
    
    if (!options.some(option => option.isCorrect)) {
      setError('One option must be marked as correct');
      return;
    }
    
    // Submit the question
    onSubmit({
      id: initialQuestion?.id,
      text: questionText,
      options,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-bold mb-4">
        {initialQuestion ? 'Edit Question' : 'Add New Question'}
      </h3>
      
      {error && (
        <div className="alert alert-error mb-4">
          {error}
        </div>
      )}
      
      <div className="form-group">
        <label htmlFor="question-text" className="font-medium">
          Question Text
        </label>
        <textarea
          id="question-text"
          className="form-control"
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          placeholder="Enter the question"
          rows={3}
          required
        />
      </div>
      
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <label className="font-medium">Options</label>
          {options.length < 6 && (
            <button
              type="button"
              className="text-primary-color text-sm"
              onClick={addOption}
            >
              + Add Option
            </button>
          )}
        </div>
        
        {options.map((option, index) => (
          <div key={index} className="flex items-center mb-2">
            <input
              type="radio"
              name="correct-option"
              className="mr-2"
              checked={option.isCorrect}
              onChange={() => handleCorrectOptionChange(index)}
            />
            <input
              type="text"
              className="form-control flex-grow"
              value={option.text}
              onChange={(e) => handleOptionTextChange(index, e.target.value)}
              placeholder={`Option ${index + 1}`}
              required
            />
            {options.length > 2 && (
              <button
                type="button"
                className="ml-2 text-red-500"
                onClick={() => removeOption(index)}
              >
                ✕
              </button>
            )}
          </div>
        ))}
        <div className="text-sm text-gray-500 mt-1">
          Select the radio button next to the correct option
        </div>
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button type="submit" variant="primary">
          {initialQuestion ? 'Update Question' : 'Add Question'}
        </Button>
      </div>
    </form>
  );
};

export default QuestionForm;
