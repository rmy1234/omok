import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { socketClient, type ChatMessage } from '../../infrastructure/socket/socket-client';
import '../styles/Chat.css';

interface ChatBoxProps {
  roomId: string;
  currentUserNickname: string;
}

interface Position {
  x: number;
  y: number;
}

export function ChatBox({ roomId, currentUserNickname }: ChatBoxProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [minimizedPosition, setMinimizedPosition] = useState<Position>({ x: 0, y: 0 }); // 우하단 기본값
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const [hasDragged, setHasDragged] = useState(false);
  const [mouseDownPos, setMouseDownPos] = useState<Position | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatBoxRef = useRef<HTMLDivElement>(null);

  // 초기 위치 설정
  useEffect(() => {
    const savedPosition = sessionStorage.getItem('chatBoxPosition');
    if (savedPosition) {
      setPosition(JSON.parse(savedPosition));
    } else {
      // 기본 위치: 우하단 (채팅창이 위로 펼쳐지므로 하단 기준)
      setPosition({
        x: window.innerWidth - 344, // 320px + 24px margin
        y: window.innerHeight - 644 // 620px + 24px margin
      });
    }

    // 최소화 아이콘 위치 - 저장된 위치 사용, 없거나 좌상단이면 우하단 기본값
    const calculateDefaultMinimizedPosition = () => {
      const iconSize = 60;
      const margin = 24;
      return {
        x: window.innerWidth - iconSize - margin,
        y: window.innerHeight - iconSize - margin
      };
    };

    const savedMinimizedPosition = sessionStorage.getItem('chatMinimizedPosition');
    if (savedMinimizedPosition) {
      const saved = JSON.parse(savedMinimizedPosition);
      // 좌상단 근처(예: x < 300, y < 300)이면 우하단으로 재설정
      if (saved.x < 300 && saved.y < 300) {
        const defaultPos = calculateDefaultMinimizedPosition();
        setMinimizedPosition(defaultPos);
        sessionStorage.setItem('chatMinimizedPosition', JSON.stringify(defaultPos));
      } else {
        setMinimizedPosition(saved);
      }
    } else {
      // 기본 위치: 우하단
      const defaultPos = calculateDefaultMinimizedPosition();
      setMinimizedPosition(defaultPos);
      sessionStorage.setItem('chatMinimizedPosition', JSON.stringify(defaultPos));
    }
    setIsInitialized(true);
  }, []);

  // 위치 저장
  useEffect(() => {
    if (position.x !== 0 || position.y !== 0) {
      sessionStorage.setItem('chatBoxPosition', JSON.stringify(position));
    }
  }, [position]);

  // 최소화 아이콘 위치 저장
  useEffect(() => {
    sessionStorage.setItem('chatMinimizedPosition', JSON.stringify(minimizedPosition));
  }, [minimizedPosition]);

  // 메시지 목록 자동 스크롤
  const scrollToBottom = (smooth: boolean = true) => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      container.scrollTop = container.scrollHeight;
    } else {
      // fallback: messagesEndRef 사용
      messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    }
  };

  // 메시지가 추가되면 스크롤
  useEffect(() => {
    if (!isMinimized) {
      scrollToBottom();
    }
  }, [messages, isMinimized]);

  // 채팅창이 열릴 때(최소화에서 복원될 때) 스크롤을 맨 아래로
  useEffect(() => {
    if (!isMinimized) {
      // 약간의 지연을 주어 DOM이 완전히 렌더링된 후 스크롤
      setTimeout(() => {
        scrollToBottom(false); // 즉시 스크롤 (애니메이션 없이)
      }, 50);
    }
  }, [isMinimized]);

  useEffect(() => {
    const socket = socketClient.getSocket();
    if (!socket) return;

    // 새 메시지 수신
    const handleNewMessage = (message: ChatMessage) => {
      setMessages((prev) => [...prev, message]);
      // 최소화 상태일 때 읽지 않은 메시지 카운트 증가
      if (isMinimized && message.sender !== currentUserNickname) {
        setUnreadCount((prev) => prev + 1);
      }
    };

    // 채팅 히스토리 수신
    const handleChatHistory = (history: ChatMessage[]) => {
      setMessages(history);
    };

    socket.on('newMessage', handleNewMessage);
    socket.on('chatHistory', handleChatHistory);

    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('chatHistory', handleChatHistory);
    };
  }, [isMinimized, currentUserNickname]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedMessage = inputValue.trim();
    if (!trimmedMessage) return;

    socketClient.sendMessage(roomId, trimmedMessage);
    setInputValue('');
    inputRef.current?.focus();
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleMinimize = () => {
    setIsMinimized(true);
  };

  const handleRestore = useCallback(() => {
    setIsMinimized(false);
    setUnreadCount(0);
  }, []);

  // 드래그 시작
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.chat-header-buttons')) return;
    
    // 마우스 다운 위치 저장 및 드래그 플래그 초기화
    setMouseDownPos({ x: e.clientX, y: e.clientY });
    setHasDragged(false);
    setIsDragging(true);
    const rect = chatBoxRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  }, []);

  // 드래그 중
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !mouseDownPos) return;

    // 마우스 이동 거리 계산 (드래그 판단 기준: 5px 이상)
    const moveDistance = Math.sqrt(
      Math.pow(e.clientX - mouseDownPos.x, 2) + 
      Math.pow(e.clientY - mouseDownPos.y, 2)
    );

    // 일정 거리 이상 이동했으면 드래그로 판단
    if (moveDistance > 5) {
      setHasDragged(true);
    }

    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;

    // 화면 경계 체크
    const maxX = window.innerWidth - (isMinimized ? 60 : 320);
    const maxY = window.innerHeight - (isMinimized ? 60 : 620);

    const boundedPosition = {
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    };

    if (isMinimized) {
      setMinimizedPosition(boundedPosition);
    } else {
      setPosition(boundedPosition);
    }
  }, [isDragging, dragOffset, isMinimized, mouseDownPos]);

  // 드래그 종료
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 전역 마우스 이벤트 등록
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // 초기화 전에는 렌더링하지 않음
  if (!isInitialized) {
    return null;
  }

  // 최소화된 아이콘
  if (isMinimized) {
    return (
      <motion.div
        ref={chatBoxRef}
        className="chat-minimized"
        style={{
          left: minimizedPosition.x,
          top: minimizedPosition.y,
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onMouseDown={handleMouseDown}
        onMouseUp={() => {
          // 드래그가 발생하지 않았으면 채팅창 열기
          if (!hasDragged) {
            handleRestore();
          }
          // 상태 초기화
          setHasDragged(false);
          setMouseDownPos(null);
        }}
      >
        <span className="chat-minimized-icon">💬</span>
        {unreadCount > 0 && (
          <motion.span
            className="chat-unread-badge"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>
        )}
      </motion.div>
    );
  }

  // 채팅창이 위로 펼쳐지도록 애니메이션 설정
  return (
    <motion.div
      ref={chatBoxRef}
      className="chat-box"
      style={{
        left: position.x,
        top: position.y,
        cursor: isDragging ? 'grabbing' : 'default',
        transformOrigin: 'bottom right'
      }}
      initial={{ opacity: 0, scale: 0.9, y: 50 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      <div 
        className="chat-header"
        onMouseDown={handleMouseDown}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <div className="chat-header-title">
          <span className="chat-icon">💬</span>
          <span className="chat-title">채팅</span>
        </div>
        <div className="chat-header-buttons">
          <button 
            className="chat-minimize-button"
            onClick={handleMinimize}
            title="최소화"
          >
            <span>−</span>
          </button>
        </div>
      </div>

      <div className="chat-messages" ref={messagesContainerRef}>
        <AnimatePresence initial={false}>
          {messages.length === 0 ? (
            <div className="chat-empty">
              <p>채팅을 시작해보세요!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <motion.div
                key={msg.id}
                className={`chat-message ${msg.sender === currentUserNickname ? 'my-message' : 'other-message'} ${msg.isSystem ? 'system-message' : ''}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                {msg.isSystem ? (
                  <div className="system-text">{msg.message}</div>
                ) : (
                  <>
                    <div className="message-header">
                      <span className="message-sender">
                        {msg.sender === currentUserNickname ? '나' : msg.sender}
                        {msg.isSpectator && (
                          <span className="spectator-badge">(관전자)</span>
                        )}
                      </span>
                      <span className="message-time">{formatTime(msg.timestamp)}</span>
                    </div>
                    <div className="message-content">{msg.message}</div>
                  </>
                )}
              </motion.div>
            ))
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-form" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          type="text"
          className="chat-input"
          placeholder="메시지를 입력하세요..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          maxLength={200}
        />
        <motion.button
          type="submit"
          className="chat-send-button"
          disabled={!inputValue.trim()}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          전송
        </motion.button>
      </form>
    </motion.div>
  );
}
