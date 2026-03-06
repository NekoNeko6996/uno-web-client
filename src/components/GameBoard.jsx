import React, { useMemo, useState } from 'react';
import UnoCard from './UnoCard';
import Leaderboard from './Leaderboard';


// 1. COMPONENT ĐỐI THỦ
const OpponentAvatar = ({ opp, position, currentTurnPlayerName }) => {
  if (!opp) return null;
  const isTurn = currentTurnPlayerName === opp.name;

  // Đối thủ ở trên cùng sẽ hiển thị ngang để tiết kiệm diện tích màn hình Mobile
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
const GameBoard = ({
  gameState, playerName,
  onPlayCard, onDrawCard,
  onCallUno, onCatchUno,
  onResolveChallenge, onPlayAgain, onLeaveRoom
}) => {
  const isMyTurn = gameState.currentTurnPlayerName === playerName;

  // STATE: Theo dõi lá bài đang được chọn (nhô lên)
  const [selectedCardIndex, setSelectedCardIndex] = useState(null);

  // Tính toán vị trí hiển thị của đối thủ
  const arrangeOpponents = () => {
    let arranged = { top: null, left: null, right: null };
    if (gameState.opponents.length === 1) arranged.top = gameState.opponents[0];
    else if (gameState.opponents.length === 2) { arranged.left = gameState.opponents[0]; arranged.right = gameState.opponents[1]; }
    else { arranged.left = gameState.opponents[0]; arranged.top = gameState.opponents[1]; arranged.right = gameState.opponents[2]; }
    return arranged;
  };
  const opponents = arrangeOpponents();

  // Xác định góc xoay cho Mũi tên chỉ lượt
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

  // Tự động sắp xếp và gom nhóm các lá bài trên tay
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

  // --- CÁC HÀM XỬ LÝ SỰ KIỆN CLICK ---
  const handleCardClick = (card) => {
    // Không cho bấm nếu chưa tới lượt, hoặc đang bận xử lý Challenge, hoặc game đã xong
    if (!isMyTurn || gameState.waitingForChallenge || gameState.finished) return;

    if (selectedCardIndex === card.originalIndex) {
      // Đã chọn rồi mà bấm lại -> Đánh luôn
      setSelectedCardIndex(null);
      onPlayCard(card, card.originalIndex);
    } else {
      // Bấm lần 1 -> Chỉ chọn (nhô lên)
      setSelectedCardIndex(card.originalIndex);
    }
  };

  const handleDrawClick = () => {
    if (isMyTurn && !gameState.waitingForChallenge && !gameState.finished) {
      setSelectedCardIndex(null); // Reset lá bài đang chọn nếu đổi ý sang rút bài
      onDrawCard();
    }
  };

  const allPlayersForLeaderboard = useMemo(() => {
    if (!gameState) return [];
    // Gộp người chơi hiện tại và các đối thủ
    const me = { name: playerName, cardCount: gameState.myHand.length };
    return [me, ...gameState.opponents];
  }, [gameState, playerName]);

  return (
    <>
      <style>{`
        /* CSS Auto-Landscape cho Mobile */
        @media screen and (orientation: portrait) {
          .auto-landscape {
            transform: rotate(-90deg); transform-origin: left top; width: 100vh !important; height: 100vw !important;
            position: fixed !important; top: 100% !important; left: 0 !important; overflow: hidden !important; background-color: #166534 !important; 
          }
        }
        /* CSS cho 3D Table */
        .perspective-table { perspective: 1200px; }
        .table-surface-3d { transform-style: preserve-3d; transform: rotateX(40deg) scale(1); }
        .deck-thickness { box-shadow: -1px 1px 0 #fff, -2px 2px 0 #94a3b8, -3px 3px 0 #fff, -4px 4px 0 #94a3b8, -10px 10px 20px rgba(0,0,0,0.6); transform: translateZ(15px); }
        .top-card-shadow { box-shadow: -5px 10px 20px rgba(0,0,0,0.5); transform: translateZ(5px); }
      `}</style>

      <div className="auto-landscape fixed inset-0 w-full h-full bg-green-800 overflow-hidden font-sans select-none">

        {/* ================= MODALS & DIALOGS (Z-INDEX CAO NHẤT) ================= */}

        {/* 1. Modal Kết Thúc Game */}
        {/* {gameState.finished && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-200 backdrop-blur-sm">
            <div className="bg-gray-900 border-4 border-yellow-400 p-8 rounded-3xl shadow-[0_0_50px_rgba(250,204,21,0.6)] text-center max-w-sm mx-auto animate-bounce">
              <h2 className="text-4xl font-black text-yellow-400 mb-2 drop-shadow-lg">🎉 WINNER 🎉</h2>
              <p className="text-3xl text-white font-bold mb-8 uppercase tracking-widest">{gameState.winnerName}</p>
              <div className="flex justify-center gap-4">
                <button onClick={onPlayAgain} className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-6 rounded-xl border-2 border-green-400 shadow-lg transition-transform hover:scale-105 active:scale-95">🔄 CHƠI LẠI</button>
                <button onClick={onLeaveRoom} className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-6 rounded-xl border-2 border-red-400 shadow-lg transition-transform hover:scale-105 active:scale-95">🚪 RỜI PHÒNG</button>
              </div>
            </div>
          </div>
        )} */}

        {gameState.finished && (
          <Leaderboard
            players={allPlayersForLeaderboard}
            winnerName={gameState.winnerName}
            onPlayAgain={onPlayAgain}
            onLeaveRoom={onLeaveRoom}
          />
        )}

        {/* 2. Modal Challenge +4 */}
        {gameState.waitingForChallenge && !gameState.finished && (
          <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-150 backdrop-blur-md">
            {gameState.victimName === playerName ? (
              <div className="bg-gray-900 border-4 border-red-500 p-6 rounded-2xl shadow-2xl text-center max-w-md mx-auto">
                <h3 className="text-3xl font-black text-red-500 mb-2 animate-pulse">🚨 BỊ ĐÁNH +4 🚨</h3>
                <p className="text-gray-200 mb-6 text-lg"><span className="text-yellow-400 font-bold">{gameState.attackerName}</span> vừa ném thẻ +4 vào mặt bạn!</p>
                <div className="flex flex-col gap-3">
                  <button onClick={() => onResolveChallenge(true)} className="bg-red-600 hover:bg-red-500 text-white font-black py-3 rounded-xl border-2 border-red-400 transition-transform hover:scale-105">⚔️ THÁCH ĐẤU (Nghi ngờ đánh láo)</button>
                  <button onClick={() => onResolveChallenge(false)} className="bg-blue-600 hover:bg-blue-500 text-white font-black py-3 rounded-xl border-2 border-blue-400 transition-transform hover:scale-105">😭 CHẤP NHẬN (Rút 4 lá)</button>
                </div>
                <p className="text-xs text-gray-400 mt-4">*Luật: Nếu họ có màu giống màu trên bàn, họ phạt 4 lá. Nếu bạn bắt sai, bạn phạt 6 lá!</p>
              </div>
            ) : (
              <div className="text-yellow-400 text-2xl font-black animate-pulse bg-black/50 px-6 py-4 rounded-full border-2 border-yellow-400">
                ⏳ Đang chờ {gameState.victimName} phản hồi +4...
              </div>
            )}
          </div>
        )}

        {/* ================= GIAO DIỆN BÀN CHƠI ================= */}

        {/* Nút Hô UNO & Bắt Lỗi (Ghim bên phải màn hình) */}
        <div className="absolute right-2 md:right-8 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-40">
          <button
            onClick={(e) => {
              e.currentTarget.style.transform = 'scale(0.9)';
              setTimeout(() => e.currentTarget.style.transform = 'scale(1)', 100);
              onCallUno();
            }}
            className="w-14 h-14 md:w-20 md:h-20 bg-linear-to-br from-red-500 to-red-700 text-white font-black italic text-lg md:text-2xl rounded-full border-4 border-white shadow-[0_0_15px_rgba(239,68,68,0.8)] flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
          >
            UNO!
          </button>
          <button
            onClick={onCatchUno}
            className="w-14 h-14 md:w-20 md:h-20 bg-linear-to-br from-blue-500 to-blue-700 text-white font-bold text-xs md:text-sm rounded-full border-4 border-white shadow-[0_0_10px_rgba(59,130,246,0.8)] flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
          >
            BẮT LỖI
          </button>
        </div>

        {/* Avatars */}
        <OpponentAvatar opp={opponents.top} position="top" currentTurnPlayerName={gameState.currentTurnPlayerName} />
        <OpponentAvatar opp={opponents.left} position="left" currentTurnPlayerName={gameState.currentTurnPlayerName} />
        <OpponentAvatar opp={opponents.right} position="right" currentTurnPlayerName={gameState.currentTurnPlayerName} />

        {/* --- KHU VỰC BÀN 3D Ở GIỮA --- */}
        <div className="absolute inset-0 flex items-center justify-center perspective-table pointer-events-none">
          <div className="relative w-55 h-55 md:w-105 md:h-105 table-surface-3d" style={{ top: "-50px" }}>

            {/* Vòng tròn quỹ đạo */}
            <div className={`absolute inset-0 border-[5px] md:border-8 border-dashed rounded-full opacity-30 animate-spin transition-colors duration-500
                ${gameState.currentColor === 'RED' ? 'border-red-500' : gameState.currentColor === 'BLUE' ? 'border-blue-500' : gameState.currentColor === 'GREEN' ? 'border-green-500' : 'border-yellow-400'}`}
              style={{ animationDuration: '8s', animationDirection: gameState.direction === 1 ? 'normal' : 'reverse' }}>
            </div>

            {/* Mũi tên chỉ lượt */}
            <div className="absolute inset-0 transition-transform duration-500 ease-in-out" style={{ transform: getPointerRotation() }}>
              <div className="absolute top-1/2 -right-3 md:-right-6 -translate-y-1/2 text-4xl md:text-6xl text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,1)] animate-pulse">▶</div>
            </div>

            {/* Cọc bài và Bài mồi */}
            <div className="absolute inset-0 flex items-center justify-center gap-4 md:gap-10 pointer-events-auto">
              <div onClick={handleDrawClick} className={`relative deck-thickness bg-gray-900 rounded-lg md:rounded-xl border-[3px] md:border-4 border-white flex items-center justify-center ${isMyTurn && !gameState.waitingForChallenge ? 'cursor-pointer hover:scale-105' : 'opacity-90'}`}>
                <div className="w-14 h-20 md:w-24 md:h-36 flex items-center justify-center"><div className="text-red-500 font-black italic text-xl md:text-4xl -rotate-30 drop-shadow-md">UNO</div></div>
                {isMyTurn && !gameState.waitingForChallenge && <div className="absolute -top-2 -right-2 w-5 h-5 md:w-8 md:h-8 bg-yellow-400 rounded-full animate-ping opacity-75"></div>}
              </div>
              <div className="top-card-shadow">
                <UnoCard cardData={gameState.topDiscardCard} isPlayable={false} />
              </div>
            </div>

          </div>
        </div>

        {/* --- KHU VỰC NÚT ĐÁNH BÀI (Ở TRUNG TÂM PHÍA DƯỚI) --- */}
        {/* --- BÀI CỦA MÌNH --- */}
        <div className="absolute bottom-1 md:bottom-6 left-0 w-full flex flex-col items-center z-50 pointer-events-none">

          <div className={`mb-1 md:mb-3 px-3 md:px-6 py-1 md:py-2 rounded-full flex items-center gap-1.5 md:gap-2 transition-colors duration-300 font-bold`}>
            {/* giử chổ cho nút action sau này */}
          </div>

          <div className="flex justify-center max-w-full overflow-x-auto pt-10 md:pt-14 pb-3 md:pb-4 px-10 pointer-events-auto snap-x hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {groupedCards.map((group, groupIdx) => (
              <div key={groupIdx} className="group flex relative -ml-4 md:-ml-8 first:ml-0 hover:z-40">
                {group.map((card, idx) => {
                  const isSelected = selectedCardIndex === card.originalIndex;
                  return (
                    <div key={card.originalIndex} className={`${idx === 0 ? 'ml-0' : '-ml-10 md:-ml-16 group-hover:-ml-4 md:group-hover:-ml-8'} transition-all duration-300 ease-out`}>
                      <div
                        onClick={() => handleCardClick(card)}
                        className={`relative ${isMyTurn && !gameState.waitingForChallenge ? 'cursor-pointer' : ''} 
                          ${isSelected ? '-translate-y-8 md:-translate-y-12 z-50 scale-105 drop-shadow-[0_0_10px_rgba(250,204,21,1)]' : 'hover:-translate-y-4 md:hover:-translate-y-8 hover:z-40'} 
                          transition-all duration-200 ease-out`}
                      >
                        <UnoCard cardData={card} isPlayable={false} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  );
};

export default GameBoard;