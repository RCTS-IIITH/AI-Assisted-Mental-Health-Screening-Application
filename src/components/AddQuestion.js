import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './AddQuestion.css';

const QuestionForm = () => {
  const { questionnaireId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    question_text: '',
    type: 'multiple_choice',
    tags: [],
    options: Array(5).fill({ text: '', image: null }),
    question_image: null,
    optionType: 'text',
    question_tag: '',
  });
  const [availableTags, setAvailableTags] = useState([]); // List of tags from backend
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [questionnaireName, setQuestionnaireName] = useState('');
  const [questionImagePreview, setQuestionImagePreview] = useState(null);

  useEffect(() => {
    const fetchQuestionnaireDetails = async () => {
      try {
        const response = await fetch(`http://localhost:5000/questionnaire/${questionnaireId}/view`);
        const data = await response.json();
        console.log(data);
        setQuestionnaireName(data.name);
      } catch (err) {
        setError('Failed to fetch questionnaire details');
      }
    };
    const fetchAvailableTags = async () => {
      try {
        const response = await fetch(`http://localhost:5000/questionnaire/${questionnaireId}/tags`);
        const data = await response.json();
        console.log("ghere")
        console.log(data)
        setAvailableTags(data.tags || []); // Assuming backend sends { tags: [...] }
      } catch (err) {
        setError('Failed to fetch tags');
      }
    };


    fetchQuestionnaireDetails();
    fetchAvailableTags();
  }, [questionnaireId]);

  const handleTypeChange = (newType) => {
    setFormData((prev) => ({
      ...prev,
      type: newType,
      options: newType === 'subjective' ? [] : Array(5).fill({ text: '', image: null }),
      optionType: 'text',
    }));
  };

  const handleOptionTypeChange = (newOptionType) => {
    setFormData((prev) => ({
      ...prev,
      optionType: newOptionType,
      options: Array(5).fill({ text: '', image: null }),
    }));
  };

  const handleQuestionImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        question_image: file,
      }));

      const previewUrl = URL.createObjectURL(file);
      setQuestionImagePreview(previewUrl);
    }
  };

  const removeQuestionImage = () => {
    setFormData((prev) => ({
      ...prev,
      question_image: null,
    }));
    if (questionImagePreview) {
      URL.revokeObjectURL(questionImagePreview);
      setQuestionImagePreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const filledOptions =
      formData.optionType === 'text'
        ? formData.options.filter((opt) => opt.text.trim() !== '')
        : formData.options.filter((opt) => opt.image !== null);

    if (formData.type === 'multiple_choice' && filledOptions.length < 2) {
      setError('Please provide at least two valid option.');
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append('question_text', formData.question_text);
    formDataToSend.append('type', formData.type);
    formDataToSend.append('questionnaire_id', questionnaireId);
    formDataToSend.append('option_type', formData.optionType);
    formDataToSend.append('question_tag', formData.question_tag);
    formData.tags.forEach((tag) => formDataToSend.append('tags', tag));

    if (formData.question_image) {
      formDataToSend.append('question_image', formData.question_image);
    }

    filledOptions.forEach((option, index) => {
      if (formData.optionType === 'text') {
        formDataToSend.append(`option_text_${index}`, option.text);
      } else {
        formDataToSend.append(`option_image_${index}`, option.image);
      }
    });

    try {
      const response = await fetch('http://localhost:5000/questions', {
        method: 'POST',
        body: formDataToSend,
      });

      if (response.ok) {
        setSuccess('Question added successfully!');
        setFormData({
          question_text: '',
          type: 'multiple_choice',
          tags: [],
          options: Array(5).fill({ text: '', image: null }),
          question_image: null,
          optionType: 'text',
          question_tag: '',
        });
        removeQuestionImage();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create question');
      }
    } catch (err) {
      setError('Failed to connect to server');
    }
  };

  const handleOptionChange = (index, field, value) => {
    const newOptions = [...formData.options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setFormData((prev) => ({
      ...prev,
      options: newOptions,
    }));
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white shadow-md rounded-lg">
        <div className="p-6">
          <h2 className="text-2xl font-semibold mb-4">Add Question to {questionnaireName}</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="text-red-600 bg-red-100 p-4 rounded-md">
                {error}
              </div>
            )}
            {success && (
              <div className="text-green-600 bg-green-100 p-4 rounded-md">
                {success}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="question_text" className="AddQuestion-Label block text-sm font-medium">
                Question Text
              </label>
              <input
                id="question_text"
                type="text"
                value={formData.question_text}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    question_text: e.target.value,
                  }))
                }
                required
                className="AddQuestionInp w-full border border-gray-300 p-2 rounded-md"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="question_tag" className="AddQuestion-Label block text-sm font-medium">
                Question Tag 
              </label>
              <select
                id="question_tag"
                value={formData.question_tag}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    question_tag: e.target.value,
                  }))
                }
                className="AddQuestionInp w-full border border-gray-300 p-2 rounded-md"
              >
                <option value="">Select a tag</option>
                {availableTags.map((tag, index) => (
                  <option key={index} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="AddQuestion-Label block text-sm font-medium">
                Question Image (Optional)
              </label>
              <div className="flex flex-col gap-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleQuestionImageChange}
                  className="AddQuestionInpFile border border-gray-300 p-2 rounded-md"
                />
                {questionImagePreview && (
                  <div className="relative">
                    <img
                      src={questionImagePreview}
                      alt="Question preview"
                      className="max-w-md h-auto rounded-md"
                    />
                    <button
                      type="button"
                      onClick={removeQuestionImage}
                      className="AddQuestion-Button absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 "
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="question_type" className="AddQuestion-Label block text-sm font-medium">
                Question Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="AddQuestionInp w-full border border-gray-300 p-2 rounded-md"
              >
                <option value="multiple_choice">Multiple Choice</option>
                <option value="subjective">Subjective</option>
              </select>
            </div>

            {formData.type === 'multiple_choice' && (
              <div className="space-y-2">
                <label className="AddQuestion-Label block text-sm font-medium">Option Type</label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => handleOptionTypeChange('text')}
                    className={`AddQuestion-Button p-2 rounded-md ${
                      formData.optionType === 'text'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    Text Options
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOptionTypeChange('image')}
                    className={`AddQuestion-Button p-2 rounded-md ${
                      formData.optionType === 'image'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    Image Options
                  </button>
                </div>

                {formData.optionType === 'text'
                  ? formData.options.map((option, index) => (
                      <div key={index} className="space-y-2">
                        <label
                          htmlFor={`option_text_${index}`}
                          className="AddQuestion-Label block text-sm font-medium"
                        >
                          Option {index + 1}
                        </label>
                        <input
                          id={`option_text_${index}`}
                          type="text"
                          value={option.text}
                          onChange={(e) =>
                            handleOptionChange(index, 'text', e.target.value)
                          }
                          className="AddQuestionInp w-full border border-gray-300 p-2 rounded-md"
                        />
                      </div>
                    ))
                  : formData.options.map((option, index) => (
                      <div key={index} className="space-y-2">
                        <label className="AddQuestion-Label block text-sm font-medium">
                          Option {index + 1} Image
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            handleOptionChange(index, 'image', e.target.files[0])
                          }
                          className="AddQuestionInpFile border border-gray-300 p-2 rounded-md"
                        />
                      </div>
                    ))}
              </div>
            )}

            <button
              type="submit"
              className="AddQuestion-Button w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
            >
              Add Question
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default QuestionForm;
