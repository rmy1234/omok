export type RankTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND' | 'CHALLENGER';

export interface RankInfo {
  tier: RankTier;
  order: number; // 정렬용 순서 (낮을수록 높은 랭크)
}

/**
 * 포인트를 기반으로 랭크를 계산합니다.
 * 
 * 랭크 기준:
 * - BRONZE: 50포인트 이상
 * - SILVER: 100포인트 이상
 * - GOLD: 200포인트 이상
 * - PLATINUM: 400포인트 이상
 * - DIAMOND: 800포인트 이상
 * - CHALLENGER: 1600포인트 이상
 * 
 * 50포인트 미만일 경우 null을 반환합니다 (랭크 없음).
 */
export function calculateRank(points: number): RankInfo | null {
  if (points >= 1600) {
    return { tier: 'CHALLENGER', order: 1 };
  }
  if (points >= 800) {
    return { tier: 'DIAMOND', order: 2 };
  }
  if (points >= 400) {
    return { tier: 'PLATINUM', order: 3 };
  }
  if (points >= 200) {
    return { tier: 'GOLD', order: 4 };
  }
  if (points >= 100) {
    return { tier: 'SILVER', order: 5 };
  }
  if (points >= 50) {
    return { tier: 'BRONZE', order: 6 };
  }
  // 50포인트 미만: 랭크 없음
  return null;
}

/**
 * 랭크 간 순서 차이를 계산합니다.
 */
export function getRankOrderDifference(tier1: RankTier, tier2: RankTier): number {
  const orderMap: Record<RankTier, number> = {
    CHALLENGER: 1,
    DIAMOND: 2,
    PLATINUM: 3,
    GOLD: 4,
    SILVER: 5,
    BRONZE: 6,
  };
  return Math.abs(orderMap[tier1] - orderMap[tier2]);
}

/**
 * 랭크 이름을 한글로 변환
 */
export function getRankName(tier: RankTier): string {
  const names: Record<RankTier, string> = {
    BRONZE: '브론즈',
    SILVER: '실버',
    GOLD: '골드',
    PLATINUM: '플래티넘',
    DIAMOND: '다이아몬드',
    CHALLENGER: '챌린저',
  };
  return names[tier];
}

