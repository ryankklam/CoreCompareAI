import React, { useState, useMemo } from 'react';
import { ComparisonStats, ComparisonResult } from '../types';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { Activity, AlertTriangle, CheckCircle, FileText, RefreshCw, BarChart2, Filter, X, ArrowRight } from 'lucide-react';
import { generateExecutiveSummary } from '../services/geminiService';
import { useLanguage } from '../contexts/LanguageContext';
import { REASON_DICTIONARY } from '../constants';

interface DashboardProps {
  stats: ComparisonStats;
  results: ComparisonResult[];
  onFieldClick: (field: string) => void;
}

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6'];

const Dashboard: React.FC<DashboardProps> = ({ stats, results, onFieldClick }) => {
  const { t, language } = useLanguage();
  const [summary, setSummary] = useState<string>("");
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [selectedField, setSelectedField] = useState<string | null>(null);

  // Calculate statistics dynamically based on selection
  const displayedStats = useMemo(() => {
    if (!selectedField) return stats;

    const fieldStat = stats.fieldStats[selectedField];
    // Safety check if field stat doesn't exist
    if (!fieldStat) return stats;

    // Recalculate breakdown for the specific field
    const breakdown: Record<string, number> = {};
    results.forEach(r => {
      // Only count reasons if this specific field has a diff
      if (r.diffs.includes(selectedField)) {
        const reason = r.reasonCode || 'Unclassified';
        breakdown[reason] = (breakdown[reason] || 0) + 1;
      }
    });

    return {
      totalRecords: fieldStat.total, // Total records containing this field
      matchCount: fieldStat.total - fieldStat.mismatch,
      mismatchCount: fieldStat.mismatch,
      matchRate: fieldStat.total > 0 ? ((fieldStat.total - fieldStat.mismatch) / fieldStat.total) * 100 : 0,
      discrepancyBreakdown: breakdown,
      fieldStats: stats.fieldStats // Keep original field stats for the main chart
    };
  }, [selectedField, stats, results]);

  const pieData = [
    { name: t('dashboard.matched'), value: displayedStats.matchCount },
    { name: 'Mismatch', value: displayedStats.mismatchCount },
  ];

  const reasonData = Object.entries(displayedStats.discrepancyBreakdown).map(([key, value]) => {
    // Get translated label for the reason code if available
    const label = (REASON_DICTIONARY[key] && (language === 'zh' ? REASON_DICTIONARY[key].label_zh : REASON_DICTIONARY[key].label)) || key;
    return {
      name: label,
      count: value,
    };
  });

  const fieldData = Object.entries(stats.fieldStats).map(([field, data]) => ({
    name: field,
    match: data.total - data.mismatch,
    mismatch: data.mismatch,
    total: data.total
  })).sort((a, b) => b.mismatch - a.mismatch); // Sort by most errors

  const handleGenerateSummary = async () => {
    setLoadingSummary(true);
    // If filtered, pass only relevant discrepancies to AI
    const relevantResults = selectedField 
        ? results.filter(r => r.diffs.includes(selectedField))
        : results.filter(r => r.type !== 'MATCH');

    const text = await generateExecutiveSummary(displayedStats, relevantResults, language);
    setSummary(text);
    setLoadingSummary(false);
  };

  const handleChartClick = (data: any) => {
    if (data && data.name) {
       // Toggle selection
       setSelectedField(prev => prev === data.name ? null : data.name);
       setSummary(""); // Reset summary as context changed
    }
  };

  // Custom Tick Component for Y-Axis to make labels clickable
  const CustomYAxisTick = (props: any) => {
    const { x, y, payload } = props;
    const isSelected = payload.value === selectedField;
    return (
      <g transform={`translate(${x},${y})`}>
        <text 
          x={-5} 
          y={4} 
          textAnchor="end" 
          fill={isSelected ? "#2563eb" : "#4b5563"} 
          fontWeight={isSelected ? "bold" : "normal"}
          fontSize={12}
          className="cursor-pointer hover:fill-blue-600 hover:font-bold hover:underline transition-all duration-200"
          onClick={() => {
             setSelectedField(prev => prev === payload.value ? null : payload.value);
             setSummary("");
          }}
        >
          {payload.value}
        </text>
      </g>
    );
  };

  // Custom Tooltip for Field Analysis to make "Gaps" red
  const FieldAnalysisTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-100 shadow-lg rounded-lg text-sm">
          {payload.map((entry: any, index: number) => {
             const isGaps = entry.name === t('dashboard.gaps');
             const color = isGaps ? '#ef4444' : '#10b981';
             return (
                 <div key={index} className="flex items-center gap-2 py-1">
                     <div 
                        className="w-2.5 h-2.5 rounded-full" 
                        style={{ backgroundColor: entry.color }}
                     ></div>
                     <span 
                        style={{ 
                            color: isGaps ? '#ef4444' : '#374151',
                            fontWeight: isGaps ? 600 : 400
                        }}
                     >
                        {entry.name}:
                     </span>
                     <span className="font-mono font-medium text-gray-700">
                        {entry.value}
                     </span>
                 </div>
             );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in relative">
      
      {/* Filter Banner */}
      {selectedField && (
        <div className="bg-blue-600 text-white px-4 py-3 rounded-xl flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2">
                <Filter size={20} />
                <span className="font-medium">{t('dashboard.filter_banner')} <span className="font-bold">{selectedField}</span></span>
            </div>
            <div className="flex items-center gap-3">
                <button 
                    onClick={() => onFieldClick(selectedField)}
                    className="flex items-center gap-1 text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors"
                >
                    {t('dashboard.view_details')} <ArrowRight size={14} />
                </button>
                <button 
                    onClick={() => setSelectedField(null)}
                    className="p-1 hover:bg-white/20 rounded-full transition-colors"
                >
                    <X size={20} />
                </button>
            </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <FileText size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">{selectedField ? `Total ${selectedField}` : t('dashboard.total_records')}</p>
            <h3 className="text-2xl font-bold text-gray-800">{displayedStats.totalRecords}</h3>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-lg">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">{t('dashboard.match_rate')}</p>
            <h3 className="text-2xl font-bold text-gray-800">{displayedStats.matchRate.toFixed(2)}%</h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-red-50 text-red-600 rounded-lg">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">{selectedField ? t('dashboard.gaps_detected') : t('dashboard.records_with_gaps')}</p>
            <h3 className="text-2xl font-bold text-gray-800">{displayedStats.mismatchCount}</h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">{t('dashboard.processing_time')}</p>
            <h3 className="text-2xl font-bold text-gray-800">0.8s</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Field Level Analysis */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <BarChart2 size={20} className="text-blue-500"/>
              {t('dashboard.field_analysis')}
            </h3>
            <span className="text-xs text-gray-500 hidden sm:inline">
                {selectedField ? t('dashboard.field_analysis_hint_active') : t('dashboard.field_analysis_hint')}
            </span>
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
                  content={<FieldAnalysisTooltip />}
                />
                <Legend 
                  formatter={(value, entry) => (
                      <span style={{ color: value === t('dashboard.gaps') ? '#ef4444' : '#374151', fontWeight: 500 }}>{value}</span>
                  )}
                />
                <Bar 
                    dataKey="match" 
                    stackId="a" 
                    fill="#10b981" 
                    radius={[4, 0, 0, 4]} 
                    name={t('dashboard.matched')} 
                    barSize={20} 
                />
                <Bar 
                    dataKey="mismatch" 
                    stackId="a" 
                    fill="#ef4444" // Add base fill for Legend icon
                    radius={[0, 4, 4, 0]} 
                    name={t('dashboard.gaps')} 
                    barSize={20}
                    cursor="pointer"
                    onClick={handleChartClick}
                >
                    {fieldData.map((entry, index) => (
                        <Cell 
                           key={`cell-${index}`} 
                           fill={selectedField && entry.name === selectedField ? '#b91c1c' : '#ef4444'} 
                        />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Reason Breakdown Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {selectedField ? `${t('dashboard.root_causes_for')} ${selectedField}` : t('dashboard.root_causes')}
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reasonData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} interval={0} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#f3f4f6' }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Match Ratio Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
             {selectedField ? `Integrity: ${selectedField}` : t('dashboard.integrity')}
          </h3>
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
                {/* Center Text for Match Rate */}
                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
                    <tspan x="50%" dy="-0.5em" fontSize="24" fontWeight="bold" fill="#1f2937">
                        {displayedStats.matchRate.toFixed(1)}%
                    </tspan>
                    <tspan x="50%" dy="1.5em" fontSize="12" fill="#6b7280" fontWeight="500">
                        {t('dashboard.match_rate')}
                    </tspan>
                </text>
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
            {t('dashboard.ai_summary')} {selectedField ? `(${selectedField})` : ''}
          </h3>
          <button 
            onClick={handleGenerateSummary}
            disabled={loadingSummary}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 text-sm font-medium shadow-sm"
          >
            {loadingSummary ? <RefreshCw className="animate-spin" size={16}/> : <FileText size={16}/>}
            {t('dashboard.generate_report')}
          </button>
        </div>
        
        {summary ? (
          <div className="prose prose-sm text-gray-700 max-w-none bg-white/50 p-4 rounded-lg border border-indigo-100/50">
             <div className="whitespace-pre-line leading-relaxed">{summary}</div>
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic">{t('dashboard.ai_placeholder')}</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;