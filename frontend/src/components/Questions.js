import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

/** Custom Hook */
import { useFetchQuestion } from '../hooks/FetchQuestion';
import { updateResult } from '../hooks/setResult';

import './Questions.css';

export default function Questions({ onChecked, onTextInputChange, textInput }) {
    const [checked, setChecked] = useState(undefined);
    const { trace } = useSelector((state) => state.questions);

    const result = useSelector((state) => state.result.result);
    const [{ isLoading, apiData, serverError }] = useFetchQuestion();

    const questions = useSelector((state) => state.questions.queue[state.questions.trace]);
    const dispatch = useDispatch();

    const BASE_URL = process.env.REACT_APP_SERVER_HOSTNAME; // Your backend endpoint for serving images

    useEffect(() => {
        if (checked !== undefined) {
            dispatch(updateResult({ trace, checked }));
        }
    }, [checked, trace, dispatch]);

    function onSelect(i) {
        onChecked(i);
        setChecked(i);
    }

    function handleTextChange(e) {
        const inputValue = e.target.value;
        onTextInputChange(e);
        dispatch(updateResult({ trace, checked: inputValue }));
    }

    if (isLoading) return <h3 className='text-light'>Loading...</h3>;
    if (serverError) return <h3 className='text-light'>{serverError || 'Unknown Error'}</h3>;

    return (
        <div className='questions'>
            <div className='question-part'>
                <h2 className='question-text question-here'>{questions?.question_text}</h2>

                {/* Render the question image */}
                {questions?.question_image && (
                    <div className='question-image'>
                        <img
                            src={`${BASE_URL}${questions.question_image}`}
                            alt='Question'
                        />
                    </div>
                )}
            </div>

            {questions?.type === 'multiple_choice' ? (
                <ul className='ulQues' key={questions?._id}>
                    {questions?.options.map((q, i) => (
                        <li key={i} className={q.image ? 'li-with-image' : 'li-without-image'}>
                            <input
                                type='radio'
                                name='options'
                                id={`option-${i}`}
                                onChange={() => onSelect(i)}
                                className='inp-rad'
                            />
                            <label className='text-primary' htmlFor={`option-${i}`}>
                                {/* Render option image */}
                                {q.image && (
                                    <img
                                        src={`${BASE_URL}${q.image}`}
                                        alt={`Option ${i}`}
                                    />
                                )}
                                <div className='option-text'>{q.text}</div>
                            </label>
                            <div
                                className={`check ${result[trace] === i ? 'checked' : ''}`}
                            ></div>
                        </li>
                    ))}
                </ul>
            ) : questions?.type === 'text' ? (
                <div>
                    <textarea
                        className='write-description'
                        placeholder='Write here'
                        rows='4'
                        value={textInput}
                        onChange={handleTextChange}
                    ></textarea>
                </div>
            ) : (
                <p className='text-light'>
                    Unsupported question type: question type has to be 'text' or
                    'multiple_choice'
                </p>
            )}
        </div>
    );
}
