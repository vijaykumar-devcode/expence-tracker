import React from 'react';
import { categoryColors } from './Icons';
import './CategoryChart.css';

const CategoryChart = ({ data = [], totalAmount = 0 }) => {
  const allCategories = ['Food', 'Travel', 'Shopping', 'Bills', 'Health', 'Education', 'Other'];

  // Merge API data with all categories to ensure all show up
  const chartData = allCategories.map((cat) => {
    const found = data.find((d) => d.category === cat);
    return {
      category: cat,
      total: found ? found.total : 0,
    };
  });

  const total = totalAmount || chartData.reduce((sum, d) => sum + d.total, 0);

  // SVG donut chart calculations
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  let cumulativeOffset = 0;

  const segments = chartData
    .filter((d) => d.total > 0)
    .map((d) => {
      const percentage = total > 0 ? (d.total / total) * 100 : 0;
      const dashLength = (percentage / 100) * circumference;
      const segment = {
        category: d.category,
        total: d.total,
        percentage,
        dashArray: `${dashLength} ${circumference - dashLength}`,
        dashOffset: -cumulativeOffset,
        color: categoryColors[d.category]?.color || '#6B7280',
      };
      cumulativeOffset += dashLength;
      return segment;
    });

  return (
    <div className="category-chart">
      <div className="category-chart-donut">
        <svg viewBox="0 0 200 200" className="category-chart-svg">
          {/* Background circle */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="#F1F5F9"
            strokeWidth="24"
          />
          {/* Data segments */}
          {segments.map((seg, i) => (
            <circle
              key={seg.category}
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth="24"
              strokeDasharray={seg.dashArray}
              strokeDashoffset={seg.dashOffset}
              strokeLinecap="butt"
              transform="rotate(-90 100 100)"
              className="category-chart-segment"
            />
          ))}
          {/* Center text */}
          <text x="100" y="94" textAnchor="middle" className="category-chart-center-amount">
            ₹ {total.toLocaleString('en-IN')}
          </text>
          <text x="100" y="114" textAnchor="middle" className="category-chart-center-label">
            This Month
          </text>
        </svg>
      </div>

      <div className="category-chart-legend">
        {chartData.map((d) => {
          const percentage = total > 0 ? Math.round((d.total / total) * 100) : 0;
          return (
            <div key={d.category} className="category-chart-legend-item">
              <span
                className="category-chart-legend-dot"
                style={{ backgroundColor: categoryColors[d.category]?.color || '#6B7280' }}
              />
              <span className="category-chart-legend-name">{d.category}</span>
              <span className="category-chart-legend-amount">
                ₹ {d.total.toLocaleString('en-IN')}
              </span>
              <span className="category-chart-legend-pct">{percentage}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryChart;
