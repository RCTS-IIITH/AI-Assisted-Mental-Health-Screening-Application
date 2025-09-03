import React, { useState, useRef, useEffect } from "react";
import { Bot, User, Send, Brain, MessageCircle, Sparkles } from "lucide-react";
import { useSelector } from "react-redux";
import axios from "axios";

const QuestionnaireBot = () => {
  const [models, setModels] = useState([]);
  const [activeModel, setActiveModels] = useState("Gemini");
  const [input, setInput] = useState("/start");
  const [loading, setLoading] = useState(false);
  const [showInput, setShowInput] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const messagesEndRef = useRef(null);
  
  // Mock data for demo purposes (replace with actual Redux selectors)
  const studentName =  useSelector((state) => state.questionnaire.selectedChild.name);
  const sessionId =  useSelector((state) => state.questionnaire.sessionId);
  const questionnaire =  useSelector((state) => state.questionnaire.selectedChild.questionnaire_name);

  const [messages, setMessages] = useState([
    {
      sender: "bot", 
      text: `Welcome! Let's begin the test for ${studentName}. To start the test, send "/start"`
    }
  ]);
  
  useEffect(() => {
    axios.get("http://localhost:8000/api/get/models")
      .then(res => setModels(res.data.models))
      .catch(() => setModels(["Gemini", "GPT-4"]));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const feedbackSend = async () => {
    console.log("is complete in feedback", isComplete);
    setMessages(prev => [...prev, { sender: "user", text: input }]);
    const userQuestion = input;
    setInput("");
    setLoading(true);
    try {
      const response = await fetch("http://localhost:8000/api/questionnaire/end", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: sessionId,
          feedback: userQuestion
        })
      });

      if (!response.ok) {
        setMessages(prev => [...prev, { sender: "bot", text: "failed to save to server" }]);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setMessages(prev => [...prev, { sender: "bot", text: data.message }]);
      setShowInput(false);

    } catch (error) {
      console.error('Unable to send :', error);
    }
  };

  const handleSend = async () => {
    console.log("is complete in handle", isComplete);
    if (!input.trim()) return;

    setMessages(prev => [...prev, { sender: "user", text: input }]);
    const userQuestion = input;
    setInput("");
    setLoading(true);

    // Mock streaming response for demo
    try {
      const response = await fetch("http://localhost:8000/api/chat/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: sessionId,
          question: userQuestion,
          model: activeModel
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
                setIsComplete(data.status);
                console.log(isComplete)
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-4">
      <div className="container mx-auto max-w-4xl h-screen flex flex-col">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-4 border border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                <Brain size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Questionnaire Bot</h2>
                <p className="text-white/70">Interactive Assessment for {studentName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-white/60">
              <MessageCircle size={16} />
              <span className="text-sm">Session: {sessionId.slice(-6)}</span>
            </div>
          </div>
        </div>

        {/* Chat Container */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 flex-1 flex flex-col overflow-hidden">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.sender === 'bot' && (
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot size={20} className="text-white" />
                  </div>
                )}
                
                <div className={`max-w-[80%] ${msg.sender === 'user' ? 'order-first' : ''}`}>
                  <div className={`rounded-2xl px-4 py-3 ${
                    msg.sender === 'bot' 
                      ? 'bg-white/20 text-white border border-white/10' 
                      : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white ml-auto'
                  }`}>
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                  </div>
                </div>

                {msg.sender === 'user' && (
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <User size={20} className="text-white" />
                  </div>
                )}
              </div>
            ))}
            
            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Bot size={20} className="text-white" />
                </div>
                <div className="bg-white/20 rounded-2xl px-4 py-3 border border-white/10">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          {showInput && (
            <div className="p-6 border-t border-white/10">
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <input
                    type="text"
                    className="w-full bg-white/20 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-transparent transition-all duration-300"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !loading && input.trim() && (isComplete ? feedbackSend() : handleSend())}
                    placeholder={isComplete ? "Share your feedback..." : "Type your message..."}
                    disabled={loading}
                  />
                </div>
                
                <select
                  className="bg-white/20 border border-white/20 rounded-xl px-3 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-transparent transition-all duration-300 min-w-[120px]"
                  value={activeModel}
                  onChange={e => setActiveModels(e.target.value)}
                >
                  {models.map((item, index) => (
                    <option key={index} value={item} className="bg-purple-900 text-white">
                      {item}
                    </option>
                  ))}
                </select>
                
                <button 
                  className={`bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-xl transition-all duration-300 flex items-center gap-2 font-medium ${
                    loading || !input.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 shadow-lg hover:shadow-purple-500/25'
                  }`}
                  onClick={isComplete ? feedbackSend : handleSend} 
                  disabled={loading || !input.trim()}
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Send size={18} />
                      Send
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {!showInput && (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mt-4 border border-white/20 text-center">
            <div className="flex items-center justify-center gap-2 text-green-400 mb-2">
              <Sparkles size={20} />
              <span className="font-semibold">Assessment Complete</span>
            </div>
            <p className="text-white/70">Thank you for completing the questionnaire!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionnaireBot;