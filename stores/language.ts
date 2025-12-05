import { defineStore } from 'pinia';

type Language = 'en' | 'zh';

interface Translations {
  [key: string]: {
    en: string;
    zh: string;
  };
}

const translations: Translations = {
  // App Shell
  'app.title': { en: 'CoreCompare', zh: 'CoreCompare' },
  'app.subtitle': { en: 'Migration Toolkit', zh: '核心迁移工具包' },
  'nav.run': { en: 'Run Comparison', zh: '运行对比作业' },
  'nav.summary': { en: 'Summary', zh: '概览仪表盘' },
  'nav.details': { en: 'Details', zh: '详细数据对比' },
  'nav.config': { en: 'Configuration', zh: '配置' },
  'nav.dictionary': { en: 'Known Discrepancy Dictionary', zh: '差异原因字典' },
  'status.legacy_online': { en: 'Legacy Core: Online', zh: '旧核心: 在线' },
  'status.new_online': { en: 'NextGen Core: Online', zh: '新核心: 在线' },
  'header.batch_id': { en: 'Batch ID', zh: '批次 ID' },

  // Dashboard
  'dashboard.filter_banner': { en: 'Filtering Stats by Field:', zh: '当前筛选字段:' },
  'dashboard.view_details': { en: 'View Details', zh: '查看详情' },
  'dashboard.total_records': { en: 'Total Records', zh: '总记录数' },
  'dashboard.match_rate': { en: 'Match Rate', zh: '匹配率' },
  'dashboard.gaps_detected': { en: 'Gaps Detected', zh: '发现差异' },
  'dashboard.records_with_gaps': { en: 'Records with Gaps', zh: '差异记录数' },
  'dashboard.processing_time': { en: 'Processing Time', zh: '处理耗时' },
  'dashboard.field_analysis': { en: 'Field Level Discrepancy Analysis', zh: '字段级差异分析' },
  'dashboard.field_analysis_hint': { en: 'Click a bar to filter dashboard stats by field.', zh: '点击柱状图可按字段筛选统计数据。' },
  'dashboard.field_analysis_hint_active': { en: 'Click selected bar again to clear filter.', zh: '再次点击选中的柱状图以清除筛选。' },
  'dashboard.matched': { en: 'Matched', zh: '匹配' },
  'dashboard.gaps': { en: 'Gaps', zh: '差异' },
  'dashboard.root_causes': { en: 'Discrepancy Root Causes', zh: '差异根本原因' },
  'dashboard.root_causes_for': { en: 'Root Causes for', zh: '差异原因：' },
  'dashboard.integrity': { en: 'Overall Record Integrity', zh: '整体数据完整性' },
  'dashboard.ai_summary': { en: 'AI Executive Summary', zh: 'AI 执行摘要' },
  'dashboard.generate_report': { en: 'Generate Report', zh: '生成报告' },
  'dashboard.ai_placeholder': { en: 'Click "Generate Report" to have Gemini analyze the current statistics and risk factors.', zh: '点击“生成报告”让 Gemini 分析当前的统计数据和风险因素。' },

  // Execution Panel
  'exec.available_jobs': { en: 'Available Comparison Jobs', zh: '可用对比作业' },
  'exec.job_history': { en: 'Job History', zh: '作业历史' },
  'exec.run_id': { en: 'Run ID', zh: '运行 ID' },
  'exec.job_name': { en: 'Job Name', zh: '作业名称' },
  'exec.start_time': { en: 'Start Time', zh: '开始时间' },
  'exec.duration': { en: 'Duration', zh: '耗时' },
  'exec.status': { en: 'Status', zh: '状态' },
  'exec.actions': { en: 'Actions', zh: '操作' },
  'exec.view_results': { en: 'View Results', zh: '查看结果' },
  'exec.no_history': { en: 'No jobs executed yet. Start a comparison above.', zh: '暂无执行记录。请在上方启动对比。' },
  'exec.queued': { en: 'Queued', zh: '排队中' },
  'exec.running': { en: 'Running', zh: '运行中' },
  'exec.completed': { en: 'Completed', zh: '已完成' },
  'exec.failed': { en: 'Failed', zh: '失败' },

  // Comparison Table
  'table.records': { en: 'Records', zh: '记录列表' },
  'table.filter.all': { en: 'All', zh: '全部' },
  'table.filter.expected': { en: 'Expected Gap', zh: '预期差异' },
  'table.filter.unknown': { en: 'Unknown', zh: '未知差异' },
  'table.search_placeholder': { en: 'Search ID...', zh: '搜索 ID...' },
  'table.col.id': { en: 'Record ID', zh: '记录 ID' },
  'table.col.legacy': { en: 'Legacy', zh: '旧核心' },
  'table.col.new': { en: 'New', zh: '新核心' },
  'table.col.status': { en: 'Status', zh: '状态' },
  'table.col.reason': { en: 'Reason', zh: '原因' },
  'table.col.action': { en: 'Action', zh: '操作' },
  'table.no_records': { en: 'No records found matching filters.', zh: '未找到匹配的记录。' },
  'detail.title': { en: 'Record Details', zh: '记录详情' },
  'detail.unknown_title': { en: 'Unknown Discrepancy', zh: '未分类差异' },
  'detail.known_title': { en: 'Known Discrepancy Identified', zh: '已识别的已知差异' },
  'detail.field': { en: 'Field', zh: '字段' },
  'detail.legacy_core': { en: 'Legacy Core', zh: '旧核心系统' },
  'detail.new_core': { en: 'New Core', zh: '新核心系统' },
  'detail.ai_analysis': { en: 'AI Root Cause Analysis', zh: 'AI 根因分析' },
  'detail.analyze_btn': { en: 'Analyze', zh: '分析' },
  'detail.analyzing': { en: 'Analyzing...', zh: '分析中...' },
  'detail.ai_hint': { en: 'Use Gemini AI to analyze unclassified discrepancies or get a deeper explanation of the root cause.', zh: '使用 Gemini AI 分析未分类的差异或获取更深层的根因解释。' },
  'detail.match': { en: 'Match', zh: '匹配' },
};

export const useLanguageStore = defineStore('language', {
  state: () => ({
    language: 'en' as Language,
  }),

  getters: {
    t: (state) => (key: string): string => {
      return translations[key]?.[state.language] || key;
    },
  },

  actions: {
    setLanguage(lang: Language) {
      this.language = lang;
    },
  },
});
