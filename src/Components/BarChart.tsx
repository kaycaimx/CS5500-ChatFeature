import React from "react";
import { VictoryChart, VictoryBar } from "victory";
import "./BarChart.css";

interface BarChartProps {
  data: [string, number][];
}

function BarChart({ data }: BarChartProps) {
  console.log("data", data);
  console.log("reverse data", data.reverse());
  const rawData = data.reverse();
  console.log("rawData", rawData);

  const mockData = [
    ["yina", 8],
    ["kay", 7],
  ].reverse();

  return (
    <div className="chartWrapper">
      <h2 className="chartHeader">Bar Chart</h2>
      <VictoryChart
        // theme={VictoryTheme.material}
        domainPadding={{ x: 10 }}
        style={{
          parent: {
            border: "1px solid #ccc",
          },
        }}
      >
        <VictoryBar
          horizontal
          style={{
            data: { fill: "#514caf" },
          }}
          data={mockData}
          x={0}
          y={1}
        />
      </VictoryChart>
    </div>
  );
}

export default BarChart;
