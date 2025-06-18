import { createSlice } from "@reduxjs/toolkit"

export const resultReducer = createSlice({
    name: 'result',
    initialState: {
        userId: null,
        childId: null,
        questionnaireId: null,
        userType: null,
        schoolName: null,
        result: []
    },
    reducers: {
        setUserId: (state, action) => {
            state.userId = action.payload
        },
        setChildId: (state, action) => {
            state.childId = action.payload
        },
        setUserType: (state, action) => {
            state.userType = action.payload
        },
        setQuestionnaireId: (state, action) => {
            state.questionnaireId = action.payload
        },
        setSchoolName: (state, action) => {
            state.schoolName = action.payload
        },
        pushResultAction: (state, action) => {
            state.result.push(action.payload)
        },
        updateResultAction: (state, action) => {
            const { trace, checked } = action.payload;
            state.result.fill(checked, trace, trace + 1)
        },
        resetResultAction: () => {
            return {
                userId: null,
                childId: null,
                userType: null,
                schoolName: null,
                questionnaireId: null,
                result: []
            }
        }
    }
})

export const { setUserId, setChildId, setUserType, setQuestionnaireId, setSchoolName, pushResultAction, resetResultAction, updateResultAction } = resultReducer.actions;

export default resultReducer.reducer;
