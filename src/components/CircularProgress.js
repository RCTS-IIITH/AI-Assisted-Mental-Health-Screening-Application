import React from 'react';

const CircularProgress = ({ size = 100, strokeWidth = 10, percentage = 40 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Calculate the offset based on the percentage, filling clockwise from the bottom
  const progressOffset = circumference - (percentage / 100) * circumference;

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} className="circular-progress">
        {/* Background circle */}
        <circle
          stroke="#e0e0e0"
          strokeWidth={strokeWidth}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
        />
        {/* Foreground progress circle */}
        <circle
          stroke="#ffc107"
          strokeWidth={strokeWidth}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={progressOffset}
          style={{
            transition: 'stroke-dashoffset 0.35s',
            transform: 'rotate(90deg)', // Start filling from bottom
            transformOrigin: '50% 50%',
          }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '3vh', fontWeight: 'bold' }}>{percentage}%</div>
        <div style={{ color: '#ffc107', fontSize: '3vh' }}>Medium</div>
      </div>
    </div>
  );
};

export default CircularProgress;
