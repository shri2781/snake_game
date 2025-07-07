// In JS, Set isn't ordered, takes only O(1) for insertion and checking

import React, { useState, useEffect, useRef } from 'react';
import Score from './Score';
import './Board.css';
import gameOverImg from './game_over.png';

const board_size = 10;

function Board() {
    const [score,setScore] = useState(0); 
    const board = createBoard(board_size);
    const [snakeCells, setSnakeCells] = useState(new Set([44])); // Snake starts at cell 44
    const [snake, setSnake] = useState([44]);

    const [gameOver, setGameOver] = useState(false);
    const [direction, setDirection] = useState('right');
    const [appleCell, setAppleCell] = useState(randomIntfromInterval(1, board_size * board_size));

    const directionRef = useRef('right'); 
    const appleCellRef = useRef(appleCell); 
    const intervalRef = useRef(null);
    const directionLockedRef = useRef(false); // Lock for direction changes per move

    useEffect(() => {
        directionRef.current = direction;
    }, [direction]);

    useEffect(() => {
        appleCellRef.current = appleCell;
    }, [appleCell]);

    // Keyboard input handler
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (directionLockedRef.current) return; // Ignore if locked

            switch (event.key) {
                case 'ArrowUp':
                    setDirection(prevDir => {
                        if (prevDir !== 'down') {
                            directionLockedRef.current = true; // Lock direction after change
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

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    // Snake movement interval with delay to fix double-start
    useEffect(() => {
        if (!gameOver) {
            const timeoutId = setTimeout(() => {
                intervalRef.current = setInterval(() => {
                    setSnake(prevSnake => {
                        const snakeSet = new Set(prevSnake); 
                        //using snakeset inside this function only, creating this is O(n) but it helps to create free cells later
                        const head = prevSnake[0];
                        let next = -1;

                        switch (directionRef.current) {
                            case 'up':
                                next = head - board_size;
                                break;
                            case 'down':
                                next = head + board_size;
                                break;
                            case 'left':
                                next = head - 1;
                                break;
                            case 'right':
                                next = head + 1;
                                break;
                            default:
                                break;
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
                        //self-collision detection -> take care of tail also
                        function isselfCollision(){
                            if(snakeSet.has(next)){
                                if(next!=tail) return true;
                                if(isEating) return true;
                            }
                            return false;
                        }

                        if (checkGameOver() || isselfCollision()){   
                            setGameOver(true);
                            clearInterval(intervalRef.current);
                            return prevSnake;
                        }

                        const newSnake = [...prevSnake];

                        if (next === appleCellRef.current){
                            setScore(prev=>(prev+1));
                            // Generate new apple that does NOT overlap with the curr_snake and next
                            //instead of doing do-while loop, we have array of free cells and randomly pick an index.
                            const freeCells = [];
                            for (let i = 1; i <= board_size * board_size; i++) {
                                if (!snakeSet.has(i) && i !== next) {
                                    freeCells.push(i);
                                }
                            }
                            // Pick a random cell
                            const newApple = freeCells[Math.floor(Math.random() * freeCells.length)];
                            setAppleCell(newApple);
                        } 
                        else newSnake.pop();
                        
                        newSnake.unshift(next);
                        setSnakeCells(new Set(newSnake));  

                        directionLockedRef.current = false; // Unlock direction after snake moves

                        return newSnake;
                    });
                }, 300);
            }, 50); // short delay fixes early double move

            return () => {
                clearTimeout(timeoutId);
                clearInterval(intervalRef.current);
            };
        } 
    }, [gameOver]);

    return (
    <div>
        <Score score={score} />
        
        {gameOver ? (
        // Show Game Over image instead of board
        <div className="game-over-container">
            <img src={gameOverImg} alt="Game Over" />
        </div>
        ) : (
        // Show the board normally
        <div className='board'>
            {board.map((row, rowID) =>
            <div key={rowID} className='row'>
                {row.map((cellvalue, cellID) =>
                <div
                    key={cellID}
                    className={`cell ${snakeCells.has(cellvalue) ? 'snake' : ''} ${cellvalue === appleCell ? 'food' : ''}`}
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

export default Board;