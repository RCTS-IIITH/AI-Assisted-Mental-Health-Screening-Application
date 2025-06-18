import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { Provider } from 'react-redux';
// import { configureStore } from '@reduxjs/toolkit';
// import rootReducer from './slices';
import store from './redux/store';

// Get the root element from the DOM
const root = ReactDOM.createRoot(document.getElementById('root'));

// Render the app, ensuring it is wrapped with the Provider to pass the store
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);

// Measure performance (optional)
reportWebVitals();
