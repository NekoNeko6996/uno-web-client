// components/Leaderboard.jsx
import React from 'react';

const Leaderboard = ({ players, winnerName, onPlayAgain, onLeaveRoom }) => {
  // Sắp xếp người chơi theo số lượng bài tăng dần (người ít bài nhất đứng đầu)
  const sortedPlayers = [...players].sort((a, b) => a.cardCount - b.cardCount);

  return (
    <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-200 backdrop-blur-md p-4">
      <div className="bg-gray-900 border-4 border-yellow-400 p-6 md:p-10 rounded-3xl shadow-[0_0_60px_rgba(250,204,21,0.4)] w-full max-w-lg animate-in fade-in zoom-in duration-300">
        
        <div className="text-center mb-8">
          <h2 className="text-5xl font-black text-yellow-400 drop-shadow-lg mb-2 italic">GAME OVER</h2>
          <div className="h-1 w-32 bg-yellow-400 mx-auto rounded-full"></div>
        </div>

        <div className="space-y-4 mb-10">
          {sortedPlayers.map((player, index) => {
            const isWinner = player.name === winnerName;
            return (
              <div 
                key={player.name} 
                className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all 
                  ${isWinner ? 'bg-yellow-400/20 border-yellow-400 scale-105 shadow-lg' : 'bg-gray-800 border-gray-700'}`}
              >
                <div className="flex items-center gap-4">
                  <span className={`text-2xl font-black w-8 ${isWinner ? 'text-yellow-400' : 'text-gray-500'}`}>
                    #{index + 1}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-white font-bold text-lg">
                      {player.name} {isWinner && '👑'}
                    </span>
                    <span className="text-gray-400 text-sm">
                      {isWinner ? 'Winner!' : `${player.cardCount} lá bài còn lại`}
                    </span>
                  </div>
                </div>
                {isWinner && (
                  <div className="text-yellow-400 text-xs font-black bg-yellow-400/10 px-3 py-1 rounded-full border border-yellow-400/50">
                    MVP
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={onPlayAgain} 
            className="flex-1 bg-green-600 hover:bg-green-500 text-white font-black py-4 px-6 rounded-2xl border-b-4 border-green-800 active:border-b-0 active:translate-y-1 transition-all shadow-lg"
          >
            🔄 CHƠI LẠI
          </button>
          <button 
            onClick={onLeaveRoom} 
            className="flex-1 bg-red-600 hover:bg-red-500 text-white font-black py-4 px-6 rounded-2xl border-b-4 border-red-800 active:border-b-0 active:translate-y-1 transition-all shadow-lg"
          >
            🚪 RỜI PHÒNG
          </button>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;