import React, { useState, useMemo } from 'react';
import { ComparisonResult, DiscrepancyType } from '../types';
import { REASON_DICTIONARY } from '../constants';
import { Search, AlertCircle, Check, ChevronRight, X, Sparkles, Filter, ChevronDown, ArrowLeft } from 'lucide-react';
import { analyzeDiscrepancyWithAI } from '../services/geminiService';
import { useLanguage } from '../contexts/LanguageContext';

interface ComparisonTableProps {
  results: ComparisonResult[];
  activeFieldFilter?: string | null;
  onFieldFilterChange: (field: string | null) => void;
}

const ComparisonTable: React.FC<ComparisonTableProps> = ({ results, activeFieldFilter, onFieldFilterChange }) => {
  const { t, language } = useLanguage();
  // Updated filter state to include dimensions: ALL, EXPECTED, UNKNOWN
  const [filter, setFilter] = useState<'ALL' | 'EXPECTED' | 'UNKNOWN'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<ComparisonResult | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<Record<string, string>>({});
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  // Determine columns dynamically from the first record (or selected schema)
  const allFields = useMemo(() => {
    if (results.length === 0) return [];
    const sample = results[0].oldRecord || results[0].newRecord;
    if (!sample) return [];
    // Exclude 'id' as we show it separately
    return Object.keys(sample).filter(key => key !== 'id');
  }, [results]);

  // Determine which columns to show in the detailed view
  const dynamicColumns = useMemo(() => {
    return allFields;
  }, [allFields]);

  const filteredResults = results.filter(r => {
    let matchesFilter = false;
    
    if (filter === 'ALL') {
        matchesFilter = true;
    } else if (filter === 'EXPECTED') {
        // Show mismatches that are NOT unknown (i.e., have a valid Expected Gap code)
        matchesFilter = r.type !== DiscrepancyType.MATCH && !!r.reasonCode && r.reasonCode !== 'UNKNOWN';
    } else if (filter === 'UNKNOWN') {
        // Show mismatches that are unknown
        matchesFilter = r.type !== DiscrepancyType.MATCH && (!r.reasonCode || r.reasonCode === 'UNKNOWN');
    }

    const matchesSearch = r.recordId.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Add logic for activeFieldFilter: show records where this field is in 'diffs'
    const matchesField = activeFieldFilter ? r.diffs.includes(activeFieldFilter) : true;
    
    return matchesFilter && matchesSearch && matchesField;
  });

  const handleAiAnalyze = async (record: ComparisonResult) => {
    setAnalyzingId(record.recordId);
    const analysis = await analyzeDiscrepancyWithAI(record.oldRecord, record.newRecord, REASON_DICTIONARY, language);
    setAiAnalysis(prev => ({ ...prev, [record.recordId]: analysis }));
    setAnalyzingId(null);
  };

  const StatusBadge = ({ type }: { type: DiscrepancyType }) => {
    if (type === DiscrepancyType.MATCH) return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium flex items-center gap-1 w-fit whitespace-nowrap"><Check size={12}/> {t('detail.match')}</span>;
    return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium flex items-center gap-1 w-fit whitespace-nowrap"><AlertCircle size={12}/> {type}</span>;
  };

  return (
    <div className="flex h-full p-4 md:p-6 relative overflow-hidden">
      {/* Main List Container */}
      <div className={`
        flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-gray-100 transition-all duration-300 overflow-hidden
        ${selectedRecord ? 'md:mr-4 md:w-[calc(100%-520px)]' : 'w-full'}
      `}>
        <div className="p-4 border-b border-gray-100">
           
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-800">{t('table.records')}</h2>
                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md text-xs font-medium">{filteredResults.length}</span>
              </div>
              
              <div className="flex flex-col xl:flex-row gap-2 w-full md:w-auto">
                {/* Field Filter Dropdown */}
                <div className="relative min-w-[150px] w-full xl:w-auto">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                        <Filter size={14} />
                    </div>
                    <select
                        value={activeFieldFilter || ''}
                        onChange={(e) => onFieldFilterChange(e.target.value || null)}
                        className={`w-full pl-9 pr-8 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white transition-colors cursor-pointer ${activeFieldFilter ? 'border-blue-300 bg-blue-50 text-blue-700 font-medium' : 'border-gray-200 text-gray-700'}`}
                    >
                        <option value="">{language === 'zh' ? '所有字段' : 'All Fields'}</option>
                        {allFields.map(field => (
                            <option key={field} value={field}>{field}</option>
                        ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                        <ChevronDown size={14} />
                    </div>
                </div>

                {/* Search */}
                <div className="relative w-full xl:w-auto">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="text" 
                    placeholder={t('table.search_placeholder')} 
                    className="w-full xl:w-48 pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* Status Toggle - Updated for Expected vs Unknown */}
                <div className="flex border border-gray-200 rounded-lg overflow-hidden w-full xl:w-auto">
                  <button 
                    className={`flex-1 xl:flex-none px-3 py-2 text-sm font-medium ${filter === 'ALL' ? 'bg-gray-100 text-gray-900' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    onClick={() => setFilter('ALL')}
                  >
                    {t('table.filter.all')}
                  </button>
                  <button 
                    className={`flex-1 xl:flex-none px-3 py-2 text-sm font-medium whitespace-nowrap ${filter === 'EXPECTED' ? 'bg-blue-50 text-blue-700' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    onClick={() => setFilter('EXPECTED')}
                    title="Expected Gaps (Defined in Known Discrepancy Dictionary)"
                  >
                    {t('table.filter.expected')}
                  </button>
                  <button 
                    className={`flex-1 xl:flex-none px-3 py-2 text-sm font-medium ${filter === 'UNKNOWN' ? 'bg-red-50 text-red-700' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    onClick={() => setFilter('UNKNOWN')}
                    title="Unknown Mismatches"
                  >
                    {t('table.filter.unknown')}
                  </button>
                </div>
              </div>
           </div>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar relative">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 font-medium">{t('table.col.id')}</th>
                
                {/* Dynamic Columns based on Field Filter */}
                {activeFieldFilter ? (
                  <>
                     <th className="px-4 py-3 font-medium bg-red-50/50 text-red-600">{t('table.col.legacy')} {activeFieldFilter}</th>
                     <th className="px-4 py-3 font-medium bg-green-50/50 text-green-600">{t('table.col.new')} {activeFieldFilter}</th>
                  </>
                ) : (
                  <th className="px-4 py-3 font-medium">{t('table.col.status')}</th>
                )}

                <th className="px-4 py-3 font-medium hidden sm:table-cell">{t('table.col.reason')}</th>
                <th className="px-4 py-3 font-medium text-right">{t('table.col.action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredResults.map((row) => (
                <tr 
                  key={row.recordId} 
                  onClick={() => setSelectedRecord(row)}
                  className={`cursor-pointer hover:bg-blue-50 transition-colors ${selectedRecord?.recordId === row.recordId ? 'bg-blue-50' : ''}`}
                >
                  <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{row.recordId}</td>
                  
                  {activeFieldFilter ? (
                      <>
                        <td className="px-4 py-3 text-red-600 font-mono text-xs max-w-[100px] truncate">
                            {String(row.oldRecord?.[activeFieldFilter] ?? '-')}
                        </td>
                        <td className="px-4 py-3 text-green-600 font-mono text-xs max-w-[100px] truncate">
                            {String(row.newRecord?.[activeFieldFilter] ?? '-')}
                        </td>
                      </>
                  ) : (
                      <td className="px-4 py-3">
                        <StatusBadge type={row.type} />
                      </td>
                  )}

                  <td className="px-4 py-3 hidden sm:table-cell">
                    {row.reasonCode && REASON_DICTIONARY[row.reasonCode] ? (
                      <span className={`text-xs px-2 py-0.5 rounded border ${
                          row.reasonCode === 'UNKNOWN' 
                            ? 'bg-red-50 text-red-600 border-red-200 font-bold' 
                            : 'bg-gray-100 text-gray-600 border-gray-200'
                      }`}>
                        {REASON_DICTIONARY[row.reasonCode].code}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ChevronRight size={16} className="text-gray-400 inline-block" />
                  </td>
                </tr>
              ))}
              {filteredResults.length === 0 && (
                  <tr>
                      <td colSpan={5} className="text-center py-8 text-gray-400 italic">{t('table.no_records')}</td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail View Panel 
          - Mobile: Fixed full screen overlay (z-50)
          - Desktop: Static sidebar (w-[500px])
      */}
      {selectedRecord && (
        <div className={`
            fixed inset-0 z-50 bg-white md:static md:z-0 md:w-[500px] md:h-full
            flex flex-col md:rounded-xl shadow-2xl md:shadow-lg border-l border-gray-200 
            transition-transform duration-300 ease-in-out
            ${selectedRecord ? 'translate-x-0' : 'translate-x-full'}
        `}>
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50 md:rounded-t-xl shrink-0">
            <div className="flex items-center gap-3">
              <button 
                 onClick={() => setSelectedRecord(null)}
                 className="md:hidden p-1 -ml-2 text-gray-600"
              >
                  <ArrowLeft size={20} />
              </button>
              <div>
                <h3 className="font-semibold text-gray-800">{t('detail.title')}</h3>
                <p className="text-xs text-gray-500">{selectedRecord.recordId}</p>
              </div>
            </div>
            <button onClick={() => setSelectedRecord(null)} className="text-gray-400 hover:text-gray-600 hidden md:block">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {/* Reason Card */}
            {selectedRecord.type !== 'MATCH' && (
               <div className={`mb-6 border rounded-lg p-4 ${
                  selectedRecord.reasonCode === 'UNKNOWN' 
                    ? 'bg-red-50 border-red-200' 
                    : 'bg-blue-50 border-blue-200'
               }`}>
                 <h4 className={`font-semibold text-sm mb-1 flex items-center gap-2 ${
                    selectedRecord.reasonCode === 'UNKNOWN' ? 'text-red-800' : 'text-blue-800'
                 }`}>
                    <AlertCircle size={16}/> 
                    {selectedRecord.reasonCode === 'UNKNOWN' ? t('detail.unknown_title') : t('detail.known_title')}
                 </h4>
                 {selectedRecord.reasonCode && REASON_DICTIONARY[selectedRecord.reasonCode] && (
                    <div className={`text-xs mt-1 ${
                        selectedRecord.reasonCode === 'UNKNOWN' ? 'text-red-700' : 'text-blue-700'
                    }`}>
                      <p className="font-medium">
                        {(language === 'zh' ? REASON_DICTIONARY[selectedRecord.reasonCode].label_zh : REASON_DICTIONARY[selectedRecord.reasonCode].label)} 
                        ({selectedRecord.reasonCode})
                      </p>
                      <p className="opacity-80">
                        {(language === 'zh' ? REASON_DICTIONARY[selectedRecord.reasonCode].description_zh : REASON_DICTIONARY[selectedRecord.reasonCode].description)}
                      </p>
                    </div>
                 )}
               </div>
            )}

            {/* Field Comparison Grid */}
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2 text-xs font-semibold text-gray-500 uppercase pb-2 border-b">
                <div>{t('detail.field')}</div>
                <div>{t('detail.legacy_core')}</div>
                <div>{t('detail.new_core')}</div>
              </div>
              
              {dynamicColumns.map((field) => {
                const oldVal = selectedRecord.oldRecord?.[field];
                const newVal = selectedRecord.newRecord?.[field];
                const isDiff = selectedRecord.diffs.includes(field);
                
                return (
                  <div key={field} className={`grid grid-cols-3 gap-2 py-2 text-sm border-b border-gray-50 last:border-0 ${isDiff ? 'bg-yellow-50 -mx-2 px-2 rounded' : ''}`}>
                    <div className="font-medium text-gray-700 capitalize break-words">{field.replace(/([A-Z])/g, ' $1')}</div>
                    <div className={`${isDiff ? 'text-red-600 font-medium' : 'text-gray-600'} break-all`}>
                      {String(oldVal ?? '-')}
                    </div>
                    <div className={`${isDiff ? 'text-green-600 font-medium' : 'text-gray-600'} break-all`}>
                      {String(newVal ?? '-')}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* AI Analysis Section */}
            {selectedRecord.type !== 'MATCH' && (
              <div className="mt-8 pt-4 border-t border-gray-100">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <Sparkles size={14} className="text-indigo-500" />
                    {t('detail.ai_analysis')}
                  </h4>
                  {!aiAnalysis[selectedRecord.recordId] && (
                    <button 
                      onClick={() => handleAiAnalyze(selectedRecord)}
                      disabled={analyzingId === selectedRecord.recordId}
                      className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 transition flex items-center gap-1 disabled:opacity-50"
                    >
                      {analyzingId === selectedRecord.recordId ? t('detail.analyzing') : t('detail.analyze_btn')}
                    </button>
                  )}
                </div>

                {aiAnalysis[selectedRecord.recordId] ? (
                  <div className="bg-indigo-50 p-3 rounded-lg text-xs text-indigo-900 leading-relaxed border border-indigo-100">
                    {aiAnalysis[selectedRecord.recordId]}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">
                    {t('detail.ai_hint')}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ComparisonTable;