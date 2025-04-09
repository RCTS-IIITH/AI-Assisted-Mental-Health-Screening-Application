import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Trash2, Edit, FileSpreadsheet, Tag, Check, Users, UserRound, School } from 'lucide-react';
import axios from 'axios';
import './AddQuestionnaire.css';
import Navbar from './Navbar'

function AddQuestionnaire() {
  const navigate = useNavigate();
  const [questionnaires, setQuestionnaires] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [activeQuestionnaireId, setActiveQuestionnaireId] = useState(null);
  const [newQuestionnaire, setNewQuestionnaire] = useState({
    name: '',
    author: '',
    category: ''
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingQuestionnaire, setEditingQuestionnaire] = useState({
    _id: '',
    name: '',
    author: '',
    category: ''
  });
  const [showTagModal, setShowTagModal] = useState(false);
  const [taggingQuestionnaireId, setTaggingQuestionnaireId] = useState(null);
  const [newTag, setNewTag] = useState('');
  const [selectionMode, setSelectionMode] = useState(null);
  const [selectedQuestionnaireId, setSelectedQuestionnaireId] = useState(null);

  const handleQuestionnaireClick = (questionnaireId, event) => {
    // Prevent click from propagating to parent div when in selection mode
    event.stopPropagation();
    
    if (!selectionMode) {
      navigate(`/questionnaire/${questionnaireId}`);
    }
  };

  const handleSelectionModeClick = (mode) => {
    setSelectionMode(mode);
    setSelectedQuestionnaireId(null);
  };

  const handleQuestionnaireSelect = (id) => {
    setSelectedQuestionnaireId(id);
  };

  const handleSubmitSelection = async () => {
    if (!selectedQuestionnaireId || !selectionMode) return;

    try {
      const response = await axios.post(
        'http://localhost:5000/set_questionnaire_type',
        {
          questionnaireId: selectedQuestionnaireId,
          type: selectionMode
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          withCredentials: true
        }
      );

      if (response.status === 200) {
        setSelectionMode(null);
        setSelectedQuestionnaireId(null);
        alert(`Successfully set ${selectionMode} questionnaire`);
      }
    } catch (err) {
      console.error('Error setting questionnaire type:', err);
      setError(err.response?.data?.error || 'Failed to set questionnaire type');
    }
  };

  useEffect(() => {
    fetchQuestionnaires();
  }, []);

  const handleAddTags = (id) => {
    setTaggingQuestionnaireId(id);
    setShowTagModal(true);
  };

  const handleSaveTag = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `http://localhost:5000/add_tag`,
        {
          id: taggingQuestionnaireId,
          tag: newTag,
        },
        {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true,
        }
      );

      if (response.data) {
        setQuestionnaires(
          questionnaires.map((q) =>
            q._id === taggingQuestionnaireId
              ? { ...q, tags: [...(q.tags || []), newTag] }
              : q
          )
        );
        setShowTagModal(false);
        setNewTag('');
      }
    } catch (err) {
      console.error('Error adding tag:', err);
      setError(err.response?.data?.error || 'Failed to add tag');
    }
  };

  const handleEditClick = (questionnaire) => {
    setEditingQuestionnaire({
      _id: questionnaire._id,
      name: questionnaire.name,
      author: questionnaire.author,
      category: questionnaire.category
    });
    setShowEditModal(true);
  };

  const handleEditQuestionnaire = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(
        'http://localhost:5000/update_questionnaire',
        {
          id: editingQuestionnaire._id,
          name: editingQuestionnaire.name,
          author: editingQuestionnaire.author,
          category: editingQuestionnaire.category
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          withCredentials: true
        }
      );

      if (response.data) {
        setQuestionnaires(questionnaires.map(q => 
          q._id === editingQuestionnaire._id ? response.data : q
        ));
        setShowEditModal(false);
        setTimeout(() => {
          window.location.reload();
        }, 0);
      }
    } catch (err) {
      console.error('Error updating questionnaire:', err);
      setError(err.response?.data?.error || 'Failed to update questionnaire');
    }
  };

  const fetchQuestionnaires = async () => {
    try {
      const response = await fetch('http://localhost:5000/view_questionnaire', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setQuestionnaires(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching questionnaires:', err);
      setError('Failed to fetch questionnaires');
      setLoading(false);
    }
  };

  const handleAddNewQuestionnaire = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('name', newQuestionnaire.name);
      formData.append('author', newQuestionnaire.author);
      formData.append('category', newQuestionnaire.category);

      const response = await axios.post(
        'http://localhost:5000/questionnaire',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          withCredentials: true
        }
      );

      if (response.data) {
        await fetchQuestionnaires();
        setShowModal(false);
        setNewQuestionnaire({ name: '', author: '', category: '' });
      }
    } catch (err) {
      console.error('Error adding questionnaire:', err);
      setError(err.response?.data?.error || 'Failed to add questionnaire');
    }
  };

  const handleDeleteQuestionnaire = async (id) => {
    if (window.confirm('Are you sure you want to delete this questionnaire?')) {
      try {
        await axios.delete('http://localhost:5000/delete_questionnaire', {
          data: { id }
        });

        setQuestionnaires(questionnaires.filter(q => q._id !== id));
      } catch (err) {
        console.error('Error deleting questionnaire:', err);
        setError(err.response?.data?.error || 'Failed to delete questionnaire');
      }
    }
  };

  const handleAddQuestions = (questionnaireId) => {
    navigate(`/questionnaire/${questionnaireId}/add-question`);
  };

  if (loading) {
    return <div className="questionnaire-container">Loading...</div>;
  }

  if (error) {
    return <div className="questionnaire-container">Error: {error}</div>;
  }

  return (
    <div className="AddQnnaire-container">
      <Navbar />
    
    <div className="questionnaire-container">
      <div className="header-section flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Questionnaires</h2>
          <button 
            className="add-button bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center"
            onClick={() => setShowModal(true)}
          >
            <PlusCircle className="w-5 h-5 mr-2" />
            Add Questionnaire
          </button>
        </div>
        
        <div className="selection-buttons bg-gray-50 p-4 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Select Questionnaire Type</h3>
          
          <div className="flex flex-wrap gap-4">
            {!selectionMode ? (
              <>
                <button 
                  className="selection-button bg-blue-100 hover:bg-blue-200 text-blue-800 px-4 py-2 rounded-lg flex items-center transition-colors mr-8"
                  onClick={() => handleSelectionModeClick('parent')}
                >
                  <Users className="w-5 h-5 mr-2" />
                  Parent Questionnaire
                </button>
                
                <button 
                  className="selection-button bg-purple-100 hover:bg-purple-200 text-purple-800 px-4 py-2 rounded-lg flex items-center transition-colors"
                  onClick={() => handleSelectionModeClick('child')}
                >
                  <UserRound className="w-5 h-5 mr-2" />
                  Child Questionnaire
                </button>
                
                <button 
                  className="selection-button bg-orange-100 hover:bg-orange-200 text-orange-800 px-4 py-2 rounded-lg flex items-center transition-colors"
                  onClick={() => handleSelectionModeClick('teacher')}
                >
                  <School className="w-5 h-5 mr-2" />
                  Teacher Questionnaire
                </button>
              </>
            ) : (
              <div className="flex items-center gap-4 w-full">
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-600">
                    Selecting: {selectionMode.charAt(0).toUpperCase() + selectionMode.slice(1)} Questionnaire
                  </span>
                </div>
                <button 
                  className={`submit-button px-4 py-2 rounded-lg flex items-center transition-colors ${
                    selectedQuestionnaireId 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  }`}
                  onClick={handleSubmitSelection}
                  disabled={!selectedQuestionnaireId}
                >
                  <Check className="w-5 h-5 mr-2" />
                  Submit Selection
                </button>
                <button 
                  className="cancel-button bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg"
                  onClick={() => setSelectionMode(null)}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={`questionnaire-list mt-6 ${selectionMode ? 'selection-mode' : ''}`}>
        {questionnaires.map((questionnaire) => (
          <div
            key={questionnaire._id}
            className={`questionnaire-item transition-colors ${
              activeQuestionnaireId === questionnaire._id ? 'border-2 border-blue-500' : ''
            } ${
              selectedQuestionnaireId === questionnaire._id 
                ? 'bg-blue-50 border-2 border-blue-500 shadow-md' 
                : selectionMode 
                  ? 'hover:bg-gray-50 cursor-pointer'
                  : ''
            }`}
            onClick={() => selectionMode && handleQuestionnaireSelect(questionnaire._id)}
          >
            <div className="questionnaire-info">
              <div className="flex items-center gap-4">                                   
                <h3 
                  className={`text-lg font-medium ${
                    selectionMode ? 'cursor-pointer' : 'cursor-pointer hover:text-blue-600'
                  }`}
                  onClick={(e) => handleQuestionnaireClick(questionnaire._id, e)}
                >
                  {questionnaire.name}
                </h3>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                <p>Author: {questionnaire.author}</p>
                <p>Category: {questionnaire.category}</p>
                <p>Tags: {questionnaire.tags?.join(', ') || 'No tags'}</p>
              </div>
            </div>
            {!selectionMode && (
              <div className="action-buttons flex gap-2">
                <button
                  className="action-button hover:bg-blue-200 text-blue-700 p-2 rounded"
                  onClick={() => handleAddQuestions(questionnaire._id)}
                  title="Add Questions"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                </button>
                <button
                  className="action-button bg-red-100 hover:bg-red-200 text-red-700 p-2 rounded"
                  onClick={() => handleDeleteQuestionnaire(questionnaire._id)}
                  title="Delete Questionnaire"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  className="action-button bg-green-100 hover:bg-green-200 text-green-700 p-2 rounded"
                  onClick={() => handleEditClick(questionnaire)}
                  title="Edit Questionnaire"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  className="action-button bg-purple-100 hover:bg-purple-200 text-purple-700 p-2 rounded"
                  onClick={() => handleAddTags(questionnaire._id)}
                  title="Add Tags"
                >
                  <Tag className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Add New Questionnaire</h3>
            <form onSubmit={handleAddNewQuestionnaire}>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={newQuestionnaire.name}
                  onChange={(e) => setNewQuestionnaire({
                    ...newQuestionnaire,
                    name: e.target.value
                  })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Author</label>
                <textarea
                  value={newQuestionnaire.author}
                  onChange={(e) => setNewQuestionnaire({
                    ...newQuestionnaire,
                    author: e.target.value
                  })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Category</label>
                <input
                  type="text"
                  value={newQuestionnaire.category}
                  onChange={(e) => setNewQuestionnaire({
                    ...newQuestionnaire,
                    category: e.target.value
                  })}
                />
              </div>
              <div className="modal-buttons">
                <button
                  type="button"
                  className="action-button"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="add-button">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showEditModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Edit Questionnaire</h3>
            <form onSubmit={handleEditQuestionnaire}>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={editingQuestionnaire.name}
                  onChange={(e) => setEditingQuestionnaire({
                    ...editingQuestionnaire,
                    name: e.target.value
                  })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Author</label>
                <textarea
                  value={editingQuestionnaire.author}
                  onChange={(e) => setEditingQuestionnaire({
                    ...editingQuestionnaire,
                    author: e.target.value
                  })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Category</label>
                <input
                  type="text"
                  value={editingQuestionnaire.category}
                  onChange={(e) => setEditingQuestionnaire({
                    ...editingQuestionnaire,
                    category: e.target.value
                  })}
                />
              </div>
              <div className="modal-buttons">
                <button
                  type="button"
                  className="action-button"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="add-button">
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showTagModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Add Tag</h3>
            <form onSubmit={handleSaveTag}>
              <div className="form-group">
                <label>Tag</label>
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  required
                />
              </div>
              <div className="modal-buttons">
                <button
                  type="button"
                  className="action-button"
                  onClick={() => setShowTagModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="add-button">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}

export default AddQuestionnaire;