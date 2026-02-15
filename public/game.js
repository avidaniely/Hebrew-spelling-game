// Hebrew Vocabulary Game - Browser Version
// No imports needed - React is loaded globally from index.html

const { useState, useEffect } = React;

const HebrewVocabGame = () => {
  const words = [
    { word: 'בית', emoji: '🏠', hint: 'House' },
    { word: 'כלב', emoji: '🐕', hint: 'Dog' },
    { word: 'חתול', emoji: '🐱', hint: 'Cat' },
    { word: 'שמש', emoji: '☀️', hint: 'Sun' },
    { word: 'ירח', emoji: '🌙', hint: 'Moon' },
    { word: 'עץ', emoji: '🌳', hint: 'Tree' },
    { word: 'פרח', emoji: '🌸', hint: 'Flower' },
    { word: 'מים', emoji: '💧', hint: 'Water' },
    { word: 'לחם', emoji: '🍞', hint: 'Bread' },
    { word: 'ספר', emoji: '📚', hint: 'Book' },
    { word: 'כדור', emoji: '⚽', hint: 'Ball' },
    { word: 'אוטו', emoji: '🚗', hint: 'Car' },
    { word: 'דג', emoji: '🐟', hint: 'Fish' },
    { word: 'ציפור', emoji: '🐦', hint: 'Bird' },
    { word: 'כוכב', emoji: '⭐', hint: 'Star' },
    { word: 'ענן', emoji: '☁️', hint: 'Cloud' },
    { word: 'גשם', emoji: '🌧️', hint: 'Rain' },
    { word: 'שולחן', emoji: '🪑', hint: 'Table' },
    { word: 'כיסא', emoji: '💺', hint: 'Chair' },
    { word: 'דלת', emoji: '🚪', hint: 'Door' },
    { word: 'חלון', emoji: '🪟', hint: 'Window' },
    { word: 'אש', emoji: '🔥', hint: 'Fire' },
    { word: 'תפוח', emoji: '🍎', hint: 'Apple' },
    { word: 'בננה', emoji: '🍌', hint: 'Banana' },
    { word: 'גלידה', emoji: '🍦', hint: 'Ice Cream' }
  ];

  const [screen, setScreen] = useState('home');
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [gameState, setGameState] = useState(null);
  const [currentInput, setCurrentInput] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [localMessage, setLocalMessage] = useState('');

  useEffect(() => {
    if (!playerId) {
      setPlayerId('player_' + Math.random().toString(36).substr(2, 9));
    }
  }, [playerId]);

  useEffect(() => {
    if (roomCode && (screen === 'lobby' || screen === 'game')) {
      const interval = setInterval(async () => {
        await loadGameState();
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [roomCode, screen]);

  const loadGameState = async () => {
    try {
      const result = await window.storage.get(`room_${roomCode}`, true);
      if (result && result.value) {
        const state = JSON.parse(result.value);
        setGameState(state);
        
        if (screen === 'lobby' && state.gameStarted) {
          setScreen('game');
        }
        
        if (state.gameOver && screen === 'game') {
          setScreen('gameover');
        }
      }
    } catch (error) {
      console.log('Room not found');
    }
  };

  const createRoom = async () => {
    if (!playerName.trim()) {
      setLocalMessage('Please enter your name!');
      return;
    }

    const code = Math.random().toString(36).substr(2, 6).toUpperCase();
    setRoomCode(code);

    const initialState = {
      players: [{
        id: playerId,
        name: playerName,
        score: 0,
        isReady: false
      }],
      currentWordIndex: 0,
      round: 1,
      gameStarted: false,
      gameOver: false,
      maxTries: 5,
      playerStates: {},
      lastUpdate: Date.now()
    };

    await window.storage.set(`room_${code}`, JSON.stringify(initialState), true);
    setGameState(initialState);
    setScreen('lobby');
  };

  const joinRoom = async () => {
    if (!playerName.trim() || !roomCode.trim()) {
      setLocalMessage('Please enter your name and room code!');
      return;
    }

    try {
      const result = await window.storage.get(`room_${roomCode.toUpperCase()}`, true);
      if (!result || !result.value) {
        setLocalMessage('Room not found!');
        return;
      }

      const state = JSON.parse(result.value);
      
      const existingPlayer = state.players.find(p => p.id === playerId);
      if (!existingPlayer) {
        state.players.push({
          id: playerId,
          name: playerName,
          score: 0,
          isReady: false
        });
        state.lastUpdate = Date.now();
        await window.storage.set(`room_${roomCode.toUpperCase()}`, JSON.stringify(state), true);
      }
      
      setRoomCode(roomCode.toUpperCase());
      setGameState(state);
      setScreen('lobby');
    } catch (error) {
      setLocalMessage('Error joining room!');
    }
  };

  const toggleReady = async () => {
    const state = { ...gameState };
    const player = state.players.find(p => p.id === playerId);
    if (player) {
      player.isReady = !player.isReady;
      state.lastUpdate = Date.now();
      await window.storage.set(`room_${roomCode}`, JSON.stringify(state), true);
      setGameState(state);
    }
  };

  const startGame = async () => {
    if (gameState.players.length < 2) {
      setLocalMessage('Need at least 2 players to start!');
      return;
    }

    const allReady = gameState.players.every(p => p.isReady);
    if (!allReady) {
      setLocalMessage('All players must be ready!');
      return;
    }

    const state = { ...gameState };
    state.gameStarted = true;
    state.playerStates = {};
    state.players.forEach(p => {
      state.playerStates[p.id] = {
        correctLetters: [],
        triesLeft: state.maxTries,
        roundScore: 100,
        currentInput: '',
        finished: false
      };
    });
    state.lastUpdate = Date.now();

    await window.storage.set(`room_${roomCode}`, JSON.stringify(state), true);
    setGameState(state);
    setScreen('game');
  };

  const updateInput = async (value) => {
    setCurrentInput(value);
    
    const state = { ...gameState };
    if (state.playerStates[playerId]) {
      state.playerStates[playerId].currentInput = value;
      state.lastUpdate = Date.now();
      await window.storage.set(`room_${roomCode}`, JSON.stringify(state), true);
    }
  };

  const checkWord = async () => {
    if (!currentInput.trim()) {
      setLocalMessage('Please write something!');
      return;
    }

    const state = { ...gameState };
    const myState = state.playerStates[playerId];
    const currentWord = words[state.currentWordIndex];
    const targetWord = currentWord.word;
    const newCorrectLetters = [];

    for (let i = 0; i < targetWord.length; i++) {
      if (currentInput[i] === targetWord[i]) {
        newCorrectLetters[i] = targetWord[i];
      } else if (myState.correctLetters[i]) {
        newCorrectLetters[i] = myState.correctLetters[i];
      }
    }

    myState.correctLetters = newCorrectLetters;
    const isComplete = newCorrectLetters.filter(l => l).length === targetWord.length;

    if (isComplete) {
      const player = state.players.find(p => p.id === playerId);
      player.score += myState.roundScore;
      myState.finished = true;
      setLocalMessage(`🎉 Correct! +${myState.roundScore} points`);
      setCurrentInput('');
      
      const allFinished = Object.values(state.playerStates).every(ps => ps.finished);
      if (allFinished) {
        state.lastUpdate = Date.now();
        await window.storage.set(`room_${roomCode}`, JSON.stringify(state), true);
        setTimeout(() => nextRound(), 2000);
        return;
      }
    } else {
      myState.triesLeft--;
      myState.roundScore = Math.floor(myState.roundScore * 0.8);
      myState.currentInput = '';
      setCurrentInput('');

      if (myState.triesLeft === 0) {
        myState.finished = true;
        setLocalMessage(`Out of tries! The word was: ${targetWord}`);
        
        const allFinished = Object.values(state.playerStates).every(ps => ps.finished);
        if (allFinished) {
          state.lastUpdate = Date.now();
          await window.storage.set(`room_${roomCode}`, JSON.stringify(state), true);
          setTimeout(() => nextRound(), 2000);
          return;
        }
      } else {
        setLocalMessage(`Try again! ${myState.triesLeft} tries left. -20%`);
      }
    }

    state.lastUpdate = Date.now();
    await window.storage.set(`room_${roomCode}`, JSON.stringify(state), true);
    setGameState(state);
  };

  const nextRound = async () => {
    const result = await window.storage.get(`room_${roomCode}`, true);
    if (!result || !result.value) return;
    
    const state = JSON.parse(result.value);
    
    if (state.currentWordIndex >= words.length - 1) {
      state.gameOver = true;
      state.lastUpdate = Date.now();
      await window.storage.set(`room_${roomCode}`, JSON.stringify(state), true);
      setGameState(state);
      setScreen('gameover');
      return;
    }

    state.currentWordIndex++;
    state.round++;
    
    if (state.round <= 10) {
      state.maxTries = 5;
    } else if (state.round <= 20) {
      state.maxTries = 3;
    } else {
      state.maxTries = 1;
    }

    state.players.forEach(p => {
      state.playerStates[p.id] = {
        correctLetters: [],
        triesLeft: state.maxTries,
        roundScore: 100,
        currentInput: '',
        finished: false
      };
    });

    state.lastUpdate = Date.now();
    await window.storage.set(`room_${roomCode}`, JSON.stringify(state), true);
    setGameState(state);
    setLocalMessage('');
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const resetGame = () => {
    setScreen('home');
    setRoomCode('');
    setPlayerName('');
    setGameState(null);
    setCurrentInput('');
    setLocalMessage('');
  };

  if (screen === 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-12 text-center max-w-md w-full">
          <div className="text-5xl sm:text-6xl mb-4 sm:mb-6">🎮</div>
          <h1 className="text-3xl sm:text-4xl font-bold text-purple-600 mb-2 sm:mb-4">Hebrew Vocab Game</h1>
          <p className="text-lg sm:text-xl text-gray-600 mb-6 sm:mb-8">Online Multiplayer</p>
          
          <div className="space-y-3 sm:space-y-4">
            <button
              onClick={() => setScreen('create')}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 sm:px-8 py-4 sm:py-5 rounded-2xl text-lg sm:text-xl font-bold hover:scale-105 transition-transform"
            >
              🎯 Create Room
            </button>
            <button
              onClick={() => setScreen('join')}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 sm:px-8 py-4 sm:py-5 rounded-2xl text-lg sm:text-xl font-bold hover:scale-105 transition-transform"
            >
              🚪 Join Room
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'create') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-12 max-w-md w-full">
          <div className="text-5xl sm:text-6xl mb-4 sm:mb-6 text-center">🎯</div>
          <h2 className="text-3xl sm:text-4xl font-bold text-purple-600 mb-6 sm:mb-8 text-center">Create Room</h2>
          
          <div className="space-y-4 sm:space-y-6">
            <div>
              <label className="block text-base sm:text-lg font-semibold text-gray-700 mb-2">Your Name</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name..."
                className="w-full px-4 sm:px-6 py-3 sm:py-4 text-lg sm:text-xl border-4 border-purple-300 rounded-2xl focus:outline-none focus:border-purple-500"
                maxLength={20}
              />
            </div>
            
            {localMessage && (
              <div className="text-orange-600 text-center font-semibold">{localMessage}</div>
            )}
            
            <button
              onClick={createRoom}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-2xl text-lg sm:text-xl font-bold hover:scale-105 transition-transform"
            >
              Create Room 🚀
            </button>
            <button
              onClick={() => setScreen('home')}
              className="w-full bg-gray-300 text-gray-700 px-6 sm:px-8 py-3 sm:py-4 rounded-2xl text-lg sm:text-xl font-bold hover:scale-105 transition-transform"
            >
              ← Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'join') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-12 max-w-md w-full">
          <div className="text-5xl sm:text-6xl mb-4 sm:mb-6 text-center">🚪</div>
          <h2 className="text-3xl sm:text-4xl font-bold text-blue-600 mb-6 sm:mb-8 text-center">Join Room</h2>
          
          <div className="space-y-4 sm:space-y-6">
            <div>
              <label className="block text-base sm:text-lg font-semibold text-gray-700 mb-2">Your Name</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name..."
                className="w-full px-4 sm:px-6 py-3 sm:py-4 text-lg sm:text-xl border-4 border-blue-300 rounded-2xl focus:outline-none focus:border-blue-500"
                maxLength={20}
              />
            </div>
            
            <div>
              <label className="block text-base sm:text-lg font-semibold text-gray-700 mb-2">Room Code</label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="Enter room code..."
                className="w-full px-4 sm:px-6 py-3 sm:py-4 text-lg sm:text-xl border-4 border-blue-300 rounded-2xl focus:outline-none focus:border-blue-500 uppercase"
                maxLength={6}
              />
            </div>
            
            {localMessage && (
              <div className="text-orange-600 text-center font-semibold">{localMessage}</div>
            )}
            
            <button
              onClick={joinRoom}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-2xl text-lg sm:text-xl font-bold hover:scale-105 transition-transform"
            >
              Join Room 🎮
            </button>
            <button
              onClick={() => setScreen('home')}
              className="w-full bg-gray-300 text-gray-700 px-6 sm:px-8 py-3 sm:py-4 rounded-2xl text-lg sm:text-xl font-bold hover:scale-105 transition-transform"
            >
              ← Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'lobby' && gameState) {
    const myPlayer = gameState.players.find(p => p.id === playerId);
    const isHost = gameState.players[0]?.id === playerId;
    const allReady = gameState.players.every(p => p.isReady);

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 mb-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-purple-600 mb-4 text-center">Game Lobby</h2>
            
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-4 sm:p-6 mb-6">
              <div className="text-center">
                <div className="text-sm sm:text-base text-gray-600 mb-2">Room Code</div>
                <div className="flex items-center justify-center gap-2 sm:gap-3">
                  <div className="text-3xl sm:text-4xl font-bold text-purple-600 tracking-wider">{roomCode}</div>
                  <button
                    onClick={copyRoomCode}
                    className="p-2 sm:p-3 bg-white rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    {copiedCode ? React.createElement(Check, { className: "text-green-500", size: 24 }) : React.createElement(Copy, { className: "text-purple-600", size: 24 })}
                  </button>
                </div>
                <div className="text-xs sm:text-sm text-gray-500 mt-2">Share this code with friends!</div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg sm:text-xl font-bold text-gray-700 flex items-center gap-2">
                {React.createElement(Users, { size: 24 })}
                Players ({gameState.players.length})
              </h3>
              {gameState.players.map((player, idx) => (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-3 sm:p-4 rounded-xl ${
                    player.id === playerId 
                      ? 'bg-gradient-to-r from-purple-200 to-pink-200 ring-2 ring-purple-400' 
                      : 'bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="text-xl sm:text-2xl">
                      {idx === 0 ? '👑' : '🎮'}
                    </div>
                    <div>
                      <div className="font-bold text-base sm:text-lg text-gray-800">
                        {player.name}
                        {player.id === playerId && <span className="text-purple-600"> (You)</span>}
                      </div>
                      {idx === 0 && <div className="text-xs sm:text-sm text-gray-500">Host</div>}
                    </div>
                  </div>
                  <div>
                    {player.isReady ? (
                      <span className="px-3 sm:px-4 py-1 sm:py-2 bg-green-500 text-white rounded-full text-xs sm:text-sm font-bold">
                        ✓ Ready
                      </span>
                    ) : (
                      <span className="px-3 sm:px-4 py-1 sm:py-2 bg-gray-300 text-gray-600 rounded-full text-xs sm:text-sm font-bold">
                        Not Ready
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {localMessage && (
              <div className="mt-4 text-orange-600 text-center font-semibold">{localMessage}</div>
            )}

            <div className="mt-6 space-y-3">
              <button
                onClick={toggleReady}
                className={`w-full px-6 sm:px-8 py-3 sm:py-4 rounded-2xl text-lg sm:text-xl font-bold transition-all ${
                  myPlayer?.isReady
                    ? 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                    : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:scale-105'
                }`}
              >
                {myPlayer?.isReady ? 'Not Ready' : 'Ready!'} 
              </button>

              {isHost && (
                <button
                  onClick={startGame}
                  disabled={!allReady || gameState.players.length < 2}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-2xl text-lg sm:text-xl font-bold hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Start Game 🚀
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'game' && gameState) {
    const currentWord = words[gameState.currentWordIndex];
    const myState = gameState.playerStates[playerId];
    const sortedPlayers = [...gameState.players].sort((a, b) => b.score - a.score);

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 p-2 sm:p-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl p-3 sm:p-6 mb-3 sm:mb-4">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="text-center sm:text-left">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-purple-600">Round {gameState.round}</h1>
                <p className="text-xs sm:text-sm text-gray-600">Room: {roomCode}</p>
              </div>
              <div className="text-sm sm:text-base text-gray-600">
                <div className="flex gap-1">
                  {[...Array(gameState.maxTries)].map((_, i) => (
                    React.createElement(Heart, {
                      key: i,
                      size: 16,
                      className: i < myState.triesLeft ? 'fill-red-500 text-red-500' : 'text-gray-300'
                    })
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-8">
                <div className="text-center mb-4 sm:mb-8">
                  <div className="text-6xl sm:text-8xl md:text-9xl mb-2 sm:mb-4">
                    {currentWord.emoji}
                  </div>
                  <p className="text-lg sm:text-xl text-gray-600 font-medium">{currentWord.hint}</p>
                </div>

                <div className="flex justify-center gap-1 sm:gap-2 mb-4 sm:mb-8" dir="rtl">
                  {currentWord.word.split('').map((letter, index) => (
                    <div
                      key={index}
                      className="w-10 h-12 sm:w-14 sm:h-16 md:w-16 md:h-20 border-2 sm:border-4 border-purple-300 rounded-lg sm:rounded-xl flex items-center justify-center text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-br from-purple-50 to-pink-50"
                    >
                      {myState.correctLetters[index] ? (
                        <span className="text-green-600">{myState.correctLetters[index]}</span>
                      ) : (
                        <span className="text-gray-300">_</span>
                      )}
                    </div>
                  ))}
                </div>

                {!myState.finished ? (
                  <div className="max-w-md mx-auto">
                    <input
                      type="text"
                      value={currentInput}
                      onChange={(e) => updateInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && checkWord()}
                      placeholder="כתוב כאן..."
                      className="w-full px-4 sm:px-6 py-3 sm:py-4 text-lg sm:text-2xl border-2 sm:border-4 border-purple-300 rounded-xl sm:rounded-2xl text-center font-bold focus:outline-none focus:border-purple-500 mb-3 sm:mb-4"
                      dir="rtl"
                    />
                    <button
                      onClick={checkWord}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-base sm:text-xl font-bold hover:scale-105 transition-transform"
                    >
                      Check ✓
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-green-600 mb-2">✓ Finished!</div>
                    <div className="text-sm sm:text-base text-gray-600">Waiting for other players...</div>
                  </div>
                )}

                {localMessage && (
                  <div className="mt-4 text-center text-base sm:text-lg md:text-xl font-bold text-orange-600">
                    {localMessage}
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-bold text-gray-700 mb-4 flex items-center gap-2">
                  {React.createElement(Trophy, { size: 24 })}
                  Players
                </h3>
                <div className="space-y-3">
                  {sortedPlayers.map((player, idx) => {
                    const playerState = gameState.playerStates[player.id];
                    return (
                      <div
                        key={player.id}
                        className={`p-3 sm:p-4 rounded-xl ${
                          player.id === playerId 
                            ? 'bg-gradient-to-r from-purple-200 to-pink-200 ring-2 ring-purple-400' 
                            : 'bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg sm:text-xl">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '🎮'}</span>
                            <span className="font-bold text-sm sm:text-base">{player.name}</span>
                          </div>
                          <span className="text-lg sm:text-xl font-bold text-purple-600">{player.score}</span>
                        </div>
                        
                        {playerState && !playerState.finished && (
                          <div className="text-xs sm:text-sm text-gray-600" dir="rtl">
                            <div className="flex justify-between">
                              <span>Typing:</span>
                              <span className="font-mono">{playerState.currentInput || '...'}</span>
                            </div>
                            <div className="flex justify-between mt-1">
                              <span>Score:</span>
                              <span className="font-bold text-green-600">{playerState.roundScore}</span>
                            </div>
                          </div>
                        )}
                        
                        {playerState?.finished && (
                          <div className="text-xs sm:text-sm text-green-600 font-bold">✓ Done</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'gameover' && gameState) {
    const sortedPlayers = [...gameState.players].sort((a, b) => b.score - a.score);
    const winner = sortedPlayers[0];

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-12 text-center max-w-2xl w-full">
          <div className="text-5xl sm:text-6xl mb-4 sm:mb-6">🏆</div>
          <h2 className="text-3xl sm:text-4xl font-bold text-purple-600 mb-6 sm:mb-8">Game Over!</h2>
          
          <div className="bg-gradient-to-br from-yellow-200 to-yellow-300 rounded-2xl p-6 sm:p-8 mb-6 sm:mb-8">
            <div className="text-4xl sm:text-5xl mb-2 sm:mb-3">👑</div>
            <div className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">{winner.name} Wins!</div>
            <div className="text-4xl sm:text-5xl font-bold text-purple-600">{winner.score} points</div>
          </div>

          <div className="space-y-3 mb-6 sm:mb-8">
            {sortedPlayers.map((player, idx) => (
              <div
                key={player.id}
                className="flex items-center justify-between p-3 sm:p-4 bg-gray-100 rounded-xl"
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="text-xl sm:text-2xl">
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '🎮'}
                  </span>
                  <span className="font-bold text-base sm:text-lg">{player.name}</span>
                </div>
                <span className="text-xl sm:text-2xl font-bold text-purple-600">{player.score}</span>
              </div>
            ))}
          </div>

          <button
            onClick={resetGame}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full text-lg sm:text-xl font-bold hover:scale-105 transition-transform flex items-center justify-center gap-2 mx-auto"
          >
            {React.createElement(RefreshCw, { size: 24 })}
            New Game
          </button>
        </div>
      </div>
    );
  }

  return null;
};

// Render the app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(HebrewVocabGame));
