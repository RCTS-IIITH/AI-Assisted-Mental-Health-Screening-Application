import { useState, useEffect } from "react"
import { useSelector, useDispatch } from "react-redux"
import { setChildren, addChild, removeChild } from "../redux/childrenSlice"
import { setSessionId, setSelected } from "../redux/questionnaireSlice"
import { useNavigate } from "react-router-dom"
import { ChevronDown, ChevronRight, Trash2, Play, X, AlertTriangle, CheckCircle, XCircle, AlertCircle, User, GraduationCap, Calendar } from "lucide-react"
import axios from "axios"

function ParentDashboard() {
  const user = useSelector((state) => state.auth.user)
  const token = useSelector((state) => state.auth.token)
  const children = useSelector((state) => state.children.children)

  const [selectedChild, setSelectedChild] = useState(null)
  const [expandedChild, setExpandedChild] = useState(null)
  const [isFormVisible, setIsFormVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [questionnaires, setQuestionnaires] = useState([])
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState(null)
  const [isQuestionnaireModalVisible, setIsQuestionnaireModalVisible] = useState(false)
  const [tnc_accepted, setTncAccepted] = useState(false)

  // New states for enhanced UI
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState({ visible: false, child: null })
  const [toast, setToast] = useState({ visible: false, type: '', message: '' })

  const role = user.role
  const userMobile = user.mobile
  const name = user.name

  const dispatch = useDispatch()
  const navigate = useNavigate()

  const [newChild, setNewChild] = useState({
    name: "",
    dob: "",
    gender: "",
    school: "",
    parent_name: name,
    parent_mobile: userMobile,
  })

  // Toast notification function
  const showToast = (type, message) => {
    setToast({ visible: true, type, message })
    setTimeout(() => {
      setToast({ visible: false, type: '', message: '' })
    }, 4000)
  }

  // Fetch children on component mount
  useEffect(() => {
    fetchChildren()
  }, [])

  // Fetch questionnaires on component mount
  useEffect(() => {
    axios.get("http://localhost:8000/api/get/questionnaires")
      .then(res => {
        console.log("Fetched questionnaires:", res.data.questionnaires);
        setQuestionnaires(res.data.questionnaires);
      })
      .catch(() => setQuestionnaires([]));
  }, []);

  // Fetch children from API
  const fetchChildren = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('http://localhost:8000/api/parent/children', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          mobile: userMobile
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      dispatch(setChildren(data.children))
      console.log(data.children)
    } catch (err) {
      console.error('Error fetching children:', err)
      setError(err.message)
      showToast('error', 'Failed to fetch children')
    } finally {
      setLoading(false)
    }
  }

  // Handle adding a new child
  const handleAddChild = async () => {
    if (!newChild.name || !newChild.school || !newChild.dob || !newChild.gender) {
      showToast('error', 'All fields are required!')
      return
    }

    setLoading(true)

    try {
      console.log("Adding child:", newChild)
      const response = await fetch('http://localhost:8000/api/parent/add-child', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newChild.name,
          dob: newChild.dob,
          gender: newChild.gender,
          school: newChild.school,
          parent_name: newChild.parent_name,
          parent_mobile: newChild.parent_mobile
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to add child')
      }

      const data = await response.json()

      // Create child object to add to Redux store
      const childToAdd = {
        _id: data.child_id,
        name: newChild.name,
        dob: newChild.dob,
        gender: newChild.gender,
        school: newChild.school,
        parent_name: newChild.parent_name,
        parent_mobile: userMobile,
        age: new Date().getFullYear() - parseInt(newChild.dob.split('-')[0])
      }

      dispatch(addChild(childToAdd))

      setNewChild({ name: "", school: "", dob: "", gender: "", parent_name: user.name, parent_mobile: userMobile })
      setIsFormVisible(false)

      showToast('success', `${newChild.name} added successfully!`)
    } catch (err) {
      console.error('Error adding child:', err)
      showToast('error', err.message || 'Failed to add child')
    } finally {
      setLoading(false)
    }
  }

  // Handle deleting a child
  const handleDeleteChild = async (childId) => {
    setLoading(true)

    try {
      const response = await fetch('http://localhost:8000/api/parent/delete-child', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          child_id: childId
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to delete child')
      }

      dispatch(removeChild(childId))

      // Clear selection if deleted child was selected
      if (selectedChild === childId) {
        setSelectedChild(null)
      }

      setDeleteConfirmDialog({ visible: false, child: null })
      showToast('success', 'Child deleted successfully!')
    } catch (err) {
      console.error('Error deleting child:', err)
      showToast('error', err.message || 'Failed to delete child')
    } finally {
      setLoading(false)
    }
  }

  // Handle start questionnaire
  const handleStartQuestionnaire = async (child) => {
    if (!selectedQuestionnaire || !tnc_accepted) {
      showToast('error', 'Please select a questionnaire and accept terms and conditions!')
      return;
    }

    setLoading(true)

    try {
      const response = await fetch('http://localhost:8000/api/questionnaire/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          student_name: child.name,
          student_dob: child.dob,
          student_gender: child.gender || "Not Specified",
          parent_name: user.name,
          parent_mobile: user.mobile,
          school: child.school || "Not Specified",
          questionnaire_name: selectedQuestionnaire.name,
          tnc_accepted: tnc_accepted
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to start questionnaire')
      }

      const data = await response.json()
      console.log("Questionnaire started:", data)

      showToast('success', 'Questionnaire started successfully!')

      // Navigate to questionnaire bot page
      dispatch(setSessionId(data.session_id))
      dispatch(setSelected(child))
      navigate("/questionnaire-bot")

    } catch (err) {
      console.error('Error starting questionnaire:', err)
      showToast('error', err.message || 'Failed to start questionnaire')
    } finally {
      setLoading(false)
    }
  }

  // Handle opening questionnaire modal
  const handleTakeTest = (child) => {
    setSelectedChild(child)
    setIsQuestionnaireModalVisible(true)
  }

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "Not specified"
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  // Toast component
  const Toast = ({ visible, type, message }) => {
    if (!visible) return null

    const icons = {
      success: <CheckCircle size={20} />,
      error: <XCircle size={20} />,
      warning: <AlertCircle size={20} />,
      info: <AlertCircle size={20} />
    }

    const colors = {
      success: 'bg-green-500',
      error: 'bg-red-500',
      warning: 'bg-yellow-500',
      info: 'bg-blue-500'
    }

    return (
      <div className="fixed top-4 right-4 z-[60] animate-in slide-in-from-right duration-300">
        <div className={`${colors[type]} text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px]`}>
          {icons[type]}
          <span className="flex-1">{message}</span>
          <button
            onClick={() => setToast({ visible: false, type: '', message: '' })}
            className="text-white/80 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    )
  }

  if (loading && children.length === 0) {
    return <h3 className="text-white text-center mt-8">Loading...</h3>
  }

  if (error && children.length === 0) {
    return (
      <div className="text-center mt-8">
        <h3 className="text-white">{error}</h3>
        <button
          onClick={fetchChildren}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <Toast visible={toast.visible} type={toast.type} message={toast.message} />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Enhanced Welcome Section */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 mb-8 border border-white/20">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full mb-4">
              <User size={32} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Welcome back!</h1>
            <h2 className="text-xl font-semibold text-white/80 mb-4">{user.name}</h2>
            <div className="flex items-center justify-center gap-6 text-white/60">
              <div className="flex items-center gap-2">
                <GraduationCap size={16} />
                <span className="text-sm">Parent Dashboard</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                <span className="text-sm">{new Date().toLocaleDateString('en-GB')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Section */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
          <h3 className="text-xl font-semibold text-white text-center mb-8">
            Your Children
          </h3>

          {/* Children Cards Container */}
          <div className="space-y-4 mb-8">
            {Array.isArray(children) && children.length > 0 ? (
              children.map((child) => (
                <div key={child._id} className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
                  {/* Main child info row */}
                  <div className="flex items-center justify-between p-6">
                    {/* Left side - Child info */}
                    <div
                      className="flex items-center gap-4 cursor-pointer flex-1"
                      onClick={() => setExpandedChild(expandedChild === child._id ? null : child._id)}
                    >
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {child.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-semibold text-lg">{child.name}</h3>
                        <p className="text-white/70 text-sm">
                          {child.school || "School not specified"} • Age: {child.age}
                        </p>
                      </div>
                      <div className="text-white/60">
                        {expandedChild === child._id ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                      </div>
                    </div>

                    {/* Right side - Take Test button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleTakeTest(child)
                      }}
                      className="ml-4 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center gap-2"
                    >
                      <Play size={16} />
                      Take Test
                    </button>
                  </div>

                  {/* Expanded details */}
                  {expandedChild === child._id && (
                    <div className="border-t border-white/10 bg-white/5 p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="space-y-3">
                          <div>
                            <span className="text-white/60 text-sm font-medium">Age:</span>
                            <p className="text-white">{child.age || "Not specified"}</p>
                          </div>
                          <div>
                            <span className="text-white/60 text-sm font-medium">Date of Birth:</span>
                            <p className="text-white">{formatDate(child.dob)}</p>
                          </div>
                          <div>
                            <span className="text-white/60 text-sm font-medium">Gender:</span>
                            <p className="text-white">{child.gender || "Not specified"}</p>
                          </div>
                          <div>
                            <span className="text-white/60 text-sm font-medium">School:</span>
                            <p className="text-white">{child.school || "Not specified"}</p>
                          </div>
                          <div>
                            <span className="text-white/60 text-sm font-medium">Parent Name:</span>
                            <p className="text-white">{child.parent_name || user.name}</p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <span className="text-white/60 text-sm font-medium">Parent Mobile:</span>
                            <p className="text-white">{child.parent_mobile}</p>
                          </div>
                          <div>
                            <span className="text-white/60 text-sm font-medium">Teacher Name:</span>
                            <p className="text-white">{child.teacher_name || "Not specified"}</p>
                          </div>
                          <div>
                            <span className="text-white/60 text-sm font-medium">Teacher Mobile:</span>
                            <p className="text-white">{child.teacher_mobile || "Not specified"}</p>
                          </div>
                          <div>
                            <span className="text-white/60 text-sm font-medium">Created:</span>
                            <p className="text-white">{formatDate(child.created_at)}</p>
                          </div>
                          <div>
                            <span className="text-white/60 text-sm font-medium">Updated:</span>
                            <p className="text-white">{formatDate(child.updated_at)}</p>
                          </div>
                        </div>
                      </div>

                      {/* Delete button */}
                      <div className="flex justify-end">
                        <button
                          onClick={() => setDeleteConfirmDialog({ visible: true, child })}
                          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center gap-2"
                        >
                          <Trash2 size={16} />
                          Delete Child
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-white/60 text-lg">
                No children added yet
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center">
            <button
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              onClick={() => setIsFormVisible(true)}
              disabled={loading}
            >
              <User size={16} />
              {loading ? 'Loading...' : 'Add Child'}
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirmDialog.visible && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="text-red-500" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Delete Child</h3>
                <p className="text-gray-600 text-sm">This action cannot be undone</p>
              </div>
            </div>

            <p className="text-gray-700 mb-6">
              Are you sure you want to delete <strong>{deleteConfirmDialog.child?.name}</strong>?
              All associated data will be permanently removed.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmDialog({ visible: false, child: null })}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteChild(deleteConfirmDialog.child._id)}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Questionnaire Selection Modal */}
      {isQuestionnaireModalVisible && selectedChild && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  Select Test for {selectedChild.name}
                </h2>
                <button
                  onClick={() => {
                    setIsQuestionnaireModalVisible(false)
                    setSelectedQuestionnaire(null)
                    setTncAccepted(false)
                  }}
                  className="text-gray-500 hover:text-gray-700 text-xl"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Available Tests Dropdown */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Available Tests
                </label>
                <div className="relative">
                  <select
                    value={selectedQuestionnaire?._id || ''}
                    onChange={(e) => {
                      const selected = questionnaires.find(q => q.name === e.target.value)
                      setSelectedQuestionnaire(selected || null)
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none"
                  >
                    <option value="">Select a test...</option>
                    {questionnaires.map((questionnaire) => (
                      <option key={questionnaire.name} value={questionnaire.name}>
                        {questionnaire.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                </div>
              </div>

              {/* Selected Test Details */}
              {selectedQuestionnaire && (
                <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-2">{selectedQuestionnaire.name}</h4>
                  {selectedQuestionnaire.description && (
                    <p className="text-blue-700 text-sm mb-2">{selectedQuestionnaire.description}</p>
                  )}
                </div>
              )}

              {/* Instructions */}
              {selectedQuestionnaire && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">Instructions</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-gray-700 whitespace-pre-wrap">
                      {selectedQuestionnaire.instructions || "No specific instructions provided for this test."}
                    </div>
                  </div>
                </div>
              )}

              {/* Terms and Conditions */}
              {selectedQuestionnaire && (
                <div className="mb-6">
                  <label className="flex items-start gap-3 cursor-pointer p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <input
                      type="checkbox"
                      checked={tnc_accepted}
                      onChange={(e) => setTncAccepted(e.target.checked)}
                      className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-gray-700 text-sm">
                      <strong>I agree to the terms and conditions.</strong><br />
                      I have read and understood the instructions above and consent to my child participating in this test.
                    </span>
                  </label>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setIsQuestionnaireModalVisible(false)
                    setSelectedQuestionnaire(null)
                    setTncAccepted(false)
                  }}
                  className="flex-1 px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleStartQuestionnaire(selectedChild)
                    setIsQuestionnaireModalVisible(false)
                    setSelectedQuestionnaire(null)
                    setTncAccepted(false)
                  }}
                  disabled={!selectedQuestionnaire || !tnc_accepted || loading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Play size={16} />
                  {loading ? 'Starting...' : 'Start Test'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {isFormVisible && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Add Child</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Child Name:</label>
                <input
                  type="text"
                  value={newChild.name}
                  onChange={(e) => setNewChild({ ...newChild, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="Enter child's name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth:</label>
                <input
                  type="date"
                  value={newChild.dob}
                  onChange={(e) => setNewChild({ ...newChild, dob: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender:
                </label>
                <select
                  value={newChild.gender}
                  onChange={(e) =>
                    setNewChild({ ...newChild, gender: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Neutral">Neutral</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">School Name:</label>
                <input
                  type="text"
                  value={newChild.school}
                  onChange={(e) => setNewChild({ ...newChild, school: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="Enter school name"
                />
              </div>

            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={handleAddChild}
                disabled={!newChild.name || !newChild.school || !newChild.dob || loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
              >
                <User size={16} />
                {loading ? 'Adding...' : 'Add Child'}
              </button>
              <button
                onClick={() => {
                  setIsFormVisible(false)
                  setNewChild({ name: "", school: "", dob: "", parent_mobile: userMobile })
                }}
                className="flex-1 px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-xl transition-all duration-200"
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ParentDashboard