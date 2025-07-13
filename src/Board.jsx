// In JS, Set isn't ordered, takes only O(1) for insertion and checking

import React, { useState, useEffect, useRef } from 'react';
import Score from './Score';
import './Board.css';
import gameOverImg from './game_over.png';
import gameOvervoice from './game-over.mp3';
import eatingVoice from './eating-sound.mp3';
const board_size = 10;

function Board() {
    const [score,setScore] = useState(0); 
    const board = createBoard(board_size);
    const [snakeCells, setSnakeCells] = useState(new Set([44])); // Snake starts at cell 44
    const [snake, setSnake] = useState([44]);
    const [gameOver, setGameOver] = useState(false);
    const [direction, setDirection] = useState('right');
    const [appleCell, setAppleCell] = useState(randomIntfromInterval(1, board_size * board_size));
    const [bombCell, setBombCell] = useState(0);
    const [boostCell, setBoostCell] = useState(0);
    
    const directionRef = useRef('right'); 
    const appleCellRef = useRef(appleCell); 
    const bombCellRef = useRef(bombCell); 
    const intervalRef = useRef(null);
    const directionLockedRef = useRef(false); // Lock for direction changes per move
    const boostCellRef = useRef(boostCell);
    const gameOverSound = useRef(new Audio(gameOvervoice));
    const eatingSound = useRef(new Audio(eatingVoice));
    const snakeCellsRef = useRef(snakeCells);

    useEffect(() => {
        snakeCellsRef.current = snakeCells;
    }, [snakeCells]);

    useEffect(() => {
        directionRef.current = direction;
    }, [direction]);

    useEffect(() => {
        appleCellRef.current = appleCell;
    }, [appleCell]);

    useEffect(() => {
        bombCellRef.current = bombCell; 
    }, [bombCell]);

    useEffect(() => {
        boostCellRef.current = boostCell;
    }, [boostCell]);

    // Keyboard input handler
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (directionLockedRef.current) return;

            switch (event.key) {
                case 'ArrowUp':
                    setDirection(prevDir => {
                        if (prevDir !== 'down') {
                            directionLockedRef.current = true;
                            return 'up';
                        }
                        return prevDir;
                    });
                    break;
                case 'ArrowDown':
                    setDirection(prevDir => {
                        if (prevDir !== 'up') {
                            directionLockedRef.current = true;
                            return 'down';
                        }
                        return prevDir;
                    });
                    break;
                case 'ArrowLeft':
                    setDirection(prevDir => {
                        if (prevDir !== 'right') {
                            directionLockedRef.current = true;
                            return 'left';
                        }
                        return prevDir;
                    });
                    break;
                case 'ArrowRight':
                    setDirection(prevDir => {
                        if (prevDir !== 'left') {
                            directionLockedRef.current = true;
                            return 'right';
                        }
                        return prevDir;
                    });
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Snake movement logic
    useEffect(() => {
        if (!gameOver) {
            const timeoutId = setTimeout(() => {
                intervalRef.current = setInterval(() => {
                    setSnake(prevSnake => {
                        const snakeSet = new Set(prevSnake);
                        const head = prevSnake[0];
                        let next = -1;

                        switch (directionRef.current) {
                            case 'up': next = head - board_size; break;
                            case 'down': next = head + board_size; break;
                            case 'left': next = head - 1; break;
                            case 'right': next = head + 1; break;
                        }

                        function checkGameOver() {
                            if (head <= board_size && directionRef.current === 'up') return true;
                            if (head > board_size * board_size - board_size && directionRef.current === 'down') return true;
                            if (head % board_size === 1 && directionRef.current === 'left') return true;
                            if (head % board_size === 0 && directionRef.current === 'right') return true;
                            return false;
                        }

                        const isEating = next === appleCellRef.current;
                        const tail = prevSnake[prevSnake.length - 1];

                        function isselfCollision(){
                            if (snakeSet.has(next)) {
                                if (next !== tail) return true;
                                if (isEating) return true;
                            }
                            return false;
                        }

                        function isBombcell(){
                            return (bombCellRef.current && next === bombCellRef.current);
                        }

                        if (checkGameOver() || isselfCollision() || isBombcell()) {
                            setGameOver(true);
                            clearInterval(intervalRef.current);
                            return prevSnake;
                        }

                        const newSnake = [...prevSnake];

                        if (next === appleCellRef.current) {
                            eatingSound.current.currentTime = 0;
                            eatingSound.current.play();
                            setScore(prev => prev + 1);

                            const newApple = freeCell(snakeSet, bombCellRef.current, appleCellRef.current, boostCellRef.current);
                            setAppleCell(newApple);
                        } 
                        /* Note: when snake eats an apple and apple comes adjacent, we dont want it to become bomb, 
                        will be too hard to play, so this is in else block
                        */ 
                        else {
                            newSnake.pop();

                            function isAdjacent() {
                                if (next > board_size && next - board_size === appleCellRef.current) return true;
                                if (next <= board_size * (board_size - 1) && next + board_size === appleCellRef.current) return true;
                                if (next % board_size !== 1 && next - 1 === appleCellRef.current) return true;
                                if (next % board_size !== 0 && next + 1 === appleCellRef.current) return true;
                                return false;
                            }

                            if (isAdjacent()) {
                                let checker = Math.floor(Math.random()*4);
                                if (checker === 0) {
                                    setBombCell(appleCellRef.current);
                                    setAppleCell(-1);
                                }
                            }
                        }

                        //shrink to one when boost feature is met
                        if(next === boostCellRef.current){
                            eatingSound.current.currentTime = 0;
                            eatingSound.current.play();
                            newSnake.length = 0;       //remove all elements, 'next' is added after this block
                            setBoostCell(0);  
                        }

                        newSnake.unshift(next);
                        setSnakeCells(new Set(newSnake));
                        directionLockedRef.current = false;
                        return newSnake;
                    });
                }, 300);
            }, 50);

            return () => {
                clearTimeout(timeoutId);
                clearInterval(intervalRef.current);
            };
        } else {
            gameOverSound.current.currentTime = 0;
            gameOverSound.current.play();
        }
    }, [gameOver]);

    //Turn bomb back to apple after 2 sec
    useEffect(() => {
        if (bombCell !== 0) { 
            const timeout = setTimeout(() => {
                setAppleCell(bombCell);
                setBombCell(0);
            }, 2000);

            return () => clearTimeout(timeout);
        }
    }, [bombCell]);

    //boost cell sets every 15s and remains for 5s
    useEffect(() => {
        let timeout;

        if (boostCellRef.current === 0) {
            timeout = setTimeout(() => {
                const newBoostCell = freeCell(
                    snakeCellsRef.current, 
                    bombCellRef.current, 
                    appleCellRef.current, 
                    boostCellRef.current
                );
                setBoostCell(newBoostCell);
            }, 15000);
        } 
        else {
            timeout = setTimeout(() => {
                setBoostCell(0);
            }, 5000);
        }

        return () => clearTimeout(timeout);
    }, [boostCell]);

    return (
        <div>
            <Score score={score} />
            {gameOver ? (
                <div className="game-over-container">
                    <img src={gameOverImg} alt="Game Over" />
                </div>
            ) : (
                <div className='board'>
                    {board.map((row, rowID) =>
                        <div key={rowID} className='row'>
                            {row.map((cellvalue, cellID) =>
                                <div
                                    key={cellID}
                                    className={`cell 
                                        ${snakeCells.has(cellvalue) ? 'snake' : ''} 
                                        ${cellvalue === appleCell ? 'apple' : ''} 
                                        ${cellvalue === bombCell ? 'bomb' : ''}
                                        ${cellvalue === boostCell ? 'boost' : ''}`
                                    }
                                />
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// Function to generate a random integer between min and max (inclusive)
function randomIntfromInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Create the board numbering 1 to 100 (for 10x10)
function createBoard(board_size) {
    const board = [];
    let counter = 1;
    for (let row = 0; row < board_size; row++) {
        const curr_row = [];
        for (let col = 0; col < board_size; col++) {
            curr_row.push(counter++);
        }
        board.push(curr_row);
    }
    return board;
}

//returns an free cell..used for apple spawn and boost cell
function freeCell(snakeSet, bombCell, appleCell, boostCell){
    const freeCells = []; //array of freecells
    for (let i = 1; i <= board_size * board_size; i++) {
        if (!snakeSet.has(i) && i !== bombCell && i !== appleCell && i !== boostCell) {
            freeCells.push(i);
        }
    }
    return freeCells[Math.floor(Math.random() * freeCells.length)]; //returns any one randomly
}

export default Board;