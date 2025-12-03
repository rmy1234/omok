import { type RankTier, getRankOrderDifference } from './rank';

const RANK_ORDER: Record<RankTier, number> = {
  CHALLENGER: 1,
  DIAMOND: 2,
  PLATINUM: 3,
  GOLD: 4,
  SILVER: 5,
  BRONZE: 6,
};

/**
 * 게임 결과에 따른 포인트 계산
 * 
 * 규칙:
 * - 기본 승리: +10, 기본 패배: -10
 * - 랭크 차이에 따라 2포인트씩 증감
 * - 낮은 랭크가 높은 랭크를 이기면 더 많은 포인트 획득
 * - 높은 랭크가 낮은 랭크를 이기면 적은 포인트 획득 (최소 0)
 * 
 * @param myRank 내 랭크
 * @param opponentRank 상대 랭크
 * @param isWinner 승자인지 여부
 * @returns 포인트 변화량 (양수면 증가, 음수면 감소)
 */
export function calculatePointsChange(
  myRank: RankTier,
  opponentRank: RankTier,
  isWinner: boolean
): number {
  const rankDiff = getRankOrderDifference(myRank, opponentRank);
  const basePoints = 10;
  const bonusPoints = rankDiff * 2;
  
  const myOrder = RANK_ORDER[myRank];
  const opponentOrder = RANK_ORDER[opponentRank];
  
  if (isWinner) {
    // 승리 시
    if (myOrder > opponentOrder) {
      // 낮은 랭크가 높은 랭크를 이김: +10 + (차이 * 2)
      return basePoints + bonusPoints;
    } else if (myOrder < opponentOrder) {
      // 높은 랭크가 낮은 랭크를 이김: +10 - (차이 * 2), 최소 0
      return Math.max(0, basePoints - bonusPoints);
    } else {
      // 같은 랭크: +10
      return basePoints;
    }
  } else {
    // 패배 시
    if (myOrder < opponentOrder) {
      // 높은 랭크가 낮은 랭크에게 짐: -(10 + (차이 * 2))
      return -(basePoints + bonusPoints);
    } else if (myOrder > opponentOrder) {
      // 낮은 랭크가 높은 랭크에게 짐: -(10 - (차이 * 2))
      return -(basePoints - bonusPoints);
    } else {
      // 같은 랭크: -10
      return -basePoints;
    }
  }
}

