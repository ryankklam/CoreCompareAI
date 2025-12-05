import { DataRecord, ComparisonResult, DiscrepancyType, ComparisonStats } from './types';

// --- Generic Dynamic Comparison Logic ---
export const compareData = (oldData: DataRecord[], newData: DataRecord[]): ComparisonResult[] => {
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

export const calculateStats = (results: ComparisonResult[]): ComparisonStats => {
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
