export function createPlayer() {
    return {
        x: 0,
        y: 0,
        hp: 20,
        maxHp: 20,
        atk: 5,
        def: 2,
        level: 1,
        xp: 0,
        nextXp: 15,
        symbol: "🧙‍♂️",
    };
}

export const gameState = {
    map: [],
    entities: [],
    player: createPlayer(),
    floor: 1,
    score: 0,
    isPlaying: true,
};

export function resetRunState() {
    gameState.map = [];
    gameState.entities = [];
    gameState.player = createPlayer();
    gameState.floor = 1;
    gameState.score = 0;
    gameState.isPlaying = true;
}
