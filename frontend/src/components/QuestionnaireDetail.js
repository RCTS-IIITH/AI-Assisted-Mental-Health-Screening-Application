import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, FileText, HelpCircle, Clock, User, CheckCircle, AlertCircle, ChevronRight } from "lucide-react"

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

function QuestionnaireDetail() {
  const { questionnaireName } = useParams()
  const navigate = useNavigate()
  const [questionnaire, setQuestionnaire] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchQuestionnaire()
  }, [questionnaireName])

  const fetchQuestionnaire = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${BACKEND_URL}/api/get/questionnaire/${questionnaireName}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setQuestionnaire(data.questionnaire)
      setLoading(false)
    } catch (err) {
      console.error("Error fetching questionnaire:", err)
      setError("Failed to fetch questionnaire details")
      setLoading(false)
    }
  }

  const getQuestionTypeIcon = (type) => {
    // Convert to string and handle null/undefined/non-string types
    const typeString = String(type || '').toLowerCase();
    
    switch (typeString) {
      case 'multiple_choice':
      case 'radio':
        return <CheckCircle className="w-5 h-5 text-blue-400" />
      case 'checkbox':
        return <CheckCircle className="w-5 h-5 text-green-400" />
      case 'text':
      case 'textarea':
        return <FileText className="w-5 h-5 text-purple-400" />
      case 'scale':
      case 'rating':
        return <AlertCircle className="w-5 h-5 text-yellow-400" />
      default:
        return <HelpCircle className="w-5 h-5 text-gray-400" />
    }
  }

  const getQuestionTypeBadge = (type, questionType) => {
    // Handle question types 0 and 1
    if (questionType === 0 || questionType === '0') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium border bg-amber-500/20 text-amber-300 border-amber-500/30">
          Follow-up
        </span>
      )
    } else if (questionType === 1 || questionType === '1') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium border bg-blue-500/20 text-blue-300 border-blue-500/30">
          Regular
        </span>
      )
    }

    // Handle other types
    const colors = {
      'multiple_choice': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      'radio': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      'checkbox': 'bg-green-500/20 text-green-300 border-green-500/30',
      'text': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      'textarea': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      'scale': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      'rating': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    }
    
    const colorClass = colors[String(type || '').toLowerCase()] || 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium border ${colorClass}`}>
        {type || 'Text'}
      </span>
    )
  }

  // Separate questions based on their type (0 for follow-up, 1 for regular)
  const categorizeQuestions = (questions) => {
    if (!questions || questions.length === 0) return { regularQuestions: [], followUpQuestions: [] }
    
    const regularQuestions = questions.filter(q => q.type === 1 || q.type === '1')
    const followUpQuestions = questions.filter(q => q.type === 0 || q.type === '0')
    
    return { regularQuestions, followUpQuestions }
  }

  const renderQuestionCard = (question, index, isFollowUp = false) => (
    <div
      key={index}
      className={`rounded-xl p-6 border transition-all duration-200 ${
        isFollowUp 
          ? 'bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/10' 
          : 'bg-white/5 border-white/10 hover:bg-white/10'
      }`}
    >
      <div className="flex items-start gap-4">
        <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm ${
          isFollowUp 
            ? 'bg-gradient-to-r from-amber-500 to-orange-600' 
            : 'bg-gradient-to-r from-blue-500 to-purple-600'
        }`}>
          {index + 1}
        </div>
        
        <div className="flex-1">
          <div className="flex items-start justify-between gap-4 mb-3">
            <h3 className="text-lg font-medium text-white leading-relaxed">
              {question.question || question.text || `Question ${index + 1}`}
            </h3>
            <div className="flex items-center gap-2 flex-shrink-0">
              {getQuestionTypeIcon(question.inputType || question.type)}
              {getQuestionTypeBadge(question.inputType, question.type)}
            </div>
          </div>

          {/* Follow-up conditional display notice */}
          {isFollowUp && index === 0 && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 text-amber-300 text-sm font-medium mb-1">
                <AlertCircle className="w-4 h-4" />
                Conditional Question
              </div>
              <p className="text-amber-200/80 text-xs">
                Answer "Yes" to this question to reveal additional follow-up questions
              </p>
            </div>
          )}

          {/* Nested follow-up indicator */}
          {isFollowUp && index > 0 && (
            <div className="bg-amber-500/5 border border-amber-500/10 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 text-amber-300/60 text-sm">
                <ChevronRight className="w-4 h-4" />
                <span>Shows only if previous follow-up question is answered "Yes"</span>
              </div>
            </div>
          )}

          {/* Question Options */}
          {question.options && question.options.length > 0 && (
            <div className={`rounded-lg p-4 border mt-4 ${
              isFollowUp 
                ? 'bg-amber-500/5 border-amber-500/10' 
                : 'bg-white/5 border-white/10'
            }`}>
              <h4 className="text-white/80 font-medium mb-3 text-sm">Options:</h4>
              <div className="grid gap-2">
                {question.options.map((option, optionIndex) => (
                  <div
                    key={optionIndex}
                    className={`flex items-center gap-3 p-2 rounded-lg ${
                      isFollowUp 
                        ? 'bg-amber-500/5' 
                        : 'bg-white/5'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      isFollowUp 
                        ? 'bg-amber-500/20 text-amber-300' 
                        : 'bg-white/10 text-white/60'
                    }`}>
                      {String.fromCharCode(65 + optionIndex)}
                    </div>
                    <span className="text-white/80">{option}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Additional question details */}
          <div className="flex flex-wrap gap-4 mt-4 text-sm text-white/60">
            {question.required && (
              <div className="flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-red-400" />
                <span>Required</span>
              </div>
            )}
            {question.scale && (
              <div className="flex items-center gap-1">
                <span>Scale: 1-{question.scale}</span>
              </div>
            )}
            {question.category && (
              <div className="flex items-center gap-1">
                <span>Category: {question.category}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="flex items-center justify-center min-h-64">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
              <div className="flex items-center gap-3 text-white text-lg">
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Loading questionnaire details...
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="flex items-center justify-center min-h-64">
            <div className="bg-red-500/20 backdrop-blur-md rounded-2xl p-8 border border-red-500/30">
              <div className="text-red-200 text-lg text-center mb-4">Error: {error}</div>
              <button
                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors"
                onClick={() => navigate(-1)}
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!questionnaire) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="flex items-center justify-center min-h-64">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
              <div className="text-white text-lg text-center">Questionnaire not found</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const { regularQuestions, followUpQuestions } = categorizeQuestions(questionnaire.questions)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header Section */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-8 border border-white/20">
          <div className="flex items-center gap-4 mb-4">
            <button
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-white" />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">{questionnaire.name}</h1>
                <div className="flex items-center gap-4 text-white/60 text-sm mt-1">
                  <div className="flex items-center gap-1">
                    <HelpCircle className="w-4 h-4" />
                    <span>{regularQuestions.length} main questions</span>
                  </div>
                  {followUpQuestions.length > 0 && (
                    <div className="flex items-center gap-1">
                      <AlertCircle className="w-4 h-4 text-amber-400" />
                      <span>{followUpQuestions.length} follow-up questions</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>Est. {Math.max(2, Math.ceil(((regularQuestions.length + followUpQuestions.length) || 0) * 0.5))} min</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {questionnaire.instructions && (
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h2 className="text-white font-medium mb-2">Instructions:</h2>
              <p className="text-white/80 leading-relaxed">{questionnaire.instructions}</p>
            </div>
          )}
        </div>

        {/* Regular Questions */}
        {regularQuestions.length > 0 && (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden mb-8">
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-blue-400" />
                  Questions
                </h2>
                <div className="flex items-center gap-2 text-white/60">
                  <HelpCircle className="w-4 h-4" />
                  <span>{regularQuestions.length} questions</span>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-6">
                {regularQuestions.map((question, index) => renderQuestionCard(question, index, false))}
              </div>
            </div>
          </div>
        )}

        {/* Follow-up Questions */}
        {followUpQuestions.length > 0 && (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden mb-8">
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white flex items-center gap-3">
                  <AlertCircle className="w-6 h-6 text-amber-400" />
                  Follow-up Questions
                </h2>
                <div className="flex items-center gap-2 text-amber-300/80">
                  <HelpCircle className="w-4 h-4" />
                  <span>{followUpQuestions.length} conditional questions</span>
                </div>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mt-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-amber-200 text-sm font-medium mb-2">How conditional questions work:</p>
                    <ul className="text-amber-200/80 text-sm space-y-1">
                      <li>• First follow-up question appears based on your previous answers</li>
                      <li>• Answer "Yes" to the first follow-up to reveal additional questions</li>
                      <li>• Each subsequent follow-up depends on the previous "Yes" answer</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-6">
                {followUpQuestions.map((question, index) => renderQuestionCard(question, index, true))}
              </div>
            </div>
          </div>
        )}

        {/* No Questions Available */}
        {regularQuestions.length === 0 && followUpQuestions.length === 0 && (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden">
            <div className="p-6">
              <div className="text-center py-12">
                <HelpCircle className="w-16 h-16 text-white/40 mx-auto mb-4" />
                <div className="text-white/60 text-lg mb-2">No questions available</div>
                <div className="text-white/40">This questionnaire doesn't have any questions yet</div>
              </div>
            </div>
          </div>
        )}

        {/* Back Button */}
        <div className="flex justify-center mt-8">
          <button
            className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-all duration-200 border border-white/20 backdrop-blur-md"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Questionnaires
          </button>
        </div>
      </div>
    </div>
  )
}

export default QuestionnaireDetail