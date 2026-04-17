import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import ProfilePhoto from '../components/ProfilePhoto';
import './Leaderboard.css';
import { baseUrl } from '../Urls';

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/user/leaderboard`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data.leaderboard);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="math-loading">
          <span>∫</span>
          <span>∑</span>
          <span>∂</span>
          <span>∞</span>
        </div>
      </div>
    );
  }

  return (
    <div className="leaderboard-page">
      <Navbar />
      <div className="container">
        <h1 className="leaderboard-title">Top Math Crafters</h1>
        <div className="leaderboard-container">
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>User</th>
                <th>Level</th>
                <th>XP</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((user, index) => (
                <tr key={user.id} className={index < 3 ? `rank-${index + 1}` : ''}>
                  <td>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                  </td>
                  <td className="user-cell">
                    <ProfilePhoto 
                      profilePhoto={user.profile_photo}
                      alt={user.username}
                      size="small"
                      showInitials={true}
                      userName={user.username}
                    />
                    <span className="username">{user.username}</span>
                  </td>
                  <td>
                    <span className="level-badge">Lvl {user.level || 1}</span>
                  </td>
                  <td>
                    <span className="xp-value">{user.xp || 0} XP</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
