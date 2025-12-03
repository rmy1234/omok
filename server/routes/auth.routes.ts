import { Router, Request, Response } from 'express';
import { userRepository } from '../repositories/user.repository';

const router = Router();

// 회원가입
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { username, nickname, password } = req.body;

    // 유효성 검사
    if (!username || username.length < 4) {
      res.status(400).json({ success: false, error: '아이디는 4자 이상이어야 합니다.' });
      return;
    }

    if (!nickname || nickname.length < 2) {
      res.status(400).json({ success: false, error: '닉네임은 2자 이상이어야 합니다.' });
      return;
    }

    if (!password || password.length < 6) {
      res.status(400).json({ success: false, error: '비밀번호는 6자 이상이어야 합니다.' });
      return;
    }

    // 중복 검사
    const existingUsername = await userRepository.findByUsername(username);
    if (existingUsername) {
      res.status(400).json({ success: false, error: '이미 사용 중인 아이디입니다.' });
      return;
    }

    const existingNickname = await userRepository.findByNickname(nickname);
    if (existingNickname) {
      res.status(400).json({ success: false, error: '이미 사용 중인 닉네임입니다.' });
      return;
    }

    // 사용자 생성
    const user = await userRepository.create(username, nickname, password);
    
    if (!user) {
      res.status(500).json({ success: false, error: '회원가입에 실패했습니다.' });
      return;
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error('회원가입 오류:', error);
    res.status(500).json({ success: false, error: '서버 오류가 발생했습니다.' });
  }
});

// 로그인
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    // 유효성 검사
    if (!username || !password) {
      res.status(400).json({ success: false, error: '아이디와 비밀번호를 입력해주세요.' });
      return;
    }

    // 사용자 조회
    const user = await userRepository.findByUsername(username);
    if (!user) {
      res.status(401).json({ success: false, error: '아이디 또는 비밀번호가 올바르지 않습니다.' });
      return;
    }

    // 비밀번호 확인
    const isValid = await userRepository.verifyPassword(user, password);
    if (!isValid) {
      res.status(401).json({ success: false, error: '아이디 또는 비밀번호가 올바르지 않습니다.' });
      return;
    }

    // 전적 정보도 함께 반환
    const stats = userRepository.getStats(user.id);
    res.json({ success: true, user: userRepository.toPublic(user), stats });
  } catch (error) {
    console.error('로그인 오류:', error);
    res.status(500).json({ success: false, error: '서버 오류가 발생했습니다.' });
  }
});

// 전적 조회
router.get('/stats/:nickname', async (req: Request, res: Response) => {
  try {
    const { nickname } = req.params;
    
    const stats = userRepository.getStatsByNickname(nickname);
    
    if (!stats) {
      res.status(404).json({ success: false, error: '사용자를 찾을 수 없습니다.' });
      return;
    }

    res.json({ success: true, stats });
  } catch (error) {
    console.error('전적 조회 오류:', error);
    res.status(500).json({ success: false, error: '서버 오류가 발생했습니다.' });
  }
});

// 랭킹 조회
router.get('/rankings', async (_req: Request, res: Response) => {
  try {
    const rankings = userRepository.getRankings();
    res.json({ success: true, rankings });
  } catch (error) {
    console.error('랭킹 조회 오류:', error);
    res.status(500).json({ success: false, error: '서버 오류가 발생했습니다.' });
  }
});

export default router;

