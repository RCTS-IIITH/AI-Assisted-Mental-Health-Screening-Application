import React from 'react';

const InteractionSummary = ({ summary }) => {
  return (
    <div className="interaction-summary">
      <h2>Interaction Summary:</h2>
      <p>
        {summary}
      </p>
      {/* <button className="view-chat-button">View Chat</button> */}
    </div>
  );
};

export default InteractionSummary;