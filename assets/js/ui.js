import { gameState } from './state.js';

export const dom = {
    board: document.getElementById('game-board'),
    logContainer: document.getElementById('log-container'),
    messageModal: document.getElementById('msg-modal'),
    messageTitle: document.getElementById('msg-title'),
    messageContent: document.getElementById('msg-content'),
    messageCloseButton: document.getElementById('msg-close-btn'),
    gameOverModal: document.getElementById('game-over-modal'),
    restartButton: document.getElementById('restart-btn'),
    endFloor: document.getElementById('end-floor'),
    endLevel: document.getElementById('end-level'),
    endScore: document.getElementById('end-score'),
    uiLevel: document.getElementById('ui-level'),
    uiFloor: document.getElementById('ui-floor'),
    uiScore: document.getElementById('ui-score'),
    uiAtk: document.getElementById('ui-atk'),
    uiDef: document.getElementById('ui-def'),
    hpBar: document.getElementById('hp-bar'),
    hpText: document.getElementById('hp-text'),
    xpBar: document.getElementById('xp-bar'),
    xpText: document.getElementById('xp-text'),
    controls: {
        up: document.getElementById('btn-up'),
        down: document.getElementById('btn-down'),
        left: document.getElementById('btn-left'),
        right: document.getElementById('btn-right'),
    },
};

const LOG_TYPE_CLASSES = {
    combat: 'log-combat',
    loot: 'log-loot',
    sys: 'log-sys',
    level: 'log-level',
};

export function bindUiEvents() {
    dom.messageCloseButton.addEventListener('click', hideMessage);
}

export function log(message, type = 'normal') {
    const entry = document.createElement('div');
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const colorClass = LOG_TYPE_CLASSES[type] ?? '';

    entry.className = 'log-entry';
    entry.innerHTML = `<span class="mr-1" style="color: #5c7e88;">[${timeStr}]</span> <span class="${colorClass}">${message}</span>`;

    dom.logContainer.appendChild(entry);
    dom.logContainer.scrollTop = dom.logContainer.scrollHeight;

    if (dom.logContainer.children.length > 50) {
        dom.logContainer.removeChild(dom.logContainer.firstChild);
    }
}

export function clearLog() {
    dom.logContainer.innerHTML = '';
}

export function updateUI() {
    dom.uiLevel.innerText = gameState.player.level;
    dom.uiFloor.innerText = gameState.floor;
    dom.uiScore.innerText = gameState.score;
    dom.uiAtk.innerText = gameState.player.atk;
    dom.uiDef.innerText = gameState.player.def;

    const hpPercent = Math.max(0, (gameState.player.hp / gameState.player.maxHp) * 100);
    dom.hpBar.style.width = `${hpPercent}%`;
    dom.hpBar.style.backgroundColor = hpPercent < 25 ? '#9b2c2c' : '#e53e3e';
    dom.hpText.innerText = `${gameState.player.hp} / ${gameState.player.maxHp}`;

    const xpPercent = Math.min(100, (gameState.player.xp / gameState.player.nextXp) * 100);
    dom.xpBar.style.width = `${xpPercent}%`;
    dom.xpText.innerText = `${gameState.player.xp} / ${gameState.player.nextXp}`;
}

export function pulseXpBar() {
    dom.xpBar.classList.remove('xp-gain-effect');
    dom.xpText.classList.remove('xp-text-gain-effect');

    void dom.xpBar.offsetWidth;

    dom.xpBar.classList.add('xp-gain-effect');
    dom.xpText.classList.add('xp-text-gain-effect');

    setTimeout(() => {
        dom.xpBar.classList.remove('xp-gain-effect');
        dom.xpText.classList.remove('xp-text-gain-effect');
    }, 650);
}

export function showMessage(title, content) {
    dom.messageTitle.innerText = title;
    dom.messageContent.innerHTML = content;
    dom.messageModal.classList.remove('hidden');
}

export function hideMessage() {
    dom.messageModal.classList.add('hidden');
}

export function showGameOver() {
    dom.endFloor.innerText = gameState.floor;
    dom.endLevel.innerText = gameState.player.level;
    dom.endScore.innerText = gameState.score;
    dom.gameOverModal.classList.remove('hidden');
}

export function hideGameOver() {
    dom.gameOverModal.classList.add('hidden');
}
