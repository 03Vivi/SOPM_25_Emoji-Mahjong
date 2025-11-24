import React, { useState, useEffect, useRef, useMemo } from 'react';
import './App.css';

// --- CONFIGURAȚIE ---
const TILE_WIDTH = 60;
const TILE_HEIGHT = 80;

const ALL_EMOJIS = [
  '🍎','🚗','🐶','🍕','⚽','🚀','🐱','🌵','💎','🎈',
  '🎉','💡','📚','🧭','🕹️','🎸','👑','🚲','🍉','🍦',
  '🦋','🌻','🏠','⏰','🔑','🎁','🌙','🔥','💧','⚡',
  '🍇','🍔','🎲','🎨','🎤','🏆','✈️','⚓','🗿','🦖',
  '👻','🤖','🎃','👓','👜','👞','👒','☂️','🧤','🧣'
];

const generateRect = (rows, cols, z, offsetX = 0, offsetY = 0) => {
  const tiles = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      tiles.push({ x: x + offsetX, y: y + offsetY, z: z });
    }
  }
  return tiles;
};

const LAYOUTS = {
  easy: [...generateRect(4,6,0,0,0), ...generateRect(3,2,1,2,0.5)],
  medium: [...generateRect(6,6,0,0,0), ...generateRect(4,4,1,1,1), ...generateRect(2,2,2,2,2), {x:0.5,y:0.5,z:1},{x:4.5,y:0.5,z:1},{x:0.5,y:4.5,z:1},{x:4.5,y:4.5,z:1}],
  hard: [...generateRect(6,8,0,0,0), ...generateRect(4,6,1,1,1), ...generateRect(2,4,2,2,2), ...generateRect(2,2,3,3,2), ...generateRect(1,2,4,3,2.5), {x:-1,y:2,z:0},{x:-1,y:3,z:0},{x:8,y:2,z:0},{x:8,y:3,z:0}]
};

const BEST_TIME_KEY = 'mahjongBestTimes';

const fyShuffle = (arr) => { const a = arr.slice(); for (let i = a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; };

function StartScreen({ onStartGame, bestTimes }) {
  const [nickname,setNickname]=useState('');
  const [difficulty,setDifficulty]=useState('medium');
  const handleSubmit=(e)=>{e.preventDefault();if(!nickname.trim()){alert('Te rog introdu un nickname.');return;}onStartGame(nickname,difficulty);}
  const formatTime=(time)=>{if(time===Infinity)return'-';const m=Math.floor(time/60);const s=time%60;return`${m}:${s.toString().padStart(2,'0')}`;}
  return(<div className="start-screen"><h1 className="title">🧩 Emoji Mahjong </h1><form onSubmit={handleSubmit} className="start-form"><div className="form-group"><label htmlFor="nick">Nickname:</label><input id="nick" value={nickname} onChange={e=>setNickname(e.target.value)} maxLength={15} /></div><div className="form-group"><label htmlFor="diff">Difficulty level:</label><select id="diff" value={difficulty} onChange={e=>setDifficulty(e.target.value)}><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></div><button type="submit" className="button">Start Game</button></form><div style={{marginTop:'20px',textAlign:'center'}}><h3>Best Time Score:</h3><p>🟢 Easy: {formatTime(bestTimes.easy)}</p><p>🟡 Medium: {formatTime(bestTimes.medium)}</p><p>🔴 Hard: {formatTime(bestTimes.hard)}</p></div></div>);
}

function GameScreen({ nickname,difficulty,bestTime,onGameEnd,onGoToMenu }){
  const [tiles,setTiles]=useState([]);
  const [selectedTile,setSelectedTile]=useState(null);
  const [score,setScore]=useState(0);
  const [isGameOver,setIsGameOver]=useState(false);
  const [currentTime,setCurrentTime]=useState(0);
  
  const [history, setHistory] = useState([]);
  const [hintIds, setHintIds] = useState([]);
  const [shakeIds, setShakeIds] = useState([]); 
  const [isShuffling, setIsShuffling] = useState(false);

  const timerRef=useRef(null);

  const getEmojisForLevel=(count)=>ALL_EMOJIS.slice(0,count);

  const computeBlockedMap=(currentTiles)=>{
    const active=currentTiles.filter(t=>t.status!=='removed');
    const blockedSet=new Set();
    const tolX=1.15;
    const tolY=0.95;
    for(let i=0;i<active.length;i++){
      const target=active[i];
      const covered=active.some(t=>t.id!==target.id && t.z>target.z && Math.abs(t.x-target.x)<1 && Math.abs(t.y-target.y)<1);
      if(covered){blockedSet.add(target.id);continue;}
      const hasLeft=active.some(t=>t.id!==target.id && t.z===target.z && Math.abs(t.y-target.y)<=tolY && target.x-t.x>0 && target.x-t.x<=tolX);
      const hasRight=active.some(t=>t.id!==target.id && t.z===target.z && Math.abs(t.y-target.y)<=tolY && t.x-target.x>0 && t.x-target.x<=tolX);
      if(hasLeft && hasRight) blockedSet.add(target.id);
    }
    return blockedSet;
  };

  const blockedMap=useMemo(()=>computeBlockedMap(tiles),[tiles]);

  const isTileBlocked=(tile)=>{
    const remainingTiles=tiles.filter(t=>t.status!=='removed');
    if(remainingTiles.length<=2) return false;
    return blockedMap.has(tile.id);
  };

  const hasValidMoves = (currentTiles) => {
    const vis = currentTiles.filter(t => t.status === 'visible' || t.status === 'selected');
    if (vis.length < 2) return true;
    
    const localBlockedMap = computeBlockedMap(currentTiles);
    const freeTiles = vis.filter(t => !localBlockedMap.has(t.id));
    
    const emojiCounts = {};
    for (const t of freeTiles) {
      if (emojiCounts[t.emoji]) return true;
      emojiCounts[t.emoji] = true;
    }
    return false;
  };

  const performShuffle = () => {
    setIsShuffling(true);
    setTimeout(() => {
      setTiles(prevTiles => {
        const visibleTiles = prevTiles.filter(t => t.status !== 'removed');
        const visibleEmojis = visibleTiles.map(t => t.emoji);
        const shuffledEmojis = fyShuffle(visibleEmojis);
        let emojiIndex = 0;
        return prevTiles.map(t => {
          if (t.status !== 'removed') {
            return { ...t, emoji: shuffledEmojis[emojiIndex++], status: 'visible' };
          }
          return t;
        });
      });
      setSelectedTile(null);
      setIsShuffling(false);
    }, 1000);
  };

  useEffect(() => {
    if (tiles.length > 0 && !isGameOver && !hasValidMoves(tiles)) {
      const remaining = tiles.filter(t => t.status !== 'removed').length;
      if (remaining > 0) performShuffle();
    }
  }, [tiles, isGameOver]);

  const startNewGame=()=>{
    const layoutTemplate=LAYOUTS[difficulty];
    const totalTiles=layoutTemplate.length;
    if(totalTiles%2!==0){console.error('Eroare layout impar!');return;}
    const pairsNeeded=totalTiles/2;
    const levelEmojis=getEmojisForLevel(pairsNeeded);
    let gameEmojis=[];
    for(let i=0;i<pairsNeeded;i++){const emoji=levelEmojis[i%levelEmojis.length];gameEmojis.push(emoji,emoji);}
    let shuffled=fyShuffle(gameEmojis);
    const newTiles=layoutTemplate.map((pos,index)=>({id:index,x:pos.x,y:pos.y,z:pos.z,emoji:shuffled[index],status:'visible'}));
    
    setTiles(newTiles);
    setScore(0);
    setSelectedTile(null);
    setIsGameOver(false);
    setCurrentTime(0);
    setHistory([]); 
    setHintIds([]); 
    setShakeIds([]);
    
    if(timerRef.current)clearInterval(timerRef.current);
    timerRef.current=setInterval(()=>setCurrentTime(t=>t+1),1000);
  };

  useEffect(()=>{startNewGame();return()=>{if(timerRef.current)clearInterval(timerRef.current);};},[difficulty]);

  const handleUndo = () => {
    if (history.length === 0 || isGameOver) return;
    const lastMove = history[history.length - 1];
    setTiles(prev => prev.map(t => {
      if (lastMove.ids.includes(t.id)) return { ...t, status: 'visible' };
      return t;
    }));
    setScore(s => Math.max(0, s - lastMove.scoreGained));
    setHistory(prev => prev.slice(0, -1));
    setSelectedTile(null);
  };

  const handleHint = () => {
    const activeTiles = tiles.filter(t => t.status === 'visible');
    const freeTiles = activeTiles.filter(t => !isTileBlocked(t));
    const map = {};
    let pair = null;

    for (let t of freeTiles) {
      if (map[t.emoji]) {
        pair = [map[t.emoji], t.id];
        break;
      }
      map[t.emoji] = t.id;
    }

    if (pair) {
      setHintIds(pair);
      setScore(s => Math.max(0, s - 50));
      setTimeout(() => setHintIds([]), 2000);
    } else {
      performShuffle();
    }
  };

  const handleTileClick=(tile)=>{
    if(isGameOver||tile.status==='removed'||tile.status==='matched'||isShuffling)return;
    if(isTileBlocked(tile))return;

    // 1. Selectare prima piesă
    if(!selectedTile){
      setTiles(prev=>prev.map(t=>t.id===tile.id?{...t,status:'selected'}:t.status==='removed'?t:{...t,status:'visible'}));
      setSelectedTile(tile);
      return;
    }

    // 2. Deselectare
    if(selectedTile.id===tile.id){
      setTiles(prev=>prev.map(t=>t.id===tile.id?{...t,status:'visible'}:t));
      setSelectedTile(null);
      return;
    }

    // 3. Verificare potrivire
    if(selectedTile.emoji===tile.emoji){
      
      // Salvăm în istoric
      setHistory(prev => [...prev, { ids: [selectedTile.id, tile.id], scoreGained: 100 }]);

      // Marcare ca 'matched' (pentru animație vizuală)
      setTiles(prev=>prev.map(t=>(t.id===tile.id||t.id===selectedTile.id)?{...t,status:'matched'}:t));
      
      setScore(s=>s+100);
      setHintIds([]);
      const tile1Id = selectedTile.id;
      const tile2Id = tile.id;
      setSelectedTile(null);
      
      // După 400ms (cât durează animația de zoom/stele), le eliminăm definitiv
      setTimeout(()=>{
        setTiles(prev=>{
          const newTiles = prev.map(t => (t.id === tile1Id || t.id === tile2Id) ? { ...t, status: 'removed' } : t);
          
          if(newTiles.every(t=>t.status==='removed')){
            setIsGameOver(true);
            if(timerRef.current)clearInterval(timerRef.current);
            onGameEnd(currentTime);
          }
          return newTiles;
        });
      }, 400); 

      return;
    }

    // 4. Mismatch (Greșeală) - declanșăm shake vizual
    setShakeIds([selectedTile.id, tile.id]);
    setTimeout(() => setShakeIds([]), 300);

    // Schimbăm selecția
    setTiles(prev=>prev.map(t=>t.id===tile.id?{...t,status:'selected'}:t.status==='selected'?{...t,status:'visible'}:t));
    setSelectedTile(tile);
  };

  const formatTime=(time)=>{const m=Math.floor(time/60);const s=time%60;return`${m}:${s.toString().padStart(2,'0')}`;};

  return(<>
    <div className="stats">
      <div>
        <div style={{fontSize:'0.9rem',opacity:0.8}}>Jucător: {nickname}</div>
        <div>Scor: {score}</div>
      </div>
      
      <div className="time-display">
        <span className="timer">⏱️ {formatTime(currentTime)}</span>
        <span className="best-time">🏆 {bestTime===Infinity?'--:--':formatTime(bestTime)}</span>
      </div>
      
      <div style={{display:'flex', flexDirection:'column', gap:'5px', alignItems:'center'}}>
        <div className="actions">
          <button className="btn-action" onClick={handleUndo} disabled={history.length === 0}>↩️ Undo</button>
          <button className="btn-action" onClick={handleHint} title="Cost: -50 pct">💡 Hint</button>
        </div>
        <div>
           <button onClick={startNewGame} className="button" style={{fontSize:'0.8rem', padding:'5px 10px'}}>Restart</button>
           <button onClick={onGoToMenu} className="button button-menu" style={{fontSize:'0.8rem', padding:'5px 10px', marginLeft:'5px'}}>Meniu</button>
        </div>
      </div>
    </div>

    {isGameOver&&<div className="winMessage">🎉 Felicitări, {nickname}! 🎉</div>}
    
    {isShuffling && (
      <div className="shuffle-message">
        <span>🔄 Nu mai sunt mutări! Se amestecă...</span>
      </div>
    )}

    <div className="boardContainer">
      <div className="board">
        {tiles.map(tile=>{
          if(tile.status==='removed')return null;
          
          const leftPos=(tile.x*TILE_WIDTH)+(tile.z*5);
          const topPos=(tile.y*TILE_HEIGHT)-(tile.z*5);
          const blocked=isTileBlocked(tile);
          
          const isSelected=tile.status==='selected';
          const isMatched=tile.status==='matched'; 
          const isHinted=hintIds.includes(tile.id);
          const isShaking=shakeIds.includes(tile.id);

          // Calcul stil
          const dynamicStyles={
            left:`${leftPos}px`,
            top:`${topPos}px`,
            zIndex:Math.round(tile.z)+10,
            backgroundColor: isMatched ? '#d4edda' : (isSelected ? '#ffd700' : (blocked ? '#d1d1d1' : '#fff')),
            cursor: blocked ? 'not-allowed' : 'pointer',
            filter: blocked ? 'brightness(0.6) contrast(0.8)' : 'none',
            border: isSelected ? '3px solid #d32f2f' : (isHinted ? '3px solid cyan' : (isMatched ? '3px solid #28a745' : '1px solid #888')),
            boxShadow: isSelected ? '0 0 15px #ffd700' : (isHinted ? '0 0 15px cyan' : `${tile.z*4}px ${tile.z*4}px 8px rgba(0,0,0,0.4)`),
          };

          const className = `tile ${isHinted ? 'hinted' : ''} ${isMatched ? 'matched' : ''} ${isShaking ? 'shake' : ''}`;

          return(
            <div key={tile.id} onClick={()=>handleTileClick(tile)} className={className} style={dynamicStyles}>
              <span className="emoji">{tile.emoji}</span>
              <div className="tileSide" style={{height:'100%',width:'6px',right:'-6px',top:'3px',transform:'skewY(45deg)',background:'#999'}}></div>
              <div className="tileSide" style={{width:'100%',height:'6px',bottom:'-6px',left:'3px',transform:'skewX(45deg)',background:'#777'}}></div>
            </div>
          );
        })}
      </div>
    </div>
  </>);
}

function App(){
  const [gameState,setGameState]=useState('menu');
  const [nickname,setNickname]=useState('');
  const [difficulty,setDifficulty]=useState('medium');
  const [bestTimes,setBestTimes]=useState(()=>{try{const saved=localStorage.getItem(BEST_TIME_KEY);return saved?JSON.parse(saved):{easy:Infinity,medium:Infinity,hard:Infinity};}catch(e){return{easy:Infinity,medium:Infinity,hard:Infinity};}});
  const handleStartGame=(nick,diff)=>{setNickname(nick);setDifficulty(diff);setGameState('playing');};
  const handleGoToMenu=()=>{setGameState('menu');};
  const handleGameEnd=(finalTime)=>{if(finalTime<(bestTimes[difficulty]||Infinity)){const updated={...bestTimes,[difficulty]:finalTime};setBestTimes(updated);localStorage.setItem(BEST_TIME_KEY,JSON.stringify(updated));}};
  return(<div className="container">{gameState==='menu'?<StartScreen onStartGame={handleStartGame} bestTimes={bestTimes}/>:<GameScreen nickname={nickname} difficulty={difficulty} bestTime={bestTimes[difficulty]||Infinity} onGameEnd={handleGameEnd} onGoToMenu={handleGoToMenu}/>}</div>);
}

export default App;
