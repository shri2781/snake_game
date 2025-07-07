import './Score.css';

function Score({ score }) {
  return (
    <div className="score-container">
      <div className="score">Score: {score}</div>
    </div>
  );
}

export default Score;