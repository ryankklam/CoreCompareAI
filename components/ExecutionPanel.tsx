import React from 'react';
import { ComparisonConfig, JobRun, RunStatus } from '../types';
import { Play, Clock, CheckCircle2, AlertCircle, Eye, RefreshCw } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface ExecutionPanelProps {
  configs: ComparisonConfig[];
  runs: JobRun[];
  onRunJob: (configId: string) => void;
  onViewResults: (runId: string) => void;
}

const ExecutionPanel: React.FC<ExecutionPanelProps> = ({ configs, runs, onRunJob, onViewResults }) => {
  const { t } = useLanguage();
  // Sort runs by startTime desc
  const sortedRuns = [...runs].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  const getStatusBadge = (status: RunStatus) => {
    switch (status) {
      case RunStatus.QUEUED:
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 flex items-center gap-1"><Clock size={12}/> {t('exec.queued')}</span>;
      case RunStatus.RUNNING:
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 flex items-center gap-1"><RefreshCw size={12} className="animate-spin"/> {t('exec.running')}</span>;
      case RunStatus.COMPLETED:
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 flex items-center gap-1"><CheckCircle2 size={12}/> {t('exec.completed')}</span>;
      case RunStatus.FAILED:
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 flex items-center gap-1"><AlertCircle size={12}/> {t('exec.failed')}</span>;
      default:
        return null;
    }
  };

  return (
    <div className="p-6 space-y-8 animate-fade-in">
      
      {/* Configuration Cards */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('exec.available_jobs')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {configs.map(config => (
            <div key={config.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div className="bg-indigo-50 text-indigo-600 p-2 rounded-lg font-mono text-xs font-bold">
                  {config.id}
                </div>
                <button
                  onClick={() => onRunJob(config.id)}
                  className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors shadow-sm"
                  title="Run Comparison"
                >
                  <Play size={16} fill="currentColor" />
                </button>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{config.name}</h3>
              <p className="text-sm text-gray-500 mb-4 line-clamp-2">{config.description}</p>
              
              <div className="text-xs text-gray-400 border-t border-gray-100 pt-3 flex flex-col gap-1">
                 <div className="flex justify-between">
                   <span>Source:</span> <span className="font-mono text-gray-600">{config.sourceTable}</span>
                 </div>
                 <div className="flex justify-between">
                   <span>Target:</span> <span className="font-mono text-gray-600">{config.targetTable}</span>
                 </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Execution History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
           <h2 className="text-lg font-semibold text-gray-800">{t('exec.job_history')}</h2>
           <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md text-xs font-medium">{runs.length} Runs</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 font-medium">{t('exec.run_id')}</th>
                <th className="px-6 py-3 font-medium">{t('exec.job_name')}</th>
                <th className="px-6 py-3 font-medium">{t('exec.start_time')}</th>
                <th className="px-6 py-3 font-medium">{t('exec.duration')}</th>
                <th className="px-6 py-3 font-medium">{t('exec.status')}</th>
                <th className="px-6 py-3 font-medium text-right">{t('exec.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedRuns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400 italic">
                    {t('exec.no_history')}
                  </td>
                </tr>
              ) : (
                sortedRuns.map((run) => (
                  <tr key={run.runId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-mono text-gray-600 text-xs">{run.runId}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{run.configName}</td>
                    <td className="px-6 py-4 text-gray-600">{new Date(run.startTime).toLocaleTimeString()}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {run.endTime ? 
                        `${((new Date(run.endTime).getTime() - new Date(run.startTime).getTime()) / 1000).toFixed(1)}s` 
                        : '-'}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(run.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {run.status === RunStatus.COMPLETED && (
                        <button
                          onClick={() => onViewResults(run.runId)}
                          className="text-indigo-600 hover:text-indigo-800 font-medium text-xs flex items-center gap-1 ml-auto"
                        >
                          <Eye size={14} /> {t('exec.view_results')}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ExecutionPanel;