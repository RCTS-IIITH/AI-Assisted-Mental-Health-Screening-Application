import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  children: [],
  loading: false,
  error: null,
  selectedChild: null
}

const childrenSlice = createSlice({
  name: 'children',
  initialState,
  reducers: {
    // Set loading state
    setLoading: (state, action) => {
      state.loading = action.payload
    },
    
    // Set error state
    setError: (state, action) => {
      state.error = action.payload
    },
    
    // Set children data
    setChildren: (state, action) => {
      state.children = action.payload
      state.loading = false
      state.error = null
    },
    
    // Add a new child
    addChild: (state, action) => {
      state.children.push(action.payload)
      state.error = null
    },
    
    // Remove a child
    removeChild: (state, action) => {
      state.children = state.children.filter(child => child._id !== action.payload)
      if (state.selectedChild === action.payload) {
        state.selectedChild = null
      }
    },
    
    // Update a child
    updateChild: (state, action) => {
      const { childId, updatedData } = action.payload
      const index = state.children.findIndex(child => child._id === childId)
      if (index !== -1) {
        state.children[index] = { ...state.children[index], ...updatedData }
      }
    },
    
    // Set selected child
    setSelectedChild: (state, action) => {
      state.selectedChild = action.payload
    },
    
    // Clear children data (useful for logout)
    clearChildren: (state) => {
      state.children = []
      state.selectedChild = null
      state.error = null
      state.loading = false
    }
  }
})

// Export actions
export const {
  setLoading,
  setError,
  setChildren,
  addChild,
  removeChild,
  updateChild,
  setSelectedChild,
  clearChildren
} = childrenSlice.actions

// Selectors
export const selectChildren = (state) => state.children.children
export const selectChildrenLoading = (state) => state.children.loading
export const selectChildrenError = (state) => state.children.error
export const selectSelectedChild = (state) => state.children.selectedChild
export const selectChildById = (state, childId) => 
  state.children.children.find(child => child._id === childId)

// Export reducer
export default childrenSlice.reducer