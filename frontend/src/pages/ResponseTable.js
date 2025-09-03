import { useState, useEffect } from "react"
import { MessageCircle, ArrowLeft, School, User, UserCheck, FileText, Search, X, Send } from "lucide-react"

function ResponseTable() {
  // State for selected school
  const [selectedSchool, setSelectedSchool] = useState("All Schools")

  // State for school options
  const [schools, setSchools] = useState(["All Schools"])

  // State to store fetched responses
  const [responses, setResponses] = useState([])

  // State for diagnosis inputs
  const [diagnoses, setDiagnoses] = useState({})

  // State for search filter
  const [searchTerm, setSearchTerm] = useState("")

  // State for chat modal
  const [selectedChat, setSelectedChat] = useState(null)
  const [chatData, setChatData] = useState(null)
  const [loadingChat, setLoadingChat] = useState(false)

  // Function to fetch schools dynamically from backend
  const fetchSchools = async () => {
    try {
      console.log("Fetching school names...")
      const response = await fetch("http://localhost:8000/api/psychologist/get-unique-schools", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })
      const data = await response.json()
      if (data.schools) {
        setSchools(["All Schools", ...data.schools])
        console.log("Fetched schools:", data.schools)
      } else {
        console.error("Error fetching schools:", data.error)
      }
    } catch (error) {
      console.error("Error fetching schools:", error)
    }
  }

  // Function to fetch chat responses
  const fetchResponses = async () => {
    try {
      console.log("Fetching chat responses...")
      const response = await fetch("http://localhost:8000/api/psychologist/chat-responses", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })
      const data = await response.json()
      console.log("Fetched responses:", data)
      setResponses(data.responses || [])
    } catch (error) {
      console.error("Error fetching responses:", error)
    }
  }

  // Function to fetch chat data for a specific session
  const fetchChatData = async (sessionId) => {
    setLoadingChat(true)
    try {
      console.log("Fetching chat for session:", sessionId)
      const response = await fetch(`http://localhost:8000/api/psychologist/chat/${sessionId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })
      const data = await response.json()
      console.log("Fetched chat data:", data)
      setChatData(data.chat)
    } catch (error) {
      console.error("Error fetching chat data:", error)
      setChatData(null)
    } finally {
      setLoadingChat(false)
    }
  }

  // Function to handle diagnosis change
  const handleDiagnosisChange = (sessionId, diagnosis) => {
    setDiagnoses((prev) => ({
      ...prev,
      [sessionId]: diagnosis,
    }))
  }

  // Function to save diagnosis
  const saveDiagnosis = async (sessionId) => {
    try {
      const diagnosis = diagnoses[sessionId] || ""
      const response = await fetch("http://localhost:8000/api/psychologist/update-diagnosis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, diagnosis })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        // Update the local state to reflect the saved diagnosis
        setResponses(prev => prev.map(resp => 
          resp.session_id === sessionId 
            ? { ...resp, diagnosis } 
            : resp
        ))
        alert("Diagnosis saved successfully!")
      } else {
        throw new Error(data.detail || "Failed to save diagnosis")
      }
    } catch (error) {
      console.error("Error saving diagnosis:", error)
      alert("Failed to save diagnosis: " + error.message)
    }
  }

  // Function to open chat modal
  const openChatModal = async (sessionId) => {
    setSelectedChat(sessionId)
    await fetchChatData(sessionId)
  }

  // Function to close chat modal
  const closeChatModal = () => {
    setSelectedChat(null)
    setChatData(null)
  }

  // Filter responses based on selected school and search term
  const filteredResponses = responses.filter((response) => {
    const matchesSchool = selectedSchool === "All Schools" || response.school === selectedSchool
    const matchesSearch = 
      response.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      response.parent_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      response.school?.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSchool && matchesSearch
  })

  // useEffect to fetch schools and responses on component mount
  useEffect(() => {
    fetchSchools()
    fetchResponses()
  }, [])

  // Initialize diagnoses state when responses change
  useEffect(() => {
    const initialDiagnoses = {}
    responses.forEach(response => {
      if (response.diagnosis) {
        initialDiagnoses[response.session_id] = response.diagnosis
      }
    })
    setDiagnoses(initialDiagnoses)
  }, [responses])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Student Responses</h1>
          <p className="text-xl text-white/80">Manage and analyze student assessment responses</p>
        </div>

        {/* Controls Section */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-4 border border-white/20">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* School Selector */}
            <div className="flex items-center gap-3">
              <School className="w-5 h-5 text-white" />
              <label htmlFor="school-select" className="text-white font-medium">
                Select School:
              </label>
              <select
                id="school-select"
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white backdrop-blur-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                value={selectedSchool}
                onChange={(e) => setSelectedSchool(e.target.value)}
              >
                {schools.map((school) => (
                  <option key={school} value={school} className="bg-gray-800 text-white">
                    {school}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/60" />
              <input
                type="text"
                placeholder="Search students, parents, or schools..."
                className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 backdrop-blur-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none w-80"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
        
        {/* Summary Stats */}
        {filteredResponses.length > 0 && (
          <div className="mb-4 grid md:grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <div className="flex items-center gap-3">
                <User className="w-8 h-8 text-blue-400" />
                <div>
                  <div className="text-2xl font-bold text-white">{filteredResponses.length}</div>
                  <div className="text-white/60">Total Students</div>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-green-400" />
                <div>
                  <div className="text-2xl font-bold text-white">
                    {filteredResponses.filter((r) => diagnoses[r.session_id] || r.diagnosis).length}
                  </div>
                  <div className="text-white/60">With Diagnosis</div>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <div className="flex items-center gap-3">
                <School className="w-8 h-8 text-purple-400" />
                <div>
                  <div className="text-2xl font-bold text-white">{schools.length - 1}</div>
                  <div className="text-white/60">Schools</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Table Section */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white uppercase tracking-wider">
                    Chat
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Student Name
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4" />
                      Parent Name
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <School className="w-4 h-4" />
                      School
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Diagnosis
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredResponses.length > 0 ? (
                  filteredResponses.map((response, index) => (
                    <tr key={response.session_id || index} className="hover:bg-white/5 transition-colors">
                      {/* Chat Icon Column */}
                      <td className="px-6 py-4">
                        <button
                          onClick={() => openChatModal(response.session_id)}
                          className="p-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors group"
                          title="View chat session"
                        >
                          <MessageCircle className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                        </button>
                      </td>

                      {/* Student Name Column */}
                      <td className="px-6 py-4">
                        <div className="text-white font-medium">{response.student_name || "N/A"}</div>
                        <div className="text-white/60 text-sm">Age: {response.student_age || "N/A"}</div>
                      </td>

                      {/* Parent Name Column */}
                      <td className="px-6 py-4">
                        <div className="text-white/80">{response.parent_name || "N/A"}</div>
                        <div className="text-white/60 text-sm">{response.parent_mobile || "N/A"}</div>
                      </td>

                      {/* School Column */}
                      <td className="px-6 py-4">
                        <div className="text-white/80">{response.school || "N/A"}</div>
                        <div className="text-white/60 text-sm">{response.teacher_name || "N/A"}</div>
                      </td>

                      {/* Diagnosis Column */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <textarea
                            className="w-full min-w-[200px] px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 backdrop-blur-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                            placeholder="Enter diagnosis..."
                            rows={2}
                            value={diagnoses[response.session_id] || response.diagnosis || ""}
                            onChange={(e) => handleDiagnosisChange(response.session_id, e.target.value)}
                          />
                          <button
                            onClick={() => saveDiagnosis(response.session_id)}
                            className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors font-medium whitespace-nowrap"
                            title="Save diagnosis"
                          >
                            Save
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <FileText className="w-12 h-12 text-white/40" />
                        <div className="text-white/60 text-lg">No responses found</div>
                        <div className="text-white/40">
                          {selectedSchool === "All Schools"
                            ? "No student responses available"
                            : `No responses found for ${selectedSchool}`}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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

      {/* Chat Modal */}
      {selectedChat && chatData &&(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/20">
              <div className="flex items-center gap-3">
                <MessageCircle className="w-6 h-6 text-white" />
                <div>
                  <h2 className="text-xl font-bold text-white">Chat Session</h2>
                  <p className="text-white/60 text-sm">Session ID: {selectedChat}</p>
                  <p className="text-white/60 text-sm">Questionnaire: {chatData.questionnaire_name}</p>
                </div>
              </div>
              <button
                onClick={closeChatModal}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-hidden">
              {loadingChat ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-white/60">Loading chat...</div>
                </div>
              ) : chatData ? (
                <div className="h-full flex flex-col">
                  {/* Chat Info */}
                  <div className="p-4 bg-white/5 border-b border-white/20">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-white/60">Student:</div>
                        <div className="text-white font-medium">{chatData.student_name}</div>
                      </div>
                      <div>
                        <div className="text-white/60">Age:</div>
                        <div className="text-white">{chatData.student_age}</div>
                      </div>
                      <div>
                        <div className="text-white/60">School:</div>
                        <div className="text-white">{chatData.school}</div>
                      </div>
                      <div>
                        <div className="text-white/60">Guardian:</div>
                        <div className="text-white">{chatData.gaurdian_name}</div>
                      </div>
                    </div>
                  </div>

                  {/* Chat Messages */}
                  <div className="flex-1 overflow-y-auto p-4">
                    {chatData.conversation && chatData.conversation.length > 0 ? (
                      <div className="space-y-4">
                        {chatData.conversation.map((message, index) => (
                          <div
                            key={index}
                            className={`flex ${
                              message.role === 'user' ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <div
                              className={`max-w-[80%] p-4 rounded-lg ${
                                message.role === 'user'
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-white/10 text-white border border-white/20'
                              }`}
                            >
                              <div className="text-xs font-medium mb-2 opacity-70">
                                {message.role === 'user' ? 'Student' : 'AI Assistant'}
                              </div>
                              
                              {/* Show question if it's a bot message and has a question */}
                              {message.role === 'bot' && message.question && (
                                <div className="mb-3 p-3 bg-white/10 rounded-lg border-l-4 border-yellow-400">
                                  <div className="text-xs font-medium text-yellow-200 mb-1">
                                    Question {(message.question_index || 0) + 1}:
                                  </div>
                                  <div className="text-sm font-medium text-yellow-100">
                                    {message.question}
                                  </div>
                                </div>
                              )}
                              
                              {/* Show the message content */}
                              <div className="whitespace-pre-wrap">
                                {message.message || message.content || 'No message content'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <MessageCircle className="w-12 h-12 text-white/40 mx-auto mb-4" />
                          <div className="text-white/60">No conversation available</div>
                          <div className="text-white/40 text-sm">This session has no chat history</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="text-white/60">Failed to load chat data</div>
                    <div className="text-white/40 text-sm">Please try again later</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ResponseTable