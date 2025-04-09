import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getServerData } from "../helper/helper";
import * as Action from '../redux/question_reducer';

/** fetch question hook to fetch api data and set value to store */
export const useFetchQuestion = () => {
    const dispatch = useDispatch();
    const [getData, setGetData] = useState({
        isLoading: false,
        apiData: [],
        serverError: null
    });
    const questionnaireId = useSelector(state => state.result.questionnaireId);

    useEffect(() => {
        if (!questionnaireId) {
            setGetData(prev => ({ ...prev, serverError: "Questionnaire ID is not available." }));
            return;
        }

        setGetData(prev => ({ ...prev, isLoading: true }));

        (async () => {
            try {
                const questionData = await getServerData(`http://127.0.0.1:5000/questionnaire/${questionnaireId}/questions`, (data) => data);

                if (questionData.length > 0) {
                    setGetData(prev => ({ ...prev, isLoading: false, apiData: questionData }));

                    /** dispatch an action */
                    dispatch(Action.startExamAction({ question: questionData }));
                } else {
                    throw new Error("No Question Available");
                }
            } catch (error) {
                setGetData(prev => ({ ...prev, isLoading: false }));
                setGetData(prev => ({ ...prev, serverError: error.message || "An unknown error occurred" }));
            }
        })();
    }, [dispatch, questionnaireId]);

    return [getData, setGetData];
};

/** MoveAction Dispatch function */
export const MoveNextQuestion = () => async (dispatch) => {
    try {
        dispatch(Action.moveNextAction()); /** increase trace by 1 */
    } catch (error) {
        console.log(error);
    }
};

/** PrevAction Dispatch function */
export const MovePrevQuestion = () => async (dispatch) => {
    try {
        dispatch(Action.movePrevAction()); /** decrease trace by 1 */
    } catch (error) {
        console.log(error);
    }
};
