import React, { useMemo } from 'react';
import UnoCard from './UnoCard';

// 1. COMPONENT ĐỐI THỦ
const OpponentAvatar = ({ opp, position, currentTurnPlayerName }) => {
  if (!opp) return null;
  const isTurn = currentTurnPlayerName === opp.name;
  
  return (
    <div className={`absolute flex flex-col items-center justify-center p-2 rounded-xl backdrop-blur-sm bg-black/50 border-2 transition-all duration-300 z-20
      ${isTurn ? 'border-yellow-400 scale-110 shadow-[0_0_15px_rgba(250,204,21,0.8)]' : 'border-transparent'}
      ${position === 'top' ? 'top-6 left-1/2 -translate-x-1/2' : ''}
      ${position === 'left' ? 'left-6 top-1/2 -translate-y-1/2' : ''}
      ${position === 'right' ? 'right-6 top-1/2 -translate-y-1/2' : ''}
    `}>
      <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center text-2xl shadow-md border-2 border-white">
        🤖
      </div>
      <span className="text-white font-bold text-sm mt-2">{opp.name}</span>
      <span className="bg-red-500 text-white text-xs px-3 py-1 rounded-full mt-1 border border-white font-bold">
        🎴 {opp.cardCount}
      </span>
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
    switch(getActivePosition()) {
      case 'top': return 'rotate(-90deg)';  
      case 'left': return 'rotate(180deg)'; 
      case 'right': return 'rotate(0deg)';  
      case 'bottom': return 'rotate(90deg)'; 
      default: return 'rotate(90deg)';
    }
  };

  // --- THUẬT TOÁN SẮP XẾP VÀ GOM NHÓM LÁ BÀI ---
  const groupedCards = useMemo(() => {
    if (!gameState || !gameState.myHand) return [];

    // 1. Lưu lại vị trí gốc của bài để gửi lên Server không bị sai
    const cardsWithOriginalIndex = gameState.myHand.map((card, idx) => ({
      ...card,
      originalIndex: idx
    }));

    // 2. Định nghĩa trọng số để sắp xếp màu (Đỏ -> Xanh dương -> Xanh lá -> Vàng -> Đen)
    const colorWeight = { 'RED': 1, 'BLUE': 2, 'GREEN': 3, 'YELLOW': 4, 'NONE': 5 };

    // 3. Tiến hành Sort
    cardsWithOriginalIndex.sort((a, b) => {
      // Ưu tiên 1: Xếp theo màu
      if (colorWeight[a.color] !== colorWeight[b.color]) {
        return colorWeight[a.color] - colorWeight[b.color];
      }
      // Ưu tiên 2: Nếu cùng màu thì xếp theo số/chức năng
      const valA = a.value !== null ? a.value : a.type;
      const valB = b.value !== null ? b.value : b.type;
      if (valA < valB) return -1;
      if (valA > valB) return 1;
      return 0;
    });

    // 4. Gom nhóm các lá cùng màu lại với nhau
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
    <div className="relative w-full h-screen bg-linear-to-br from-green-700 to-green-900 overflow-hidden font-sans">
      
      {/* Đối thủ */}
      <OpponentAvatar opp={opponents.top} position="top" currentTurnPlayerName={gameState.currentTurnPlayerName} />
      <OpponentAvatar opp={opponents.left} position="left" currentTurnPlayerName={gameState.currentTurnPlayerName} />
      <OpponentAvatar opp={opponents.right} position="right" currentTurnPlayerName={gameState.currentTurnPlayerName} />

      {/* --- KHU VỰC BÀN Ở GIỮA --- */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
        
        <div 
          className={`absolute w-64 h-64 md:w-80 md:h-80 border-[6px] border-dashed rounded-full opacity-40 animate-spin transition-colors duration-500
            ${gameState.currentColor === 'RED' ? 'border-red-500' : gameState.currentColor === 'BLUE' ? 'border-blue-500' : gameState.currentColor === 'GREEN' ? 'border-green-500' : 'border-yellow-400'}
          `}
          style={{ animationDuration: '8s', animationDirection: gameState.direction === 1 ? 'normal' : 'reverse' }}
        ></div>

        <div 
          className="absolute top-1/2 left-1/2 w-70 h-70 md:w-90 md:h-90 transition-transform duration-500 ease-in-out z-0 pointer-events-none"
          style={{ transform: `translate(-50%, -50%) ${getPointerRotation()}` }}
        >
          <div className="absolute top-1/2 right-0 -translate-y-1/2 text-4xl md:text-5xl text-yellow-400 drop-shadow-[0_0_12px_rgba(250,204,21,1)] animate-pulse">
            ▶
          </div>
        </div>

        <div className="flex gap-4 md:gap-10 z-10">
          <div 
            onClick={isMyTurn ? onDrawCard : null}
            className={`relative w-16 h-24 md:w-24 md:h-36 bg-gray-900 rounded-lg md:rounded-xl border-4 border-white flex items-center justify-center shadow-2xl
            ${isMyTurn ? 'cursor-pointer hover:scale-105 hover:shadow-yellow-400/50' : 'opacity-90'}`}
          >
            <div className="text-red-500 font-black italic text-xl md:text-3xl -rotate-30 drop-shadow-md">UNO</div>
            {isMyTurn && <div className="absolute -top-3 -right-3 w-8 h-8 bg-yellow-400 rounded-full animate-ping opacity-75"></div>}
            {isMyTurn && <div className="absolute -top-3 -right-3 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-xs font-bold text-black border border-white">RÚT</div>}
          </div>
          <div><UnoCard cardData={gameState.topDiscardCard} isPlayable={false} /></div>
        </div>
        
        <div className="absolute -bottom-16 text-white text-sm md:text-base font-bold bg-black/60 px-4 py-1 rounded-full border border-white/20">
          {/* có thể hiển thị các tùy chọn challenge và rút bài nếu bị ăn +4 */}
        </div>
      </div>

      {/* --- BÀI CỦA MÌNH (SORT VÀ STACK) --- */}
      <div className="absolute bottom-4 left-0 w-full flex flex-col items-center z-30 pointer-events-none">
        
        {/* Vùng tay bài (Cho phép click xuyên qua để dễ thao tác) */}
        <div className="flex justify-center max-w-full overflow-x-auto pt-10 pb-4 px-10 pointer-events-auto snap-x">
          
          {/* Lặp qua từng NHÓM MÀU */}
          {groupedCards.map((group, groupIdx) => (
            
            // THẺ GROUP: Bọc các lá bài cùng màu lại. Khai báo 'group' để Tailwind bắt sự kiện Hover cả cụm
            <div key={groupIdx} className="group flex relative -ml-2 md:-ml-4 first:ml-0 hover:z-40">
              
              {/* Lặp qua từng LÁ BÀI trong Nhóm Màu đó */}
              {group.map((card, idx) => (
                <div
                  key={card.originalIndex}
                  // LOGIC STACK: Lá đầu tiên đứng im (ml-0). Từ lá thứ 2 trở đi sẽ bị lùi sâu vào (-ml-12/-ml-16) để tạo hiệu ứng xếp chồng.
                  // Khi Hover vào Group, nhóm sẽ bung ra (-ml-6/-ml-10) để người dùng chọn bài.
                  className={`${idx === 0 ? 'ml-0' : '-ml-17 md:-ml-22 group-hover:-ml-6 md:group-hover:-ml-10'} transition-all duration-300 ease-out`}
                >
                  <div
                    // CHÚ Ý CỰC KỲ QUAN TRỌNG: Gửi card.originalIndex lên Server thay vì idx
                    onClick={() => { if(isMyTurn) onPlayCard(card, card.originalIndex) }}
                    className={`relative ${isMyTurn ? 'cursor-pointer hover:-translate-y-10 hover:z-50' : ''} transition-all duration-200 ease-out`}
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
  );
};

export default GameBoard;