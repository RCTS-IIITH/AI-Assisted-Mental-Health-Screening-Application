import { postServerData } from '../helper/helper'
import * as Action from '../redux/result_reducer'

export const PushAnswer = (result) => async (dispatch) => {
    try {
        await dispatch(Action.pushResultAction(result))
    } catch (error) {
        console.log(error)
    }
}
export const updateResult = (index) => async (dispatch) => {
    try {
        dispatch(Action.updateResultAction(index));
    } catch (error) {
        console.log(error)
    }
}

export const usePublishResult = (resultData) => {
    (async () => {
        try {
            console.log("l23 setResult.js")
            console.log(resultData)
            await postServerData(`http://127.0.0.1:5000/responses`, resultData, data => data)
        } catch (error) {
            console.log(error)
        }
    })();
}