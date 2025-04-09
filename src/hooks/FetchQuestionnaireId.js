import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { getServerData } from '../helper/helper';
import * as Action from '../redux/result_reducer';

export const useFetchQuestionnaireId = (userType) => {
    const dispatch = useDispatch();
    const [getData, setGetData] = useState({
        isLoading: false,
        apiData: [],
        serverError: null
    });

    useEffect(() => {
        if (userType) {
            setGetData(prev => ({ ...prev, isLoading: true }));
            const requestData = {
                user_type: userType.toLowerCase()
            };

            (async () => {
                try {
                    let url = `http://127.0.0.1:5000/questionnaire/active?user_type=${encodeURIComponent(requestData.user_type)}`;
                    const questionnaireData = await getServerData(url, (requestData) => requestData);
                    const questionnaireId = questionnaireData.questionnaire_id;

                    setGetData(prev => ({ ...prev, isLoading: false, apiData: questionnaireData }));

                } catch (error) {
                    setGetData(prev => ({ ...prev, isLoading: false }));
                    setGetData(prev => ({ ...prev, serverError: error.message || "An unknown error occurred" }));
                }
            })();
        }
    }, [dispatch, userType]);

    return [getData, setGetData];
};
