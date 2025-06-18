import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';

const LoaderIcon = () => (
  <svg className="animate-spin h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const defaultPythonFunction = `def grade_answer(student_answer, correct_answer):
    """
    Implement your grading logic here.
    Args:
        student_answer: The answer provided by the student
        correct_answer: The correct answer to compare against
    Returns:
        float: Score between 0 and 1
    """
    # Your grading logic here
    return "LOW"  # Replace with actual scoring logic
`;

const QuestionnaireView = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [groupedQuestions, setGroupedQuestions] = useState({});
  const [openRubrics, setOpenRubrics] = useState({});
  const [rubricCodes, setRubricCodes] = useState({});
  const [editorLoading, setEditorLoading] = useState(true);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:5000/questionnaire/${id}/questions`, {
          credentials: 'include'
        });
        if (!response.ok) {
          throw new Error('Failed to fetch questions');
        }
        const data = await response.json();
        
        const grouped = data.reduce((acc, question) => {
          const tag = question.tags || 'Untagged';
          if (!acc[tag]) {
            acc[tag] = [];
          }
          acc[tag].push(question);
          return acc;
        }, {});
        
        setGroupedQuestions(grouped);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchQuestions();
    }
  }, [id]);

  const handleBack = () => {
    navigate('/questionnaires');
  };

  const toggleRubric = (tag) => {
    setOpenRubrics(prev => {
      const newState = {
        ...prev,
        [tag]: !prev[tag]
      };
      
      // Initialize code with template if opening for the first time
      if (newState[tag] && !rubricCodes[tag]) {
        setRubricCodes(prev => ({
          ...prev,
          [tag]: defaultPythonFunction
        }));
      }
      
      return newState;
    });
  };

  const handleEditorChange = (tag, value) => {
    setRubricCodes(prev => ({
      ...prev,
      [tag]: value
    }));
  };

  const handleSaveRubric = async (tag) => {
    try {
      const response = await fetch(`http://localhost:5000/questionnaire/${id}/tag/${tag}/rubric`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          rubric: rubricCodes[tag]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save rubric');
      }

      // Close the rubric input after saving
      toggleRubric(tag);
    } catch (error) {
      console.error('Error saving rubric:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <LoaderIcon />
          <p className="text-gray-600 mt-4">Loading questions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg max-w-2xl w-full">
          <p className="text-red-700 font-medium">Error loading questions</p>
          <p className="text-red-600 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (Object.keys(groupedQuestions).length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500 bg-white p-6 rounded-lg shadow-sm">
          No questions found
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={handleBack}
          className="px-3 py-1 text-sm font-medium hover:text-blue-700 focus:outline-none border border-blue-200 rounded-md hover:bg-blue-50"
        >
          ← Back to Questionnaires
        </button>

        <div className="space-y-8">
          {Object.entries(groupedQuestions).map(([tag, questions]) => (
            <div key={tag} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200 bg-gray-50">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">
                      {tag}
                    </h2>
                    <div className="flex items-center gap-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        {questions.length} questions
                      </span>
                      <button
                        onClick={() => toggleRubric(tag)}
                        className="px-3 py-1 text-sm font-medium hover:text-blue-700 focus:outline-none border border-blue-200 rounded-md hover:bg-blue-50"
                      >
                        {openRubrics[tag] ? 'Cancel' : 'Add Rubric'}
                      </button>
                    </div>
                  </div>
                  
                  {openRubrics[tag] && (
                    <div className="space-y-2">
                      <div className="border rounded-md overflow-hidden" style={{ height: '400px' }}>
                        <Editor
                          height="400px"
                          defaultLanguage="python"
                          value={rubricCodes[tag] || defaultPythonFunction}
                          onChange={(value) => handleEditorChange(tag, value)}
                          theme="vs-dark"
                          options={{
                            minimap: { enabled: false },
                            fontSize: 14,
                            lineNumbers: 'on',
                            rulers: [80],
                            scrollBeyondLastLine: false,
                            automaticLayout: true
                          }}
                          loading={
                            <div className="flex items-center justify-center h-full bg-gray-800">
                              <LoaderIcon />
                            </div>
                          }
                        />
                      </div>
                      <button
                        onClick={() => handleSaveRubric(tag)}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Save Rubric
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <ul className="divide-y divide-gray-200">
                {questions.map((question, index) => (
                  <li key={question._id} className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-medium text-gray-900">
                            {question.question_text}
                          </h3>
                          <span className="text-xs text-gray-500">
                            {new Date(question.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        
                        {question.options && question.options.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {question.options.map((option, optIndex) => (
                              <div
                                key={optIndex}
                                className="flex items-center p-2 rounded-md bg-gray-50"
                              >
                                <span className="w-6 text-center text-sm text-gray-500">
                                  {String.fromCharCode(65 + optIndex)}
                                </span>
                                <div className="ml-2 flex-1">
                                  <span className="text-sm text-gray-700">
                                    {option.text}
                                  </span>
                                  {option.image && (
                                    <img
                                      src={option.image}
                                      alt={`Option ${String.fromCharCode(65 + optIndex)}`}
                                      className="mt-2 rounded-md max-h-32 object-contain"
                                    />
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {question.question_image && (
                          <div className="mt-3">
                            <img
                              src={question.question_image}
                              alt="Question"
                              className="rounded-lg max-h-48 object-cover"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuestionnaireView;