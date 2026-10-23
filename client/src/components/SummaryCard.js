import React from 'react';
import './SummaryCard.css';

const SummaryCard = ({ icon, title, value, subtitle, iconBg }) => {
  return (
    <div className="summary-card">
      <div className="summary-card-icon" style={{ backgroundColor: iconBg }}>
        {icon}
      </div>
      <p className="summary-card-title">{title}</p>
      <p className="summary-card-value">{value}</p>
      <p className="summary-card-subtitle">{subtitle}</p>
    </div>
  );
};

export default SummaryCard;
