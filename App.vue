<template>
  <div class="flex h-screen bg-gray-50 font-sans text-gray-900">
    
    <!-- Mobile Sidebar Overlay -->
    <div
      v-if="isMobileNavOpen"
      class="fixed inset-0 bg-black/50 z-20 md:hidden"
      @click="isMobileNavOpen = false"
    />

    <!-- Sidebar -->
    <aside class="fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white flex flex-col shadow-xl transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0" :class="{ 'translate-x-0': isMobileNavOpen, '-translate-x-full': !isMobileNavOpen }">
      <div class="p-6 border-b border-slate-800 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="bg-blue-600 p-2 rounded-lg">
              <Database :size="20" class="text-white" />
          </div>
          <div>
              <h1 class="font-bold text-lg tracking-tight">{{ t('app.title') }}</h1>
              <p class="text-xs text-slate-400">{{ t('app.subtitle') }}</p>
          </div>
        </div>
        <!-- Close button for mobile -->
        <button 
          class="md:hidden text-slate-400 hover:text-white"
          @click="isMobileNavOpen = false"
        >
          <X :size="20" />
        </button>
      </div>

      <nav class="flex-1 p-4 space-y-2 overflow-y-auto">
          <button
              @click="activeTab = 'execution'; isMobileNavOpen = false"
              class="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors"
              :class="activeTab === 'execution' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'"
          >
              <PlayCircle :size="18" />
              {{ t('nav.run') }}
          </button>
          <div class="my-2 border-t border-slate-800 opacity-50"></div>
          <button
              @click="activeTab = 'dashboard'; isMobileNavOpen = false"
              class="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors"
              :class="activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'"
          >
              <LayoutDashboard :size="18" />
              {{ t('nav.summary') }}
          </button>
          <button
              @click="activeTab = 'compare'; isMobileNavOpen = false"
              class="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors"
              :class="activeTab === 'compare' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'"
          >
              <GitCompare :size="18" />
              {{ t('nav.details') }}
          </button>
        <div class="pt-4 mt-4 border-t border-slate-800">
           <p class="px-4 text-xs font-semibold text-slate-500 uppercase mb-2">{{ t('nav.config') }}</p>
           <button
              @click="activeTab = 'settings'; isMobileNavOpen = false"
              class="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors"
              :class="activeTab === 'settings' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'"
          >
              <Settings :size="18" />
              {{ t('nav.dictionary') }}
          </button>
        </div>
      </nav>
      
      <div class="p-4 bg-slate-800/50 m-4 rounded-xl border border-slate-700">
          <div class="flex items-center gap-2 mb-2">
              <div class="w-2 h-2 rounded-full bg-green-500"></div>
              <span class="text-xs font-medium text-slate-300">{{ t('status.legacy_online') }}</span>
          </div>
          <div class="flex items-center gap-2">
              <div class="w-2 h-2 rounded-full bg-green-500"></div>
              <span class="text-xs font-medium text-slate-300">{{ t('status.new_online') }}</span>
          </div>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col min-w-0 overflow-hidden relative">

      <header class="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8 shadow-sm z-10 shrink-0">
          <div class="flex items-center gap-4">
            <button 
              class="md:hidden text-gray-600 hover:text-gray-900"
              @click="isMobileNavOpen = true"
            >
               <Menu :size="24" />
            </button>
            <div class="min-w-0">
              <h2 class="text-lg md:text-xl font-semibold text-gray-800 truncate">
                  <template v-if="activeTab === 'dashboard'">
                    {{ t('nav.summary') }}
                  </template>
                  <template v-else-if="activeTab === 'compare'">
                    {{ t('nav.details') }}
                  </template>
                  <template v-else-if="activeTab === 'execution'">
                    {{ t('nav.run') }}
                  </template>
                  <template v-else-if="activeTab === 'settings'">
                    {{ t('nav.dictionary') }}
                  </template>
              </h2>
              <template v-if="activeTab !== 'execution' && activeTab !== 'settings'">
                 <p class="text-xs text-blue-600 font-medium truncate hidden sm:block">
                   {{ activeJobName }}
                 </p>
              </template>
            </div>
          </div>
          
          <div class="flex items-center gap-4 shrink-0">
              <span class="text-sm text-gray-500 hidden sm:inline">
                {{ t('header.batch_id') }}: 
                <span class="font-mono text-gray-700">#MIG-2023-10-25-A</span>
              </span>
              
              <!-- Language Toggle -->
              <button 
                @click="toggleLanguage"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                title="Switch Language"
              >
                <Globe :size="14" />
                <span class="font-medium">
                  {{ language === 'en' ? 'EN' : '中文' }}
                </span>
              </button>

              <div class="h-8 w-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-xs">
                A
              </div>
          </div>
      </header>

      <div class="flex-1 overflow-auto bg-gray-50/50">
          <template v-if="activeTab === 'dashboard' && currentStats">
              <Dashboard 
                  :stats="currentStats" 
                  :results="currentResults" 
                  @field-click="handleFieldClick"
              />
          </template>
          <template v-else-if="activeTab === 'compare'">
              <ComparisonTable 
                  :results="currentResults" 
                  :activeFieldFilter="activeFieldFilter"
                  @field-filter-change="setActiveFieldFilter"
              />
          </template>
          <template v-else-if="activeTab === 'execution'">
              <ExecutionPanel 
                  :configs="JOB_CONFIGS" 
                  :runs="runs" 
                  @run-job="handleRunJob"
                  @view-results="handleViewResults"
              />
          </template>
          <template v-else-if="activeTab === 'settings'">
              <div class="p-4 md:p-8">
                  <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                      <div class="p-6 border-b border-gray-100">
                          <h3 class="text-lg font-semibold text-gray-800">{{ t('settings.title') }}</h3>
                          <p class="text-sm text-gray-500">{{ t('settings.subtitle') }}</p>
                      </div>
                      <div class="overflow-x-auto">
                          <table class="w-full text-sm text-left">
                              <thead class="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                                  <tr>
                                      <th class="px-6 py-3 whitespace-nowrap">{{ t('settings.code') }}</th>
                                      <th class="px-6 py-3 whitespace-nowrap">{{ t('settings.label') }}</th>
                                      <th class="px-6 py-3 whitespace-nowrap">{{ t('settings.description') }}</th>
                                      <th class="px-6 py-3 whitespace-nowrap">{{ t('settings.severity') }}</th>
                                  </tr>
                              </thead>
                              <tbody class="divide-y divide-gray-100">
                                  <tr
                                      v-for="reason in Object.values(REASON_DICTIONARY)"
                                      :key="reason.code"
                                      class="hover:bg-gray-50"
                                  >
                                      <td class="px-6 py-4 font-mono text-blue-600 font-medium">{{ reason.code }}</td>
                                      <td class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                                          {{ language === 'zh' ? reason.label_zh || reason.label : reason.label }}
                                      </td>
                                      <td class="px-6 py-4 text-gray-600 min-w-[200px]">
                                          {{ language === 'zh' ? reason.description_zh || reason.description : reason.description }}
                                      </td>
                                      <td class="px-6 py-4">
                                          <span :class="getSeverityClass(reason.severity)">
                                              {{ reason.severity.toUpperCase() }}
                                          </span>
                                      </td>
                                  </tr>
                              </tbody>
                          </table>
                      </div>
                  </div>
              </div>
          </template>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { LayoutDashboard, GitCompare, Settings, Database, PlayCircle, Menu, X, Globe } from 'lucide-vue-next';
import { JOB_CONFIGS, generateMockData, REASON_DICTIONARY } from './constants';
import { ComparisonResult, ComparisonStats, DiscrepancyType, JobRun, RunStatus, DataRecord } from './types';
import Dashboard from './components/Dashboard.vue';
import ComparisonTable from './components/ComparisonTable.vue';
import ExecutionPanel from './components/ExecutionPanel.vue';
import { compareData, calculateStats } from './utils';
import { useLanguageStore } from './stores/language';

// Main App Logic
const { t, language, setLanguage } = useLanguageStore();
const activeTab = ref<'dashboard' | 'compare' | 'execution' | 'settings'>('dashboard');
const runs = ref<JobRun[]>([]);
const currentResults = ref<ComparisonResult[]>([]);
const currentStats = ref<ComparisonStats | null>(null);
const activeJobName = ref<string>("No Job Selected");
const activeFieldFilter = ref<string | null>(null);
const isMobileNavOpen = ref(false);

// Initial load (Optional: load default mock)
onMounted(() => {
  const { oldData, newData } = generateMockData('LOAN_MASTER', 0.5);
  const results = compareData(oldData, newData);
  currentResults.value = results;
  currentStats.value = calculateStats(results);
  activeJobName.value = "Loan Account Master (Demo)";
});

const toggleLanguage = () => {
  setLanguage(language === 'en' ? 'zh' : 'en');
};

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

  runs.value = [newRun, ...runs.value];

  // 2. Simulate Backend Delay
  setTimeout(() => {
      // 3. Generate Mock Result based on schema
      const randomVariance = Math.random();
      const { oldData, newData } = generateMockData(config.schemaType, randomVariance);
      const results = compareData(oldData, newData);
      const stats = calculateStats(results);

      // 4. Update Job to Completed
      runs.value = runs.value.map(run => {
          if (run.runId === newRunId) {
              const updatedRun = {
                  ...run,
                  status: RunStatus.COMPLETED,
                  endTime: new Date().toISOString(),
                  results,
                  stats
              };
              console.log('Updated run with results and stats:', {
                  runId: updatedRun.runId,
                  hasResults: !!updatedRun.results,
                  hasStats: !!updatedRun.stats,
                  resultsLength: updatedRun.results?.length,
                  stats: updatedRun.stats
              });
              return updatedRun;
          }
          return run;
      });
      console.log('Updated runs array:', runs.value.length, 'runs');
      console.log('First run in array:', runs.value[0]);
  }, 2000); 
};

const handleViewResults = (runId: string) => {
  console.log('=== handleViewResults called ===');
  console.log('Looking for runId:', runId);
  console.log('Current runs array:', runs.value);
  const run = runs.value.find(r => r.runId === runId);
  console.log('Found run:', run);
  if (!run) {
      console.error('Run not found! runId:', runId);
      return;
  }
  console.log('Run details:', {
      runId: run.runId,
      configName: run.configName,
      status: run.status,
      hasResults: !!run.results,
      hasStats: !!run.stats,
      results: run.results,
      stats: run.stats,
      resultsLength: run.results?.length,
      schemaType: run.schemaType
  });
  // 即使没有results或stats，也尝试导航到dashboard
  if (run.results && run.stats) {
      currentResults.value = run.results;
      currentStats.value = run.stats;
      activeJobName.value = run.configName;
      activeFieldFilter.value = null; // Reset filter
      activeTab.value = 'dashboard';
      isMobileNavOpen.value = false; // Close mobile nav on selection
      console.log('Successfully navigated to dashboard');
  } else {
      console.error('Run is missing results or stats!');
      // 尝试使用mock数据
      const { oldData, newData } = generateMockData(run.schemaType || 'LOAN_MASTER', 0.5);
      const results = compareData(oldData, newData);
      const stats = calculateStats(results);
      currentResults.value = results;
      currentStats.value = stats;
      activeJobName.value = run.configName;
      activeFieldFilter.value = null;
      activeTab.value = 'dashboard';
      isMobileNavOpen.value = false;
      console.log('Used mock data as fallback');
  }
};

const handleFieldClick = (field: string) => {
  activeFieldFilter.value = field;
  activeTab.value = 'compare';
};

const setActiveFieldFilter = (field: string | null) => {
  activeFieldFilter.value = field;
};

const getSeverityClass = (severity: string) => {
  switch (severity) {
    case 'low':
      return 'px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600';
    case 'medium':
      return 'px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700';
    case 'high':
      return 'px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700';
    case 'critical':
      return 'px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700';
    default:
      return 'px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600';
  }
};
</script>
