import React, { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { WishItem } from '../types';
import { CATEGORIES } from '../constants';

interface StatsViewProps {
  items: WishItem[];
}

export const StatsView: React.FC<StatsViewProps> = ({ items }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  // Use useMemo to process data efficiently
  const { data, totalValue } = useMemo(() => {
    // We do NOT filter by ACTIVE status here anymore, assuming the parent component 
    // passes the correct filtered list (e.g. including Completed if tab is Completed)
    
    const dataMap = d3.rollup(
      items,
      v => d3.sum(v, d => d.price),
      d => d.category
    );

    const processedData = Array.from(dataMap, ([category, value]) => ({
      category,
      value
    })).sort((a, b) => b.value - a.value);

    const total = d3.sum(processedData, d => d.value);

    return { data: processedData, totalValue: total };
  }, [items]);

  // Chart colors to be shared between D3 and the list
  const CHART_COLORS = ['#0ea5e9', '#f59e0b', '#10b981', '#ec4899', '#8b5cf6', '#ef4444', '#64748b'];

  useEffect(() => {
    if (!data.length || !svgRef.current) return;

    const width = 300;
    const height = 200;
    const radius = Math.min(width, height) / 2;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous

    const g = svg
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    const colorScale = d3.scaleOrdinal<string>()
      .domain(data.map(d => d.category))
      .range(CHART_COLORS);

    const pie = d3.pie<{ category: string; value: number }>()
      .value(d => d.value)
      .sort(null); // Keep data sort order

    const arc = d3.arc<d3.PieArcDatum<{ category: string; value: number }>>()
      .innerRadius(radius * 0.65)
      .outerRadius(radius);

    g.selectAll("path")
      .data(pie(data))
      .enter()
      .append("path")
      // @ts-ignore
      .attr("fill", d => colorScale(d.data.category))
      .attr("d", arc)
      .attr("stroke", "white")
      .style("stroke-width", "2px")
      .transition()
      .duration(500)
      .attrTween("d", function(d) {
          const i = d3.interpolate(d.startAngle+0.1, d.endAngle);
          return function(t) {
              d.endAngle = i(t);
              return arc(d) || "";
          }
      });

    // Center Text
    g.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "-0.2em")
      .style("font-size", "14px")
      .style("font-weight", "bold")
      .style("fill", "#94a3b8") // slate-400
      .style("font-family", '"Noto Serif TC", serif')
      .text("總計");

    g.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "1.2em")
      .style("font-size", "16px")
      .style("fill", "#334155") // slate-700
      .style("font-weight", "bold")
      .style("font-family", '"Noto Serif TC", serif')
      .text(`$${totalValue.toLocaleString()}`);

  }, [data, totalValue]);

  if (items.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-8 bg-white rounded-3xl border border-gray-100 shadow-sm mb-6 text-gray-400">
           <p className="text-sm">此分類無數據可顯示</p>
        </div>
      )
  }

  return (
    <div className="flex flex-col p-6 bg-white rounded-3xl border border-gray-100 shadow-sm mb-6">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-6 text-center">消費分析</h3>
      
      <div className="flex justify-center mb-8">
        <svg ref={svgRef}></svg>
      </div>

      <div className="space-y-3">
        {data.map((d, index) => {
            const percent = totalValue > 0 ? (d.value / totalValue) * 100 : 0;
            const config = CATEGORIES[d.category] || CATEGORIES['Other'];
            // Cycle through colors if categories exceed color palette length
            const colorHex = CHART_COLORS[index % CHART_COLORS.length];

            return (
                <div key={d.category} className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-3">
                        <div 
                          className="w-3 h-3 rounded-full shadow-sm" 
                          style={{ backgroundColor: colorHex }}
                        ></div>
                        <span className="text-sm font-bold text-gray-700">{config.label}</span>
                    </div>
                    <div className="text-right">
                        <div className="text-sm font-bold text-gray-900">${d.value.toLocaleString()}</div>
                        <div className="text-xs text-gray-400 font-medium">{percent.toFixed(1)}%</div>
                    </div>
                </div>
            );
        })}
      </div>
    </div>
  );
};