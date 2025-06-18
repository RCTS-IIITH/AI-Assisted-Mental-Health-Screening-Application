import { createSlice } from "@reduxjs/toolkit";

/** create reducer */
export const questionReducer = createSlice({
    name: 'questions',
    initialState: {
        queue: [],
        trace: 0
    },
    reducers: {
        startExamAction: (state, action) => {
            let { question } = action.payload;
            return {
                ...state,
                queue: question
            };
        },
        moveNextAction: (state) => {
            return {
                ...state,
                trace: state.trace + 1
            };
        },
        movePrevAction: (state) => {
            return {
                ...state,
                trace: state.trace - 1
            };
        },
        resetAllAction: () => {
            return {
                queue: [],
                trace: 0
            };
        }
    }
});

export const { startExamAction, moveNextAction, movePrevAction, resetAllAction } = questionReducer.actions;

export default questionReducer.reducer;
