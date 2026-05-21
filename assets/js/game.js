import { CONFIG, TYPES } from './config.js';
import { createMap, computeFOV, isValidEnemyMove, isWalkableTile } from './dungeon.js';
import { getEntityAt, removeEntity } from './entities.js';
import { bindInputHandlers } from './input.js';
import { getCameraBounds, render } from './renderer.js';
import { gameState, resetRunState } from './state.js';
import {
    bindUiEvents,
    clearLog,
    dom,
    hideGameOver,
    log,
    pulseXpBar,
    showGameOver,
    showMessage,
    updateUI,
} from './ui.js';

const visualEffects = [];

function queueClassEffect(elementId, className, duration) {
    if (!elementId) {
        return;
    }

    visualEffects.push({
        type: 'class',
        elementId,
        className,
        duration,
    });
}

function queueFloatingText(x, y, text, className) {
    visualEffects.push({
        type: 'floating-text',
        x,
        y,
        text,
        className,
    });
}

function flushVisualEffects() {
    const effects = visualEffects.splice(0);

    effects.forEach((effect) => {
        if (effect.type === 'class') {
            const element = document.getElementById(effect.elementId);

            if (!element) {
                return;
            }

            element.classList.add(effect.className);
            setTimeout(() => element.classList.remove(effect.className), effect.duration);
            return;
        }

        const tile = document.querySelector(`[data-map-x="${effect.x}"][data-map-y="${effect.y}"]`);

        if (!tile) {
            return;
        }

        const textEl = document.createElement('div');
        textEl.className = `floating-text ${effect.className}`;
        textEl.textContent = effect.text;
        tile.appendChild(textEl);
        setTimeout(() => textEl.remove(), 750);
    });
}

function renderWithEffects() {
    render();
    flushVisualEffects();
}

function calculateDamage(attacker, defender) {
    const baseDamage = Math.max(1, attacker.atk - Math.floor(defender.def / 2));
    const variance = Math.floor(baseDamage * 0.2);
    return Math.max(1, baseDamage + (Math.floor(Math.random() * (variance * 2 + 1)) - variance));
}

function queueCombatEffects(attacker, defender, finalDamage, isPlayerAttacking) {
    queueClassEffect(isPlayerAttacking ? 'player-entity' : attacker.id, 'attacking', 200);
    queueClassEffect(isPlayerAttacking ? defender.id : 'player-entity', 'hit-effect', 300);
    queueFloatingText(
        defender.x,
        defender.y,
        `-${finalDamage}`,
        isPlayerAttacking ? 'floating-enemy-damage' : 'floating-player-damage',
    );
}

function attack(attacker, defender, isPlayerAttacking) {
    const finalDamage = calculateDamage(attacker, defender);
    defender.hp -= finalDamage;

    queueCombatEffects(attacker, defender, finalDamage, isPlayerAttacking);

    if (isPlayerAttacking) {
        log(`You hit ${defender.name} for ${finalDamage} dmg!`, 'combat');

        if (defender.hp <= 0) {
            log(`Defeated ${defender.name}! Gained ${defender.xp} XP.`, 'loot');
            gameState.score += defender.maxHp;
            gainXP(defender.xp);
            removeEntity(defender.id);
        }

        return;
    }

    log(`${attacker.name} hits you for ${finalDamage} dmg!`, 'combat');

    if (defender.hp <= 0) {
        gameOver();
    }
}

function gainXP(amount) {
    queueFloatingText(gameState.player.x, gameState.player.y, `+${amount} XP`, 'floating-xp');
    pulseXpBar();
    gameState.player.xp += amount;

    while (gameState.player.xp >= gameState.player.nextXp) {
        levelUp();
    }
}

function levelUp() {
    gameState.player.level++;
    gameState.player.xp -= gameState.player.nextXp;
    gameState.player.nextXp = Math.floor(gameState.player.nextXp * 1.5);
    gameState.player.maxHp += 5;
    gameState.player.hp = gameState.player.maxHp;
    gameState.player.atk += 2;
    gameState.player.def += 1;

    log(`LEVEL UP! You are now level ${gameState.player.level}!`, 'level');
}

function applyItemEffect(item, { allowStatUpgrades = true } = {}) {
    if (item.type === 'heal') {
        const healAmount = Math.min(item.value, gameState.player.maxHp - gameState.player.hp);
        gameState.player.hp += healAmount;
        log(healAmount > 0 ? `Healed for ${healAmount} HP.` : "Already at full health.", healAmount > 0 ? 'loot' : 'normal');
        return;
    }

    if (item.type === 'xp') {
        gainXP(item.value);
        return;
    }

    if (!allowStatUpgrades) {
        return;
    }

    if (item.type === 'atk') {
        gameState.player.atk += item.value;
    } else if (item.type === 'def') {
        gameState.player.def += item.value;
    }
}

function interact(entity) {
    if (entity.type === TYPES.ENEMY) {
        attack(gameState.player, entity, true);
        return false;
    }

    if (entity.type === TYPES.ITEM) {
        log(`Picked up ${entity.item.symbol} ${entity.item.name}.`, 'loot');
        applyItemEffect(entity.item, { allowStatUpgrades: false });
        removeEntity(entity.id);
        return true;
    }

    if (entity.type === TYPES.CHEST) {
        log(`Opened chest: Found ${entity.item.symbol} ${entity.item.name}!`, 'loot');
        gameState.score += 50;
        applyItemEffect(entity.item);
        removeEntity(entity.id);
        return true;
    }

    if (entity.type === TYPES.STAIRS) {
        log(`Descending to floor ${gameState.floor + 1}...`, 'sys');
        gameState.floor++;
        gameState.score += 100 * gameState.floor;
        startFloor();
        return false;
    }

    return true;
}

function movePlayer(dx, dy) {
    if (!gameState.isPlaying) {
        return;
    }

    const newX = gameState.player.x + dx;
    const newY = gameState.player.y + dy;

    if (!isWalkableTile(newX, newY)) {
        return;
    }

    const entity = getEntityAt(newX, newY);
    const canMove = entity ? interact(entity) : true;

    if (canMove) {
        gameState.player.x = newX;
        gameState.player.y = newY;
    }

    if (gameState.isPlaying) {
        enemiesTurn();
    }

    computeFOV();
    renderWithEffects();
}

function getEnemyMove(entity) {
    const dx = gameState.player.x - entity.x;
    const dy = gameState.player.y - entity.y;

    if (Math.abs(dx) > Math.abs(dy)) {
        return { x: dx > 0 ? 1 : -1, y: 0 };
    }

    return { x: 0, y: dy > 0 ? 1 : -1 };
}

function enemiesTurn() {
    gameState.entities.forEach((entity) => {
        if (entity.type !== TYPES.ENEMY || entity.hp <= 0) {
            return;
        }

        const dx = gameState.player.x - entity.x;
        const dy = gameState.player.y - entity.y;
        const dist = Math.abs(dx) + Math.abs(dy);

        if (dist === 1) {
            attack(entity, gameState.player, false);
            return;
        }

        if (dist >= 5 || !gameState.map[entity.y][entity.x].visible) {
            return;
        }

        const move = getEnemyMove(entity);
        const newX = entity.x + move.x;
        const newY = entity.y + move.y;

        if (isValidEnemyMove(newX, newY)) {
            entity.x = newX;
            entity.y = newY;
        }
    });
}

function gameOver() {
    gameState.isPlaying = false;
    log("You have died...", 'combat');
    showGameOver();
}

function resetGame() {
    resetRunState();
    clearLog();
    hideGameOver();
    log("Welcome to Dungeon Explorer!", 'sys');
    startFloor();
}

function startFloor() {
    createMap();
    computeFOV();
    renderWithEffects();

    if (gameState.floor > 1 && gameState.player.hp < gameState.player.maxHp) {
        const heal = Math.floor(gameState.player.maxHp * 0.2);
        gameState.player.hp = Math.min(gameState.player.maxHp, gameState.player.hp + heal);
        log(`Rested briefly. Recovered ${heal} HP.`, 'normal');
    }

    updateUI();
}

function getVisibleEntities() {
    return gameState.entities
        .filter((entity) => gameState.map[entity.y]?.[entity.x]?.visible)
        .map((entity) => ({
            type: entity.type,
            name: entity.name ?? entity.item?.name ?? '',
            x: entity.x,
            y: entity.y,
            hp: entity.hp,
        }));
}

function renderGameToText() {
    return JSON.stringify({
        mode: gameState.isPlaying ? 'playing' : 'game-over',
        coordinateSystem: 'origin top-left; x increases right; y increases down',
        floor: gameState.floor,
        score: gameState.score,
        camera: getCameraBounds(),
        player: {
            x: gameState.player.x,
            y: gameState.player.y,
            hp: gameState.player.hp,
            maxHp: gameState.player.maxHp,
            level: gameState.player.level,
            xp: gameState.player.xp,
            nextXp: gameState.player.nextXp,
            atk: gameState.player.atk,
            def: gameState.player.def,
        },
        visibleEntities: getVisibleEntities(),
    });
}

function advanceTime() {
    return renderGameToText();
}

function exposeTestHooks() {
    window.render_game_to_text = renderGameToText;
    window.advanceTime = advanceTime;
    window.dungeonGame = {
        movePlayer,
        resetGame,
        getState: () => gameState,
    };
}

function bootstrap() {
    bindUiEvents();
    bindInputHandlers({
        movePlayer,
        resetGame,
        controls: dom.controls,
        restartButton: dom.restartButton,
    });
    exposeTestHooks();
    resetGame();

    setTimeout(() => {
        showMessage("Welcome", "Explore the dungeon, defeat enemies, and find the stairs to go deeper.<br><br>Move: WASD or Arrow Keys.<br>Bump into enemies to attack.<br>Walk over items to pick them up.");
    }, 500);
}

bootstrap();
