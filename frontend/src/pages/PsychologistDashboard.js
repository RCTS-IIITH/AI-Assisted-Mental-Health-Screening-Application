"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useSelector } from "react-redux"
import { Brain, FileText, Users, Calendar, BarChart3, Settings, ChevronRight, Eye, Plus } from "lucide-react"

function PsychologistDashboard() {
  const [selectedRole, setSelectedRole] = useState(null)
  const user = useSelector((state) => state.auth.user)
  const navigate = useNavigate()

  const handleCardSelect = (role) => {
    setSelectedRole(role)
    if (role === "Add Question") {
      navigate("/questionnaires")
    } else if (role === "View Responses") {
      navigate("/response-table")
    }
  }

  const dashboardCards = [
    {
      id: "View Responses",
      title: "Student Responses",
      description: "View and analyze responses from all students",
      icon: <Users size={32} />,
      color: "from-blue-500 to-purple-600",
      hoverColor: "from-blue-600 to-purple-700",
      route: "/response-table"
    },
    {
      id: "Add Question",
      title: "Questionnaires",
      description: "Manage and create new questionnaires",
      icon: <FileText size={32} />,
      color: "from-green-500 to-blue-600",
      hoverColor: "from-green-600 to-blue-700",
      route: "/questionnaires"
    }
  ]

  const Card = ({ card, isSelected, onSelect }) => (
    <div
      className={`relative bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8 cursor-pointer transition-all duration-300 transform hover:scale-105 hover:bg-white/10 group ${
        isSelected ? 'ring-2 ring-white/30 bg-white/15' : ''
      }`}
      onClick={() => onSelect(card.id)}
    >
      <div className="flex flex-col items-center text-center space-y-6">
        {/* Icon Container */}
        <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${card.color} group-hover:${card.hoverColor} flex items-center justify-center text-white transition-all duration-300 shadow-lg`}>
          {card.icon}
        </div>
        
        {/* Content */}
        <div className="space-y-3">
          <h3 className="text-2xl font-bold text-white group-hover:text-white/90 transition-colors">
            {card.title}
          </h3>
          <p className="text-white/70 group-hover:text-white/80 transition-colors leading-relaxed">
            {card.description}
          </p>
        </div>

        {/* Arrow Icon */}
        <div className="absolute top-6 right-6 text-white/40 group-hover:text-white/60 transition-colors">
          <ChevronRight size={20} />
        </div>

        {/* Selection Indicator */}
        {isSelected && (
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-800 to-pink-800">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Enhanced Welcome Section */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 mb-8 border border-white/20">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full mb-4">
              <Brain size={32} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Welcome back!</h1>
            <h2 className="text-xl font-semibold text-white/80 mb-4">{user.name}</h2>
            <div className="flex items-center justify-center gap-6 text-white/60">
              <div className="flex items-center gap-2">
                <BarChart3 size={16} />
                <span className="text-sm">Psychologist Dashboard</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                <span className="text-sm">{new Date().toLocaleDateString('en-GB')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Dashboard Container */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
          <div className="text-center mb-8">
            <h3 className="text-xl font-semibold text-white mb-2">
              Dashboard Overview
            </h3>
            <p className="text-white/70">
              Manage questionnaires and analyze student assessment data
            </p>
          </div>

          {/* Dashboard Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {dashboardCards.map((card) => (
              <Card
                key={card.id}
                card={card}
                isSelected={selectedRole === card.id}
                onSelect={handleCardSelect}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PsychologistDashboard