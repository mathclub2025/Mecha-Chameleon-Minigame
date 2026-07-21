// Main entry point for Mecha Chameleon minigame
import * as THREE from 'three';
import { CONFIG } from './config.js';
import { Environment } from './environment.js';
import { Player } from './player.js';
import { UIManager } from './ui.js';
import { GameManager } from './gameManager.js';
import { CharacterFactory } from './characters.js';

class GameApp {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.lastTime = performance.now();
        this.startTime = performance.now();
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.environment = null;
        this.player = null;
        this.ui = null;
        this.gameManager = null;

        this.init();
    }

    // Bootstrap game engine
    init() {
        // 1. Create Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xd0e8ff); // Bright blue daytime sky!
        this.scene.fog = new THREE.FogExp2(0xd0e8ff, 0.007); // Light daytime fog for visibility

        // 2. Create Camera
        this.camera = new THREE.PerspectiveCamera(
            CONFIG.fov,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );

        // 3. Create WebGL Renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: false,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit to 2 for perf
        
        // Shadow mappings (Optimized PCF for butter-smooth frame rates)
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFShadowMap;
        
        // Tone mapping for rich neon lighting effects
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;

        // 4. Instantiate UI
        this.ui = new UIManager();

        // 5. Instantiate Environment (procedural room)
        this.environment = new Environment(this.scene);

        // 6. Instantiate Player Controller
        this.player = new THREE.Group(); // Player wrapper mesh
        this.player = new Player(this.camera, this.canvas, this.scene);

        // 7. Instantiate GameManager State Machine
        this.gameManager = new GameManager(this.scene, this.camera, this.player, this.ui, this.environment);

        // Handle Resizing
        window.addEventListener('resize', () => this.onWindowResize());

        // Start animation frame loop
        this.animate();
    }

    // Resize camera projection and canvas context
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    // Main animation loop
    animate() {
        requestAnimationFrame(() => this.animate());

        const now = performance.now();
        const delta = Math.min(0.1, (now - this.lastTime) / 1000); // Cap delta to avoid physics pops
        this.lastTime = now;
        const elapsed = (now - this.startTime) / 1000;

        // Update player movement and interactions if in playing state
        // Update player movement and interactions if in playing state
        if (this.gameManager.state === 'PLAYING') {
            this.player.update(delta, this.environment);
        }

        // Update environment animations (like spinning ceiling fans!)
        if (this.environment && this.environment.update) {
            this.environment.update(delta);
        }

        // Update game state manager loops (time, cinematic camera, camo shimmer)
        this.gameManager.update(delta, elapsed);

        // Render scene
        this.renderer.render(this.scene, this.camera);
    }
}

// Start screen 3D target preview setup
// Start screen 3D target preview setup (Vertical 4-symbol side panels on Left & Right)
class StartScreenPreview {
    constructor() {
        this.setupSideCanvas('preview-canvas-left', ["∞", "κ", "θ", "Σ"]);
        this.setupSideCanvas('preview-canvas-right', ["π", "Δ", "Ω", "λ"]);
    }

    setupSideCanvas(canvasId, symbols) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const scene = new THREE.Scene();
        scene.background = null;

        const width = canvas.clientWidth || 130;
        const height = canvas.clientHeight || 400;
        const aspect = width / height;
        const frustumHeight = 4.0;
        const frustumWidth = frustumHeight * aspect;

        // Orthographic camera matching exact container aspect ratio
        const camera = new THREE.OrthographicCamera(
            -frustumWidth / 2,
            frustumWidth / 2,
            frustumHeight / 2,
            -frustumHeight / 2,
            0.1,
            100
        );
        camera.position.set(0, 0, 5);

        const renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            alpha: true
        });
        // Pass false for 3rd parameter so Three.js does NOT overwrite CSS width/height
        renderer.setSize(width, height, false);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        const ambient = new THREE.AmbientLight(0xffffff, 0.85);
        scene.add(ambient);

        const dirLight = new THREE.DirectionalLight(0xffffff, 0.65);
        dirLight.position.set(2, 5, 3);
        scene.add(dirLight);

        const symbolMat = new THREE.MeshStandardMaterial({
            color: 0x00f2fe,
            emissive: 0x00f2fe,
            emissiveIntensity: 0.35,
            roughness: 0.2,
            metalness: 0.5
        });

        const models = [];
        const yPositions = [1.52, 0.52, -0.48, -1.48];

        symbols.forEach((sym, idx) => {
            const mesh = CharacterFactory.createMathSymbol(sym, symbolMat);
            mesh.position.set(0, yPositions[idx], 0);
            mesh.scale.setScalar(0.42); // Clean scale fitting above each slot's label pill
            scene.add(mesh);
            models.push(mesh);
        });

        const resize = () => {
            if (canvas && canvas.clientWidth > 0) {
                const w = canvas.clientWidth;
                const h = canvas.clientHeight;
                const asp = w / h;
                const fW = frustumHeight * asp;
                camera.left = -fW / 2;
                camera.right = fW / 2;
                camera.updateProjectionMatrix();
                renderer.setSize(w, h, false);
            }
        };
        window.addEventListener('resize', resize);

        const animate = () => {
            requestAnimationFrame(animate);
            models.forEach(model => {
                model.rotation.y += 0.018;
            });
            renderer.render(scene, camera);
        };

        animate();
    }
}

// Start app immediately (since ES6 modules are deferred and execute after DOM parsing is complete)
new GameApp();
new StartScreenPreview();

