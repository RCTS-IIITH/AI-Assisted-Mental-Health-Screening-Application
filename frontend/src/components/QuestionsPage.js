import React, { useEffect, useState } from 'react'
import Questions from './Questions'
import Navbar from './Navbar'

import { MoveNextQuestion, MovePrevQuestion } from '../hooks/FetchQuestion';
import { PushAnswer, usePublishResult } from '../hooks/setResult';

/** redux store import */
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'  // Using useNavigate hook

import './QuestionsPage.css';

function createAnswers(queue, result) {
    return queue.map((item, index) => {
        return {
            question_id: item._id,
            answer: result[index]
        };
    });
}
function createResponse(queue, result, userId, questionnaireId, userType, childId) {
    const answers = createAnswers(queue, result);
    const response = {
        user_id: userId,
        questionnaire_id: questionnaireId,
        child_id: childId,
        user_type: userType,
        answers: answers,
    };
    return response;
}

export default function QuestionsPage() {
    const [check, setChecked] = useState(undefined)
    const [isOptionSelected, setIsOptionSelected] = useState(false);
    const [textInput, setTextInput] = useState('');
    const [isTextInputValid, setIsTextInputValid] = useState(false);

    const { userId, questionnaireId, childId, userType, result } = useSelector(state => state.result);
    const { queue, trace } = useSelector(state => state.questions);
    const dispatch = useDispatch()
    const submitResult = usePublishResult;

    const navigate = useNavigate();  // Initialize useNavigate hook

    useEffect(() => {
        // Reset input validation when trace changes
        setIsTextInputValid(false);
        setTextInput('');
        setIsOptionSelected(false);
        setChecked(undefined);
    }, [trace]);

    /** next button event handler */
    function onNext() {
        if (!isOptionSelected && !isTextInputValid) {
            alert('Please select an option before proceeding.');
            return; // Prevent moving to the next question if no option is selected
        }

        if (trace < queue.length) {
            dispatch(MoveNextQuestion());

            if (result.length <= trace) {
                dispatch(PushAnswer(check || textInput));
            }
        }

        setChecked(undefined);
        setTextInput('');
        setIsOptionSelected(false);
        setIsTextInputValid(false);
    }

    /** Prev button event handler */
    function onPrev() {
        if (trace > 0) {
            /** decrease the trace value by one using MovePrevQuestion */
            dispatch(MovePrevQuestion());
        }
    }

    function onChecked(check) {
        setChecked(check);
        setIsOptionSelected(true);
        setIsTextInputValid(false);
        console.log("l86 check = ", check);
        console.log("l87 isOptionSelected = ", isOptionSelected);
    }

    function handleTextInputChange(event) {
        const input = event.target.value;
        setTextInput(input);

        // Check if the input has at least 2 words
        const wordCount = input.trim().split(/\s+/).length;
        if (wordCount >= 1) {
            setIsTextInputValid(true);
            // setIsOptionSelected(false);
        } else {
            setIsTextInputValid(false);
            setIsOptionSelected(false);
        }
    }

    /** finished exam after the last question */
    if (result.length && result.length >= queue.length) {
        const response = createResponse(queue, result, userId, questionnaireId, userType, childId);
        submitResult(response);
        navigate('/thank-you');  // Using navigate function from useNavigate
        return null;  // No need to render anything after redirection
    }

    const isLastQuestion = trace === queue.length - 1;

    // useEffect()
    return (
        <div className='quiz-page'>
            <Navbar />
            <div className='container-QuestionsPage'>
                <Questions
                    onChecked={onChecked}
                    onTextInputChange={handleTextInputChange}
                    textInput={textInput}
                />
            </div>
            <div className='grid-QuestionsPage'>
                {trace > 0 ? <button className='btn-prev' onClick={onPrev}>Prev</button> : <div></div>}
                <button className='btn-next' onClick={onNext} disabled={!isOptionSelected && !isTextInputValid}>
                    {isLastQuestion ? 'Submit' : 'Next'}
                </button>
            </div>
        </div>
    )
}
