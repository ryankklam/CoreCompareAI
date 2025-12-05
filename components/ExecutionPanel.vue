<template>
  <div class="p-6 space-y-8">
    <!-- Configuration Cards -->
    <div>
      <h2 class="text-lg font-semibold text-gray-800 mb-4">{{ t('exec.available_jobs') }}</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="config in configs"
          :key="config.id"
          class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
        >
          <div class="flex justify-between items-start mb-3">
            <div class="bg-indigo-50 text-indigo-600 p-2 rounded-lg font-mono text-xs font-bold">
              {{ config.id }}
            </div>
            <button
              @click="emit('run-job', config.id)"
              class="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors shadow-sm"
              title="Run Comparison"
            >
              <Play :size="16" fill="currentColor" />
            </button>
          </div>
          <h3 class="font-semibold text-gray-900 mb-1">{{ config.name }}</h3>
          <p class="text-sm text-gray-500 mb-4 line-clamp-2">{{ config.description }}</p>
          
          <div class="text-xs text-gray-400 border-t border-gray-100 pt-3 flex flex-col gap-1">
             <div class="flex justify-between">
               <span>Source:</span> <span class="font-mono text-gray-600">{{ config.sourceTable }}</span>
             </div>
             <div class="flex justify-between">
               <span>Target:</span> <span class="font-mono text-gray-600">{{ config.targetTable }}</span>
             </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Execution History -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div class="p-6 border-b border-gray-100 flex items-center justify-between">
         <h2 class="text-lg font-semibold text-gray-800">{{ t('exec.job_history') }}</h2>
         <span class="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md text-xs font-medium">{{ runs.length }} Runs</span>
      </div>
      
      <div class="overflow-x-auto">
        <table class="w-full text-sm text-left">
          <thead class="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
            <tr>
              <th class="px-6 py-3 font-medium">{{ t('exec.run_id') }}</th>
              <th class="px-6 py-3 font-medium">{{ t('exec.job_name') }}</th>
              <th class="px-6 py-3 font-medium">{{ t('exec.start_time') }}</th>
              <th class="px-6 py-3 font-medium">{{ t('exec.duration') }}</th>
              <th class="px-6 py-3 font-medium">{{ t('exec.status') }}</th>
              <th class="px-6 py-3 font-medium text-right">{{ t('exec.actions') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-if="sortedRuns.length === 0">
              <td colspan="6" class="px-6 py-8 text-center text-gray-400 italic">
                {{ t('exec.no_history') }}
              </td>
            </tr>
            <tr
              v-for="run in sortedRuns"
              :key="run.runId"
              class="hover:bg-gray-50"
            >
              <td class="px-6 py-4 font-mono text-gray-600 text-xs">{{ run.runId }}</td>
              <td class="px-6 py-4 font-medium text-gray-900">{{ run.configName }}</td>
              <td class="px-6 py-4 text-gray-600">{{ formatTime(run.startTime) }}</td>
              <td class="px-6 py-4 text-gray-600">
                {{ run.endTime ? formatDuration(run.startTime, run.endTime) : '-' }}
              </td>
              <td class="px-6 py-4">
                      <span :class="getStatusConfig(run.status).class" class="flex items-center gap-1">
                        <Clock v-if="getStatusConfig(run.status).icon === 'Clock'" :size="12" />
                        <RefreshCw v-else-if="getStatusConfig(run.status).icon === 'RefreshCw'" :size="12" :class="{ 'animate-spin': getStatusConfig(run.status).isAnimated }" />
                        <CheckCircle2 v-else-if="getStatusConfig(run.status).icon === 'CheckCircle2'" :size="12" />
                        <AlertCircle v-else-if="getStatusConfig(run.status).icon === 'AlertCircle'" :size="12" />
                        {{ getStatusConfig(run.status).text }}
                      </span>
                    </td>
              <td class="px-6 py-4 text-right">
                <button
                  v-if="run.status === RunStatus.COMPLETED"
                  @click="emit('view-results', run.runId)"
                  class="text-indigo-600 hover:text-indigo-800 font-medium text-xs flex items-center gap-1 ml-auto"
                >
                  <Eye :size="14" /> {{ t('exec.view_results') }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Play, Clock, CheckCircle2, AlertCircle, Eye, RefreshCw } from 'lucide-vue-next';
import { ComparisonConfig, JobRun, RunStatus } from '../types';
import { useLanguageStore } from '../stores/language';

const props = defineProps<{
  configs: ComparisonConfig[];
  runs: JobRun[];
}>();

const emit = defineEmits<{
  'run-job': [configId: string];
  'view-results': [runId: string];
}>();

const { t } = useLanguageStore();

// Sort runs by startTime desc
const sortedRuns = computed(() => {
  return [...props.runs].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
});

const formatTime = (time: string) => {
  return new Date(time).toLocaleTimeString();
};

const formatDuration = (start: string, end: string) => {
  const duration = (new Date(end).getTime() - new Date(start).getTime()) / 1000;
  return `${duration.toFixed(1)}s`;
};

// Status Badge Component - moved to template
// Using a computed property to determine the appropriate configuration
const getStatusConfig = (status: RunStatus) => {
  const { t } = useLanguageStore();
  
  switch (status) {
    case RunStatus.QUEUED:
      return {
        class: 'px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 flex items-center gap-1',
        icon: 'Clock',
        text: t('exec.queued'),
        isAnimated: false
      };
    case RunStatus.RUNNING:
      return {
        class: 'px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 flex items-center gap-1',
        icon: 'RefreshCw',
        text: t('exec.running'),
        isAnimated: true
      };
    case RunStatus.COMPLETED:
      return {
        class: 'px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 flex items-center gap-1',
        icon: 'CheckCircle2',
        text: t('exec.completed'),
        isAnimated: false
      };
    case RunStatus.FAILED:
      return {
        class: 'px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 flex items-center gap-1',
        icon: 'AlertCircle',
        text: t('exec.failed'),
        isAnimated: false
      };
    default:
      return {
        class: '',
        icon: 'AlertCircle',
        text: status,
        isAnimated: false
      };
  }
};
</script>
