import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  sessionId: null,
  selectedChild: null
}

const questionnaireSlice = createSlice({
    name: 'questionnaire',
    initialState,
    reducers: {
        setSessionId: (state, action) => {
            state.sessionId = action.payload;
        },
        setSelected: (state, action) => {
            state.selectedChild = action.payload;
        }
    }
});

export const { setSessionId, setSelected } = questionnaireSlice.actions;

export const selectSessionId = (state) => state.questionnaire.sessionId;
export const selectSelected = (state) => state.questionnaire.selectedChild;

export default questionnaireSlice.reducer;
