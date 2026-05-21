import { gameState } from './state.js';

export function createEntityId(prefix) {
    return `${prefix}_${Math.random().toString(36).slice(2, 11)}`;
}

export function addEntity(type, x, y, symbol, properties = {}) {
    gameState.entities.push({
        type,
        x,
        y,
        symbol,
        ...properties,
    });
}

export function getEntityAt(x, y) {
    return gameState.entities.find((entity) => entity.x === x && entity.y === y);
}

export function isEntityAt(x, y) {
    return getEntityAt(x, y) !== undefined;
}

export function removeEntity(id) {
    gameState.entities = gameState.entities.filter((entity) => entity.id !== id);
}

export function canPlaceEntity(x, y) {
    return !isEntityAt(x, y) && !(x === gameState.player.x && y === gameState.player.y);
}
