<template>
  <div class="flex h-full p-4 md:p-6 relative overflow-hidden">
    <!-- Main List Container -->
    <div class="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-gray-100 transition-all duration-300 overflow-hidden md:mr-4 md:w-[calc(100%-520px)]" :class="{ 'md:mr-0 md:w-full': !selectedRecord }">
      <div class="p-4 border-b border-gray-100">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
          <div class="flex items-center gap-2">
            <h2 class="text-lg font-semibold text-gray-800">{{ t('table.records') }}</h2>
            <span class="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md text-xs font-medium">{{ filteredResults.length }}</span>
          </div>
          
          <div class="flex flex-col xl:flex-row gap-2 w-full md:w-auto">
            <!-- Field Filter Dropdown -->
            <div class="relative min-w-[150px] w-full xl:w-auto">
                <div class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                    <Filter :size="14" />
                </div>
                <select
                    v-model="localFieldFilter"
                    @change="handleFieldFilterChange"
                    class="w-full pl-9 pr-8 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white transition-colors cursor-pointer"
                    :class="{ 'border-blue-300 bg-blue-50 text-blue-700 font-medium': localFieldFilter, 'border-gray-200 text-gray-700': !localFieldFilter }"
                >
                    <option value="">
                      {{ language === 'zh' ? '所有字段' : 'All Fields' }}
                    </option>
                    <option
                        v-for="field in allFields"
                        :key="field"
                        :value="field"
                    >
                        {{ field }}
                    </option>
                </select>
                <div class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                    <ChevronDown :size="14" />
                </div>
            </div>

            <!-- Search -->
            <div class="relative w-full xl:w-auto">
              <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" :size="16" />
              <input 
                type="text" 
                :placeholder="t('table.search_placeholder')" 
                class="w-full xl:w-48 pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                v-model="searchTerm"
              />
            </div>

            <!-- Status Toggle -->
            <div class="flex border border-gray-200 rounded-lg overflow-hidden w-full xl:w-auto">
              <button 
                class="flex-1 xl:flex-none px-3 py-2 text-sm font-medium" 
                :class="{ 'bg-gray-100 text-gray-900': filter === 'ALL', 'bg-white text-gray-600 hover:bg-gray-50': filter !== 'ALL' }"
                @click="filter = 'ALL'"
              >
                {{ t('table.filter.all') }}
              </button>
              <button 
                class="flex-1 xl:flex-none px-3 py-2 text-sm font-medium whitespace-nowrap"
                :class="{ 'bg-blue-50 text-blue-700': filter === 'EXPECTED', 'bg-white text-gray-600 hover:bg-gray-50': filter !== 'EXPECTED' }"
                @click="filter = 'EXPECTED'"
                title="Expected Gaps (Defined in Known Discrepancy Dictionary)"
              >
                {{ t('table.filter.expected') }}
              </button>
              <button 
                class="flex-1 xl:flex-none px-3 py-2 text-sm font-medium"
                :class="{ 'bg-red-50 text-red-700': filter === 'UNKNOWN', 'bg-white text-gray-600 hover:bg-gray-50': filter !== 'UNKNOWN' }"
                @click="filter = 'UNKNOWN'"
                title="Unknown Mismatches"
              >
                {{ t('table.filter.unknown') }}
              </button>
            </div>
          </div>
       </div>
      </div>

      <div class="flex-1 overflow-auto custom-scrollbar relative">
        <table class="w-full text-sm text-left">
          <thead class="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0 z-10">
            <tr>
              <th class="px-4 py-3 font-medium">{{ t('table.col.id') }}</th>
              
              <!-- Dynamic Columns based on Field Filter -->
              <template v-if="localFieldFilter">
                <th class="px-4 py-3 font-medium bg-red-50/50 text-red-600">
                  {{ t('table.col.legacy') }} {{ localFieldFilter }}
                </th>
                <th class="px-4 py-3 font-medium bg-green-50/50 text-green-600">
                  {{ t('table.col.new') }} {{ localFieldFilter }}
                </th>
              </template>
              <template v-else>
                <th class="px-4 py-3 font-medium">{{ t('table.col.status') }}</th>
              </template>

              <th class="px-4 py-3 font-medium hidden sm:table-cell">{{ t('table.col.reason') }}</th>
              <th class="px-4 py-3 font-medium text-right">{{ t('table.col.action') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr
              v-for="row in filteredResults"
              :key="row.recordId"
              @click="selectedRecord = row"
              class="cursor-pointer hover:bg-blue-50 transition-colors"
              :class="{ 'bg-blue-50': selectedRecord?.recordId === row.recordId }"
            >
              <td class="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{{ row.recordId }}</td>
              
              <template v-if="localFieldFilter">
                <td class="px-4 py-3 text-red-600 font-mono text-xs max-w-[100px] truncate">
                  {{ String(row.oldRecord?.[localFieldFilter] ?? '-') }}
                </td>
                <td class="px-4 py-3 text-green-600 font-mono text-xs max-w-[100px] truncate">
                  {{ String(row.newRecord?.[localFieldFilter] ?? '-') }}
                </td>
              </template>
              <template v-else>
                <td class="px-4 py-3 flex items-center gap-1">
                  <template v-if="row.type === DiscrepancyType.MATCH">
                    <Check :size="12" />
                  </template>
                  <template v-else>
                    <AlertCircle :size="12" />
                  </template>
                  <span :class="getStatusBadgeClass(row.type)">
                    {{ row.type === DiscrepancyType.MATCH ? t('detail.match') : row.type }}
                  </span>
                </td>
              </template>

              <td class="px-4 py-3 hidden sm:table-cell">
                <template v-if="row.reasonCode && REASON_DICTIONARY[row.reasonCode]">
                  <span 
                    class="text-xs px-2 py-0.5 rounded border"
                    :class="row.reasonCode === 'UNKNOWN' ? 'bg-red-50 text-red-600 border-red-200 font-bold' : 'bg-gray-100 text-gray-600 border-gray-200'"
                  >
                    {{ REASON_DICTIONARY[row.reasonCode].code }}
                  </span>
                </template>
                <template v-else>
                  <span class="text-gray-400 text-xs">-</span>
                </template>
              </td>
              <td class="px-4 py-3 text-right">
                <ChevronRight :size="16" class="text-gray-400 inline-block" />
              </td>
            </tr>
            <tr v-if="filteredResults.length === 0">
              <td :colspan="localFieldFilter ? 5 : 4" class="text-center py-8 text-gray-400 italic">
                {{ t('table.no_records') }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Detail View Panel -->
    <div
      v-if="selectedRecord"
      class="fixed inset-0 z-50 bg-white md:static md:z-0 md:w-[500px] md:h-full flex flex-col md:rounded-xl shadow-2xl md:shadow-lg border-l border-gray-200 transition-transform duration-300 ease-in-out"
      :class="{ 'translate-x-0': selectedRecord, 'translate-x-full': !selectedRecord }"
    >
      <div class="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50 md:rounded-t-xl shrink-0">
        <div class="flex items-center gap-3">
          <button 
             @click="selectedRecord = null"
             class="md:hidden p-1 -ml-2 text-gray-600"
          >
              <ArrowLeft :size="20" />
          </button>
          <div>
            <h3 class="font-semibold text-gray-800">{{ t('detail.title') }}</h3>
            <p class="text-xs text-gray-500">{{ selectedRecord.recordId }}</p>
          </div>
        </div>
        <button @click="selectedRecord = null" class="text-gray-400 hover:text-gray-600 hidden md:block">
          <X :size="20" />
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <!-- Reason Card -->
        <template v-if="selectedRecord.type !== 'MATCH'">
          <div
            class="mb-6 border rounded-lg p-4"
            :class="selectedRecord.reasonCode === 'UNKNOWN' ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'"
          >
            <h4
              class="font-semibold text-sm mb-1 flex items-center gap-2"
              :class="selectedRecord.reasonCode === 'UNKNOWN' ? 'text-red-800' : 'text-blue-800'"
            >
              <AlertCircle :size="16"/>
              {{ selectedRecord.reasonCode === 'UNKNOWN' ? t('detail.unknown_title') : t('detail.known_title') }}
            </h4>
            <template v-if="selectedRecord.reasonCode && REASON_DICTIONARY[selectedRecord.reasonCode]">
              <div
                class="text-xs mt-1"
                :class="selectedRecord.reasonCode === 'UNKNOWN' ? 'text-red-700' : 'text-blue-700'"
              >
                <p class="font-medium">
                  {{ (language === 'zh' ? REASON_DICTIONARY[selectedRecord.reasonCode].label_zh : REASON_DICTIONARY[selectedRecord.reasonCode].label) }}
                  ({{ selectedRecord.reasonCode }})
                </p>
                <p class="opacity-80">
                  {{ (language === 'zh' ? REASON_DICTIONARY[selectedRecord.reasonCode].description_zh : REASON_DICTIONARY[selectedRecord.reasonCode].description) }}
                </p>
              </div>
            </template>
          </div>
        </template>

        <!-- Field Comparison Grid -->
        <div class="space-y-4">
          <div class="grid grid-cols-3 gap-2 text-xs font-semibold text-gray-500 uppercase pb-2 border-b">
            <div>{{ t('detail.field') }}</div>
            <div>{{ t('detail.legacy_core') }}</div>
            <div>{{ t('detail.new_core') }}</div>
          </div>
          
          <div
            v-for="field in dynamicColumns"
            :key="field"
            class="grid grid-cols-3 gap-2 py-2 text-sm border-b border-gray-50 last:border-0"
            :class="selectedRecord.diffs.includes(field) ? 'bg-yellow-50 -mx-2 px-2 rounded' : ''"
          >
            <div class="font-medium text-gray-700 capitalize break-words">
              {{ field.replace(/([A-Z])/g, ' $1') }}
            </div>
            <div :class="selectedRecord.diffs.includes(field) ? 'text-red-600 font-medium' : 'text-gray-600'" class="break-all">
              {{ String(selectedRecord.oldRecord?.[field] ?? '-') }}
            </div>
            <div :class="selectedRecord.diffs.includes(field) ? 'text-green-600 font-medium' : 'text-gray-600'" class="break-all">
              {{ String(selectedRecord.newRecord?.[field] ?? '-') }}
            </div>
          </div>
        </div>

        <!-- AI Analysis Section -->
        <template v-if="selectedRecord.type !== 'MATCH'">
          <div class="mt-8 pt-4 border-t border-gray-100">
            <div class="flex justify-between items-center mb-3">
              <h4 class="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <Sparkles :size="14" class="text-indigo-500" />
                {{ t('detail.ai_analysis') }}
              </h4>
              <template v-if="!aiAnalysis[selectedRecord.recordId]">
                <button 
                  @click="handleAiAnalyze(selectedRecord)"
                  :disabled="analyzingId === selectedRecord.recordId"
                  class="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 transition flex items-center gap-1 disabled:opacity-50"
                >
                  <template v-if="analyzingId === selectedRecord.recordId">
                    {{ t('detail.analyzing') }}
                  </template>
                  <template v-else>
                    {{ t('detail.analyze_btn') }}
                  </template>
                </button>
              </template>
            </div>

            <template v-if="aiAnalysis[selectedRecord.recordId]">
              <div class="bg-indigo-50 p-3 rounded-lg text-xs text-indigo-900 leading-relaxed border border-indigo-100">
                {{ aiAnalysis[selectedRecord.recordId] }}
              </div>
            </template>
            <template v-else>
              <p class="text-xs text-gray-400">
                {{ t('detail.ai_hint') }}
              </p>
            </template>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Search, AlertCircle, Check, ChevronRight, X, Sparkles, Filter, ChevronDown, ArrowLeft } from 'lucide-vue-next';
import { ComparisonResult, DiscrepancyType } from '../types';
import { REASON_DICTIONARY } from '../constants';
import { analyzeDiscrepancyWithAI } from '../services/geminiService';
import { useLanguageStore } from '../stores/language';

const props = defineProps<{
  results: ComparisonResult[];
  activeFieldFilter?: string | null;
}>();

const emit = defineEmits<{
  'field-filter-change': [field: string | null];
}>();

const { t, language } = useLanguageStore();
const localFieldFilter = ref(props.activeFieldFilter || null);
const filter = ref<'ALL' | 'EXPECTED' | 'UNKNOWN'>('ALL');
const searchTerm = ref('');
const selectedRecord = ref<ComparisonResult | null>(null);
const aiAnalysis = ref<Record<string, string>>({});
const analyzingId = ref<string | null>(null);

// Sync localFieldFilter with props.activeFieldFilter
watch(() => props.activeFieldFilter, (newValue) => {
  localFieldFilter.value = newValue || null;
});

// Determine columns dynamically from the first record (or selected schema)
const allFields = computed(() => {
  if (props.results.length === 0) return [];
  const sample = props.results[0].oldRecord || props.results[0].newRecord;
  if (!sample) return [];
  // Exclude 'id' as we show it separately
  return Object.keys(sample).filter(key => key !== 'id');
});

// Determine which columns to show in the detailed view
const dynamicColumns = computed(() => {
  return allFields.value;
});

const filteredResults = computed(() => {
  return props.results.filter(r => {
    let matchesFilter = false;
    
    if (filter.value === 'ALL') {
        matchesFilter = true;
    } else if (filter.value === 'EXPECTED') {
        // Show mismatches that are NOT unknown (i.e., have a valid Expected Gap code)
        matchesFilter = r.type !== DiscrepancyType.MATCH && !!r.reasonCode && r.reasonCode !== 'UNKNOWN';
    } else if (filter.value === 'UNKNOWN') {
        // Show mismatches that are unknown
        matchesFilter = r.type !== DiscrepancyType.MATCH && (!r.reasonCode || r.reasonCode === 'UNKNOWN');
    }

    const matchesSearch = r.recordId.toLowerCase().includes(searchTerm.value.toLowerCase());
    
    // Add logic for activeFieldFilter: show records where this field is in 'diffs'
    const matchesField = localFieldFilter.value ? r.diffs.includes(localFieldFilter.value) : true;
    
    return matchesFilter && matchesSearch && matchesField;
  });
});

const handleFieldFilterChange = () => {
  emit('field-filter-change', localFieldFilter.value);
};

const handleAiAnalyze = async (record: ComparisonResult) => {
  analyzingId.value = record.recordId;
  const analysis = await analyzeDiscrepancyWithAI(record.oldRecord, record.newRecord, REASON_DICTIONARY, language);
  aiAnalysis.value = { ...aiAnalysis.value, [record.recordId]: analysis };
  analyzingId.value = null;
};

// Status Badge Component (use a function to return CSS class instead of JSX)
const getStatusBadgeClass = (type: DiscrepancyType) => {
  if (type === DiscrepancyType.MATCH) {
    return 'px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium flex items-center gap-1 w-fit whitespace-nowrap';
  }
  return 'px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium flex items-center gap-1 w-fit whitespace-nowrap';
};
</script>
