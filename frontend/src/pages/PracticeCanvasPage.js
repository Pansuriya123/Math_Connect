import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import DrawingCanvas from '../components/DrawingCanvas';
import { baseUrl } from '../Urls';

const PracticeCanvasPage = () => {
  const { questionId } = useParams();
  const navigate = useNavigate();
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        const res = await fetch(`${baseUrl}/api/question/${questionId}`, { credentials: 'include' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to load question');
        setQuestion(data.question || data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestion();
  }, [questionId]);

  return (
    <div className="answer-page">
      <Navbar />
      <div className="container">
        <h1 className="question-title">Practice Canvas</h1>
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          <div className="practice-container">
            <div className="question-preview">
              <button
                type="button"
                className="back-btn"
                onClick={() => navigate(`/answer/${questionId}`)}
                aria-label="Back to answers"
              >
                ← Back to Answers
              </button>
              <div className="question-card" style={{ cursor: 'pointer' }} onClick={() => navigate(`/answer/${questionId}`)}>
                <h3 style={{ marginTop: 8 }}>{question.title || 'Question'}</h3>
                <p>{question.question || ''}</p>
                {question.category && <p>Category: {question.category}</p>}
              </div>
            </div>
            <div className="practice-canvas-section">
              <h2>Your Workspace</h2>
              <DrawingCanvas />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PracticeCanvasPage;
