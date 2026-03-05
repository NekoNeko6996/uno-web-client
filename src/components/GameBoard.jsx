import React, { useMemo } from 'react';
import UnoCard from './UnoCard';

// 1. COMPONENT ĐỐI THỦ
const OpponentAvatar = ({ opp, position, currentTurnPlayerName }) => {
  if (!opp) return null;
  const isTurn = currentTurnPlayerName === opp.name;

  // Xác định xem có phải đối thủ ở trên cùng không
  const isTop = position === 'top';

  const posClasses = {
    top: 'top-2 md:top-6 left-1/2 -translate-x-1/2',
    left: 'left-2 md:left-10 top-1/3 -translate-y-1/2',
    right: 'right-2 md:right-10 top-1/3 -translate-y-1/2'
  };

  return (
    <div className={`absolute flex ${isTop ? 'flex-row md:flex-col' : 'flex-col'} items-center justify-center p-1.5 md:p-2 rounded-xl backdrop-blur-md bg-gray-900/60 border-2 transition-all duration-300 z-40
      ${isTurn ? 'border-yellow-400 scale-110 shadow-[0_0_15px_rgba(250,204,21,0.8)]' : 'border-gray-500/50'}
      ${posClasses[position]}
    `}>
      <div className="w-9 h-9 md:w-14 md:h-14 shrink-0 bg-gray-700 rounded-full flex items-center justify-center text-lg md:text-3xl shadow-md border-2 border-white">
        🤖
      </div>
      {/* Tên và số bài (Nếu ở Top thì nằm ngang bên phải avatar để tiết kiệm chỗ) */}
      <div className={`flex flex-col items-center ${isTop ? 'ml-2 md:ml-0 md:mt-2' : 'mt-1 md:mt-2'}`}>
        <span className="text-white font-bold text-[11px] md:text-sm whitespace-nowrap">{opp.name}</span>
        <span className="bg-red-500 text-white text-[10px] md:text-xs px-2 py-0.5 md:py-1 rounded-full mt-0.5 border border-white font-bold shadow-lg">
          🎴 {opp.cardCount}
        </span>
      </div>
    </div>
  );
};

// 2. COMPONENT BÀN CỜ CHÍNH
const GameBoard = ({ gameState, playerName, onPlayCard, onDrawCard }) => {
  const isMyTurn = gameState.currentTurnPlayerName === playerName;

  const arrangeOpponents = () => {
    let arranged = { top: null, left: null, right: null };
    if (gameState.opponents.length === 1) {
      arranged.top = gameState.opponents[0];
    } else if (gameState.opponents.length === 2) {
      arranged.left = gameState.opponents[0];
      arranged.right = gameState.opponents[1];
    } else {
      arranged.left = gameState.opponents[0];
      arranged.top = gameState.opponents[1];
      arranged.right = gameState.opponents[2];
    }
    return arranged;
  };

  const opponents = arrangeOpponents();

  const getActivePosition = () => {
    if (isMyTurn) return 'bottom';
    if (opponents.top?.name === gameState.currentTurnPlayerName) return 'top';
    if (opponents.left?.name === gameState.currentTurnPlayerName) return 'left';
    if (opponents.right?.name === gameState.currentTurnPlayerName) return 'right';
    return 'bottom';
  };

  const getPointerRotation = () => {
    switch (getActivePosition()) {
      case 'top': return 'rotate(-90deg)';
      case 'left': return 'rotate(180deg)';
      case 'right': return 'rotate(0deg)';
      case 'bottom': return 'rotate(90deg)';
      default: return 'rotate(90deg)';
    }
  };

  const groupedCards = useMemo(() => {
    if (!gameState || !gameState.myHand) return [];
    const cardsWithOriginalIndex = gameState.myHand.map((card, idx) => ({ ...card, originalIndex: idx }));
    const colorWeight = { 'RED': 1, 'BLUE': 2, 'GREEN': 3, 'YELLOW': 4, 'NONE': 5 };

    cardsWithOriginalIndex.sort((a, b) => {
      if (colorWeight[a.color] !== colorWeight[b.color]) return colorWeight[a.color] - colorWeight[b.color];
      const valA = a.value !== null ? a.value : a.type;
      const valB = b.value !== null ? b.value : b.type;
      if (valA < valB) return -1;
      if (valA > valB) return 1;
      return 0;
    });

    const groups = [];
    let currentColor = null;
    let currentGroup = [];
    cardsWithOriginalIndex.forEach(card => {
      if (card.color !== currentColor) {
        if (currentGroup.length > 0) groups.push(currentGroup);
        currentColor = card.color;
        currentGroup = [card];
      } else {
        currentGroup.push(card);
      }
    });
    if (currentGroup.length > 0) groups.push(currentGroup);
    return groups;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.myHand]);

  return (
    <>
      <style>{`
        /* Fix lỗi nền trắng bằng cách set cứng màu xanh rêu (#166534) cho auto-landscape */
        @media screen and (orientation: portrait) {
          .auto-landscape {
            transform: rotate(-90deg);
            transform-origin: left top;
            width: 100vh !important;
            height: 100vw !important;
            position: fixed !important;
            top: 100% !important;
            left: 0 !important;
            overflow: hidden !important;
            background-color: #166534 !important; 
          }
        }
        
        .perspective-table {
          perspective: 1200px;
        }
        .table-surface-3d {
          transform-style: preserve-3d;
          /* Giảm độ nghiêng X xuống 40 độ để vòng tròn bớt dẹt và vừa vặn màn hình hơn */
          transform: rotateX(40deg) scale(1); 
        }
        
        .deck-thickness {
          box-shadow: 
            -1px 1px 0 #fff, -2px 2px 0 #94a3b8, -3px 3px 0 #fff, -4px 4px 0 #94a3b8, 
            -10px 10px 20px rgba(0,0,0,0.6);
          transform: translateZ(15px);
        }
        
        .top-card-shadow {
          box-shadow: -5px 10px 20px rgba(0,0,0,0.5);
          transform: translateZ(5px);
        }
      `}</style>

      {/* CONTAINER CHÍNH - Thay thế gradient phức tạp bằng màu nền xanh rêu chuẩn Tailwind (bg-green-800) */}
      <div className="auto-landscape fixed inset-0 w-full h-full bg-green-800 overflow-hidden font-sans select-none">

        {/* Avatars */}
        <OpponentAvatar opp={opponents.top} position="top" currentTurnPlayerName={gameState.currentTurnPlayerName} />
        <OpponentAvatar opp={opponents.left} position="left" currentTurnPlayerName={gameState.currentTurnPlayerName} />
        <OpponentAvatar opp={opponents.right} position="right" currentTurnPlayerName={gameState.currentTurnPlayerName} />

        {/* --- KHU VỰC BÀN 3D Ở GIỮA --- */}
        <div className="absolute inset-0 flex items-center justify-center perspective-table pointer-events-none">

          {/* MẶT BÀN - Thu nhỏ đáng kể trên Mobile (w-220px) để không bị đè lên bài */}
          <div className="relative w-55 h-55 md:w-105 md:h-105 table-surface-3d" style={{ top: "-50px" }}>

            <div
              className={`absolute inset-0 border-[5px] md:border-8 border-dashed rounded-full opacity-30 animate-spin transition-colors duration-500
                ${gameState.currentColor === 'RED' ? 'border-red-500' : gameState.currentColor === 'BLUE' ? 'border-blue-500' : gameState.currentColor === 'GREEN' ? 'border-green-500' : 'border-yellow-400'}
              `}
              style={{ animationDuration: '8s', animationDirection: gameState.direction === 1 ? 'normal' : 'reverse' }}
            ></div>

            {/* Mũi tên (Thu nhỏ khoảng cách quay để không bị cắt mép) */}
            <div
              className="absolute inset-0 transition-transform duration-500 ease-in-out"
              style={{ transform: getPointerRotation() }}
            >
              <div className="absolute top-1/2 -right-3 md:-right-6 -translate-y-1/2 text-4xl md:text-6xl text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,1)] animate-pulse">
                ▶
              </div>
            </div>

            <div className="absolute inset-0 flex items-center justify-center gap-4 md:gap-10 pointer-events-auto">

              <div
                onClick={isMyTurn ? onDrawCard : null}
                className={`relative deck-thickness bg-gray-900 rounded-lg md:rounded-xl border-[3px] md:border-4 border-white flex items-center justify-center
                ${isMyTurn ? 'cursor-pointer hover:scale-105 transition-transform' : 'opacity-90'}`}
              >
                <div className="w-14 h-20 md:w-24 md:h-36 flex items-center justify-center">
                  <div className="text-red-500 font-black italic text-xl md:text-4xl -rotate-30 drop-shadow-md">UNO</div>
                </div>
                {isMyTurn && <div className="absolute -top-2 -right-2 w-5 h-5 md:w-8 md:h-8 bg-yellow-400 rounded-full animate-ping opacity-75"></div>}
              </div>

              <div className="top-card-shadow">
                <UnoCard cardData={gameState.topDiscardCard} isPlayable={false} />
              </div>

            </div>
          </div>
        </div>

        {/* --- Nút option(challenge và rút, đánh bài) --- */}
        <div className="absolute top-[62%] md:top-[70%] left-1/2 -translate-x-1/2 text-white text-[10px] md:text-sm font-bold bg-black/60 px-4 py-1.5 md:px-6 md:py-2 rounded-full border border-white/20 shadow-xl z-20">

        </div>

        {/* --- BÀI CỦA MÌNH --- */}
        <div className="absolute bottom-1 md:bottom-6 left-0 w-full flex flex-col items-center z-50 pointer-events-none">
          <div className="flex justify-center max-w-full overflow-x-auto pt-6 md:pt-8 pb-3 md:pb-4 px-10 pointer-events-auto snap-x hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {groupedCards.map((group, groupIdx) => (
              <div key={groupIdx} className="group flex relative -ml-4 md:-ml-8 first:ml-0 hover:z-40">
                {group.map((card, idx) => (
                  <div
                    key={card.originalIndex}
                    className={`${idx === 0 ? 'ml-0' : '-ml-10 md:-ml-16 group-hover:-ml-4 md:group-hover:-ml-8'} transition-all duration-300 ease-out`}
                  >
                    <div
                      onClick={() => { if (isMyTurn) onPlayCard(card, card.originalIndex) }}
                      className={`relative ${isMyTurn ? 'cursor-pointer hover:-translate-y-4 md:hover:-translate-y-10 hover:z-50' : ''} transition-all duration-200 ease-out`}
                    >
                      <UnoCard cardData={card} isPlayable={false} />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  );
};

export default GameBoard;