import React from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import POSPage from './components/POSPage';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import Main from './components/main';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Main />} />
          <Route path="/POSPage" element={<POSPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;