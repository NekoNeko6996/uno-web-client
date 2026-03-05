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


  // --- PHỤC HỒI CÁC HÀM API BỊ MẤT ---
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
      setCurrentRoom(await res.json())
    } catch (error) { console.error(error) }
  }

  const handleStartGame = async () => {
    try {
      await fetch(`${SERVER_URL}/api/rooms/${currentRoom.roomId}/start`, { method: 'POST' })
    } catch (error) { console.error("Lỗi khi bắt đầu game:", error) }
  }

  const fetchGameState = async () => {
    try {
      const res = await fetch(`${SERVER_URL}/api/rooms/${currentRoom.roomId}/state?playerName=${encodeURIComponent(playerName)}`)
      if (res.ok) setGameState(await res.json())
    } catch (error) { console.error("Lỗi khi lấy dữ liệu bài:", error) }
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

      const res = await fetch(url, { method: 'POST' })
      if (!res.ok) alert("❌ " + await res.text())
      
      setShowColorPicker(false);
      setPendingCardIndex(null);
    } catch (error) { console.error(error) }
  }

  // --- PHỤC HỒI WEBSOCKET EFFECT ---
  useEffect(() => {
    if (!currentRoom) return;
    const socket = new SockJS(`${SERVER_URL}/ws`)
    const client = new Client({
      webSocketFactory: () => socket,
      onConnect: () => {
        setIsConnected(true)
        const roomTopic = `/topic/room/${currentRoom.roomId}`
        client.subscribe(roomTopic, (message) => {
          if (message.body === 'GAME_STARTED' || message.body === 'BOARD_UPDATED') {
            fetchGameState()
          }
        })
      },
      onDisconnect: () => setIsConnected(false)
    })
    client.activate()
    stompClientRef.current = client
    return () => { if (stompClientRef.current) stompClientRef.current.deactivate() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRoom])

  // --- RENDERING ---
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

  if (gameState) {
    return (
      <>
        <GameBoard 
          gameState={gameState} 
          playerName={playerName} 
          onPlayCard={handlePlayCard} 
          onDrawCard={handleDrawCard} 
        />

        {showColorPicker && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-100 backdrop-blur-sm">
            <div className="bg-white p-6 rounded-2xl shadow-2xl text-center">
              <h3 className="text-2xl font-bold mb-4 text-gray-800">Chọn màu đổi</h3>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => handlePlayCard(gameState.myHand[pendingCardIndex], pendingCardIndex, 'RED')} className="w-20 h-20 bg-red-600 rounded-xl hover:scale-110 shadow-lg border-4 border-transparent hover:border-gray-800 transition-transform"></button>
                <button onClick={() => handlePlayCard(gameState.myHand[pendingCardIndex], pendingCardIndex, 'BLUE')} className="w-20 h-20 bg-blue-600 rounded-xl hover:scale-110 shadow-lg border-4 border-transparent hover:border-gray-800 transition-transform"></button>
                <button onClick={() => handlePlayCard(gameState.myHand[pendingCardIndex], pendingCardIndex, 'GREEN')} className="w-20 h-20 bg-green-600 rounded-xl hover:scale-110 shadow-lg border-4 border-transparent hover:border-gray-800 transition-transform"></button>
                <button onClick={() => handlePlayCard(gameState.myHand[pendingCardIndex], pendingCardIndex, 'YELLOW')} className="w-20 h-20 bg-yellow-400 rounded-xl hover:scale-110 shadow-lg border-4 border-transparent hover:border-gray-800 transition-transform"></button>
              </div>
              <button onClick={() => setShowColorPicker(false)} className="mt-6 text-gray-500 hover:text-gray-800 font-bold underline">Hủy bỏ</button>
            </div>
          </div>
        )}
      </>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
      <div className="text-center">
        <h1 className="text-3xl mb-4">Phòng: {currentRoom.roomId}</h1>
        {currentRoom.host.name === playerName ? (
          <button onClick={handleStartGame} className="bg-red-600 px-8 py-4 rounded-xl font-bold text-xl animate-pulse hover:bg-red-700">🚀 BẮT ĐẦU GAME</button>
        ) : (
          <p className="text-gray-400 animate-pulse">Đang chờ chủ phòng bắt đầu...</p>
        )}
      </div>
    </div>
  )
}

export default App