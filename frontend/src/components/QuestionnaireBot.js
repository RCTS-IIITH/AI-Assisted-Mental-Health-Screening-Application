import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import "./QuestionnaireBot.css";

const BOT_AVATAR = "https://ui-avatars.com/api/?name=Bot&background=333&color=fff";
const USER_AVATAR = "https://ui-avatars.com/api/?name=User&background=C68EFD&color=fff";

const QuestionnaireBot = () => {
  const [questionnaires, setQuestionnaires] = useState([]);
  const [models, setModels] = useState([]);
  const [activeModel, setActiveModels] = useState("Mistral");
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState("");
  const [studentName, setStudentName] = useState("");
  const [studentDob, setStudentDob] = useState("");
  const [studentGender, setStudentGender] = useState("");
  const [guardianType, setGuardianType] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [tncAccepted, setTncAccepted] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showInput, setShowInput] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const [results, setResults] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    axios.get("http://localhost:8000/api/questionnaires")
      .then(res => setQuestionnaires(res.data.questionnaires))
      .catch(() => setQuestionnaires([]));
  }, []);

  useEffect(() => {
    axios.get("http://localhost:8000/api/models")
      .then(res => setModels(res.data.models))
      .catch(() => setModels([]));
  }, []);

  useEffect(() => {
    // Scroll to bottom on new message
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getSelectedQuestionnaireData = () => {
    return questionnaires.find(q => (q.name || q) === selectedQuestionnaire);
  };

  const startQuestionnaire = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessages([]);
    setIsComplete(false);
    setResults(null);

    try {
      const requestData = {
        questionnaire_name: selectedQuestionnaire,
        student_name: studentName,
        student_dob: studentDob,
        student_gender: studentGender,
        tnc_accepted: tncAccepted
      };

      // Add guardian information based on type
      if (guardianType && guardianName) {
        if (guardianType === "parent") {
          requestData.parent_name = guardianName;
        } else if (guardianType === "teacher") {
          requestData.teacher_name = guardianName;
        }
      }

      const res = await axios.post("http://localhost:8000/api/questionnaire/start", requestData);

      setSessionId(res.data.session_id);
      setMessages([
        {
          sender: "bot",
          text: `Hello ${studentName}! Let's begin the questionnaire.`,
        },
        {
          sender: "bot",
          text: res.data.question,
          options: res.data.options
        }
      ]);
      // setShowInput(false);
    } catch (e) {
      setMessages([{
        sender: "bot",
        text: "Failed to start questionnaire. Please check your information and try again."
      }]);
    }
    setLoading(false);
  };

  const handleOptionClick = async (option, idx) => {
    setMessages(prev => [
      ...prev,
      { sender: "user", text: option }
    ]);
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:8000/api/questionnaire/answer", {
        session_id: sessionId,
        answer: option,
        answer_index: idx
      });
      if (res.data.is_complete) {
        setIsComplete(true);
        setResults(res.data.results);
        setMessages(prev => [
          ...prev,
          { sender: "bot", text: res.data.question }
        ]);
        // setShowInput(true);
      } else {
        setMessages(prev => [
          ...prev,
          { sender: "bot", text: res.data.question, options: res.data.options }
        ]);
        // setShowInput(false);
      }
    } catch (e) {
      setMessages(prev => [
        ...prev,
        { sender: "bot", text: "Failed to submit answer." }
      ]);
    }
    setLoading(false);
  };

  // For free-form chat after questionnaire
  const handleSend = async () => {
    if (!input.trim()) return;
    
    setMessages(prev => [...prev, { sender: "user", text: input }]);
    const userQuestion = input;
    setInput("");
    setLoading(true);
  
    try {
      const response = await fetch("http://localhost:8000/api/chat/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: sessionId,
          question: userQuestion,
          model: activeModel, // Replace with actual model
          age: 15 // Replace with actual age value
        })
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      let botMsg = { sender: "bot", text: "" };
      setMessages(prev => [...prev, botMsg]);
  
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          setLoading(false);
          break;
        }
  
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.chunk) {
                botMsg.text += data.chunk;
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { ...botMsg };
                  return updated;
                });
              }
              if (data.complete) {
                setLoading(false);
                return;
              }
            } catch (parseError) {
              console.error('Error parsing JSON:', parseError);
            }
          }
        }
      }
    } catch (error) {
      console.error('Streaming error:', error);
      setMessages(prev => [...prev, { sender: "bot", text: "Failed to get response." }]);
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSessionId(null);
    setMessages([]);
    setIsComplete(false);
    setResults(null);
    setShowInput(true);
    setStudentName("");
    setStudentDob("");
    setStudentGender("");
    setGuardianType("");
    setGuardianName("");
    setSelectedQuestionnaire("");
    setTncAccepted(false);
  };

  return (
    <div className="qb-container">
      <div className="qb-header">
        <h2>Questionnaire Chatbot</h2>
        <p>Get Started by Entering the following details.</p>
      </div>
      {!sessionId ? (
        <form className="qb-select" onSubmit={startQuestionnaire}>
          <div className="qb-form-group">
            <label className="qb-label">Student Name *</label>
            <input
              type="text"
              className="qb-input"
              placeholder="Enter student's full name"
              value={studentName}
              onChange={e => setStudentName(e.target.value)}
              required
            />
          </div>

          <div className="qb-form-row">
            <div className="qb-form-group">
              <label className="qb-label">Date of Birth *</label>
              <input
                type="date"
                className="qb-input"
                value={studentDob}
                onChange={e => setStudentDob(e.target.value)}
                required
              />
            </div>

            <div className="qb-form-group">
              <label className="qb-label">Gender *</label>
              <select
                className="qb-input"
                value={studentGender}
                onChange={e => setStudentGender(e.target.value)}
                required
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="qb-form-group">
            <label className="qb-label">Guardian Type</label>
            <select
              className="qb-input"
              value={guardianType}
              onChange={e => {
                setGuardianType(e.target.value);
                setGuardianName(""); // Reset guardian name when type changes
              }}
            >
              <option value="">Select Guardian Type (Optional)</option>
              <option value="parent">Parent</option>
              <option value="teacher">Teacher</option>
            </select>
          </div>

          {guardianType && (
            <div className="qb-form-group">
              <label className="qb-label">
                {guardianType === "parent" ? "Parent Name" : "Teacher Name"}
              </label>
              <input
                type="text"
                className="qb-input"
                placeholder={`Enter ${guardianType}'s name`}
                value={guardianName}
                onChange={e => setGuardianName(e.target.value)}
              />
            </div>
          )}

          <div className="qb-form-group">
            <label className="qb-label">Questionnaire *</label>
            <select
              className="qb-input"
              value={selectedQuestionnaire}
              onChange={e => setSelectedQuestionnaire(e.target.value)}
              required
            >
              <option value="">Select questionnaire...</option>
              {questionnaires.map(q => (
                <option key={q.name || q} value={q.name || q}>
                  {q.name || q}
                </option>
              ))}
            </select>
          </div>

          {selectedQuestionnaire && getSelectedQuestionnaireData()?.instructions && (
            <div className="qb-instructions">
              <h4>Instructions:</h4>
              <p>{getSelectedQuestionnaireData().instructions}</p>
            </div>
          )}

          <label className="qb-checkbox-label">
            <input
              type="checkbox"
              className="qb-checkbox"
              checked={tncAccepted}
              onChange={e => setTncAccepted(e.target.checked)}
              required
            />
            <span className="qb-checkbox-text">
              I acknowledge that I have read and understood the instructions above *
            </span>
          </label>

          <button
            className="qb-btn qb-btn-primary"
            type="submit"
            disabled={loading}
          >
            {loading ? "Starting..." : "Start Questionnaire"}
          </button>
        </form>
      ) : (
        <div className="qb-chatbox">
          <div className="qb-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`qb-msg-row ${msg.sender}`}>
                <img
                  src={msg.sender === "bot" ? BOT_AVATAR : USER_AVATAR}
                  alt={msg.sender}
                  className="qb-avatar"
                />
                <div className={`qb-bubble ${msg.sender}`}>
                  {msg.text}
                  {msg.options && (
                    <div className="qb-options">
                      {msg.options.map((opt, i) => (
                        <button
                          key={i}
                          className="qb-btn qb-option"
                          onClick={() => handleOptionClick(opt, i)}
                          disabled={loading}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          {showInput && (
            <div className="qb-input-row">
              <input
                type="text"
                className="qb-input"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSend()}
                placeholder="Type your message..."
                disabled={loading}
              />
              <select
                className="qb-model-select"
                value={activeModel}
                onChange={e => setActiveModels(e.target.value)}
                required
              >
                <option value="Mistral">Mistral</option>
                <option value="Zephyr">Zephyr</option>
                <option value="Sarvam">Sarvam</option>
              </select>
              <button className="qb-btn" onClick={handleSend} disabled={loading || !input.trim()}>
                Send
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QuestionnaireBot;
