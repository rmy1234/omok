import { type RankTier } from '../../infrastructure/api/auth-api';
import '../styles/RankEmblem.css';

interface RankEmblemProps {
  tier: RankTier;
  size?: 'small' | 'medium' | 'large';
}

export function RankEmblem({ tier, size = 'medium' }: RankEmblemProps) {
  const tierLower = tier.toLowerCase();
  
  return (
    <div className={`rank-emblem rank-emblem-${tierLower} rank-emblem-${size}`}>
      {/* 날개 (왼쪽) */}
      <div className={`emblem-wing emblem-wing-left wing-${tierLower}`} />
      
      {/* 날개 (오른쪽) */}
      <div className={`emblem-wing emblem-wing-right wing-${tierLower}`} />
      
      {/* 왕관 (골드 이상) */}
      {(tier === 'GOLD' || tier === 'PLATINUM' || tier === 'DIAMOND' || tier === 'CHALLENGER') && (
        <div className={`emblem-crown crown-${tierLower}`} />
      )}
      
      {/* 방패 */}
      <div className={`emblem-shield shield-${tierLower}`}>
        {/* 아이콘 */}
        <div className={`emblem-icon icon-${tierLower}`} />
      </div>
      
      {/* 배너 */}
      <div className={`emblem-banner banner-${tierLower}`} />
    </div>
  );
}
