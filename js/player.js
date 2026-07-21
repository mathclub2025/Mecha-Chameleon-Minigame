// Player Controller (Movement, Camera Look, Collision, Raycast Interaction)
import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { CONFIG } from './config.js';
import { audioManager } from './audio.js';

export class Player {
    constructor(camera, domElement, scene) {
        this.camera = camera;
        this.domElement = domElement;
        this.scene = scene;

        // PointerLock Controls setup
        this.controls = new PointerLockControls(this.camera, this.domElement);
        this.scene.add(this.camera);

        // Initial Position (Center-ish, facing back wall)
        this.camera.position.set(0, CONFIG.playerHeight, 10);

        // Movement variables
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.keys = { forward: false, backward: false, left: false, right: false, shift: false };
        
        // Footstep timing variables
        this.footstepTimer = 0;
        this.footstepInterval = 0.45; // seconds per step

        // Interactive raycaster
        this.raycaster = new THREE.Raycaster();
        
        // Active click cooldown to prevent clicking every frame
        this.clickCooldown = 0;

        // Jump physics states
        this.yVelocity = 0.0;
        this.isGrounded = true;

        // Callback hooks for game events (assigned by GameManager)
        this.onTargetDetected = null; // function(target)
        this.onWrongClick = null;     // function()

        this.setupInput();
    }

    // Bind event listeners for keyboard and mouse
    setupInput() {
        // Keyboard down
        const onKeyDown = (e) => {
            if (!this.isGameplayActive()) return;
            let handled = false;
            switch (e.code) {
                case 'KeyW': case 'ArrowUp': this.keys.forward = true; handled = true; break;
                case 'KeyS': case 'ArrowDown': this.keys.backward = true; handled = true; break;
                case 'KeyA': case 'ArrowLeft': this.keys.left = true; handled = true; break;
                case 'KeyD': case 'ArrowRight': this.keys.right = true; handled = true; break;
                case 'ShiftLeft': case 'ShiftRight': this.keys.shift = true; handled = true; break;
                case 'Space':
                    if (this.isGrounded) {
                        this.yVelocity = 8.5; // High jump impulse to easily clear 1.39m tables
                        this.isGrounded = false;
                    }
                    handled = true;
                    break;
            }
            if (handled) {
                e.preventDefault(); // Stop default browser actions
            }
        };

        const onKeyUp = (e) => {
            if (!this.isGameplayActive()) return;
            let handled = false;
            switch (e.code) {
                case 'KeyW': case 'ArrowUp': this.keys.forward = false; handled = true; break;
                case 'KeyS': case 'ArrowDown': this.keys.backward = false; handled = true; break;
                case 'KeyA': case 'ArrowLeft': this.keys.left = false; handled = true; break;
                case 'KeyD': case 'ArrowRight': this.keys.right = false; handled = true; break;
                case 'ShiftLeft': case 'ShiftRight': this.keys.shift = false; handled = true; break;
                case 'Space': handled = true; break;
            }
            if (handled) {
                e.preventDefault();
            }
        };

        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);

        // Mouse Click Interaction (Cast Ray)
        this.domElement.addEventListener('click', (e) => {
            if (!this.controls.isLocked) {
                // Request lock if not locked
                this.controls.lock();
            } else {
                // Perform scanning raycast click
                this.interact();
            }
        });

        // Pointer Lock events to pause/resume HUD alerts
        const lockPrompt = document.getElementById('pointer-lock-prompt');
        const crosshair = document.getElementById('crosshair');

        if (lockPrompt) {
            lockPrompt.style.cursor = 'pointer';
            lockPrompt.addEventListener('click', (e) => {
                e.stopPropagation();
                if (!this.controls.isLocked && this.isGameplayActive()) {
                    this.controls.lock();
                }
            });
        }

        window.addEventListener('click', () => {
            if (!this.controls.isLocked && this.isGameplayActive()) {
                this.controls.lock();
            }
        });
        
        this.controls.addEventListener('lock', () => {
            if (lockPrompt) lockPrompt.classList.add('hidden');
            if (crosshair) crosshair.classList.remove('hidden');
            audioManager.resume();
        });

        this.controls.addEventListener('unlock', () => {
            // CRITICAL RESET: Reset keyboard states to prevent sticking on focus loss
            this.keys.forward = false;
            this.keys.backward = false;
            this.keys.left = false;
            this.keys.right = false;
            this.keys.shift = false;

            // Only show pause prompt if game is currently in playing state
            if (this.isGameplayActive()) {
                if (lockPrompt) lockPrompt.classList.remove('hidden');
                if (crosshair) crosshair.classList.add('hidden');
            }
        });
    }

    // Set check if playing
    isGameplayActive() {
        if (!window.currentGameManager) return false;
        const state = window.currentGameManager.state;
        return state === 'PLAYING' || state === 'POST_GAME';
    }

    // Lock controls explicitly
    lock() {
        this.controls.lock();
    }

    // Unlock controls explicitly
    unlock() {
        this.controls.unlock();
    }

    // Reset player position for new games
    reset() {
        this.camera.position.set(0, CONFIG.playerHeight, 10);
        this.velocity.set(0, 0, 0);
        this.footstepTimer = 0;
        this.clickCooldown = 0;
        
        // Reset keys
        Object.keys(this.keys).forEach(k => this.keys[k] = false);
    }

    // Frame update physics loop
    update(delta, environment) {
        if (!this.isGameplayActive()) return;

        // Manage click cooldown
        if (this.clickCooldown > 0) {
            this.clickCooldown -= delta;
        }

        const playerObj = this.camera;
        const baseSpeed = CONFIG.playerSpeed;
        const currentSpeed = this.keys.shift ? baseSpeed * CONFIG.playerRunMultiplier : baseSpeed;
        const moveSpeed = currentSpeed * delta;

        // 1. Vertical Y physics (gravity & jumping on top of tables/chairs!) - CALCULATE FIRST
        const groundHeight = this.getStandingSurfaceHeight(environment);
        const minEyeY = groundHeight + CONFIG.playerHeight;

        if (playerObj.position.y > minEyeY || !this.isGrounded) {
            this.isGrounded = false;
            this.yVelocity -= 18.0 * delta; // apply gravity
            playerObj.position.y += this.yVelocity * delta;
            
            // Landing check
            if (playerObj.position.y <= minEyeY) {
                playerObj.position.y = minEyeY;
                this.yVelocity = 0.0;
                this.isGrounded = true;
            }
        } else {
            // Grounded on a surface (floor, table top, or seat)
            playerObj.position.y = minEyeY;
            this.yVelocity = 0.0;
            this.isGrounded = true;
        }

        const prevPosition = playerObj.position.clone();

        // 2. Move X axis (moveRight) and check collision
        let dx = 0;
        if (this.keys.right) dx += moveSpeed;
        if (this.keys.left) dx -= moveSpeed;
        if (dx !== 0) {
            this.controls.moveRight(dx);
            if (environment.checkCollision(playerObj.position, CONFIG.playerRadius)) {
                // Revert if colliding
                playerObj.position.x = prevPosition.x;
                playerObj.position.z = prevPosition.z;
            }
        }

        const midPosition = playerObj.position.clone();

        // 3. Move Z axis (moveForward) and check collision
        let dz = 0;
        if (this.keys.forward) dz += moveSpeed;
        if (this.keys.backward) dz -= moveSpeed;
        if (dz !== 0) {
            this.controls.moveForward(dz);
            if (environment.checkCollision(playerObj.position, CONFIG.playerRadius)) {
                // Revert if colliding
                playerObj.position.x = midPosition.x;
                playerObj.position.z = midPosition.z;
            }
        }

        // Trigger mechanical thud footstep sound effects
        const moving = this.keys.forward || this.keys.backward || this.keys.left || this.keys.right;
        if (moving) {
            this.footstepTimer += delta;
            
            // Adjust footstep frequency: faster when running
            const currentInterval = this.keys.shift ? this.footstepInterval / CONFIG.playerRunMultiplier : this.footstepInterval;
            
            if (this.footstepTimer >= currentInterval) {
                audioManager.playFootstep();
                this.footstepTimer = 0;
            }
        } else {
            this.footstepTimer = 0; // reset
        }
    }

    // Calculate the height of the highest solid surface under the player's feet
    getStandingSurfaceHeight(environment) {
        let maxHeight = 0.0;
        const px = this.camera.position.x;
        const pz = this.camera.position.z;
        const radius = CONFIG.playerRadius; // Check circular footprint range for edge landings
        
        environment.colliders.forEach(box => {
            // Skip vertical wall bounding boxes and ceiling fixtures (height > 3.5m)
            if (box.max.y > 3.5) return;
            
            // Check horizontal overlap between player cylinder and collider Box3 bounds
            const overlapX = (px + radius >= box.min.x) && (px - radius <= box.max.x);
            const overlapZ = (pz + radius >= box.min.z) && (pz - radius <= box.max.z);
            
            if (overlapX && overlapZ) {
                if (box.max.y > maxHeight) {
                    maxHeight = box.max.y;
                }
            }
        });
        
        return maxHeight;
    }

    // Cast interaction ray to detect camouflaged targets
    interact() {
        if (window.currentGameManager && window.currentGameManager.state !== 'PLAYING') return;
        if (this.clickCooldown > 0) return;
        this.clickCooldown = 0.08; // 80ms click cooldown for ultra-fast, responsive clicks

        // Play scanner sound
        audioManager.playScanClick();

        // 1. Raycast from camera center
        this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);

        // Get targets from game manager
        const gameManager = window.currentGameManager;
        if (!gameManager) return;
        
        const targets = gameManager.spawnedTargets;
        let hitDetected = false;

        // 2. Intersect targets
        // We will collect click meshes (interaction helper meshes)
        const checkObjects = [];
        const meshToTargetMap = new Map();

        targets.forEach(target => {
            if (target.userData.found) return; // Skip already found ones
            
            const hitMesh = target.userData.interactionMesh;
            if (hitMesh) {
                checkObjects.push(hitMesh);
                meshToTargetMap.set(hitMesh, target);
            }
        });

        if (checkObjects.length > 0) {
            const intersects = this.raycaster.intersectObjects(checkObjects);

            if (intersects.length > 0) {
                const closestHit = intersects[0];
                
                // 3. Verify interaction distance range
                if (closestHit.distance <= CONFIG.interactionDistance) {
                    const hitMesh = closestHit.object;
                    const matchedTarget = meshToTargetMap.get(hitMesh);

                    if (matchedTarget) {
                        hitDetected = true;
                        if (this.onTargetDetected) {
                            this.onTargetDetected(matchedTarget);
                        }
                    }
                }
            }
        }

        // 4. Trigger penalty if the raycast missed a camouflaged agent
        if (!hitDetected) {
            if (this.onWrongClick) {
                this.onWrongClick();
            }
        }
    }
}
export default Player;
