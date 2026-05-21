export const CONFIG = {
    mapWidth: 30,
    mapHeight: 30,
    viewRadius: 8,
    tileSize: 30,
    maxRooms: 10,
    roomMinSize: 4,
    roomMaxSize: 9,
    cameraWidth: 15,
    cameraHeight: 15,
};

export const TYPES = {
    WALL: 'wall',
    FLOOR: 'floor',
    PLAYER: 'player',
    ENEMY: 'enemy',
    CHEST: 'chest',
    STAIRS: 'stairs',
    ITEM: 'item',
};

export const ENEMY_TYPES = [
    { name: "Goblin", symbol: "👺", hp: 10, atk: 3, def: 1, xp: 5, color: "#48bb78" },
    { name: "Skeleton", symbol: "💀", hp: 15, atk: 4, def: 2, xp: 8, color: "#e2e8f0" },
    { name: "Orc", symbol: "👹", hp: 25, atk: 6, def: 3, xp: 15, color: "#38a169" },
    { name: "Slime", symbol: "💧", hp: 8, atk: 2, def: 0, xp: 3, color: "#4299e1" },
    { name: "Bat", symbol: "🦇", hp: 5, atk: 5, def: 0, xp: 4, color: "#a0aec0" },
];

export const ITEM_TYPES = [
    { name: "Health Potion", type: "heal", value: 15, symbol: "🍎" },
    { name: "Big Potion", type: "heal", value: 30, symbol: "🍖" },
    { name: "Sword Upgrade", type: "atk", value: 2, symbol: "🗡️" },
    { name: "Shield Upgrade", type: "def", value: 1, symbol: "🛡️" },
    { name: "Experience Scroll", type: "xp", value: 20, symbol: "📜" },
];

export const FLOOR_ITEM_TYPES = ITEM_TYPES.filter((item) => item.type === 'heal' || item.type === 'xp');
