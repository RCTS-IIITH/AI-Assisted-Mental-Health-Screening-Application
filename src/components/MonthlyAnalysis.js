import React from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

function MonthlyAnalysis() {
  const data = {
    labels: ["High", "Medium", "Low"],
    datasets: [
      {
        label: "Responses",
        data: [60, 20, 20],
        backgroundColor: ["#FF6B6B", "#FFD93D", "#4CAF50"],
        hoverOffset: 4,
      },
    ],
  };

  return (
    <div className="monthly-analysis">
      <div className="chart-wrapper">
        <Doughnut data={data} />
      </div>
      <h3 className="chart-title">Monthly Analysis</h3>
      <div className="legend">
        <span className="legend-item high">High</span>
        <span className="legend-item medium">Medium</span>
        <span className="legend-item low">Low</span>
      </div>
    </div>
  );
}

export default MonthlyAnalysis;
