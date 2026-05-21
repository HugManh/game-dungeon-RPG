import { CONFIG, ENEMY_TYPES, FLOOR_ITEM_TYPES, ITEM_TYPES, TYPES } from './config.js';
import { addEntity, canPlaceEntity, createEntityId, isEntityAt } from './entities.js';
import { gameState } from './state.js';

class Rect {
    constructor(x, y, w, h) {
        this.x1 = x;
        this.y1 = y;
        this.x2 = x + w;
        this.y2 = y + h;
    }

    center() {
        return {
            x: Math.floor((this.x1 + this.x2) / 2),
            y: Math.floor((this.y1 + this.y2) / 2),
        };
    }

    intersect(other) {
        return this.x1 <= other.x2 &&
            this.x2 >= other.x1 &&
            this.y1 <= other.y2 &&
            this.y2 >= other.y1;
    }
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomRoomTile(room) {
    return {
        x: randomInt(room.x1 + 1, room.x2 - 1),
        y: randomInt(room.y1 + 1, room.y2 - 1),
    };
}

function createRoom(room) {
    for (let x = room.x1 + 1; x < room.x2; x++) {
        for (let y = room.y1 + 1; y < room.y2; y++) {
            gameState.map[y][x].type = TYPES.FLOOR;
        }
    }
}

function createHTunnel(x1, x2, y) {
    const min = Math.min(x1, x2);
    const max = Math.max(x1, x2);

    for (let x = min; x <= max; x++) {
        gameState.map[y][x].type = TYPES.FLOOR;
    }
}

function createVTunnel(y1, y2, x) {
    const min = Math.min(y1, y2);
    const max = Math.max(y1, y2);

    for (let y = min; y <= max; y++) {
        gameState.map[y][x].type = TYPES.FLOOR;
    }
}

function placeEnemy(room) {
    const { x, y } = randomRoomTile(room);

    if (!canPlaceEntity(x, y)) {
        return;
    }

    const enemyLimit = Math.min(ENEMY_TYPES.length, Math.ceil(gameState.floor / 2) + 1);
    const enemyTemplate = ENEMY_TYPES[Math.floor(Math.random() * enemyLimit)];
    const multiplier = 1 + (gameState.floor - 1) * 0.2;

    addEntity(TYPES.ENEMY, x, y, enemyTemplate.symbol, {
        name: enemyTemplate.name,
        hp: Math.floor(enemyTemplate.hp * multiplier),
        maxHp: Math.floor(enemyTemplate.hp * multiplier),
        atk: Math.floor(enemyTemplate.atk * multiplier),
        def: Math.floor(enemyTemplate.def * multiplier),
        xp: Math.floor(enemyTemplate.xp * multiplier),
        color: enemyTemplate.color,
        id: createEntityId('enemy'),
    });
}

function placeFloorItem(room) {
    const { x, y } = randomRoomTile(room);

    if (!canPlaceEntity(x, y)) {
        return;
    }

    const item = FLOOR_ITEM_TYPES[Math.floor(Math.random() * FLOOR_ITEM_TYPES.length)];

    addEntity(TYPES.ITEM, x, y, item.symbol, {
        item,
        id: createEntityId('item'),
    });
}

function placeChest(room) {
    const { x, y } = randomRoomTile(room);

    if (!canPlaceEntity(x, y)) {
        return;
    }

    const item = ITEM_TYPES[Math.floor(Math.random() * ITEM_TYPES.length)];

    addEntity(TYPES.CHEST, x, y, "🧰", {
        item,
        id: createEntityId('chest'),
    });
}

function populateRoom(room) {
    const maxEnemies = Math.floor(gameState.floor / 3) + 1;
    const numEnemies = Math.floor(Math.random() * (maxEnemies + 1));

    for (let i = 0; i < numEnemies; i++) {
        placeEnemy(room);
    }

    if (Math.random() < 0.5) {
        placeFloorItem(room);
    }

    if (Math.random() < 0.3) {
        placeChest(room);
    }
}

function createEmptyMap() {
    gameState.map = [];

    for (let y = 0; y < CONFIG.mapHeight; y++) {
        const row = [];

        for (let x = 0; x < CONFIG.mapWidth; x++) {
            row.push({ type: TYPES.WALL, explored: false, visible: false });
        }

        gameState.map.push(row);
    }

    gameState.entities = [];
}

export function createMap() {
    createEmptyMap();

    const rooms = [];

    for (let i = 0; i < CONFIG.maxRooms; i++) {
        const w = randomInt(CONFIG.roomMinSize, CONFIG.roomMaxSize);
        const h = randomInt(CONFIG.roomMinSize, CONFIG.roomMaxSize);
        const x = Math.floor(Math.random() * (CONFIG.mapWidth - w - 1)) + 1;
        const y = Math.floor(Math.random() * (CONFIG.mapHeight - h - 1)) + 1;
        const newRoom = new Rect(x, y, w, h);

        if (rooms.some((room) => newRoom.intersect(room))) {
            continue;
        }

        createRoom(newRoom);

        const center = newRoom.center();

        if (rooms.length === 0) {
            gameState.player.x = center.x;
            gameState.player.y = center.y;
        } else {
            const previousCenter = rooms[rooms.length - 1].center();

            if (Math.random() > 0.5) {
                createHTunnel(previousCenter.x, center.x, previousCenter.y);
                createVTunnel(previousCenter.y, center.y, center.x);
            } else {
                createVTunnel(previousCenter.y, center.y, previousCenter.x);
                createHTunnel(previousCenter.x, center.x, center.y);
            }

            populateRoom(newRoom);
        }

        rooms.push(newRoom);
    }

    if (rooms.length === 0) {
        const fallbackRoom = new Rect(1, 1, CONFIG.roomMinSize + 1, CONFIG.roomMinSize + 1);
        createRoom(fallbackRoom);
        const center = fallbackRoom.center();
        gameState.player.x = center.x;
        gameState.player.y = center.y;
        rooms.push(fallbackRoom);
    }

    const lastRoomCenter = rooms[rooms.length - 1].center();
    addEntity(TYPES.STAIRS, lastRoomCenter.x, lastRoomCenter.y, "🌀", { name: "Stairs Down" });
}

export function computeFOV() {
    const px = gameState.player.x;
    const py = gameState.player.y;
    const radius = CONFIG.viewRadius;

    for (let y = 0; y < CONFIG.mapHeight; y++) {
        for (let x = 0; x < CONFIG.mapWidth; x++) {
            gameState.map[y][x].visible = false;
        }
    }

    gameState.map[py][px].visible = true;
    gameState.map[py][px].explored = true;

    for (let i = 0; i < 360; i += 2) {
        const rad = i * Math.PI / 180;
        const dx = Math.cos(rad);
        const dy = Math.sin(rad);
        let x = px + 0.5;
        let y = py + 0.5;

        for (let j = 0; j < radius; j++) {
            x += dx;
            y += dy;

            const mapX = Math.floor(x);
            const mapY = Math.floor(y);

            if (mapX < 0 || mapX >= CONFIG.mapWidth || mapY < 0 || mapY >= CONFIG.mapHeight) {
                break;
            }

            gameState.map[mapY][mapX].visible = true;
            gameState.map[mapY][mapX].explored = true;

            if (gameState.map[mapY][mapX].type === TYPES.WALL) {
                break;
            }
        }
    }
}

export function isWalkableTile(x, y) {
    if (x < 0 || x >= CONFIG.mapWidth || y < 0 || y >= CONFIG.mapHeight) {
        return false;
    }

    return gameState.map[y][x].type !== TYPES.WALL;
}

export function isValidEnemyMove(x, y) {
    return isWalkableTile(x, y) &&
        !isEntityAt(x, y) &&
        !(x === gameState.player.x && y === gameState.player.y);
}
