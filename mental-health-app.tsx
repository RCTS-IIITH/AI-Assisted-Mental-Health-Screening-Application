import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, ArrowRight, ChevronLeft, Home, BarChart4 } from 'lucide-react';

export default function MentalHealthScreening() {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [responses, setResponses] = useState({});
  const [result, setResult] = useState(null);
  const [formProgress, setFormProgress] = useState(0);

  // Questionnaire sections with multiple types of questions
  const questionnaires = {
    depression: {
      title: "Depression Screening",
      description: "This screens for symptoms of depression over the past 2 weeks.",
      questions: [
        {
          id: "dep1",
          text: "Little interest or pleasure in doing things?",
          type: "frequency",
        },
        {
          id: "dep2",
          text: "Feeling down, depressed, or hopeless?",
          type: "frequency",
        },
        {
          id: "dep3",
          text: "Trouble falling or staying asleep, or sleeping too much?",
          type: "frequency",
        },
        {
          id: "dep4", 
          text: "Feeling tired or having little energy?",
          type: "frequency",
        },
        {
          id: "dep5",
          text: "How would you rate your current mood?",
          type: "slider",
        }
      ]
    },
    anxiety: {
      title: "Anxiety Screening",
      description: "This screens for symptoms of anxiety over the past 2 weeks.",
      questions: [
        {
          id: "anx1",
          text: "Feeling nervous, anxious, or on edge?",
          type: "frequency",
        },
        {
          id: "anx2",
          text: "Not being able to stop or control worrying?",
          type: "frequency",
        },
        {
          id: "anx3",
          text: "Worrying too much about different things?",
          type: "frequency",
        },
        {
          id: "anx4",
          text: "Trouble relaxing?",
          type: "frequency",
        },
        {
          id: "anx5",
          text: "How would you rate your anxiety level today?",
          type: "slider",
        }
      ]
    },
    wellbeing: {
      title: "General Wellbeing",
      description: "These questions assess your overall mental wellbeing.",
      questions: [
        {
          id: "wb1",
          text: "I've been feeling optimistic about the future",
          type: "agreement",
        },
        {
          id: "wb2",
          text: "I've been feeling useful",
          type: "agreement",
        },
        {
          id: "wb3",
          text: "I've been dealing with problems well",
          type: "agreement",
        },
        {
          id: "wb4",
          text: "Which areas of your life do you find most stressful? (Select all that apply)",
          type: "multiselect",
          options: ["Work", "Family", "Relationships", "Finances", "Health", "Studies", "Other"]
        }
      ]
    }
  };

  // Keep track of the active questionnaire
  const [activeQuestionnaire, setActiveQuestionnaire] = useState('depression');
  
  // Calculate total number of questions for progress bar
  const totalQuestions = Object.values(questionnaires).reduce(
    (sum, section) => sum + section.questions.length, 0
  );

  // Handle user input for different question types
  const handleResponse = (questionId, value) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
    
    // Update progress
    const answeredQuestions = Object.keys(responses).length + 1;
    setFormProgress(Math.round((answeredQuestions / totalQuestions) * 100));
  };

  // Handle form submission and calculate results
  const calculateResults = () => {
    // Calculate depression score (example algorithm)
    const depressionScore = questionnaires.depression.questions
      .filter(q => q.type === "frequency")
      .reduce((score, q) => {
        const value = responses[q.id] || 0;
        return score + value;
      }, 0);
      
    // Calculate anxiety score (example algorithm)  
    const anxietyScore = questionnaires.anxiety.questions
      .filter(q => q.type === "frequency")
      .reduce((score, q) => {
        const value = responses[q.id] || 0;
        return score + value;
      }, 0);
    
    // Calculate wellbeing score (example algorithm)
    const wellbeingScore = questionnaires.wellbeing.questions
      .filter(q => q.type === "agreement")
      .reduce((score, q) => {
        const value = responses[q.id] || 0;
        return score + value;
      }, 0);

    // Determine risk levels
    const getLevel = (score, max, isWellbeing = false) => {
      const percentage = score / max;
      if (isWellbeing) {
        if (percentage >= 0.8) return "High";
        if (percentage >= 0.5) return "Moderate";
        return "Low";
      } else {
        if (percentage >= 0.7) return "High";
        if (percentage >= 0.4) return "Moderate";
        return "Low";
      }
    };

    const depressionLevel = getLevel(depressionScore, questionnaires.depression.questions.filter(q => q.type === "frequency").length * 3);
    const anxietyLevel = getLevel(anxietyScore, questionnaires.anxiety.questions.filter(q => q.type === "frequency").length * 3);
    const wellbeingLevel = getLevel(wellbeingScore, questionnaires.wellbeing.questions.filter(q => q.type === "agreement").length * 4, true);

    const results = {
      depression: {
        score: depressionScore,
        level: depressionLevel
      },
      anxiety: {
        score: anxietyScore,
        level: anxietyLevel
      },
      wellbeing: {
        score: wellbeingScore,
        level: wellbeingLevel
      },
      stressors: responses.wb4 || []
    };

    setResult(results);
    setCurrentScreen('results');
  };

  // Navigate between questionnaires
  const navigateNext = () => {
    if (activeQuestionnaire === 'depression') {
      setActiveQuestionnaire('anxiety');
    } else if (activeQuestionnaire === 'anxiety') {
      setActiveQuestionnaire('wellbeing');
    } else if (activeQuestionnaire === 'wellbeing') {
      calculateResults();
    }
  };

  const navigatePrevious = () => {
    if (activeQuestionnaire === 'anxiety') {
      setActiveQuestionnaire('depression');
    } else if (activeQuestionnaire === 'wellbeing') {
      setActiveQuestionnaire('anxiety');
    }
  };

  // Frequency answer component
  const FrequencyQuestion = ({ question }) => (
    <div className="mb-6">
      <p className="mb-2 font-medium">{question.text}</p>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
        {['Not at all', 'Several days', 'More than half the days', 'Nearly every day'].map((option, index) => (
          <button
            key={index}
            className={`p-3 border rounded-lg text-sm transition-colors ${
              responses[question.id] === index ? 'bg-blue-500 text-white border-blue-600' : 'bg-white hover:bg-gray-50 border-gray-200'
            }`}
            onClick={() => handleResponse(question.id, index)}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );

  // Agreement answer component
  const AgreementQuestion = ({ question }) => (
    <div className="mb-6">
      <p className="mb-2 font-medium">{question.text}</p>
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
        {['None of the time', 'Rarely', 'Some of the time', 'Often', 'All of the time'].map((option, index) => (
          <button
            key={index}
            className={`p-3 border rounded-lg text-sm transition-colors ${
              responses[question.id] === index ? 'bg-blue-500 text-white border-blue-600' : 'bg-white hover:bg-gray-50 border-gray-200'
            }`}
            onClick={() => handleResponse(question.id, index)}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );

  // Slider question component
  const SliderQuestion = ({ question }) => (
    <div className="mb-6">
      <p className="mb-2 font-medium">{question.text}</p>
      <input 
        type="range" 
        min="0" 
        max="10"
        value={responses[question.id] || 5}
        onChange={(e) => handleResponse(question.id, parseInt(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
      />
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>Very Poor</span>
        <span>Average</span>
        <span>Excellent</span>
      </div>
    </div>
  );

  // Multi-select question component
  const MultiSelectQuestion = ({ question }) => {
    const selectedOptions = responses[question.id] || [];
    
    const toggleOption = (option) => {
      const currentSelections = responses[question.id] || [];
      const newSelections = currentSelections.includes(option)
        ? currentSelections.filter(item => item !== option)
        : [...currentSelections, option];
      
      handleResponse(question.id, newSelections);
    };
    
    return (
      <div className="mb-6">
        <p className="mb-2 font-medium">{question.text}</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {question.options.map((option) => (
            <button
              key={option}
              className={`p-3 border rounded-lg text-sm transition-colors ${
                selectedOptions.includes(option) ? 'bg-blue-500 text-white border-blue-600' : 'bg-white hover:bg-gray-50 border-gray-200'
              }`}
              onClick={() => toggleOption(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Render the appropriate question component based on question type
  const renderQuestion = (question) => {
    switch (question.type) {
      case 'frequency':
        return <FrequencyQuestion question={question} />;
      case 'agreement':
        return <AgreementQuestion question={question} />;
      case 'slider':
        return <SliderQuestion question={question} />;
      case 'multiselect':
        return <MultiSelectQuestion question={question} />;
      default:
        return null;
    }
  };

  // Home screen
  const HomeScreen = () => (
    <div className="text-center flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-4">Mental Health Screening</h1>
      <p className="mb-8 text-gray-600 max-w-lg">
        This assessment helps you understand different aspects of your mental wellbeing. Your responses are private and not stored anywhere.
      </p>
      <div className="bg-blue-50 p-4 rounded-lg mb-8 text-left max-w-lg w-full">
        <h3 className="font-semibold text-blue-800 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          Important Note
        </h3>
        <p className="text-blue-700 text-sm mt-1">
          This is not a diagnostic tool. If you're experiencing severe symptoms or distress, please contact a healthcare professional immediately.
        </p>
      </div>
      <button
        onClick={() => setCurrentScreen('questionnaire')}
        className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-8 rounded-full text-lg font-medium transition-colors flex items-center"
      >
        Begin Assessment
        <ArrowRight className="ml-2 w-5 h-5" />
      </button>
    </div>
  );

  // Questionnaire screen
  const QuestionnaireScreen = () => {
    const currentQuestionnaire = questionnaires[activeQuestionnaire];
    
    return (
      <div>
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
            style={{ width: `${formProgress}%` }}
          ></div>
        </div>
        
        {/* Section header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold">{currentQuestionnaire.title}</h2>
          <p className="text-gray-600">{currentQuestionnaire.description}</p>
        </div>
        
        {/* Questions */}
        <div className="space-y-6">
          {currentQuestionnaire.questions.map((question) => (
            <div key={question.id}>
              {renderQuestion(question)}
            </div>
          ))}
        </div>
        
        {/* Navigation buttons */}
        <div className="flex justify-between mt-10">
          <button
            onClick={activeQuestionnaire === 'depression' ? () => setCurrentScreen('home') : navigatePrevious}
            className="flex items-center px-4 py-2 text-gray-700 hover:text-gray-900"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            {activeQuestionnaire === 'depression' ? 'Back to Home' : 'Previous Section'}
          </button>
          
          <button
            onClick={navigateNext}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center transition-colors"
          >
            {activeQuestionnaire === 'wellbeing' ? 'See Results' : 'Next Section'}
            <ArrowRight className="ml-2 w-5 h-5" />
          </button>
        </div>
      </div>
    );
  };

  // Results screen
  const ResultsScreen = () => {
    if (!result) return null;
    
    const getRiskColor = (level) => {
      switch (level) {
        case 'High':
          return level === 'High' && activeQuestionnaire === 'wellbeing' ? 'text-green-600' : 'text-red-600';
        case 'Moderate':
          return 'text-yellow-600';
        case 'Low':
          return activeQuestionnaire === 'wellbeing' ? 'text-red-600' : 'text-green-600';
        default:
          return 'text-gray-600';
      }
    };

    const getBgColor = (level) => {
      switch (level) {
        case 'High':
          return level === 'High' && activeQuestionnaire === 'wellbeing' ? 'bg-green-100' : 'bg-red-100';
        case 'Moderate':
          return 'bg-yellow-100';
        case 'Low':
          return activeQuestionnaire === 'wellbeing' ? 'bg-red-100' : 'bg-green-100';
        default:
          return 'bg-gray-100';
      }
    };

    return (
      <div>
        <h2 className="text-2xl font-bold mb-6">Your Assessment Results</h2>

        <div className="bg-blue-50 p-4 rounded-lg mb-8 text-left">
          <h3 className="font-semibold text-blue-800 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            Disclaimer
          </h3>
          <p className="text-blue-700 text-sm mt-1">
            These results are for informational purposes only and do not constitute a clinical diagnosis.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Depression Score Card */}
          <div className="border rounded-lg overflow-hidden shadow-sm">
            <div className="bg-gray-50 p-4 border-b">
              <h3 className="font-medium">Depression Screening</h3>
            </div>
            <div className="p-4">
              <div className={`text-center p-3 rounded-lg ${getBgColor(result.depression.level)} mb-4`}>
                <span className={`text-lg font-bold ${getRiskColor(result.depression.level)}`}>
                  {result.depression.level} Risk
                </span>
              </div>
              <p className="text-sm text-gray-600">
                {result.depression.level === 'High' ? 
                  'Your responses suggest significant symptoms of depression. Consider speaking with a healthcare provider.' :
                  result.depression.level === 'Moderate' ?
                  'Your responses indicate some symptoms of depression. Monitoring your mood is recommended.' :
                  'Your responses show few symptoms of depression. Continue practicing good self-care.'
                }
              </p>
            </div>
          </div>

          {/* Anxiety Score Card */}
          <div className="border rounded-lg overflow-hidden shadow-sm">
            <div className="bg-gray-50 p-4 border-b">
              <h3 className="font-medium">Anxiety Screening</h3>
            </div>
            <div className="p-4">
              <div className={`text-center p-3 rounded-lg ${getBgColor(result.anxiety.level)} mb-4`}>
                <span className={`text-lg font-bold ${getRiskColor(result.anxiety.level)}`}>
                  {result.anxiety.level} Risk
                </span>
              </div>
              <p className="text-sm text-gray-600">
                {result.anxiety.level === 'High' ? 
                  'Your responses suggest significant symptoms of anxiety. Consider speaking with a healthcare provider.' :
                  result.anxiety.level === 'Moderate' ?
                  'Your responses indicate some symptoms of anxiety. Learning stress management techniques may help.' :
                  'Your responses show few symptoms of anxiety. Continue practicing good self-care.'
                }
              </p>
            </div>
          </div>

          {/* Wellbeing Score Card */}
          <div className="border rounded-lg overflow-hidden shadow-sm">
            <div className="bg-gray-50 p-4 border-b">
              <h3 className="font-medium">General Wellbeing</h3>
            </div>
            <div className="p-4">
              <div className={`text-center p-3 rounded-lg ${getBgColor(result.wellbeing.level)} mb-4`}>
                <span className={`text-lg font-bold ${getRiskColor(result.wellbeing.level)}`}>
                  {result.wellbeing.level} Level
                </span>
              </div>
              <p className="text-sm text-gray-600">
                {result.wellbeing.level === 'High' ? 
                  'Your responses indicate a good sense of wellbeing. Continue your positive practices.' :
                  result.wellbeing.level === 'Moderate' ?
                  'Your responses suggest a moderate level of wellbeing. Consider activities that boost mental health.' :
                  'Your responses indicate opportunities to improve your wellbeing. Self-care activities may help.'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Stressors Section */}
        {result.stressors && result.stressors.length > 0 && (
          <div className="mb-8">
            <h3 className="font-medium mb-2">Areas of Stress Identified:</h3>
            <div className="flex flex-wrap gap-2">
              {result.stressors.map(stressor => (
                <span key={stressor} className="bg-gray-100 px-3 py-1 rounded-full text-sm">
                  {stressor}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        <div className="bg-green-50 border border-green-100 rounded-lg p-4 mb-8">
          <h3 className="font-medium text-green-800 flex items-center mb-2">
            <CheckCircle2 className="w-5 h-5 mr-2" />
            Next Steps & Resources
          </h3>
          <ul className="text-green-700 text-sm space-y-1">
            <li>• Practice mindfulness and relaxation techniques</li>
            <li>• Maintain regular physical activity</li>
            <li>• Establish healthy sleep routines</li>
            <li>• Connect with supportive friends and family</li>
            <li>• Consider speaking with a mental health professional for personalized guidance</li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <button
            onClick={() => {
              setCurrentScreen('home');
              setResponses({});
              setResult(null);
              setFormProgress(0);
              setActiveQuestionnaire('depression');
            }}
            className="flex items-center justify-center px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Home className="w-5 h-5 mr-2" />
            Return Home
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <BarChart4 className="w-5 h-5 mr-2" />
            Print or Save Results
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6">
      {currentScreen === 'home' && <HomeScreen />}
      {currentScreen === 'questionnaire' && <QuestionnaireScreen />}
      {currentScreen === 'results' && <ResultsScreen />}
    </div>
  );
}