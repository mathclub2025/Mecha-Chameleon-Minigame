// Game Manager (Finite State Machine, Scoring, End Camera Reveal, Highlights)
import * as THREE from 'three';
import { CONFIG, SPAWN_POINTS, MATHEMATICAL_SAGES } from './config.js';
import { CharacterFactory } from './characters.js';
import { CamouflageManager } from './camouflage.js';
import { audioManager } from './audio.js';
import { saveScore, getTopScores, getLeaderboardData, exportRecordsToCSV } from './firebaseService.js';

export class GameManager {
    constructor(scene, camera, player, ui, environment) {
        this.scene = scene;
        this.camera = camera;
        this.player = player;
        this.ui = ui;
        this.environment = environment;

        // FSM states: 'LOADING' | 'INTRO' | 'PLAYING' | 'END_REVEAL' | 'RESULTS'
        this.state = 'LOADING';

        // Player registration details
        this.playerName = "Agent";
        this.playerNumber = "";

        // Gameplay state variables
        this.spawnedTargets = []; // Chameleons
        this.chameleonsRemaining = CONFIG.chameleonsToSpawn;
        this.timeRemaining = CONFIG.gameDuration;
        this.score = 0;

        // Click tracking for accuracy
        this.correctClicks = 0;
        this.wrongClicks = 0;

        // Transition animation variables
        this.endRevealTimer = 0;
        this.endRevealDuration = 5.0; // 5 seconds of cinematic camera fly-up
        this.startCamPos = new THREE.Vector3();
        this.startLookTarget = new THREE.Vector3();
        this.currentLookTarget = new THREE.Vector3();
        this.highlightRings = []; // Mesh rings for reveal animations

        // Setup player callbacks
        this.player.onTargetDetected = (target) => this.handleTargetFound(target);
        this.player.onWrongClick = () => this.handleWrongClick();

        // Make global reference so player/ui can communicate
        window.currentGameManager = this;
        
        // Initial state
        this.init();
    }

    // Launch title screen
    init() {
        this.state = 'INTRO';
        this.ui.showScreen('start');
        
        // Setup start buttons (Validate player inputs before initializing)
        document.getElementById('btn-start').addEventListener('click', () => {
            const playerDetails = this.ui.getPlayerInputs();
            if (!playerDetails) return; // Name is required!

            this.playerName = playerDetails.name;
            this.playerNumber = playerDetails.number;

            this.player.lock();
            this.startLoading();
        });

        document.getElementById('btn-restart').addEventListener('click', () => {
            this.ui.clearFormInputs();
            this.ui.showScreen('start');
            this.state = 'INTRO';
        });

        document.getElementById('btn-show-results').addEventListener('click', () => {
            this.startZoomOutTransition();
        });

        // Main Menu Leaderboard Modal handlers
        const btnOpenLb = document.getElementById('btn-open-leaderboard');
        const btnCloseLb = document.getElementById('btn-close-leaderboard');
        const btnModalCloseBottom = document.getElementById('btn-modal-close-bottom');

        if (btnOpenLb) {
            btnOpenLb.addEventListener('click', async () => {
                this.ui.toggleLeaderboardModal(true);
                if (this.ui.modalLeaderboardRows) {
                    this.ui.modalLeaderboardRows.innerHTML = `<tr><td colspan="5" class="lb-loading">Loading top scores...</td></tr>`;
                }
                try {
                    const topScores = await getTopScores(10);
                    this.ui.renderLeaderboard(topScores, this.playerName, null, this.ui.modalLeaderboardRows);
                } catch (err) {
                    console.error("Leaderboard modal fetch error:", err);
                    this.ui.renderLeaderboard([], this.playerName, null, this.ui.modalLeaderboardRows);
                }
            });
        }

        if (btnCloseLb) {
            btnCloseLb.addEventListener('click', () => {
                this.ui.toggleLeaderboardModal(false);
            });
        }

        if (btnModalCloseBottom) {
            btnModalCloseBottom.addEventListener('click', () => {
                this.ui.toggleLeaderboardModal(false);
            });
        }

        const btnExportCsv = document.getElementById('btn-export-csv');
        if (btnExportCsv) {
            btnExportCsv.addEventListener('click', () => {
                exportRecordsToCSV();
            });
        }
    }

    // Enter simulated loading phase
    startLoading() {
        this.state = 'LOADING';
        this.ui.clearConsole();
        this.ui.showScreen('loading');
        
        // Reset old meshes
        this.cleanupGameMeshes();

        let progress = 0;
        const interval = setInterval(() => {
            progress += 10;
            
            let message = null;
            if (progress === 20) message = "Generating 3D laboratory grid";
            if (progress === 40) message = "Spawning structural furniture bounding boxes";
            if (progress === 60) message = "Selecting randomized camouflage coordinates";
            if (progress === 80) message = "Initializing optical blending matrices";
            if (progress === 100) message = "Synchronizing neural sensory systems";

            this.ui.updateLoading(progress, message);

            if (progress >= 100) {
                clearInterval(interval);
                setTimeout(() => {
                    this.startGame();
                }, 400);
            }
        }, 120);
    }

    // Cleanup old targets and highlight rings
    cleanupGameMeshes() {
        audioManager.stopBGM(); // Stop background music on restart/cleanup
        
        this.spawnedTargets.forEach(target => {
            this.scene.remove(target);
        });
        this.spawnedTargets = [];

        this.highlightRings.forEach(ring => {
            this.scene.remove(ring);
        });
        this.highlightRings = [];
    }

    // Pick 5 spots for Chameleons and 1 spot for Sage without replacement
    startGame() {
        // Initialize audio (context resume)
        audioManager.init();

        this.state = 'PLAYING';
        this.chameleonsRemaining = CONFIG.chameleonsToSpawn;
        this.timeRemaining = CONFIG.gameDuration;
        this.score = 0;
        this.correctClicks = 0;
        this.wrongClicks = 0;

        // Reset player placement
        this.player.reset();

        // 1. Spawning selection by Category (guarantee blackboard, cupboard, table, furniture, floor, ceiling)
        const targetCount = CONFIG.chameleonsToSpawn; // 8
        const categories = ["blackboard", "cupboard", "table", "furniture", "floor", "ceiling"];
        const chosenSpots = [];

        // First pass: pick 1 spot from each of the 6 key categories (guarantees chalkboard & cupboard doors!)
        categories.forEach(cat => {
            const catSpots = SPAWN_POINTS.filter(spot => spot.category === cat);
            const shuffledCatSpots = catSpots.sort(() => Math.random() - 0.5);
            if (shuffledCatSpots.length > 0) {
                chosenSpots.push(shuffledCatSpots[0]);
            }
        });

        // Second pass: fill remaining spots up to targetCount (8) from non-wall remaining spots
        const remainingSpots = SPAWN_POINTS
            .filter(s => !chosenSpots.includes(s) && s.category !== "wall")
            .sort(() => Math.random() - 0.5);

        for (let i = 0; i < remainingSpots.length && chosenSpots.length < targetCount; i++) {
            const spot = remainingSpots[i];
            let farEnough = true;
            for (let j = 0; j < chosenSpots.length; j++) {
                const chosen = chosenSpots[j];
                const dx = spot.position.x - chosen.position.x;
                const dy = spot.position.y - chosen.position.y;
                const dz = spot.position.z - chosen.position.z;
                if (Math.sqrt(dx*dx + dy*dy + dz*dz) < 2.5) {
                    farEnough = false;
                    break;
                }
            }
            if (farEnough || i === remainingSpots.length - 1) {
                chosenSpots.push(spot);
            }
        }

        // Pick chameleon spots from chosen list
        const chameleonSpots = chosenSpots;

        // 2. Spawn 8 Chameleons (assign 8 unique mathematical symbols: ∞, κ, θ, Σ, π, Δ, Ω, λ)
        const symbolsList = ["∞", "κ", "θ", "Σ", "π", "Δ", "Ω", "λ"].sort(() => Math.random() - 0.5);
        chameleonSpots.forEach((spot, idx) => {
            const symbol = symbolsList[idx % symbolsList.length];
            const cham = CharacterFactory.createChameleon(symbol);
            cham.position.set(spot.position.x, spot.position.y, spot.position.z);
            cham.rotation.set(spot.rotation.x, spot.rotation.y, spot.rotation.z);
            // Realistic natural target scale factor (0.95) for challenging camouflaged search
            cham.scale.setScalar(spot.scale * 0.95);
            
            // Camouflage it based on its spot properties
            CamouflageManager.applyCamouflage(cham, spot, this.environment.materials);
            
            // Store coordinates for reveal rings later
            cham.userData.spawnPointInfo = spot;
            cham.userData.found = false;

            this.scene.add(cham);
            this.spawnedTargets.push(cham);
        });

        // Lock mouse pointer for play
        this.player.lock();

        // Start synthesized classroom puzzle BGM loop exactly when countdown starts
        audioManager.startBGM();

        // Update UI HUD
        this.ui.showScreen('hud');
        this.ui.updateHUD(0, CONFIG.chameleonsToSpawn, this.timeRemaining, this.score);
        this.ui.triggerAlert("SIMULATION COMMENCED. SEARCH THE CLASSROOM.", "success");
    }

    // Handle Raycast Target hit callback
    handleTargetFound(target) {
        if (this.state !== 'PLAYING') return;

        target.userData.found = true;
        this.correctClicks++;

        if (target.name === 'chameleon') {
            this.chameleonsRemaining--;
            this.score += CONFIG.foundChameleonScore;
            
            // Visual reveal animation
            CamouflageManager.revealCharacter(target);
            
            // SFX Found
            audioManager.playTargetFound();
            
            this.ui.triggerAlert("MATH SYMBOL DETECTED! (+100 PTS)", "success");
        }

        // Verify Win Condition
        if (this.chameleonsRemaining === 0) {
            this.endGame(true);
        } else {
            this.ui.updateHUD(
                CONFIG.chameleonsToSpawn - this.chameleonsRemaining, 
                CONFIG.chameleonsToSpawn, 
                this.timeRemaining, 
                this.score
            );
        }
    }

    // Handle Raycast click misses
    handleWrongClick() {
        if (this.state !== 'PLAYING') return;

        this.wrongClicks++;
        this.score = Math.max(0, this.score - CONFIG.wrongClickPenalty);
        
        // Play error buzz
        audioManager.playErrorBuzz();
        
        // CSS red screen flash overlay
        this.ui.flashRedScreen();
        
        this.ui.triggerAlert("BLANK SURFACE DETECTED", "error");
        
        this.ui.updateHUD(
            CONFIG.chameleonsToSpawn - this.chameleonsRemaining, 
            CONFIG.chameleonsToSpawn, 
            this.timeRemaining, 
            this.score
        );
    }

    // Trigger Win or Lose transitions
    endGame(isWin) {
        this.state = 'POST_GAME';
        
        // Stop background music loop immediately
        audioManager.stopBGM();

        // Play matching ending audio fanfare
        if (isWin) {
            audioManager.playVictoryMusic();
        } else {
            // Apply missed penalties
            const missedCount = this.chameleonsRemaining;
            this.score = Math.max(0, this.score - (missedCount * CONFIG.missedPenalty));
            audioManager.playDefeatMusic();
        }

        // Show post-game free roam overlay instructions
        this.ui.showPostGameOverlay(true);
        this.ui.triggerAlert(isWin ? "SIMULATION COMPLETE! DATA RECOVERED." : "TIME EXPIRED! INSPECT MISSED TARGETS.", isWin ? "success" : "error");

        // Instantiate glowing highlight rings around all target locations
        this.spawnedTargets.forEach(target => {
            const spot = target.userData.spawnPointInfo;
            const isTargetFound = target.userData.found;

            // Select color: neon green for found, blinking bright red for missed
            const ringColor = isTargetFound ? 0x39ff14 : 0xff073a;

            const ringGroup = new THREE.Group();
            // For ceiling spots, push indicator ring downwards so it hangs and is visible.
            const ringY = spot.position.y > 6.0 ? spot.position.y - 0.4 : spot.position.y + 0.1;
            ringGroup.position.set(spot.position.x, ringY, spot.position.z);
            
            // Build thin flat glowing double-sided Torus ring
            const torusGeo = new THREE.TorusGeometry(0.8, 0.08, 8, 24);
            torusGeo.rotateX(Math.PI / 2); // Flat horizontal on floor
            const torusMat = new THREE.MeshBasicMaterial({
                color: ringColor,
                side: THREE.DoubleSide
            });
            const torusMesh = new THREE.Mesh(torusGeo, torusMat);
            ringGroup.add(torusMesh);

            // Add indicator line pointing up
            const lineGeo = new THREE.CylinderGeometry(0.02, 0.02, 1.2, 4);
            lineGeo.translate(0, 0.6, 0);
            const lineMesh = new THREE.Mesh(lineGeo, torusMat);
            ringGroup.add(lineMesh);

            // Keep reference to animate scale pulse
            ringGroup.userData = { isFound: isTargetFound };
            this.scene.add(ringGroup);
            this.highlightRings.push(ringGroup);

            // CRITICAL UPDATE: Missed targets do NOT reveal their materials anymore!
            // They remain fully camouflaged so that walking around allows inspection of how they blended.
        });
    }

    // Frame update state loop
    update(delta, elapsed) {
        if (this.state === 'PLAYING') {
            // Count down timer
            const oldSec = Math.floor(this.timeRemaining);
            this.timeRemaining -= delta;
            const newSec = Math.floor(this.timeRemaining);
            
            // Play ticking sound warning on whole seconds during last 10s
            if (this.timeRemaining <= 10.0 && oldSec !== newSec) {
                audioManager.playTick(this.timeRemaining <= 5.0);
            }

            // Lose trigger
            if (this.timeRemaining <= 0) {
                this.timeRemaining = 0;
                this.endGame(false);
            }

            // Update UI HUD
            this.ui.updateHUD(
                CONFIG.chameleonsToSpawn - this.chameleonsRemaining, 
                CONFIG.chameleonsToSpawn, 
                this.timeRemaining, 
                this.score
            );

            // Animate target characters
            CharacterFactory.animateCharacters(this.spawnedTargets, delta, elapsed);
            
            // Update camouflage shimmer
            CamouflageManager.updateCamoEffects(this.spawnedTargets, elapsed);

        } else if (this.state === 'POST_GAME') {
            // Keep player walking and looking around during free roam
            this.player.update(delta, this.environment);

            // Pulse Highlight Rings
            this.highlightRings.forEach(ring => {
                const pulse = 1.0 + 0.15 * Math.sin(elapsed * 6.0);
                ring.scale.set(pulse, 1.0, pulse);
            });

        } else if (this.state === 'END_REVEAL') {
            this.endRevealTimer += delta;

            if (this.endRevealTimer < this.totalMissedRevealDuration) {
                // Phase A: Fly to each missed target one by one (Skipped now in free roam show results)
                const idx = Math.floor(this.endRevealTimer / this.missedTargetDuration);
                const tLocal = (this.endRevealTimer % this.missedTargetDuration) / this.missedTargetDuration;

                if (idx !== this.lastRevealIndex) {
                    this.lastRevealIndex = idx;
                    this.revealStartCamPos.copy(this.camera.position);
                    this.revealStartLookTarget.copy(this.currentLookTarget);
                }

                const missedTarget = this.missedTargetsList[idx];
                const view = this.getTargetCameraView(missedTarget);

                const flyRatio = Math.min(1.0, tLocal / 0.45);
                const ease = flyRatio * flyRatio * (3 - 2 * flyRatio);

                this.camera.position.lerpVectors(this.revealStartCamPos, view.camPos, ease);
                this.currentLookTarget.lerpVectors(this.revealStartLookTarget, view.lookTarget, ease);
                this.camera.lookAt(this.currentLookTarget);
            } else {
                // Phase B: Zoom Out to overview
                const tZoom = Math.min(1.0, (this.endRevealTimer - this.totalMissedRevealDuration) / this.zoomOutDuration);
                const ease = tZoom * tZoom * (3 - 2 * tZoom);

                if (this.lastRevealIndex !== 999) {
                    this.lastRevealIndex = 999;
                    this.revealStartCamPos.copy(this.camera.position);
                    this.revealStartLookTarget.copy(this.currentLookTarget);
                }

                // Final camera position: overhead overview looking down at desks
                const finalCamPos = new THREE.Vector3(0, 17.5, 11.5);
                const finalLookTarget = new THREE.Vector3(0, 1.0, -1.0);

                this.camera.position.lerpVectors(this.revealStartCamPos, finalCamPos, ease);
                this.currentLookTarget.lerpVectors(this.revealStartLookTarget, finalLookTarget, ease);
                this.camera.lookAt(this.currentLookTarget);

                if (tZoom >= 1.0) {
                    this.showResults();
                }
            }

            // 2. Pulse Highlight Rings
            this.highlightRings.forEach(ring => {
                const pulse = 1.0 + 0.15 * Math.sin(elapsed * 6.0);
                ring.scale.set(pulse, 1.0, pulse);
            });
        }
    }

    // Transition to Results state dashboard & sync score with Firebase Leaderboard
    async showResults() {
        this.state = 'RESULTS';
        
        // Calculate accuracy and time taken
        const totalClicks = this.correctClicks + this.wrongClicks;
        const accuracy = totalClicks > 0 ? (this.correctClicks / totalClicks) : 0;
        const timeTaken = Math.max(0, CONFIG.gameDuration - this.timeRemaining);

        // Apply time bonus if win
        const isWin = this.chameleonsRemaining === 0;
        const timeBonus = isWin ? Math.floor(this.timeRemaining) * CONFIG.timeScoreMultiplier : 0;
        this.score += timeBonus;

        const foundCount = CONFIG.chameleonsToSpawn - this.chameleonsRemaining;

        // Show UI results overlay with player details
        this.ui.populateResults(
            isWin, 
            foundCount, 
            CONFIG.chameleonsToSpawn, 
            accuracy, 
            timeTaken, 
            this.score,
            this.playerName
        );
        this.ui.showScreen('results');

        // Save score to Firebase Firestore / Local Storage
        let savedRecordTimestamp = null;
        try {
            const saveRes = await saveScore({
                name: this.playerName,
                number: this.playerNumber,
                score: this.score,
                found: foundCount,
                total: CONFIG.chameleonsToSpawn,
                accuracy: accuracy,
                timeRemaining: this.timeRemaining,
                timeTaken: timeTaken
            });

            if (saveRes.record) savedRecordTimestamp = saveRes.record.timestamp;

            if (saveRes.isLocal) {
                this.ui.setSyncStatus("Saved score locally (Offline/Fallback mode)", true);
            } else {
                this.ui.setSyncStatus("Score saved to Firebase successfully!", true);
            }
        } catch (err) {
            console.error("Score save error:", err);
            this.ui.setSyncStatus("Error saving to Firebase", false);
        }

        // Fetch Leaderboard Data with Player Rank calculation (Top 10 + 11th row if player ranked 11+)
        try {
            const leaderboardData = await getLeaderboardData({
                limitCount: 10,
                currentPlayerName: this.playerName,
                currentScore: this.score,
                currentTimestamp: savedRecordTimestamp
            });
            this.ui.renderLeaderboard(leaderboardData, this.playerName, this.score, this.ui.leaderboardRows);
            this.ui.renderLeaderboard(leaderboardData, this.playerName, this.score, this.ui.modalLeaderboardRows);
        } catch (err) {
            console.error("Leaderboard fetch error:", err);
            this.ui.renderLeaderboard([], this.playerName, this.score, this.ui.leaderboardRows);
        }
    }

    // Handles the transition from Free Roam inspection to the final overhead zoom-out and results screen
    startZoomOutTransition() {
        this.state = 'END_REVEAL';
        this.endRevealTimer = 0;
        this.zoomOutDuration = 3.0; // 3 seconds zoom animation
        this.totalMissedRevealDuration = 0; // jump directly to Phase B zoom-out

        // Hide overlay and unlock controls
        this.ui.showPostGameOverlay(false);
        this.player.unlock();

        // Establish starting camera vectors from player's current view location
        this.revealStartCamPos = new THREE.Vector3().copy(this.camera.position);
        
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyQuaternion(this.camera.quaternion);
        this.revealStartLookTarget = new THREE.Vector3().copy(this.camera.position).add(forward.multiplyScalar(5));
        this.currentLookTarget.copy(this.revealStartLookTarget);
        
        this.lastRevealIndex = 999; // bypasses Phase A fly-to targeting in update()
    }

    // Helper: Calculates optimal camera view distance and angle looking at a target without geometry clipping
    getTargetCameraView(target) {
        const spot = target.userData.spawnPointInfo;
        const targetPos = new THREE.Vector3(spot.position.x, spot.position.y, spot.position.z);
        const lookTarget = targetPos.clone();
        
        let camPos = new THREE.Vector3();
        if (spot.position.y > 6.0) {
            // Ceiling spots: look up from below
            camPos.set(spot.position.x, spot.position.y - 2.8, spot.position.z + 0.05);
        } else {
            // Floor/Wall/Table spots: position camera 2.8 meters away towards center of room
            const sx = spot.position.x;
            const sz = spot.position.z;
            const len = Math.sqrt(sx * sx + sz * sz);
            const dx = len > 0.1 ? -sx / len : 0;
            const dz = len > 0.1 ? -sz / len : -1;
            camPos.set(sx + dx * 2.8, spot.position.y + 1.2, sz + dz * 2.8);
        }
        return { camPos, lookTarget };
    }
}
export default GameManager;
