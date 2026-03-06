import { useState, useEffect, useRef } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import GameBoard from './components/GameBoard'
import './index.css'

function App() {
  const [playerName, setPlayerName] = useState('')
  const [roomCodeInput, setRoomCodeInput] = useState('')

  const [currentRoom, setCurrentRoom] = useState(null)
  const [gameState, setGameState] = useState(null)

  // eslint-disable-next-line no-unused-vars
  const [isConnected, setIsConnected] = useState(false)
  const stompClientRef = useRef(null)

  const [showColorPicker, setShowColorPicker] = useState(false)
  const [pendingCardIndex, setPendingCardIndex] = useState(null)
  
  const SERVER_URL = 'http://192.168.1.62:8080'

  const handleCreateRoom = async () => {
    if (!playerName) return alert("Vui lòng nhập tên!")
    try {
      const res = await fetch(`${SERVER_URL}/api/rooms/create?playerName=${encodeURIComponent(playerName)}`, { method: 'POST' })
      setCurrentRoom(await res.json())
    } catch (error) { console.error(error) }
  }

  const handleJoinRoom = async () => {
    if (!playerName || !roomCodeInput) return alert("Vui lòng nhập tên và mã phòng!")
    try {
      const res = await fetch(`${SERVER_URL}/api/rooms/join?roomCode=${roomCodeInput}&playerName=${encodeURIComponent(playerName)}`, { method: 'POST' })
      if (!res.ok) return alert(await res.text())
      const resRoom = await res.json()
      setCurrentRoom(resRoom)
    } catch (error) { console.error(error) }
  }

  const fetchRoomInfo = async () => {
    if (!currentRoom?.roomId) return;
    try {
      const res = await fetch(`${SERVER_URL}/api/rooms/${currentRoom.roomId}`);
      if (res.ok) {
        const updatedRoom = await res.json();
        // CÁCH LY LỖI: Kiểm tra xem mình còn trong danh sách phòng trên server không
        const amIStillInRoom = updatedRoom.players.some(p => p.name === playerName);
        if (!amIStillInRoom) {
          // Nếu không còn (do thoát/bị kích) -> Dọn dẹp và ra sảnh
          if (stompClientRef.current) stompClientRef.current.deactivate();
          setCurrentRoom(null);
          setGameState(null);
        } else {
          setCurrentRoom(updatedRoom);
        }
      }
    } catch (error) { console.error("Lỗi cập nhật phòng:", error) }
  }

  const handleKickPlayer = async (targetName) => {
    try {
      const res = await fetch(`${SERVER_URL}/api/rooms/${currentRoom.roomId}/kick?hostName=${encodeURIComponent(playerName)}&targetName=${encodeURIComponent(targetName)}`, { method: 'POST' });
      if (!res.ok) alert(await res.text());
    } catch (error) { console.error(error) }
  }

  const handleStartGame = async () => {
    try {
      const res = await fetch(`${SERVER_URL}/api/rooms/${currentRoom.roomId}/start`, { method: 'POST' });
      if (!res.ok) alert(await res.text());
    } catch (error) { console.error("Lỗi khi bắt đầu game:", error)}
  }

  const fetchGameState = async () => {
    try {
      const res = await fetch(`${SERVER_URL}/api/rooms/${currentRoom.roomId}/state?playerName=${encodeURIComponent(playerName)}`)
      if (res.ok) setGameState(await res.json())
    } catch (error) { console.error("Lỗi khi lấy dữ liệu:", error) }
  }

  const handleDrawCard = async () => {
    try {
      const res = await fetch(`${SERVER_URL}/api/rooms/${currentRoom.roomId}/draw?playerName=${encodeURIComponent(playerName)}`, { method: 'POST' })
      if (!res.ok) alert(await res.text())
    } catch (error) { console.error(error) }
  }

  const handlePlayCard = async (card, index, selectedColor = '') => {
    if (card.color === 'NONE' && !selectedColor) {
      setPendingCardIndex(index);
      setShowColorPicker(true);
      return;
    }
    try {
      let url = `${SERVER_URL}/api/rooms/${currentRoom.roomId}/play?playerName=${encodeURIComponent(playerName)}&cardIndex=${index}`
      if (selectedColor) url += `&selectedColor=${selectedColor}`
      await fetch(url, { method: 'POST' })
      setShowColorPicker(false);
      setPendingCardIndex(null);
    } catch (error) { console.error(error) }
  }

  const handleCallUno = async () => {
    await fetch(`${SERVER_URL}/api/rooms/${currentRoom.roomId}/call-uno?playerName=${encodeURIComponent(playerName)}`, { method: 'POST' })
  }

  const handleCatchUno = async () => {
    const res = await fetch(`${SERVER_URL}/api/rooms/${currentRoom.roomId}/catch-uno`, { method: 'POST' })
    if (!res.ok) alert(await res.text())
  }

  const handleResolveChallenge = async (isChallenge) => {
    const res = await fetch(`${SERVER_URL}/api/rooms/${currentRoom.roomId}/challenge?playerName=${encodeURIComponent(playerName)}&isChallenge=${isChallenge}`, { method: 'POST' })
    if (!res.ok) alert(await res.text())
  }

  const handlePlayAgain = async () => {
    await fetch(`${SERVER_URL}/api/rooms/${currentRoom.roomId}/reset`, { method: 'POST' })
  }

  const handleLeaveRoom = async () => {
    // VÁ LỖI: Cúp cầu dao WebSocket ngay lập tức để không nhận event ROOM_UPDATED nữa
    if (stompClientRef.current) stompClientRef.current.deactivate();
    
    await fetch(`${SERVER_URL}/api/rooms/${currentRoom.roomId}/leave?playerName=${encodeURIComponent(playerName)}`, { method: 'POST' })
    setCurrentRoom(null);
    setGameState(null);
  }

  const roomId = currentRoom?.roomId;
  useEffect(() => {
    if (!roomId) return;
    const socket = new SockJS(`${SERVER_URL}/ws`)
    const client = new Client({
      webSocketFactory: () => socket,
      onConnect: () => {
        setIsConnected(true)
        client.subscribe(`/topic/room/${roomId}`, (message) => {
          const action = message.body;
          if (action === 'GAME_STARTED' || action === 'BOARD_UPDATED') {
            fetchGameState();
          } else if (action === 'GAME_RESET') {
            setGameState(null);
          } else if (action === 'ROOM_UPDATED') {
            fetchRoomInfo(); 
          } else if (action === `KICKED_${playerName}`) {
            // VÁ LỖI: Cúp cầu dao WebSocket khi bị kích
            if (stompClientRef.current) stompClientRef.current.deactivate();
            alert('Bạn đã bị chủ phòng mời ra ngoài!');
            setCurrentRoom(null);
            setGameState(null);
          }
        })
      },
      onDisconnect: () => setIsConnected(false)
    })
    client.activate()
    stompClientRef.current = client
    return () => { if (stompClientRef.current) stompClientRef.current.deactivate() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId])

  // ================= UI ĐĂNG NHẬP (GIỮ NGUYÊN BẢN CŨ) =================
  if (!currentRoom) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md text-center">
          <h1 className="text-4xl font-black text-red-600 mb-6 italic">UNO GAME</h1>
          <input className="w-full mb-4 p-3 border-2 border-gray-300 rounded focus:border-red-500 outline-none" placeholder="Tên của bạn..." value={playerName} onChange={(e) => setPlayerName(e.target.value)} />
          <button className="w-full bg-blue-600 text-white font-bold py-3 rounded mb-4 hover:bg-blue-700 transition" onClick={handleCreateRoom}>TẠO PHÒNG MỚI</button>
          <div className="relative flex py-2 items-center"><div className="grow border-t border-gray-400"></div><span className="shrink-0 mx-4 text-gray-400">Hoặc</span><div className="grow border-t border-gray-400"></div></div>
          <input className="w-full mt-4 mb-4 p-3 border-2 border-gray-300 rounded focus:border-red-500 uppercase outline-none" placeholder="Mã phòng..." value={roomCodeInput} onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())} />
          <button className="w-full bg-green-600 text-white font-bold py-3 rounded hover:bg-green-700 transition" onClick={handleJoinRoom}>VÀO PHÒNG</button>
        </div>
      </div>
    )
  }

  // ================= UI TRONG GAME =================
  if (gameState) {
    return (
      <>
        <GameBoard gameState={gameState} playerName={playerName} onPlayCard={handlePlayCard} onDrawCard={handleDrawCard} onCallUno={handleCallUno} onCatchUno={handleCatchUno} onResolveChallenge={handleResolveChallenge} onPlayAgain={handlePlayAgain} onLeaveRoom={handleLeaveRoom} />
        {showColorPicker && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-200">
            <div className="bg-white p-6 rounded-xl text-center">
              <h3 className="text-2xl font-bold mb-4 text-gray-800">Chọn màu đổi</h3>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => handlePlayCard(gameState.myHand[pendingCardIndex], pendingCardIndex, 'RED')} className="w-20 h-20 bg-red-600 rounded"></button>
                <button onClick={() => handlePlayCard(gameState.myHand[pendingCardIndex], pendingCardIndex, 'BLUE')} className="w-20 h-20 bg-blue-600 rounded"></button>
                <button onClick={() => handlePlayCard(gameState.myHand[pendingCardIndex], pendingCardIndex, 'GREEN')} className="w-20 h-20 bg-green-600 rounded"></button>
                <button onClick={() => handlePlayCard(gameState.myHand[pendingCardIndex], pendingCardIndex, 'YELLOW')} className="w-20 h-20 bg-yellow-400 rounded"></button>
              </div>
              <button onClick={() => setShowColorPicker(false)} className="mt-6 text-gray-500 hover:text-gray-800 font-bold underline">Hủy bỏ</button>
            </div>
          </div>
        )}
      </>
    )
  }

  // ================= UI PHÒNG CHỜ (LOBBY) CLEAN =================
  const isHost = currentRoom.host.name === playerName;

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white p-4 font-sans">
      <div className="w-full max-w-sm text-center">
        
        <h1 className="text-4xl mb-2 font-black">Phòng: {currentRoom.roomId}</h1>
        <p className="text-gray-400 mb-8">{currentRoom.players.length}/4 người chơi</p>

        {/* Danh sách người chơi - Không bọc trong box rườm rà, chỉ kẻ vạch ngang phân cách */}
        <div className="mb-10 text-left">
          {currentRoom.players.map((p) => {
            const isThisPlayerHost = currentRoom.host.name === p.name;
            const isMe = p.name === playerName;
            
            return (
              <div key={p.name} className="flex justify-between items-center py-3 border-b border-gray-800 last:border-0">
                <span className={`text-xl ${isMe ? 'text-yellow-400' : ''}`}>
                  {p.name} {isThisPlayerHost && '(chủ phòng)'}
                </span>
                
                {/* Nút Kick đơn giản */}
                {isHost && !isMe && (
                  <button 
                    onClick={() => handleKickPlayer(p.name)} 
                    className="text-red-500 hover:text-red-400 font-semibold text-sm uppercase"
                  >
                    Kích
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Khu vực nút chức năng */}
        <div className="flex flex-col gap-4">
          {isHost ? (
            <button 
              onClick={handleStartGame} 
              className="w-full bg-red-600 px-8 py-4 rounded font-bold text-xl hover:bg-red-700 transition"
            >
              🚀 BẮT ĐẦU GAME
            </button>
          ) : (
            <p className="text-gray-400 animate-pulse text-lg py-4">
              Đang chờ chủ phòng bắt đầu...
            </p>
          )}
          
          <button 
            onClick={handleLeaveRoom} 
            className="w-full text-gray-500 hover:text-white underline py-2 font-semibold"
          >
            Thoát phòng
          </button>
        </div>

      </div>
    </div>
  )
}

export default App