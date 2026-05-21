const KEY_MOVES = {
    ArrowUp: [0, -1],
    ArrowDown: [0, 1],
    ArrowLeft: [-1, 0],
    ArrowRight: [1, 0],
    w: [0, -1],
    W: [0, -1],
    s: [0, 1],
    S: [0, 1],
    a: [-1, 0],
    A: [-1, 0],
    d: [1, 0],
    D: [1, 0],
};

const PREVENT_DEFAULT_CODES = new Set(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space", " "]);
const SWIPE_THRESHOLD = 30;

let touchStartX = 0;
let touchStartY = 0;

function handleKeyDown(event, movePlayer) {
    if (PREVENT_DEFAULT_CODES.has(event.code)) {
        event.preventDefault();
    }

    const move = KEY_MOVES[event.key];

    if (move) {
        movePlayer(move[0], move[1]);
    }
}

function handleSwipe(startX, startY, endX, endY, movePlayer) {
    const dx = endX - startX;
    const dy = endY - startY;

    if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) {
        return;
    }

    if (Math.abs(dx) > Math.abs(dy)) {
        movePlayer(dx > 0 ? 1 : -1, 0);
        return;
    }

    movePlayer(0, dy > 0 ? 1 : -1);
}

export function bindInputHandlers({ movePlayer, resetGame, controls, restartButton }) {
    window.addEventListener('keydown', (event) => handleKeyDown(event, movePlayer));

    controls.up.addEventListener('click', () => movePlayer(0, -1));
    controls.down.addEventListener('click', () => movePlayer(0, 1));
    controls.left.addEventListener('click', () => movePlayer(-1, 0));
    controls.right.addEventListener('click', () => movePlayer(1, 0));

    document.addEventListener('touchstart', (event) => {
        touchStartX = event.changedTouches[0].screenX;
        touchStartY = event.changedTouches[0].screenY;
    }, { passive: true });

    document.addEventListener('touchend', (event) => {
        handleSwipe(
            touchStartX,
            touchStartY,
            event.changedTouches[0].screenX,
            event.changedTouches[0].screenY,
            movePlayer,
        );
    }, { passive: true });

    restartButton.addEventListener('click', resetGame);
}
