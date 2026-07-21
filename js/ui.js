// UI Overlay Manager (HUD Updates, Screen Transitions, Text Animations)

export class UIManager {
    constructor() {
        // Screens
        this.startScreen = document.getElementById('screen-start');
        this.loadingScreen = document.getElementById('screen-loading');
        this.hud = document.getElementById('hud');
        this.resultsScreen = document.getElementById('screen-results');
        this.postGameOverlay = document.getElementById('post-game-overlay');
        
        // HUD elements
        this.foundText = document.getElementById('hud-found');
        this.timerText = document.getElementById('hud-timer');
        this.scoreText = document.getElementById('hud-score');
        this.alertBox = document.getElementById('hud-alert');
        this.alertText = document.getElementById('hud-alert-text');
        
        // Form & Input elements
        this.inputName = document.getElementById('input-player-name');
        this.inputNumber = document.getElementById('input-player-number');
        this.formError = document.getElementById('start-form-error');

        // Results elements
        this.resPlayerName = document.getElementById('res-player-name');
        this.resHeadline = document.getElementById('results-headline');
        this.resStatus = document.getElementById('results-status');
        this.resFound = document.getElementById('res-found');
        this.resAccuracy = document.getElementById('res-accuracy');
        this.resTime = document.getElementById('res-time');
        this.resScore = document.getElementById('res-score');
        this.syncStatus = document.getElementById('sync-status');
        this.leaderboardRows = document.getElementById('leaderboard-rows');
        
        // Modal Leaderboard elements
        this.modalLeaderboard = document.getElementById('modal-leaderboard');
        this.modalLeaderboardRows = document.getElementById('modal-leaderboard-rows');

        // Loader elements
        this.progressBar = document.getElementById('progress-bar');
        this.consoleLog = document.getElementById('loading-console');
    }

    // Clear input form fields for fresh player registration
    clearFormInputs() {
        if (this.inputName) this.inputName.value = "";
        if (this.inputNumber) this.inputNumber.value = "";
        if (this.formError) this.formError.classList.add('hidden');
        localStorage.removeItem('last_player_name');
    }

    // Toggle Main Menu Leaderboard Modal
    toggleLeaderboardModal(show = true) {
        if (!this.modalLeaderboard) return;
        if (show) {
            this.modalLeaderboard.classList.remove('hidden');
        } else {
            this.modalLeaderboard.classList.add('hidden');
        }
    }

    // Read player inputs (Name optional, defaults to "Agent")
    getPlayerInputs() {
        const name = this.inputName ? this.inputName.value.trim() : "";
        const number = this.inputNumber ? this.inputNumber.value.trim() : "";

        if (this.formError) this.formError.classList.add('hidden');
        return { name: name || "Agent", number: number };
    }

    // Screen Transitions (Fade wrapper using CSS classes)
    showScreen(screenName) {
        // Hide all screens
        this.startScreen.classList.add('hidden');
        this.loadingScreen.classList.add('hidden');
        this.hud.classList.add('hidden');
        this.resultsScreen.classList.add('hidden');
        this.postGameOverlay.classList.add('hidden');

        // Show targeted screen
        if (screenName === 'start') {
            this.startScreen.classList.remove('hidden');
        } else if (screenName === 'loading') {
            this.loadingScreen.classList.remove('hidden');
        } else if (screenName === 'hud') {
            this.hud.classList.remove('hidden');
        } else if (screenName === 'results') {
            this.resultsScreen.classList.remove('hidden');
        }
    }

    // Toggle Post-Game Free Roam Action Button overlay
    showPostGameOverlay(show = true) {
        if (show) {
            this.postGameOverlay.classList.remove('hidden');
        } else {
            this.postGameOverlay.classList.add('hidden');
        }
    }

    // Update Simulated Loading Progress
    updateLoading(progressPercent, logMessage = null) {
        this.progressBar.style.width = `${progressPercent}%`;
        
        if (logMessage) {
            const div = document.createElement('div');
            div.textContent = `> ${logMessage}... OK`;
            this.consoleLog.appendChild(div);
            this.consoleLog.scrollTop = this.consoleLog.scrollHeight;
        }
    }

    // Clear console log
    clearConsole() {
        this.consoleLog.innerHTML = `<div>> Booting systems... OK</div><div>> Initializing physics matrices... OK</div>`;
    }

    // Update Active HUD
    updateHUD(found, total, timeRemaining, score) {
        // Found Count
        this.foundText.textContent = `${found} / ${total}`;

        // Time Counter
        const roundedTime = Math.max(0, timeRemaining).toFixed(1);
        this.timerText.textContent = `${roundedTime}s`;
        
        // Add flashing effect if under 10 seconds
        if (timeRemaining <= 10.0) {
            this.timerText.classList.add('danger');
        } else {
            this.timerText.classList.remove('danger');
        }

        // Score format padding (e.g. 0240)
        const paddedScore = String(Math.max(0, score)).padStart(4, '0');
        this.scoreText.textContent = paddedScore;
    }

    // Trigger floating message alerts in game HUD
    triggerAlert(message, type = 'success') {
        this.alertBox.classList.remove('hidden', 'success', 'error', 'bonus');
        this.alertBox.classList.add(type);
        this.alertText.textContent = message;

        // Force a reflow to restart CSS slide-up animation
        void this.alertBox.offsetWidth;

        // Clear after 2 seconds
        if (this.alertTimeout) clearTimeout(this.alertTimeout);
        this.alertTimeout = setTimeout(() => {
            this.alertBox.classList.add('hidden');
        }, 2200);
    }

    // Dynamic Full Red Screen flash overlay on wrong click penalty
    flashRedScreen() {
        const flash = document.createElement('div');
        flash.style.position = 'absolute';
        flash.style.top = '0';
        flash.style.left = '0';
        flash.style.width = '100%';
        flash.style.height = '100%';
        flash.style.background = 'rgba(255, 7, 58, 0.2)';
        flash.style.zIndex = '3';
        flash.style.pointerEvents = 'none';
        flash.style.transition = 'opacity 0.3s ease';
        document.body.appendChild(flash);

        // Fade out quickly and remove
        setTimeout(() => {
            flash.style.opacity = '0';
            setTimeout(() => flash.remove(), 300);
        }, 100);
    }

    // Populate Results Screen Details
    populateResults(winState, found, total, accuracy, timeTaken, finalScore, playerName = "Agent") {
        if (winState) {
            this.resHeadline.textContent = "SIMULATION COMPLETE";
            this.resHeadline.className = "results-title win";
            this.resStatus.textContent = "ALL TARGETS NEUTRALIZED";
        } else {
            this.resHeadline.textContent = "MISSION FAILURE";
            this.resHeadline.className = "results-title lose";
            this.resStatus.textContent = "SURVEILLANCE AGENTS ESCAPED";
        }

        if (this.resPlayerName) this.resPlayerName.textContent = playerName;
        this.resFound.textContent = `${found} / ${total}`;
        this.resAccuracy.textContent = `${(accuracy * 100).toFixed(0)}%`;
        this.resTime.textContent = `${Math.max(0, timeTaken).toFixed(1)} s`;
        this.resScore.textContent = finalScore;

        if (this.syncStatus) {
            this.syncStatus.textContent = "> Syncing score with Firebase...";
            this.syncStatus.style.color = "var(--neon-gold)";
        }
    }

    // Update Firebase Sync Status Indicator
    setSyncStatus(message, isSuccess = true) {
        if (this.syncStatus) {
            this.syncStatus.textContent = `> ${message}`;
            this.syncStatus.style.color = isSuccess ? "var(--neon-green)" : "var(--neon-red)";
        }
    }

    // Render Leaderboard Table (Displays: Rank, Name, Points, Accuracy, Time)
    renderLeaderboard(scoresList, currentPlayerName = "", currentScore = null, targetElement = null) {
        const rowsElem = targetElement || this.leaderboardRows;
        if (!rowsElem) return;

        if (!scoresList || scoresList.length === 0) {
            rowsElem.innerHTML = `<tr><td colspan="5" class="lb-loading">No scores recorded yet. Be the first!</td></tr>`;
            return;
        }

        let html = '';
        scoresList.forEach((entry, index) => {
            const rank = entry.rank !== undefined ? entry.rank : (index + 1);
            const isCurrent = entry.isCurrentPlayer || (entry.name === currentPlayerName && (currentScore === null || entry.score === currentScore));
            
            let rankBadgeClass = "rank-other";
            if (rank === 1) rankBadgeClass = "rank-1";
            else if (rank === 2) rankBadgeClass = "rank-2";
            else if (rank === 3) rankBadgeClass = "rank-3";

            let rowClasses = [];
            if (isCurrent) rowClasses.push("current-player-row");
            if (entry.isOutsideTop10) rowClasses.push("outside-top10-row");
            const rowClassStr = rowClasses.join(" ");

            const safeName = this.escapeHtml(entry.name || "Agent");
            const scoreFormatted = entry.score;
            const accFormatted = entry.accuracy !== undefined ? `${entry.accuracy}%` : '-';
            const timeFormatted = entry.timeTaken ? `${entry.timeTaken}s` : '-';

            html += `
                <tr class="${rowClassStr}">
                    <td><span class="rank-badge ${rankBadgeClass}">${rank}</span></td>
                    <td class="lb-name">${safeName}${isCurrent ? ' (YOU)' : ''}</td>
                    <td class="lb-score">${scoreFormatted}</td>
                    <td class="lb-acc">${accFormatted}</td>
                    <td class="lb-time">${timeFormatted}</td>
                </tr>
            `;
        });

        rowsElem.innerHTML = html;
    }

    escapeHtml(str) {
        return str.replace(/[&<>"']/g, function(m) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#039;'
            }[m];
        });
    }
}
export default UIManager;

