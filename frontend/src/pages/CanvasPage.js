import React from 'react';
import Navbar from '../components/Navbar';
import DrawingCanvas from '../components/DrawingCanvas';

const CanvasPage = () => {
  return (
    <div className="answer-page">
      <Navbar />
      <div className="container">
        <h1 className="question-title">Practice Canvas</h1>
        <div className="practice-container">
          <div className="practice-canvas-section" style={{ width: '100%' }}>
            <DrawingCanvas />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CanvasPage;
