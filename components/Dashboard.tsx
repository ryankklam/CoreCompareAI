import React, { useState } from 'react';
import { ComparisonStats, ComparisonResult } from '../types';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { Activity, AlertTriangle, CheckCircle, FileText, RefreshCw, BarChart2 } from 'lucide-react';
import { generateExecutiveSummary } from '../services/geminiService';

interface DashboardProps {
  stats: ComparisonStats;
  results: ComparisonResult[];
  onFieldClick: (field: string) => void;
}

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6'];

const Dashboard: React.FC<DashboardProps> = ({ stats, results, onFieldClick }) => {
  const [summary, setSummary] = useState<string>("");
  const [loadingSummary, setLoadingSummary] = useState(false);

  const pieData = [
    { name: 'Matched', value: stats.matchCount },
    { name: 'Mismatch', value: stats.mismatchCount },
  ];

  const reasonData = Object.entries(stats.discrepancyBreakdown).map(([key, value]) => ({
    name: key,
    count: value,
  }));

  const fieldData = Object.entries(stats.fieldStats).map(([field, data]) => ({
    name: field,
    match: data.total - data.mismatch,
    mismatch: data.mismatch,
    total: data.total
  })).sort((a, b) => b.mismatch - a.mismatch); // Sort by most errors

  const handleGenerateSummary = async () => {
    setLoadingSummary(true);
    const mismatches = results.filter(r => r.type !== 'MATCH');
    const text = await generateExecutiveSummary(stats, mismatches);
    setSummary(text);
    setLoadingSummary(false);
  };

  // Custom Tick Component for Y-Axis to make labels clickable
  const CustomYAxisTick = (props: any) => {
    const { x, y, payload } = props;
    return (
      <g transform={`translate(${x},${y})`}>
        <text 
          x={-5} 
          y={4} 
          textAnchor="end" 
          fill="#4b5563" 
          fontSize={12}
          className="cursor-pointer hover:fill-blue-600 hover:font-bold hover:underline transition-all duration-200"
          onClick={() => onFieldClick(payload.value)}
        >
          {payload.value}
        </text>
      </g>
    );
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <FileText size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Records</p>
            <h3 className="text-2xl font-bold text-gray-800">{stats.totalRecords}</h3>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-lg">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Match Rate</p>
            <h3 className="text-2xl font-bold text-gray-800">{stats.matchRate.toFixed(2)}%</h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-red-50 text-red-600 rounded-lg">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Records with Gaps</p>
            <h3 className="text-2xl font-bold text-gray-800">{stats.mismatchCount}</h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Time Taken</p>
            <h3 className="text-2xl font-bold text-gray-800">0.8s</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Field Level Analysis (NEW) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <BarChart2 size={20} className="text-blue-500"/>
              Field Level Discrepancy Analysis
            </h3>
            <span className="text-xs text-gray-500">Shows mismatch count per field. Click bar or label to view details.</span>
          </div>
          <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fieldData} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={true} />
                <XAxis type="number" hide />
                <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={140} 
                    tick={<CustomYAxisTick />}
                    interval={0}
                />
                <Tooltip 
                  cursor={{ fill: '#f3f4f6' }} 
                  formatter={(value: number, name: string) => [value, name === 'mismatch' ? 'Gaps' : 'Matches']}
                />
                <Legend />
                <Bar 
                    dataKey="match" 
                    stackId="a" 
                    fill="#10b981" 
                    radius={[0, 4, 4, 0]} 
                    name="Matched" 
                    barSize={20} 
                />
                <Bar 
                    dataKey="mismatch" 
                    stackId="a" 
                    fill="#ef4444" 
                    radius={[0, 4, 4, 0]} 
                    name="Gaps" 
                    barSize={20}
                    cursor="pointer"
                    onClick={(data) => {
                        if (data && data.name) onFieldClick(data.name);
                    }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Reason Breakdown Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Discrepancy Root Causes</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reasonData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#f3f4f6' }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Match Ratio Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Overall Record Integrity</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* AI Summary Section */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-xl border border-indigo-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-indigo-900 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
            AI Executive Summary
          </h3>
          <button 
            onClick={handleGenerateSummary}
            disabled={loadingSummary}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 text-sm font-medium"
          >
            {loadingSummary ? <RefreshCw className="animate-spin" size={16}/> : <FileText size={16}/>}
            Generate Report
          </button>
        </div>
        
        {summary ? (
          <div className="prose prose-sm text-gray-700 max-w-none bg-white/50 p-4 rounded-lg">
             <div className="whitespace-pre-line">{summary}</div>
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic">Click "Generate Report" to have Gemini analyze the current migration statistics and risk factors.</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;