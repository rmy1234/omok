import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getRankings, type RankingEntry } from '../../infrastructure/api/auth-api';
import { useUserStore } from '../../infrastructure/state/user-store';
import { RankEmblem } from '../components/RankEmblem';
import '../styles/Stats.css';

interface StatsPageProps {
  onNavigate: (page: 'home' | 'login' | 'signup' | 'game' | 'lobby' | 'room' | 'stats') => void;
}

export function StatsPage({ onNavigate }: StatsPageProps) {
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useUserStore();

  useEffect(() => {
    loadRankings();
  }, []);

  const loadRankings = async () => {
    setIsLoading(true);
    setError(null);
    
    const result = await getRankings();
    
    if (result.success && result.rankings) {
      setRankings(result.rankings);
    } else {
      setError(result.error || '랭킹을 불러올 수 없습니다.');
    }
    
    setIsLoading(false);
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `${rank}`;
    }
  };

  const getRankClass = (rank: number) => {
    switch (rank) {
      case 1: return 'rank-gold';
      case 2: return 'rank-silver';
      case 3: return 'rank-bronze';
      default: return '';
    }
  };

  return (
    <div className="stats-page">
      <div className="stats-container">
        <motion.div
          className="stats-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="stats-title">🏆 랭킹</h1>
        </motion.div>

        <motion.button
          className="back-button"
          onClick={() => onNavigate('lobby')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          ← 로비로 돌아가기
        </motion.button>

        {isLoading ? (
          <div className="stats-loading">
            <div className="loading-spinner" />
            <p>랭킹을 불러오는 중...</p>
          </div>
        ) : error ? (
          <div className="stats-error">
            <p>{error}</p>
            <button onClick={loadRankings}>다시 시도</button>
          </div>
        ) : rankings.length === 0 ? (
          <div className="stats-empty">
            <p>아직 등록된 플레이어가 없습니다.</p>
          </div>
        ) : (
          <motion.div
            className="rankings-table"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="rankings-header">
              <span className="col-rank">순위</span>
              <span className="col-nickname">닉네임</span>
              <span className="col-record">전적</span>
              <span className="col-points">포인트</span>
              <span className="col-winrate">승률</span>
            </div>
            
            <div className="rankings-body">
              {rankings.map((entry, index) => (
                <motion.div
                  key={entry.nickname}
                  className={`ranking-row ${getRankClass(entry.rank)} ${
                    currentUser?.nickname === entry.nickname ? 'my-rank' : ''
                  }`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <span className={`col-rank ${getRankClass(entry.rank)}`}>
                    {getRankIcon(entry.rank)}
                  </span>
                  <span className="col-nickname">
                    {entry.stats.rank && entry.stats.points >= 50 && (
                      <RankEmblem tier={entry.stats.rank} size="small" />
                    )}
                    {entry.nickname}
                    {currentUser?.nickname === entry.nickname && (
                      <span className="my-badge">나</span>
                    )}
                  </span>
                  <span className="col-record">
                    <span className="record-total">{entry.stats.totalGames}전</span>
                    <span className="record-detail">
                      <span className="win">{entry.stats.wins}승</span>
                      <span className="draw">{entry.stats.draws}무</span>
                      <span className="loss">{entry.stats.losses}패</span>
                    </span>
                  </span>
                  <span className="col-points">
                    {entry.stats.points}P
                  </span>
                  <span className="col-winrate">
                    <span className="winrate-value">{entry.stats.winRate}%</span>
                    <div className="winrate-bar">
                      <div 
                        className="winrate-fill"
                        style={{ width: `${entry.stats.winRate}%` }}
                      />
                    </div>
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

