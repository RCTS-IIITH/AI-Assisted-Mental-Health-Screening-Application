"use client"

import { useState, useEffect } from "react"
import { Users, UserRound, School, Check, ArrowLeft, FileText, Plus, Settings, Eye, HelpCircle, Clock, CheckCircle, AlertCircle } from "lucide-react"

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

function AddQuestionnaire() {
  const [questionnaires, setQuestionnaires] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectionMode, setSelectionMode] = useState(null)
  const [selectedQuestionnaireId, setSelectedQuestionnaireId] = useState(null)
  const [viewingQuestionnaire, setViewingQuestionnaire] = useState(null)
  const [questionnaireDetail, setQuestionnaireDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const handleQuestionnaireClick = (questionnaireName, event) => {
    event.stopPropagation()

    if (!selectionMode) {
      setViewingQuestionnaire(questionnaireName)
      fetchQuestionnaireDetail(questionnaireName)
    }
  }

  const fetchQuestionnaireDetail = async (questionnaireName) => {
    try {
      setDetailLoading(true)
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
      setQuestionnaireDetail(data.questionnaire)
      setDetailLoading(false)
    } catch (err) {
      console.error("Error fetching questionnaire detail:", err)
      setError("Failed to fetch questionnaire details")
      setDetailLoading(false)
    }
  }

  const handleBackToList = () => {
    setViewingQuestionnaire(null)
    setQuestionnaireDetail(null)
    setError(null)
  }

  const handleSelectionModeClick = (mode) => {
    setSelectionMode(mode)
    setSelectedQuestionnaireId(null)
  }

  const handleQuestionnaireSelect = (name) => {
    setSelectedQuestionnaireId(name)
  }

  const handleSubmitSelection = async () => {
    if (!selectedQuestionnaireId || !selectionMode) return

    try {
      const response = await fetch(`${BACKEND_URL}/set_questionnaire_type`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          questionnaireName: selectedQuestionnaireId,
          type: selectionMode,
        }),
      })

      if (response.ok) {
        setSelectionMode(null)
        setSelectedQuestionnaireId(null)
        // Show success notification
        const notification = document.createElement("div")
        notification.className = "fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all"
        notification.textContent = `Successfully set ${selectionMode} questionnaire`
        document.body.appendChild(notification)
        setTimeout(() => {
          notification.remove()
        }, 3000)
      }
    } catch (err) {
      console.error("Error setting questionnaire type:", err)
      setError("Failed to set questionnaire type")
    }
  }

  useEffect(() => {
    fetchQuestionnaires()
  }, [])

  const fetchQuestionnaires = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/get/questionnaires`, {
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
      setQuestionnaires(data.questionnaires || [])
      setLoading(false)
    } catch (err) {
      console.error("Error fetching questionnaires:", err)
      setError("Failed to fetch questionnaires")
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
  const getQuestionTypeBadge = (type) => {
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
        {type || 'Unknown'}
      </span>
    )
  }

  // If viewing a specific questionnaire, show the detail view
  if (viewingQuestionnaire) {
    if (detailLoading) {
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
                  className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors mx-auto block"
                  onClick={handleBackToList}
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    if (!questionnaireDetail) {
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

    // Render questionnaire detail view
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Header Section */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-8 border border-white/20">
            <div className="flex items-center gap-4 mb-4">
              <button
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                onClick={handleBackToList}
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-white" />
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-white">{questionnaireDetail.name}</h1>
                  <div className="flex items-center gap-4 text-white/60 text-sm mt-1">
                    <div className="flex items-center gap-1">
                      <HelpCircle className="w-4 h-4" />
                      <span>{questionnaireDetail.questions?.length || 0} questions</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>Est. {Math.max(2, Math.ceil((questionnaireDetail.questions?.length || 0) * 0.5))} min</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {questionnaireDetail.instructions && (
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <h2 className="text-white font-medium mb-2">Instructions:</h2>
                <p className="text-white/80 leading-relaxed">{questionnaireDetail.instructions}</p>
              </div>
            )}
          </div>

          {/* Questions List */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Questions</h2>
                <div className="flex items-center gap-2 text-white/60">
                  <HelpCircle className="w-4 h-4" />
                  <span>{questionnaireDetail.questions?.length || 0} questions</span>
                </div>
              </div>
            </div>

            <div className="p-6">
              {!questionnaireDetail.questions || questionnaireDetail.questions.length === 0 ? (
                <div className="text-center py-12">
                  <HelpCircle className="w-16 h-16 text-white/40 mx-auto mb-4" />
                  <div className="text-white/60 text-lg mb-2">No questions available</div>
                  <div className="text-white/40">This questionnaire doesn't have any questions yet</div>
                </div>
              ) : (
                <div className="space-y-6">
                  {questionnaireDetail.questions.map((question, index) => (
                    <div
                      key={index}
                      className="bg-white/5 rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-200"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                          {index + 1}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <h3 className="text-lg font-medium text-white leading-relaxed">
                              {question.question || question.text || `Question ${index + 1}`}
                            </h3>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {getQuestionTypeIcon(question.type)}
                              {getQuestionTypeBadge(question.type)}
                            </div>
                          </div>

                          {/* Question Options */}
                          {question.options && question.options.length > 0 && (
                            <div className="bg-white/5 rounded-lg p-4 border border-white/10 mt-4">
                              <h4 className="text-white/80 font-medium mb-3 text-sm">Options:</h4>
                              <div className="grid gap-2">
                                {question.options.map((option, optionIndex) => (
                                  <div
                                    key={optionIndex}
                                    className="flex items-center gap-3 p-2 bg-white/5 rounded-lg"
                                  >
                                    <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center text-white/60 text-xs font-bold">
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
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Back Button */}
          <div className="flex justify-center mt-8">
            <button
              className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-all duration-200 border border-white/20 backdrop-blur-md"
              onClick={handleBackToList}
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Questionnaires
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="flex items-center justify-center min-h-64">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
              <div className="flex items-center gap-3 text-white text-lg">
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Loading questionnaires...
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
              <div className="text-red-200 text-lg text-center">Error: {error}</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <FileText className="w-8 h-8 text-white" />
            <h1 className="text-3xl md:text-4xl font-bold text-white">Questionnaire Management</h1>
          </div>
          <p className="text-lg text-white/80">Manage and configure assessment questionnaires</p>
        </div>

        {/* Selection Mode Controls */}
        {/* <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-8 border border-white/20">
          <div className="flex items-center gap-3 mb-4">
            <Settings className="w-6 h-6 text-white" />
            <h2 className="text-xl font-semibold text-white">Configure Questionnaire Types</h2>
          </div>

          {!selectionMode ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                className="group bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white p-4 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
                onClick={() => handleSelectionModeClick("parent")}
              >
                <div className="flex items-center justify-center gap-3">
                  <Users className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  <span className="font-semibold">Parent Questionnaire</span>
                </div>
                <p className="text-blue-100 text-sm mt-2">Configure questionnaire for parents</p>
              </button>

              <button
                className="group bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white p-4 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
                onClick={() => handleSelectionModeClick("child")}
              >
                <div className="flex items-center justify-center gap-3">
                  <UserRound className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  <span className="font-semibold">Child Questionnaire</span>
                </div>
                <p className="text-purple-100 text-sm mt-2">Configure questionnaire for children</p>
              </button>

              <button
                className="group bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white p-4 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
                onClick={() => handleSelectionModeClick("teacher")}
              >
                <div className="flex items-center justify-center gap-3">
                  <School className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  <span className="font-semibold">Teacher Questionnaire</span>
                </div>
                <p className="text-orange-100 text-sm mt-2">Configure questionnaire for teachers</p>
              </button>
            </div>
          ) : (
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                  <span className="text-white font-medium">
                    Selecting: {selectionMode.charAt(0).toUpperCase() + selectionMode.slice(1)} Questionnaire
                  </span>
                  {selectedQuestionnaireId && <span className="text-blue-300">({selectedQuestionnaireId})</span>}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                      selectedQuestionnaireId
                        ? "bg-green-500 hover:bg-green-600 text-white transform hover:scale-105"
                        : "bg-gray-500 text-gray-300 cursor-not-allowed"
                    }`}
                    onClick={handleSubmitSelection}
                    disabled={!selectedQuestionnaireId}
                  >
                    <Check className="w-4 h-4" />
                    Submit Selection
                  </button>
                  <button
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    onClick={() => setSelectionMode(null)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div> */}

        {/* Questionnaires List */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Available Questionnaires</h2>
              <div className="flex items-center gap-2 text-white/60">
                <FileText className="w-4 h-4" />
                <span>
                  {questionnaires.length} questionnaire{questionnaires.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>

          <div className="p-6">
            {questionnaires.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-white/40 mx-auto mb-4" />
                <div className="text-white/60 text-lg mb-2">No questionnaires available</div>
                <div className="text-white/40">Create your first questionnaire to get started</div>
                <button className="mt-4 flex items-center gap-2 mx-auto px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors">
                  <Plus className="w-4 h-4" />
                  Create Questionnaire
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {questionnaires.map((questionnaire, index) => (
                  <div
                    key={questionnaire.name}
                    className={`group relative bg-white/5 rounded-xl p-6 border transition-all duration-200 cursor-pointer ${
                      selectedQuestionnaireId === questionnaire.name
                        ? "border-blue-400 bg-blue-500/20 shadow-lg transform scale-[1.02]"
                        : selectionMode
                          ? "border-white/20 hover:border-white/40 hover:bg-white/10"
                          : "border-white/20 hover:border-white/40 hover:bg-white/10 hover:transform hover:scale-[1.01]"
                    }`}
                    onClick={() => selectionMode && handleQuestionnaireSelect(questionnaire.name)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3
                              className={`text-lg font-semibold text-white transition-colors ${
                                !selectionMode ? "hover:text-blue-300 cursor-pointer" : ""
                              }`}
                              onClick={(e) => handleQuestionnaireClick(questionnaire.name, e)}
                            >
                              {questionnaire.name}
                            </h3>
                            <div className="text-white/60 text-sm">Questionnaire #{index + 1}</div>
                          </div>
                        </div>

                        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                          <div className="flex items-start gap-2">
                            <div className="w-5 h-5 text-blue-300 mt-0.5">
                              <FileText className="w-full h-full" />
                            </div>
                            <div>
                              <span className="text-white/80 font-medium">Instructions:</span>
                              <p className="text-white/70 mt-1 leading-relaxed">
                                {questionnaire.instructions || "No instructions available"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        {!selectionMode && (
                          <button
                            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors group"
                            onClick={(e) => handleQuestionnaireClick(questionnaire.name, e)}
                            title="View questionnaire"
                          >
                            <Eye className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
                          </button>
                        )}
                        {selectedQuestionnaireId === questionnaire.name && (
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Back Button */}
        <div className="flex justify-center mt-8">
          <button
            className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-all duration-200 border border-white/20 backdrop-blur-md"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
        </div>
      </div>
    </div>
  )
}

export default AddQuestionnaire