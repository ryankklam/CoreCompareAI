<template>
  <div class="p-6 space-y-6 relative">
    
    <!-- Filter Banner -->
    <div
      v-if="selectedField"
      class="bg-blue-600 text-white px-4 py-3 rounded-xl flex items-center justify-between shadow-md"
    >
        <div class="flex items-center gap-2">
            <Filter :size="20" />
            <span class="font-medium">
              {{ t('dashboard.filter_banner') }} <span class="font-bold">{{ selectedField }}</span>
            </span>
        </div>
        <div class="flex items-center gap-3">
            <button 
                @click="emit('field-click', selectedField)"
                class="flex items-center gap-1 text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors"
            >
                {{ t('dashboard.view_details') }} <ArrowRight :size="14" />
            </button>
            <button 
                @click="clearSelection"
                class="p-1 hover:bg-white/20 rounded-full transition-colors"
            >
                <X :size="20" />
            </button>
        </div>
    </div>

    <!-- KPI Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
        <div class="p-3 bg-blue-50 text-blue-600 rounded-lg">
          <FileText :size="24" />
        </div>
        <div>
          <p class="text-sm text-gray-500 font-medium">
            {{ selectedField ? `Total ${selectedField}` : t('dashboard.total_records') }}
          </p>
          <h3 class="text-2xl font-bold text-gray-800">{{ displayedStats.totalRecords }}</h3>
        </div>
      </div>
      
      <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
        <div class="p-3 bg-green-50 text-green-600 rounded-lg">
          <CheckCircle :size="24" />
        </div>
        <div>
          <p class="text-sm text-gray-500 font-medium">{{ t('dashboard.match_rate') }}</p>
          <h3 class="text-2xl font-bold text-gray-800">{{ displayedStats.matchRate.toFixed(2) }}%</h3>
        </div>
      </div>

      <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
        <div class="p-3 bg-red-50 text-red-600 rounded-lg">
          <AlertTriangle :size="24" />
        </div>
        <div>
          <p class="text-sm text-gray-500 font-medium">
            {{ selectedField ? t('dashboard.gaps_detected') : t('dashboard.records_with_gaps') }}
          </p>
          <h3 class="text-2xl font-bold text-gray-800">{{ displayedStats.mismatchCount }}</h3>
        </div>
      </div>

      <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
        <div class="p-3 bg-purple-50 text-purple-600 rounded-lg">
          <Activity :size="24" />
        </div>
        <div>
          <p class="text-sm text-gray-500 font-medium">{{ t('dashboard.processing_time') }}</p>
          <h3 class="text-2xl font-bold text-gray-800">0.8s</h3>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Field Level Analysis (Simplified) -->
      <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <BarChart2 :size="20" class="text-blue-500"/>
            {{ t('dashboard.field_analysis') }}
          </h3>
          <span class="text-xs text-gray-500 hidden sm:inline">
              {{ selectedField ? t('dashboard.field_analysis_hint_active') : t('dashboard.field_analysis_hint') }}
          </span>
        </div>
        <div class="h-80 overflow-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-200">
                <th class="text-left py-3 px-4 font-semibold text-gray-700">Field</th>
                <th class="text-right py-3 px-4 font-semibold text-gray-700">Total</th>
                <th class="text-right py-3 px-4 font-semibold text-gray-700">Matched</th>
                <th class="text-right py-3 px-4 font-semibold text-gray-700">Mismatched</th>
                <th class="text-right py-3 px-4 font-semibold text-gray-700">Match Rate</th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="field in fieldData" 
                :key="field.name" 
                class="border-b border-gray-100 hover:bg-gray-50 cursor-pointer" 
                @click="handleChartClick(field)"
              >
                <td class="py-3 px-4 font-medium">{{ field.name }}</td>
                <td class="py-3 px-4 text-right">{{ field.total }}</td>
                <td class="py-3 px-4 text-right text-green-600">{{ field.match }}</td>
                <td class="py-3 px-4 text-right text-red-600">{{ field.mismatch }}</td>
                <td class="py-3 px-4 text-right">{{ ((field.match / field.total) * 100).toFixed(1) }}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Reason Breakdown (Simplified) -->
      <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">
          {{ selectedField ? `${t('dashboard.root_causes_for')} ${selectedField}` : t('dashboard.root_causes') }}
        </h3>
        <div class="h-80 overflow-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-200">
                <th class="text-left py-3 px-4 font-semibold text-gray-700">Reason</th>
                <th class="text-right py-3 px-4 font-semibold text-gray-700">Count</th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="reason in reasonData" 
                :key="reason.name" 
                class="border-b border-gray-100 hover:bg-gray-50"
              >
                <td class="py-3 px-4">{{ reason.name }}</td>
                <td class="py-3 px-4 text-right">{{ reason.count }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Match Ratio (Simplified) -->
      <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">
           {{ selectedField ? `Integrity: ${selectedField}` : t('dashboard.integrity') }}
        </h3>
        <div class="h-80 flex items-center justify-center">
          <div class="text-center">
            <div class="text-5xl font-bold text-blue-600 mb-2">
              {{ displayedStats.matchRate.toFixed(1) }}%
            </div>
            <div class="text-gray-500 mb-4">Match Rate</div>
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600">Matched</span>
                <span class="text-sm font-medium text-green-600">{{ displayedStats.matchCount }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600">Mismatched</span>
                <span class="text-sm font-medium text-red-600">{{ displayedStats.mismatchCount }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600">Total</span>
                <span class="text-sm font-medium text-gray-900">{{ displayedStats.totalRecords }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- AI Summary Section -->
    <div class="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-xl border border-indigo-100">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold text-indigo-900 flex items-center gap-2">
          <div class="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
          {{ t('dashboard.ai_summary') }} {{ selectedField ? `(${selectedField})` : '' }}
        </h3>
        <button 
          @click="handleGenerateSummary"
          :disabled="loadingSummary"
          class="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 text-sm font-medium shadow-sm"
        >
          <RefreshCw v-if="loadingSummary" :size="16" class="animate-spin" />
          <FileText v-else :size="16" />
          {{ t('dashboard.generate_report') }}
        </button>
      </div>
      
      <div v-if="summary" class="prose prose-sm text-gray-700 max-w-none bg-white/50 p-4 rounded-lg border border-indigo-100/50">
         <div class="whitespace-pre-line leading-relaxed">{{ summary }}</div>
      </div>
      <p v-else class="text-sm text-gray-500 italic">{{ t('dashboard.ai_placeholder') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineComponent } from 'vue';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { Activity, AlertTriangle, CheckCircle, FileText, RefreshCw, BarChart2, Filter, X, ArrowRight } from 'lucide-vue-next';
import { ComparisonStats, ComparisonResult } from '../types';
import { generateExecutiveSummary } from '../services/geminiService';
import { useLanguageStore } from '../stores/language';
import { REASON_DICTIONARY } from '../constants';

const props = defineProps<{
  stats: ComparisonStats;
  results: ComparisonResult[];
}>();

const emit = defineEmits<{
  'field-click': [field: string];
}>();

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6'];

const { t, language } = useLanguageStore();
const summary = ref<string>("");
const loadingSummary = ref<boolean>(false);
const selectedField = ref<string | null>(null);

// Calculate statistics dynamically based on selection
const displayedStats = computed(() => {
  if (!selectedField.value) return props.stats;

  const fieldStat = props.stats.fieldStats[selectedField.value];
  // Safety check if field stat doesn't exist
  if (!fieldStat) return props.stats;

  // Recalculate breakdown for the specific field
  const breakdown: Record<string, number> = {};
  props.results.forEach(r => {
    // Only count reasons if this specific field has a diff
    if (r.diffs.includes(selectedField.value!)) {
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
    fieldStats: props.stats.fieldStats // Keep original field stats for the main chart
  };
});

const pieData = computed(() => [
  { name: t('dashboard.matched'), value: displayedStats.matchCount },
  { name: t('dashboard.gaps'), value: displayedStats.mismatchCount },
]);

const reasonData = computed(() => {
  const breakdown = displayedStats.discrepancyBreakdown || {};
  return Object.entries(breakdown).map(([key, value]) => {
    // Get translated label for the reason code if available
    const label = (REASON_DICTIONARY[key] && (language === 'zh' ? REASON_DICTIONARY[key].label_zh : REASON_DICTIONARY[key].label)) || key;
    return {
      name: label,
      count: value,
    };
  });
});

const fieldData = computed(() => {
  return Object.entries(props.stats.fieldStats).map(([field, data]) => ({
    name: field,
    match: data.total - data.mismatch,
    mismatch: data.mismatch,
    total: data.total
  })).sort((a, b) => b.mismatch - a.mismatch); // Sort by most errors
});

const handleGenerateSummary = async () => {
  loadingSummary.value = true;
  // If filtered, pass only relevant discrepancies to AI
  const relevantResults = selectedField.value 
      ? props.results.filter(r => r.diffs.includes(selectedField.value!))
      : props.results.filter(r => r.type !== 'MATCH');

  const text = await generateExecutiveSummary(displayedStats.value, relevantResults, language);
  summary.value = text;
  loadingSummary.value = false;
};

const handleChartClick = (field: any) => {
  if (field && field.name) {
     // Toggle selection
     selectedField.value = selectedField.value === field.name ? null : field.name;
     summary.value = ""; // Reset summary as context changed
  }
};

const clearSelection = () => {
  selectedField.value = null;
  summary.value = "";
};

// Use a function to format legend text instead of JSX
const legendFormatter = (value: string) => {
  return value;
};

// Use default Recharts tooltip for simplicity
// For a more customized tooltip, we would need to create a separate Vue component
// Using default tooltip for now to avoid JSX issues
</script>
