import { DataRecord, DiscrepancyReason, ComparisonConfig, SchemaType } from './types';

// 1. The Reason Dictionary
export const REASON_DICTIONARY: Record<string, DiscrepancyReason> = {
  'R001': { 
    code: 'R001', 
    label: 'Rounding Difference', 
    description: 'Variance due to different rounding precision (e.g. 2 vs 4 decimals).',
    label_zh: '精度舍入差异',
    description_zh: '由于不同的小数位精度（例如2位与4位）导致的差异。',
    severity: 'low' 
  },
  'R002': { 
    code: 'R002', 
    label: 'Migration Transformation', 
    description: 'Data transformed during migration logic (e.g. Product Code mapping).', 
    label_zh: '迁移转换逻辑',
    description_zh: '迁移过程中因业务逻辑转换导致的数据变更（如产品代码映射）。',
    severity: 'medium' 
  },
  'R003': { 
    code: 'R003', 
    label: 'Date Offset', 
    description: 'Date varies by +/- 1 day due to timezone or EOD logic.', 
    label_zh: '日期偏移',
    description_zh: '由于时区或日终（EOD）逻辑导致的+/- 1天日期差异。',
    severity: 'low' 
  },
  'R004': { 
    code: 'R004', 
    label: 'Truncation', 
    description: 'String field truncated in target system.', 
    label_zh: '字段截断',
    description_zh: '目标系统中的字符串字段被截断。',
    severity: 'low' 
  },
  'R005': { 
    code: 'R005', 
    label: 'Record Drop', 
    description: 'Record failed to migrate completely.', 
    label_zh: '记录丢失',
    description_zh: '记录未成功迁移至新核心。',
    severity: 'critical' 
  },
  'R006': { 
    code: 'R006', 
    label: 'Interest Logic Change', 
    description: 'Accrual calculation method updated in new core.', 
    label_zh: '计息逻辑变更',
    description_zh: '新核心中的利息计提计算方法已更新。',
    severity: 'medium' 
  },
  'UNKNOWN': { 
    code: 'UNKNOWN', 
    label: 'Requires Investigation', 
    description: 'No automatic rule matched this discrepancy.', 
    label_zh: '需人工调查',
    description_zh: '没有自动规则匹配此差异。',
    severity: 'high' 
  },
};

// 2. Job Configurations
export const JOB_CONFIGS: ComparisonConfig[] = [
  { 
    id: 'JOB-LM-001', 
    name: 'Loan Account Master Comparison', 
    schemaType: 'LOAN_MASTER',
    sourceTable: 'LEGACY.LN_MSTR', 
    targetTable: 'CORE.LOAN_ACCOUNT', 
    description: 'Compare Principal, Interest Rates, and Dates for active loans.' 
  },
  { 
    id: 'JOB-LT-001', 
    name: 'Loan Transaction History', 
    schemaType: 'LOAN_TXN',
    sourceTable: 'LEGACY.LN_HIST', 
    targetTable: 'CORE.TXN_HIST', 
    description: 'Validate transaction amounts, capture dates, and types.' 
  },
];

// 3. Mock Data Generator
export const generateMockData = (schemaType: SchemaType, varianceLevel: number = 0): { oldData: DataRecord[]; newData: DataRecord[] } => {
  const oldData: DataRecord[] = [];
  const newData: DataRecord[] = [];
  const baseCount = 100;
  
  // Helper to introduce random variance
  const shouldCreateDiscrepancy = () => Math.random() < 0.28; // approx 28% error rate

  if (schemaType === 'LOAN_MASTER') {
    for (let i = 0; i < baseCount; i++) {
      const id = `LN-${100000 + i}`;
      const rec = {
        id,
        accountNumber: id,
        outstandingPrincipal: Math.floor(Math.random() * 500000) + 10000,
        dateLastActivity: '2023-10-25',
        interestRate: 4.5,
        productCode: 'MORTGAGE_FIXED',
        status: 'ACTIVE'
      };
      
      let newRec = { ...rec };
      let isMissing = false;

      // 1. Chance of missing record (3%)
      if (Math.random() < 0.03) {
         isMissing = true;
      }

      // 2. Chance of field discrepancies
      if (!isMissing && shouldCreateDiscrepancy()) {
         const errorType = Math.random();
         
         if (errorType < 0.35) {
             // Principal Mismatch (Value)
             newRec.outstandingPrincipal = Number((rec.outstandingPrincipal + (Math.random() * 10 - 5)).toFixed(2));
         } else if (errorType < 0.55) {
             // Date Mismatch (Timing)
             newRec.dateLastActivity = '2023-10-26';
         } else if (errorType < 0.70) {
             // Interest Rate (Rounding/Logic)
             newRec.interestRate = rec.interestRate + 0.125;
         } else if (errorType < 0.85) {
             // Product Code (Transformation)
             newRec.productCode = 'MORT_FX_30Y_V2';
         } else {
             // Status Change
             newRec.status = 'REVIEW_PENDING';
         }
      }

      oldData.push(rec);
      if (!isMissing) {
         newData.push(newRec);
      }
    }
  } else if (schemaType === 'LOAN_TXN') {
    for (let i = 0; i < baseCount; i++) {
      const id = `TX-${900000 + i}`;
      const rec = {
        id,
        accountNumber: `LN-${100000 + (i % 20)}`,
        captureDate: '2023-10-25T10:30:00Z',
        transactionAmount: Math.floor(Math.random() * 1000) + 50,
        transactionType: 'REPAYMENT',
        description: 'Monthly Installment'
      };

      let newRec = { ...rec };
      let isMissing = false;

      if (Math.random() < 0.02) isMissing = true;

      if (!isMissing && shouldCreateDiscrepancy()) {
         const errorType = Math.random();
         
         if (errorType < 0.4) {
             // Amount Mismatch
             newRec.transactionAmount = rec.transactionAmount + 0.01;
         } else if (errorType < 0.7) {
             // Date/Time Mismatch
             newRec.captureDate = '2023-10-25T10:30:01Z';
         } else {
             // Description Truncation
             newRec.description = 'Monthly Install';
         }
      }

      oldData.push(rec);
      if (!isMissing) {
        newData.push(newRec);
      }
    }
  }

  return { oldData, newData };
};

// Initial Mock Data (Default to Master)
export const MOCK_DATA = generateMockData('LOAN_MASTER');