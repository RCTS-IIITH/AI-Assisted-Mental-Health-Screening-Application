import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './SubQuestionnaire.css';

const LoaderIcon = () => (
  <svg className="animate-spin h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const SubQuestionnaireView = () => {
  const navigate = useNavigate();
  const { id, tag } = useParams(); // Get questionnaire ID and tag from URL params
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/question_by_tag', {
          method: 'POST', // Changed to POST
          headers: {
            'Content-Type': 'application/json', // Specify JSON content type
          },
          credentials: 'include', // Include cookies if necessary
          body: JSON.stringify({ questionnaire_id: id, tag }), // Send id and tag in request body
        });
  
        if (!response.ok) {
          throw new Error('Failed to fetch questions');
        }
  
        const data = await response.json();
        setQuestions(data.questions); // Assuming the API returns questions for the tag
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
  
    if (id && tag) {
      fetchQuestions();
    }
  }, [id, tag]); // Reload questions whenever ID or tag changes

  const handleBack = () => {
    navigate(`/questionnaire/${id}`);  // Navigate back to the main questionnaire page
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

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500 bg-white p-6 rounded-lg shadow-sm">
          No questions found for the tag "{tag}"
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={handleBack}
          className="mb-6 inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          ← Back to Questionnaire
        </button>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Questions for "{tag}" tag
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {questions.map((question, index) => (
            <div 
              key={question._id} 
              className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className="bg-gray-50 border-b border-gray-100 p-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-800">
                    Question {index + 1}
                  </h2>
                  <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                    {question.type}
                  </span>
                </div>
              </div>

              <ul className="divide-y divide-gray-100">
                <li 
                  key={question._id} 
                  className="p-4 hover:bg-gray-50 transition-colors duration-150"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm flex items-center justify-center font-medium">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 break-words">
                        {question.question_text}
                      </p>
                      <span className="mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {question.type}
                      </span>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SubQuestionnaireView;