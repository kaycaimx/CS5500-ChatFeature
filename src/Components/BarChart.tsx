import React from "react";
import { VictoryChart, VictoryBar } from "victory";
import "./BarChart.css";

interface BarChartProps {
  data: [string, number][];
}

function BarChart({ data }: BarChartProps) {
  let reverseData = [...data].reverse();

  return (
    <div className="chartWrapper">
      <h2 className="chartHeader">Top 10 Active Users</h2>
      <VictoryChart
        // theme={VictoryTheme.material}
        domainPadding={20}
        //domainPadding={{ x: 10 }}
        // padding={{ top: 0, bottom: 50, left: 50, right: 50 }}
      >
        <VictoryBar
          horizontal
          style={{
            data: { fill: "#514caf" },
          }}
          data={reverseData}
          labels={({ datum }) => datum[1] + " msgs"}
          x={0}
          y={1}
        />
      </VictoryChart>
    </div>
  );
}

export default BarChart;
