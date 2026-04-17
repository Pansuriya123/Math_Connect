import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import MathRenderer from '../components/MathRenderer';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './Answer.css';
import { baseUrl } from '../Urls';

const Answer = () => {
  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [newAnswer, setNewAnswer] = useState('');
  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSolution, setAiSolution] = useState('');
  const { questionId } = useParams();
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchQuestionAndAnswers();
    fetchCurrentUser();
  }, [questionId]);

  const handleAiSolve = async () => {
    if (!question) return;
    setIsAiLoading(true);
    setAiSolution('');
    try {
      const response = await fetch(`${baseUrl}/api/ai/solve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: question.title,
          category: question.category,
          image: question.image // Send the question's image if it exists
        }),
        credentials: 'include',
      });
      const data = await response.json();
      if (response.ok) {
        setAiSolution(data.solution);
      } else {
        throw new Error(data.message || 'AI solve failed');
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setIsAiLoading(false);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/user/current`, {
        credentials: 'include',
      });
      const data = await response.json();
      setCurrentUser(data.user);
    } catch (err) {
      setError(`Failed to load user: ${err.message}`);
    }
  };

  const fetchQuestionAndAnswers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${baseUrl}/api/answer/${questionId}`, {
        method: 'GET',
        credentials: 'include',
      });
      const data = await response.json();
      if (response.ok) {
        setQuestion(data.question || null);
        const ans = data.answers || [];
        setAnswers(ans);
        const loadedComments = {};
        for (const a of ans) {
          loadedComments[a.answerId] = await fetchCommentsForAnswer(a.answerId);
        }
        setComments(loadedComments);
      } else {
        throw new Error(data.message || 'Failed to fetch question and answers');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAnswer = async (answerId) => {
    if (!window.confirm('Delete this answer?')) return;
    try {
      const response = await fetch(`${baseUrl}/api/answer/delete/${answerId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to delete the answer');
      setAnswers((prev) => prev.filter((a) => a.answerId !== answerId));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleVote = async (answerId, voteType) => {
    try {
      const response = await fetch(`${baseUrl}/api/answer/${answerId}/${voteType}`, {
        method: 'PATCH',
        credentials: 'include',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || `Failed to ${voteType} answer`);
      fetchQuestionAndAnswers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newAnswer.trim()) {
      setError('Answer cannot be empty');
      return;
    }
    try {
      const response = await fetch(`${baseUrl}/api/answer/${questionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer: newAnswer }),
        credentials: 'include',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to submit answer');
      setNewAnswer('');
      fetchQuestionAndAnswers();
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchCommentsForAnswer = async (answerId) => {
    try {
      const response = await fetch(`${baseUrl}/api/comment/${answerId}`, {
        method: 'GET',
        credentials: 'include',
      });
      const data = await response.json();
      if (response.ok) {
        return data.comments || [];
      }
      return [];
    } catch {
      return [];
    }
  };

  const handleSubmitComment = async (answerId, e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const response = await fetch(`${baseUrl}/api/comment/${answerId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content: newComment }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to post comment');
      setNewComment('');
      const updated = await fetchCommentsForAnswer(answerId);
      setComments((prev) => ({ ...prev, [answerId]: updated }));
    } catch (err) {
      alert(err.message);
    }
  };

  const modules = {
    toolbar: [
      [{ header: [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
      ['link', 'image'],
      ['clean'],
    ],
  };

  const formats = ['header', 'bold', 'italic', 'underline', 'strike', 'blockquote', 'list', 'bullet', 'indent', 'link', 'image'];

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="math-loading">
          <span>∫</span>
          <span>∑</span>
          <span>∏</span>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="error-message">Error: {error}</div>;
  }

  return (
    <div className="answer-page">
      <Navbar />
      <div className="container">
        <h1 className="question-title">{question ? <MathRenderer text={question.title} /> : 'Question not found'}</h1>
        
        <div className="ai-tutor-section">
          <button 
            className={`ai-solve-button ${isAiLoading ? 'loading' : ''}`}
            onClick={handleAiSolve}
            disabled={isAiLoading}
          >
            {isAiLoading ? 'AI is thinking...' : '✨ Ask AI Tutor for Step-by-Step Solution'}
          </button>
          {aiSolution && (
            <div className="ai-solution-card">
              <h3>AI Tutor Solution</h3>
              <div className="ai-solution-content">
                <MathRenderer text={aiSolution} />
              </div>
            </div>
          )}
        </div>

        <div className="answers-list">
          <h2>Answers</h2>
          {answers.length > 0 ? (
            answers.map((answer) => (
              <div key={answer.answerId} className="answer-card">
                <div className="answer-content" dangerouslySetInnerHTML={{ __html: answer.answer }} />
                {answer.image && <img src={answer.image} alt="Answer illustration" className="answer-image" />}
                <div className="answer-meta">
                  <p>By: {answer.user}</p>
                  <p>Posted on: {answer.createdAt ? new Date(answer.createdAt).toLocaleDateString() : 'Date not available'}</p>
                </div>
                <div className="vote-buttons">
                  <button onClick={() => handleVote(answer.answerId, 'upvote')} className="vote-button upvote">
                    Upvote ({answer.upvotes})
                  </button>
                  <button onClick={() => handleVote(answer.answerId, 'downvote')} className="vote-button downvote">
                    Downvote ({answer.downvotes})
                  </button>
                </div>
               
                {currentUser && currentUser.username === answer.user && (
                  <div className="delete-section">
                    <button className="submit-button" onClick={() => handleDeleteAnswer(answer.answerId)}>
                      Delete Answer
                    </button>
                  </div>
                )}
                <div className="comments-section">
                  <h3>Comments</h3>
                  {comments[answer.answerId] && comments[answer.answerId].length > 0 ? (
                    comments[answer.answerId].map((comment) => (
                      <div key={comment._id} className="comment-card">
                        <div className="comment-meta">
                          <p className="comment-author">By: {comment.username}</p>
                          <p className="comment-date">
                            Posted on: {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString() : 'Date not available'}
                          </p>
                        </div>
                        <p className="comment-content"><MathRenderer text={comment.content} /></p>
                      </div>
                    ))
                  ) : (
                    <p className="no-comments">No comments yet.</p>
                  )}
                  <form onSubmit={(e) => handleSubmitComment(answer.answerId, e)}>
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment"
                    />
                    <button type="submit">Comment</button>
                  </form>
                </div>
              </div>
            ))
          ) : (
            <p className="no-answers">No answers yet.</p>
          )}
        </div>

        <div className="practice-canvas-section">
          <h2>Practice Canvas</h2>
          <p>You can practice and sketch your solution steps here.</p>
          <button className="submit-button" onClick={() => navigate(`/practice/${questionId}`)}>Open Practice Canvas</button>
        </div>

        <div className="answer-form">
          <h2>Your Answer</h2>
          <form onSubmit={handleSubmit}>
            <ReactQuill value={newAnswer} onChange={setNewAnswer} modules={modules} formats={formats} />
            <button type="submit" className="submit-button">
              Submit Answer
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Answer;
