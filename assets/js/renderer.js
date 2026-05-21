import { CONFIG, TYPES } from './config.js';
import { getEntityAt } from './entities.js';
import { gameState } from './state.js';
import { dom, updateUI } from './ui.js';

export function getCameraBounds() {
    const maxX = CONFIG.mapWidth - CONFIG.cameraWidth;
    const maxY = CONFIG.mapHeight - CONFIG.cameraHeight;
    const x = Math.max(0, Math.min(Math.floor(gameState.player.x - CONFIG.cameraWidth / 2), maxX));
    const y = Math.max(0, Math.min(Math.floor(gameState.player.y - CONFIG.cameraHeight / 2), maxY));

    return {
        x,
        y,
        width: CONFIG.cameraWidth,
        height: CONFIG.cameraHeight,
    };
}

function createPlayerElement() {
    const playerEl = document.createElement('div');
    playerEl.className = 'entity player';
    playerEl.id = 'player-entity';
    playerEl.innerHTML = gameState.player.symbol;
    return playerEl;
}

function createEntityElement(entity) {
    const entityEl = document.createElement('div');
    entityEl.className = `entity ${entity.type}`;
    entityEl.innerHTML = entity.symbol;

    if (entity.type === TYPES.ITEM) {
        entityEl.classList.add('floor-item');
    }

    if (entity.id) {
        entityEl.id = entity.id;
    }

    return entityEl;
}

function applyFog(tileEl, tileData) {
    if (tileData.visible) {
        return;
    }

    if (tileData.explored) {
        tileEl.style.filter = 'brightness(0.3)';
        return;
    }

    tileEl.classList.add('fog');
}

function renderTile(x, y) {
    const tileData = gameState.map[y][x];
    const tileEl = document.createElement('div');
    tileEl.className = `tile ${tileData.type}`;
    tileEl.dataset.mapX = String(x);
    tileEl.dataset.mapY = String(y);

    applyFog(tileEl, tileData);

    if (!tileData.visible) {
        return tileEl;
    }

    if (x === gameState.player.x && y === gameState.player.y) {
        tileEl.appendChild(createPlayerElement());
        return tileEl;
    }

    const entity = getEntityAt(x, y);

    if (entity) {
        tileEl.appendChild(createEntityElement(entity));
    }

    return tileEl;
}

export function render() {
    const camera = getCameraBounds();
    const fragment = document.createDocumentFragment();

    dom.board.innerHTML = '';
    dom.board.style.gridTemplateColumns = `repeat(${CONFIG.cameraWidth}, 1fr)`;
    dom.board.style.gridTemplateRows = `repeat(${CONFIG.cameraHeight}, 1fr)`;

    for (let y = camera.y; y < camera.y + camera.height; y++) {
        for (let x = camera.x; x < camera.x + camera.width; x++) {
            fragment.appendChild(renderTile(x, y));
        }
    }

    dom.board.appendChild(fragment);
    updateUI();
}
