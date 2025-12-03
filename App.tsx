import React, { useState, useEffect } from 'react';
import { JOB_CONFIGS, generateMockData, REASON_DICTIONARY } from './constants';
import { ComparisonResult, ComparisonStats, DiscrepancyType, JobRun, RunStatus, DataRecord } from './types';
import Dashboard from './components/Dashboard';
import ComparisonTable from './components/ComparisonTable';
import ExecutionPanel from './components/ExecutionPanel';
import { LayoutDashboard, GitCompare, Settings, Database, PlayCircle, Menu, X } from 'lucide-react';

// --- Generic Dynamic Comparison Logic ---
const compareData = (oldData: DataRecord[], newData: DataRecord[]): ComparisonResult[] => {
  const results: ComparisonResult[] = [];
  const newMap = new Map(newData.map(d => [d.id, d]));

  oldData.forEach(oldRec => {
    const newRec = newMap.get(oldRec.id);
    if (!newRec) {
      results.push({
        recordId: oldRec.id, oldRecord: oldRec, type: DiscrepancyType.MISSING_IN_NEW, diffs: [], reasonCode: 'R005'
      });
      return;
    }

    const diffs: string[] = [];
    let type = DiscrepancyType.MATCH;
    let reasonCode = undefined;

    // Dynamically compare all keys in oldRecord (excluding ID)
    const keys = Object.keys(oldRec).filter(k => k !== 'id');
    
    for (const key of keys) {
       const v1 = oldRec[key];
       const v2 = newRec[key];
       
       if (v1 !== v2) {
          diffs.push(key);
          type = DiscrepancyType.VALUE_MISMATCH; // Default mismatch type

          // Refine Discrepancy Type based on Field Name (Heuristic)
          if (key.toLowerCase().includes('date')) type = DiscrepancyType.TIMING_DIFF;
          if (key.toLowerCase().includes('status')) type = DiscrepancyType.STATUS_DIFF;
          if (key.toLowerCase().includes('desc')) type = DiscrepancyType.META_DIFF;

          // Refine Reason Code (Heuristic)
          if (typeof v1 === 'number' && typeof v2 === 'number' && Math.abs(v1 - v2) < 0.1) {
             reasonCode = 'R001'; // Rounding
          } else if (key.toLowerCase().includes('date')) {
             reasonCode = 'R003'; // Date Offset
          } else if (key === 'productCode') {
             reasonCode = 'R002'; // Migration Transformation
          }
       }
    }

    if (diffs.length > 0 && !reasonCode) {
       reasonCode = 'UNKNOWN';
    }

    results.push({ recordId: oldRec.id, oldRecord: oldRec, newRecord: newRec, type, diffs, reasonCode });
  });
  
  return results;
};

const calculateStats = (results: ComparisonResult[]): ComparisonStats => {
  const total = results.length;
  const matches = results.filter(r => r.type === DiscrepancyType.MATCH).length;
  const mismatches = total - matches;
  
  const breakdown: Record<string, number> = {};
  // Track field level stats
  const fieldStats: Record<string, { total: number; mismatch: number }> = {};

  results.forEach(r => {
    // 1. Reason Breakdown
    if (r.type !== DiscrepancyType.MATCH) {
      const reason = r.reasonCode || 'Unclassified';
      breakdown[reason] = (breakdown[reason] || 0) + 1;
    }

    // 2. Field Stats
    // Initialize fields based on the record schema (using oldRecord)
    if (r.oldRecord) {
        Object.keys(r.oldRecord).forEach(key => {
            if (key === 'id') return;
            if (!fieldStats[key]) fieldStats[key] = { total: 0, mismatch: 0 };
            fieldStats[key].total++;
            if (r.diffs.includes(key)) {
                fieldStats[key].mismatch++;
            }
        });
    }
  });

  return {
    totalRecords: total,
    matchCount: matches,
    mismatchCount: mismatches,
    matchRate: total > 0 ? (matches / total) * 100 : 0,
    discrepancyBreakdown: breakdown,
    fieldStats
  };
};

// --- Main App Component ---

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'compare' | 'execution' | 'settings'>('execution');
  const [runs, setRuns] = useState<JobRun[]>([]);
  
  // Current Active Data
  const [currentResults, setCurrentResults] = useState<ComparisonResult[]>([]);
  const [currentStats, setCurrentStats] = useState<ComparisonStats | null>(null);
  const [activeJobName, setActiveJobName] = useState<string>("No Job Selected");
  
  // Field Drilldown State
  const [activeFieldFilter, setActiveFieldFilter] = useState<string | null>(null);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Initial load (Optional: load default mock)
  useEffect(() => {
    const { oldData, newData } = generateMockData('LOAN_MASTER', 0.5);
    const results = compareData(oldData, newData);
    setCurrentResults(results);
    setCurrentStats(calculateStats(results));
    setActiveJobName("Loan Account Master (Demo)");
  }, []);

  const handleRunJob = (configId: string) => {
    const config = JOB_CONFIGS.find(c => c.id === configId);
    if (!config) return;

    const newRunId = `RUN-${Date.now().toString().slice(-6)}`;
    
    // 1. Create Job in Running State
    const newRun: JobRun = {
      runId: newRunId,
      configId: config.id,
      configName: config.name,
      schemaType: config.schemaType,
      startTime: new Date().toISOString(),
      status: RunStatus.RUNNING
    };

    setRuns(prev => [newRun, ...prev]);

    // 2. Simulate Backend Delay
    setTimeout(() => {
        // 3. Generate Mock Result based on schema
        const randomVariance = Math.random();
        const { oldData, newData } = generateMockData(config.schemaType, randomVariance);
        const results = compareData(oldData, newData);
        const stats = calculateStats(results);

        // 4. Update Job to Completed
        setRuns(prev => prev.map(run => {
            if (run.runId === newRunId) {
                return {
                    ...run,
                    status: RunStatus.COMPLETED,
                    endTime: new Date().toISOString(),
                    results,
                    stats
                };
            }
            return run;
        }));
    }, 2000); 
  };

  const handleViewResults = (runId: string) => {
    const run = runs.find(r => r.runId === runId);
    if (run && run.results && run.stats) {
        setCurrentResults(run.results);
        setCurrentStats(run.stats);
        setActiveJobName(run.configName);
        setActiveFieldFilter(null); // Reset filter
        setActiveTab('dashboard');
        setIsMobileNavOpen(false); // Close mobile nav on selection
    }
  };

  const handleFieldClick = (field: string) => {
    setActiveFieldFilter(field);
    setActiveTab('compare');
  };

  const NavButton = ({ tab, icon: Icon, label, onClick }: any) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
        activeTab === tab ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <Icon size={18} />
      {label}
    </button>
  );

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900">
      
      {/* Mobile Sidebar Overlay */}
      {isMobileNavOpen && (
        <div 
            className="fixed inset-0 bg-black/50 z-20 md:hidden"
            onClick={() => setIsMobileNavOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white flex flex-col shadow-xl 
        transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${isMobileNavOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
                <Database size={20} className="text-white" />
            </div>
            <div>
                <h1 className="font-bold text-lg tracking-tight">CoreCompare</h1>
                <p className="text-xs text-slate-400">Migration Toolkit</p>
            </div>
          </div>
          {/* Close button for mobile */}
          <button 
            className="md:hidden text-slate-400 hover:text-white"
            onClick={() => setIsMobileNavOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            <NavButton 
                tab="execution" 
                icon={PlayCircle} 
                label="Run Comparison" 
                onClick={() => { setActiveTab('execution'); setIsMobileNavOpen(false); }} 
            />
            <div className="my-2 border-t border-slate-800 opacity-50"></div>
            <NavButton 
                tab="dashboard" 
                icon={LayoutDashboard} 
                label="Summary" 
                onClick={() => { setActiveTab('dashboard'); setIsMobileNavOpen(false); }} 
            />
            <NavButton 
                tab="compare" 
                icon={GitCompare} 
                label="Details" 
                onClick={() => { 
                    setActiveTab('compare'); 
                    setIsMobileNavOpen(false);
                    // Do not reset filter to preserve context
                }} 
            />
          <div className="pt-4 mt-4 border-t border-slate-800">
             <p className="px-4 text-xs font-semibold text-slate-500 uppercase mb-2">Configuration</p>
             <NavButton 
                tab="settings" 
                icon={Settings} 
                label="Known Discrepancy Dictionary" 
                onClick={() => { setActiveTab('settings'); setIsMobileNavOpen(false); }} 
            />
          </div>
        </nav>
        
        <div className="p-4 bg-slate-800/50 m-4 rounded-xl border border-slate-700">
            <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-xs font-medium text-slate-300">Legacy Core: Online</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-xs font-medium text-slate-300">NextGen Core: Online</span>
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8 shadow-sm z-10 shrink-0">
            <div className="flex items-center gap-4">
              <button 
                className="md:hidden text-gray-600 hover:text-gray-900"
                onClick={() => setIsMobileNavOpen(true)}
              >
                 <Menu size={24} />
              </button>
              <div className="min-w-0">
                <h2 className="text-lg md:text-xl font-semibold text-gray-800 truncate">
                    {activeTab === 'dashboard' && 'Migration Summary'}
                    {activeTab === 'compare' && 'Detailed Record Comparison'}
                    {activeTab === 'execution' && 'Run Comparison Jobs'}
                    {activeTab === 'settings' && 'Discrepancy Definitions'}
                </h2>
                {activeTab !== 'execution' && activeTab !== 'settings' && (
                   <p className="text-xs text-blue-600 font-medium truncate hidden sm:block">{activeJobName}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-4 shrink-0">
                <span className="text-sm text-gray-500 hidden sm:inline">Batch ID: <span className="font-mono text-gray-700">#MIG-2023-10-25-A</span></span>
                <div className="h-8 w-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-xs">Admin</div>
            </div>
        </header>

        <div className="flex-1 overflow-auto bg-gray-50/50">
            {activeTab === 'dashboard' && currentStats && (
                <Dashboard 
                    stats={currentStats} 
                    results={currentResults} 
                    onFieldClick={handleFieldClick}
                />
            )}
            {activeTab === 'compare' && (
                <ComparisonTable 
                    results={currentResults} 
                    activeFieldFilter={activeFieldFilter}
                    onFieldFilterChange={setActiveFieldFilter}
                />
            )}
            {activeTab === 'execution' && (
                <ExecutionPanel 
                    configs={JOB_CONFIGS} 
                    runs={runs} 
                    onRunJob={handleRunJob} 
                    onViewResults={handleViewResults} 
                />
            )}
            {activeTab === 'settings' && (
                <div className="p-4 md:p-8">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-800">Known Discrepancy Dictionary</h3>
                            <p className="text-sm text-gray-500">Definitions used by the auto-classification engine.</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-3 whitespace-nowrap">Code</th>
                                        <th className="px-6 py-3 whitespace-nowrap">Label</th>
                                        <th className="px-6 py-3 whitespace-nowrap">Description</th>
                                        <th className="px-6 py-3 whitespace-nowrap">Severity</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {Object.values(REASON_DICTIONARY).map((reason) => (
                                        <tr key={reason.code} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 font-mono text-blue-600 font-medium">{reason.code}</td>
                                            <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{reason.label}</td>
                                            <td className="px-6 py-4 text-gray-600 min-w-[200px]">{reason.description}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                    reason.severity === 'low' ? 'bg-gray-100 text-gray-600' :
                                                    reason.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-red-100 text-red-700'
                                                }`}>
                                                    {reason.severity.toUpperCase()}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </main>
    </div>
  );
};

export default App;