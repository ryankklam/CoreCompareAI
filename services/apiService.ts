import { ComparisonResult, ComparisonStats, SchemaType, JobRun, RunStatus } from '../types';
import { generateMockData } from '../constants';
import { compareData, calculateStats } from '../utils';

// API 配置
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

// 模拟 API 延迟
const SIMULATED_DELAY = 1000;

// API 服务类
class ApiService {
  private mockMode: boolean;

  constructor(mockMode: boolean = true) {
    this.mockMode = mockMode;
  }

  setMockMode(mockMode: boolean) {
    this.mockMode = mockMode;
  }

  getMockMode() {
    return this.mockMode;
  }

  // 模拟 API 调用 - 生成比较结果
  private async mockCompareData(schemaType: SchemaType): Promise<{ results: ComparisonResult[]; stats: ComparisonStats }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const randomVariance = Math.random();
        const { oldData, newData } = generateMockData(schemaType, randomVariance);
        const results = compareData(oldData, newData);
        const stats = calculateStats(results);
        resolve({ results, stats });
      }, SIMULATED_DELAY);
    });
  }

  // 实际 API 调用 - 生成比较结果
  private async realCompareData(schemaType: SchemaType): Promise<{ results: ComparisonResult[]; stats: ComparisonStats }> {
    try {
      const response = await fetch(`${API_BASE_URL}/compare/${schemaType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // 实际 API 可能需要的请求体
        body: JSON.stringify({
          // 根据实际后端 API 要求调整
          schemaType,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch compare data:', error);
      // 失败时回退到 mock 数据
      return this.mockCompareData(schemaType);
    }
  }

  // 统一的比较数据方法
  async compareData(schemaType: SchemaType): Promise<{ results: ComparisonResult[]; stats: ComparisonStats }> {
    if (this.mockMode) {
      return this.mockCompareData(schemaType);
    }
    return this.realCompareData(schemaType);
  }

  // 模拟 API 调用 - 获取历史运行记录
  private async mockGetRuns(): Promise<JobRun[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // 返回空数组或模拟历史记录
        resolve([]);
      }, SIMULATED_DELAY);
    });
  }

  // 实际 API 调用 - 获取历史运行记录
  private async realGetRuns(): Promise<JobRun[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/runs`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch runs:', error);
      // 失败时回退到 mock 数据
      return this.mockGetRuns();
    }
  }

  // 统一的获取历史运行记录方法
  async getRuns(): Promise<JobRun[]> {
    if (this.mockMode) {
      return this.mockGetRuns();
    }
    return this.realGetRuns();
  }

  // 模拟 API 调用 - 获取运行结果
  private async mockGetRunResults(runId: string): Promise<JobRun> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // 生成模拟运行结果
        const schemaType: SchemaType = 'LOAN_MASTER';
        const randomVariance = Math.random();
        const { oldData, newData } = generateMockData(schemaType, randomVariance);
        const results = compareData(oldData, newData);
        const stats = calculateStats(results);

        const mockRun: JobRun = {
          runId,
          configId: 'job-lm-001',
          configName: 'Loan Account Master',
          schemaType,
          startTime: new Date(Date.now() - SIMULATED_DELAY).toISOString(),
          endTime: new Date().toISOString(),
          status: RunStatus.COMPLETED,
          results,
          stats,
        };

        resolve(mockRun);
      }, SIMULATED_DELAY);
    });
  }

  // 实际 API 调用 - 获取运行结果
  private async realGetRunResults(runId: string): Promise<JobRun> {
    try {
      const response = await fetch(`${API_BASE_URL}/runs/${runId}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Failed to fetch run ${runId}:`, error);
      // 失败时回退到 mock 数据
      return this.mockGetRunResults(runId);
    }
  }

  // 统一的获取运行结果方法
  async getRunResults(runId: string): Promise<JobRun> {
    if (this.mockMode) {
      return this.mockGetRunResults(runId);
    }
    return this.realGetRunResults(runId);
  }
}

// 导出单例实例
export const apiService = new ApiService();

// API 范例文档
export const API_EXAMPLES = {
  compareData: {
    endpoint: `${API_BASE_URL}/compare/:schemaType`,
    method: 'POST',
    request: {
      schemaType: 'LOAN_MASTER',
      timestamp: '2023-10-25T10:00:00Z',
    },
    response: {
      results: [
        {
          recordId: 'LN-100000',
          oldRecord: {
            id: 'LN-100000',
            accountNumber: 'LN-100000',
            outstandingPrincipal: 150000,
            dateLastActivity: '2023-10-25',
            interestRate: 4.5,
            productCode: 'MORTGAGE_FIXED',
            status: 'ACTIVE'
          },
          newRecord: {
            id: 'LN-100000',
            accountNumber: 'LN-100000',
            outstandingPrincipal: 150000.05,
            dateLastActivity: '2023-10-25',
            interestRate: 4.5,
            productCode: 'MORTGAGE_FIXED',
            status: 'ACTIVE'
          },
          type: 'VALUE_MISMATCH',
          diffs: ['outstandingPrincipal'],
          reasonCode: 'R001'
        }
      ],
      stats: {
        totalRecords: 100,
        matchCount: 72,
        mismatchCount: 28,
        matchRate: 72,
        discrepancyBreakdown: {
          'R001': 12,
          'R002': 8,
          'R003': 5,
          'UNKNOWN': 3
        },
        fieldStats: {
          outstandingPrincipal: { total: 100, mismatch: 12 },
          productCode: { total: 100, mismatch: 8 },
          dateLastActivity: { total: 100, mismatch: 5 },
          status: { total: 100, mismatch: 3 }
        }
      }
    }
  },
  getRuns: {
    endpoint: `${API_BASE_URL}/runs`,
    method: 'GET',
    request: {},
    response: [
      {
        runId: 'RUN-123456',
        configId: 'job-lm-001',
        configName: 'Loan Account Master',
        schemaType: 'LOAN_MASTER',
        startTime: '2023-10-25T10:00:00Z',
        endTime: '2023-10-25T10:01:30Z',
        status: 'COMPLETED',
        stats: {
          totalRecords: 100,
          matchCount: 72,
          mismatchCount: 28,
          matchRate: 72
        }
      }
    ]
  },
  getRunResults: {
    endpoint: `${API_BASE_URL}/runs/:runId`,
    method: 'GET',
    request: {},
    response: {
      runId: 'RUN-123456',
      configId: 'job-lm-001',
      configName: 'Loan Account Master',
      schemaType: 'LOAN_MASTER',
      startTime: '2023-10-25T10:00:00Z',
      endTime: '2023-10-25T10:01:30Z',
      status: 'COMPLETED',
      results: [
        // 与 compareData 响应格式相同
      ],
      stats: {
        // 与 compareData 响应格式相同
      }
    }
  }
};
