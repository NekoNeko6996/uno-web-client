import React from 'react';

const UnoCard = ({ cardData, onClick, isPlayable }) => {
  // Rất quan trọng: Nếu không có dữ liệu, không render gì cả để tránh lỗi trắng trang
  if (!cardData) return null;

  // 1. Chuyển đổi Màu sắc từ Backend (Chữ HOA) sang Tailwind
  let cColor = 'black';
  if (cardData.color === 'RED') cColor = 'red';
  else if (cardData.color === 'BLUE') cColor = 'blue';
  else if (cardData.color === 'GREEN') cColor = 'green';
  else if (cardData.color === 'YELLOW') cColor = 'yellow';

  // 2. Chuyển đổi Loại bài và Giá trị
  let type = 'number';
  let value = cardData.value;

  if (cardData.color === 'NONE') {
    type = 'wild';
    value = cardData.type === 'WILD_DRAW_FOUR' ? '+4' : 'WILD';
  } else if (cardData.type === 'SKIP') {
    type = 'action'; value = 'Skip';
  } else if (cardData.type === 'REVERSE') {
    type = 'action'; value = 'Reverse';
  } else if (cardData.type === 'DRAW_TWO') {
    type = 'action'; value = '+2';
  }

  // Bảng màu của Tailwind
  const bgColorMap = { red: 'bg-red-500', blue: 'bg-blue-500', green: 'bg-green-500', yellow: 'bg-yellow-400', black: 'bg-gray-800' };
  const textColorMap = { red: 'text-red-500', blue: 'text-blue-500', green: 'text-green-500', yellow: 'text-yellow-500', black: 'text-gray-800' };

  const cardBg = bgColorMap[cColor] || 'bg-gray-800';
  const textColor = textColorMap[cColor] || 'text-gray-800';

  const renderActionIcon = (actionValue, isCorner = false) => {
    switch (actionValue) {
      case 'Skip': return isCorner ? <span>⃠</span> : <span className="text-3xl md:text-5xl">⃠</span>;
      case 'Reverse': return isCorner ? <span>↺</span> : <span className="text-3xl md:text-5xl">↺</span>;
      case '+2': return isCorner ? <span>+2</span> : <span className="text-4xl md:text-5xl">+2</span>;
      default: return null;
    }
  };

  return (
    <div 
      onClick={isPlayable ? onClick : undefined}
      className={`relative w-16 h-24 md:w-24 md:h-36 ${cardBg} rounded-lg md:rounded-xl border-2 md:border-4 border-white shadow-xl flex flex-col items-center justify-between p-1 md:p-2 overflow-hidden select-none 
      ${isPlayable ? 'cursor-pointer hover:-translate-y-4 hover:shadow-2xl transition-all duration-200 z-10 hover:z-50' : ''}`}
    >
      {/* Góc trên bên trái */}
      <div className="self-start text-white flex flex-col items-center leading-none">
        <span className="font-black text-xs md:text-base italic">{type === 'action' ? renderActionIcon(value, true) : value}</span>
      </div>

      {/* Ở giữa - Căn chỉnh lại cho cân đối */}
      {type === 'wild' ? (
        <div className="absolute inset-0 m-auto w-[80%] h-[65%] rounded-full rotate-30 overflow-hidden shadow-inner flex flex-wrap border-2 border-white">
          <div className="w-1/2 h-1/2 bg-red-500" /> <div className="w-1/2 h-1/2 bg-yellow-400" />
          <div className="w-1/2 h-1/2 bg-green-500" /> <div className="w-1/2 h-1/2 bg-blue-500" />
          <div className="absolute inset-0 m-auto flex items-center justify-center text-white font-black text-sm md:text-xl -rotate-30 drop-shadow-md">{value}</div>
        </div>
      ) : (
        <div className="absolute inset-0 m-auto w-[80%] h-[65%] bg-white rounded-full rotate-30 flex items-center justify-center shadow-inner">
          {type === 'action' && <span className={`${textColor} -rotate-30`}>{renderActionIcon(value)}</span>}
          {type === 'number' && <span className={`text-3xl md:text-5xl font-black italic ${textColor} drop-shadow-md -rotate-30`}>{value}</span>}
        </div>
      )}

      {/* Góc dưới bên phải */}
      <div className="self-end text-white flex flex-col items-center leading-none rotate-180">
        <span className="font-black text-xs md:text-base italic">{type === 'action' ? renderActionIcon(value, true) : value}</span>
      </div>
    </div>
  );
};

export default UnoCard;