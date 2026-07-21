// 3D Spacious Classroom Environment Generator
import * as THREE from 'three';
import { CONFIG } from './config.js';

// Static reusable objects for zero-GC collision checking
const _playerBox = new THREE.Box3();
const _minVec = new THREE.Vector3();
const _maxVec = new THREE.Vector3();

export class Environment {
    constructor(scene) {
        this.scene = scene;
        this.colliders = []; // Bounding boxes for collision
        this.materials = {}; // Cache for materials
        this.furnitureGroup = new THREE.Group();
        this.scene.add(this.furnitureGroup);

        this.initMaterials();
        this.buildClassroom();
        this.buildFurniture();
        this.setupLights();
        this.buildOutsideScenery();
        this.buildProps();
    }

    // Initialize bright, warm materials with realistic procedural textures and checkers/grids
    initMaterials() {
        // 1. Floor tile (linoleum checkered tiles with terrazzo stone chips)
        const floorCanvas = document.createElement('canvas');
        floorCanvas.width = 512;
        floorCanvas.height = 512;
        const fctx = floorCanvas.getContext('2d');
        
        // Alternating checkers in 2x2 grid
        // Cream-beige tiles
        fctx.fillStyle = '#eddcb9';
        fctx.fillRect(0, 0, 256, 256);
        fctx.fillRect(256, 256, 256, 256);
        // Slate-blue/teal tiles
        fctx.fillStyle = '#2c525d';
        fctx.fillRect(256, 0, 256, 256);
        fctx.fillRect(0, 256, 256, 256);

        // Add stone terrazzo flecks in tiles for photorealistic depth
        const terrazzoColors = ['#1b3238', '#cf995f', '#ffffff', '#78909c', '#4e3629'];
        for (let i = 0; i < 450; i++) {
            fctx.fillStyle = terrazzoColors[Math.floor(Math.random() * terrazzoColors.length)];
            const size = 1.5 + Math.random() * 3.5;
            fctx.fillRect(Math.random() * 512, Math.random() * 512, size, size);
        }

        // Draw tile grout borders
        fctx.strokeStyle = '#1a3239';
        fctx.lineWidth = 6;
        fctx.strokeRect(0, 0, 512, 512);
        fctx.beginPath();
        fctx.moveTo(256, 0); fctx.lineTo(256, 512);
        fctx.moveTo(0, 256); fctx.lineTo(512, 256);
        fctx.stroke();

        // Add linoleum speckle noise and scuffs
        fctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
        for (let i = 0; i < 1500; i++) {
            fctx.fillRect(Math.random() * 512, Math.random() * 512, 2.5, 2.5);
        }
        fctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
        for (let i = 0; i < 1500; i++) {
            fctx.fillRect(Math.random() * 512, Math.random() * 512, 2.5, 2.5);
        }

        const floorTexture = new THREE.CanvasTexture(floorCanvas);
        floorTexture.wrapS = THREE.RepeatWrapping;
        floorTexture.wrapT = THREE.RepeatWrapping;
        floorTexture.repeat.set(16, 16);

        this.materials.floor = new THREE.MeshStandardMaterial({
            map: floorTexture,
            bumpMap: floorTexture,
            bumpScale: 0.015,
            roughness: 0.42, // semi-gloss linoleum floor reflections
            metalness: 0.02
        });

        // 2. Drywall Wall Texture (school painted beige with high-density fine stipple roughness)
        const wallCanvas = document.createElement('canvas');
        wallCanvas.width = 256;
        wallCanvas.height = 256;
        const wctx = wallCanvas.getContext('2d');
        wctx.fillStyle = '#eddcb9'; // Warm light beige paint
        wctx.fillRect(0, 0, 256, 256);
        
        // Fine paint stipple micro-dots noise pattern
        for (let i = 0; i < 6000; i++) {
            wctx.fillStyle = 'rgba(0, 0, 0, 0.06)';
            wctx.fillRect(Math.random() * 256, Math.random() * 256, 1.0, 1.0);
            wctx.fillStyle = 'rgba(255, 255, 255, 0.10)';
            wctx.fillRect(Math.random() * 256, Math.random() * 256, 1.0, 1.0);
        }

        const wallTexture = new THREE.CanvasTexture(wallCanvas);
        this.materials.wall = new THREE.MeshStandardMaterial({
            map: wallTexture,
            bumpMap: wallTexture,
            bumpScale: 0.012, // Fine paint roller bumps
            roughness: 0.94, // completely matte plaster paint
            metalness: 0.0
        });

        // 3. Ceiling panels (acoustic tiles with light grey grid pattern)
        const ceilingCanvas = document.createElement('canvas');
        ceilingCanvas.width = 256;
        ceilingCanvas.height = 256;
        const cctx = ceilingCanvas.getContext('2d');
        cctx.fillStyle = '#e5ebf0'; // Light grey-blue base
        cctx.fillRect(0, 0, 256, 256);
        cctx.strokeStyle = '#b0bec5'; // Grid lines
        cctx.lineWidth = 4;
        cctx.strokeRect(0, 0, 256, 256);

        // Acoustic tile pinholes noise
        cctx.fillStyle = 'rgba(0, 0, 0, 0.06)';
        for (let i = 0; i < 150; i++) {
            cctx.fillRect(Math.random() * 256, Math.random() * 256, 1.8, 1.8);
        }

        const ceilingTexture = new THREE.CanvasTexture(ceilingCanvas);
        ceilingTexture.wrapS = THREE.RepeatWrapping;
        ceilingTexture.wrapT = THREE.RepeatWrapping;
        ceilingTexture.repeat.set(16, 16);

        this.materials.ceiling = new THREE.MeshStandardMaterial({
            map: ceilingTexture,
            bumpMap: ceilingTexture,
            bumpScale: 0.015, // Realistic acoustic panel tile indent/grid depth!
            roughness: 0.88,
            metalness: 0.02
        });

        // 4. Oak Wood Texture (Procedural Canvas: warm golden oak grain)
        const woodCanvas = document.createElement('canvas');
        woodCanvas.width = 512;
        woodCanvas.height = 512;
        const wdctx = woodCanvas.getContext('2d');
        
        // Base warm golden oak wood
        wdctx.fillStyle = '#d7a15c';
        wdctx.fillRect(0, 0, 512, 512);

        // Draw soft wavy wood grains
        wdctx.strokeStyle = '#bd843c';
        wdctx.lineWidth = 4;
        for (let i = 0; i < 20; i++) {
            wdctx.beginPath();
            let y = i * 25.6;
            wdctx.moveTo(0, y);
            for (let x = 0; x <= 512; x += 30) {
                let wave = Math.sin(x * 0.02 + i) * 15;
                wdctx.lineTo(x, y + wave);
            }
            wdctx.stroke();
        }

        // Draw fine high-density grain fibers
        wdctx.strokeStyle = 'rgba(110, 70, 30, 0.25)';
        wdctx.lineWidth = 1.2;
        for (let i = 0; i < 120; i++) {
            wdctx.beginPath();
            let y = Math.random() * 512;
            wdctx.moveTo(0, y);
            for (let x = 0; x <= 512; x += 40) {
                let wave = Math.sin(x * 0.05 + i) * 6;
                wdctx.lineTo(x, y + wave + (Math.random() * 2 - 1));
            }
            wdctx.stroke();
        }

        const woodTexture = new THREE.CanvasTexture(woodCanvas);
        woodTexture.wrapS = THREE.RepeatWrapping;
        woodTexture.wrapT = THREE.RepeatWrapping;
        woodTexture.repeat.set(1.5, 3.0);

        this.materials.wood = new THREE.MeshStandardMaterial({
            map: woodTexture,
            roughness: 0.65,  // semi-rough desk surface
            metalness: 0.04
        });

        // 5. Dark Mahogany Wood Texture (Procedural Canvas: rich reddish-brown mahogany)
        const darkWoodCanvas = document.createElement('canvas');
        darkWoodCanvas.width = 512;
        darkWoodCanvas.height = 512;
        const dwdctx = darkWoodCanvas.getContext('2d');
        
        // Base rich reddish-brown mahogany
        dwdctx.fillStyle = '#8d4a27';
        dwdctx.fillRect(0, 0, 512, 512);

        // Draw dark grains
        dwdctx.strokeStyle = '#6d3314';
        dwdctx.lineWidth = 5;
        for (let i = 0; i < 20; i++) {
            dwdctx.beginPath();
            let y = i * 25.6;
            dwdctx.moveTo(0, y);
            for (let x = 0; x <= 512; x += 35) {
                let wave = Math.sin(x * 0.025 + i) * 12;
                dwdctx.lineTo(x, y + wave);
            }
            dwdctx.stroke();
        }

        // Fine dark fibers
        dwdctx.strokeStyle = 'rgba(50, 20, 5, 0.35)';
        dwdctx.lineWidth = 1.5;
        for (let i = 0; i < 120; i++) {
            dwdctx.beginPath();
            let y = Math.random() * 512;
            dwdctx.moveTo(0, y);
            for (let x = 0; x <= 512; x += 40) {
                let wave = Math.sin(x * 0.06 + i) * 5;
                dwdctx.lineTo(x, y + wave + (Math.random() * 2 - 1));
            }
            dwdctx.stroke();
        }

        const darkWoodTexture = new THREE.CanvasTexture(darkWoodCanvas);
        darkWoodTexture.wrapS = THREE.RepeatWrapping;
        darkWoodTexture.wrapT = THREE.RepeatWrapping;
        darkWoodTexture.repeat.set(1.5, 3.0);

        this.materials.darkWood = new THREE.MeshStandardMaterial({
            map: darkWoodTexture,
            roughness: 0.58, // slightly polished mahogany
            metalness: 0.05
        });

        // 6. Classroom chair legs/metal framing (brushed slate grey steel)
        this.materials.metal = new THREE.MeshStandardMaterial({
            color: 0x5a5c60,
            roughness: 0.24, // highly reflective steel
            metalness: 0.88  // metallic shine
        });

        // Lighter steel for cabinet doors to prevent black shading
        this.materials.cabinetMetal = new THREE.MeshStandardMaterial({
            color: 0x78909c, // light slate blue-grey steel
            roughness: 0.32,
            metalness: 0.82
        });

        // 7. Student Chair plastic seats
        this.materials.chairPlastic = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.55,
            metalness: 0.05
        });

        // 8. Green Blackboard (matte slate with chalk residue smudges)
        const bbCanvas = document.createElement('canvas');
        bbCanvas.width = 512;
        bbCanvas.height = 512;
        const bbctx = bbCanvas.getContext('2d');
        bbctx.fillStyle = '#1d3a24'; // Slate dark green
        bbctx.fillRect(0, 0, 512, 512);

        // Chalk smudges/erasures ghosts
        for (let i = 0; i < 8; i++) {
            const cx = Math.random() * 512;
            const cy = Math.random() * 512;
            const rad = 60 + Math.random() * 100;
            const grad = bbctx.createRadialGradient(cx, cy, 10, cx, cy, rad);
            grad.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
            grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.025)');
            grad.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
            bbctx.fillStyle = grad;
            bbctx.beginPath();
            bbctx.arc(cx, cy, rad, 0, Math.PI * 2);
            bbctx.fill();
        }

        // Horizontal blackboard slate scratches
        bbctx.strokeStyle = 'rgba(255,255,255,0.035)';
        bbctx.lineWidth = 1.0;
        for (let i = 0; i < 35; i++) {
            bbctx.beginPath();
            const y = Math.random() * 512;
            bbctx.moveTo(0, y);
            bbctx.lineTo(512, y + (Math.random() - 0.5) * 8);
            bbctx.stroke();
        }

        const bbTexture = new THREE.CanvasTexture(bbCanvas);
        this.materials.blackboard = new THREE.MeshStandardMaterial({
            map: bbTexture,
            bumpMap: bbTexture,
            bumpScale: 0.012,
            roughness: 0.88, // rough chalk slate
            metalness: 0.02
        });

        // 9. Glass windows (highly reflective glass)
        this.materials.glass = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.08,
            roughness: 0.02,
            metalness: 0.05,
            transmission: 0.98,
            ior: 1.52
        });

        // 10. Glowing light tubes
        this.materials.glowLight = new THREE.MeshBasicMaterial({
            color: 0xffffff
        });

        this.materials.matteWhite = new THREE.MeshStandardMaterial({
            color: 0xfafafa,
            roughness: 0.25,
            metalness: 0.05
        });

        // 11. Custom colorful frame materials
        this.materials.windowFrame = new THREE.MeshStandardMaterial({
            color: 0x1a3d4b, // School ocean blue frame
            roughness: 0.35,
            metalness: 0.15
        });
    }

    // Build the classroom shell with windows on the right
    buildClassroom() {
        const w = CONFIG.roomWidth;
        const l = CONFIG.roomLength;
        const h = CONFIG.roomHeight;

        // 1. Floor
        const floor = new THREE.Mesh(new THREE.PlaneGeometry(w, l), this.materials.floor);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);

        // 2. Ceiling
        const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(w, l), this.materials.ceiling);
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.y = h;
        ceiling.receiveShadow = true;
        this.scene.add(ceiling);

        // 3. Walls (Solid geometries)
        const wallGeometries = {
            lr: new THREE.PlaneGeometry(l, h), // left-right
            fb: new THREE.PlaneGeometry(w, h)  // front-back
        };

        // Front Wall (Z = -16)
        const frontWall = new THREE.Mesh(wallGeometries.fb, this.materials.wall);
        frontWall.position.set(0, h / 2, -l / 2);
        frontWall.receiveShadow = true;
        this.scene.add(frontWall);

        // Back Wall (Z = 16)
        const backWall = new THREE.Mesh(wallGeometries.fb, this.materials.wall);
        backWall.position.set(0, h / 2, l / 2);
        backWall.rotation.y = Math.PI;
        backWall.receiveShadow = true;
        this.scene.add(backWall);

        // Left Wall (X = -16)
        const leftWall = new THREE.Mesh(wallGeometries.lr, this.materials.wall);
        leftWall.position.set(-w / 2, h / 2, 0);
        leftWall.rotation.y = Math.PI / 2;
        leftWall.receiveShadow = true;
        this.scene.add(leftWall);

        // 4. Smooth corner columns (to round out the 90-degree room corners)
        const pillarGeo = new THREE.CylinderGeometry(0.5, 0.5, h, 24);
        const pillarPositions = [
            { x: -w / 2 + 0.3, z: -l / 2 + 0.3 },
            { x: w / 2 - 0.3, z: -l / 2 + 0.3 },
            { x: -w / 2 + 0.3, z: l / 2 - 0.3 },
            { x: w / 2 - 0.3, z: l / 2 - 0.3 }
        ];
        pillarPositions.forEach(pos => {
            const pillar = new THREE.Mesh(pillarGeo, this.materials.wall);
            pillar.position.set(pos.x, h / 2, pos.z);
            pillar.castShadow = true;
            pillar.receiveShadow = true;
            this.scene.add(pillar);
        });

        // Right Wall (X = 16) - Contain Windows
        const rightWallGroup = new THREE.Group();
        rightWallGroup.position.set(w / 2, 0, 0);
        rightWallGroup.rotation.y = -Math.PI / 2;
        this.scene.add(rightWallGroup);

        // Solid bottom wall under windows (height 1.2m)
        const rwBottom = new THREE.Mesh(new THREE.BoxGeometry(l, 1.2, 0.4), this.materials.wall);
        rwBottom.position.set(0, 0.6, 0);
        rwBottom.receiveShadow = true;
        rwBottom.castShadow = true;
        rightWallGroup.add(rwBottom);

        // Solid top wall section (4.8m to 8m height)
        const rwTop = new THREE.Mesh(new THREE.BoxGeometry(l, h - 4.8, 0.4), this.materials.wall);
        rwTop.position.set(0, h - (h - 4.8) / 2, 0);
        rwTop.receiveShadow = true;
        rightWallGroup.add(rwTop);

        // Windows frames and glass panes (With custom colorful blue frames and red/yellow blinds!)
        const frameGeo = new THREE.BoxGeometry(0.2, 3.6, 0.4);
        const glassGeo = new THREE.BoxGeometry(5.8, 3.6, 0.05);

        const blindCasingGeo = new THREE.BoxGeometry(5.8, 0.15, 0.45);
        const blindSlatsGeo = new THREE.BoxGeometry(5.6, 1.2, 0.05);
        const blindCasingMat = new THREE.MeshStandardMaterial({ color: 0x8b2635, roughness: 0.5 }); // Dark red casing
        const blindSlatsMat = new THREE.MeshStandardMaterial({ color: 0xe0a96d, roughness: 0.65 }); // Sandy orange blinds

        for (let i = -2; i <= 2; i++) {
            const zPos = i * 6.0;
            if (i > -2 && i < 2) {
                const col = new THREE.Mesh(frameGeo, this.materials.windowFrame);
                col.position.set(zPos - 3.0, 3.0, 0);
                col.castShadow = true;
                rightWallGroup.add(col);
            }
            const glass = new THREE.Mesh(glassGeo, this.materials.glass);
            glass.position.set(zPos, 3.0, 0);
            rightWallGroup.add(glass);

            // Add colorful blinds at the top of each window pane!
            const casing = new THREE.Mesh(blindCasingGeo, blindCasingMat);
            casing.position.set(zPos, 4.7, 0.15);
            casing.castShadow = true;
            rightWallGroup.add(casing);

            const slats = new THREE.Mesh(blindSlatsGeo, blindSlatsMat);
            slats.position.set(zPos, 4.02, 0.1);
            slats.castShadow = true;
            rightWallGroup.add(slats);
        }

        // --- 3D WALL ACCENTS & TRIMS (Adds color bands to the room) ---
        const baseboardMat = new THREE.MeshStandardMaterial({ color: 0x1f4a56, roughness: 0.5 }); // Ocean blue baseboards
        const chairRailMat = new THREE.MeshStandardMaterial({ color: 0x8b2635, roughness: 0.5 });  // Dark red chair rails

        // 1. Baseboard trims
        // Left Trim
        const trimL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.2, l), baseboardMat);
        trimL.position.set(-w/2 + 0.03, 0.1, 0);
        trimL.castShadow = true;
        this.scene.add(trimL);

        // Right Trim
        const trimR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.2, l), baseboardMat);
        trimR.position.set(w/2 - 0.03, 0.1, 0);
        trimR.castShadow = true;
        this.scene.add(trimR);

        // Front Trim
        const trimF = new THREE.Mesh(new THREE.BoxGeometry(w, 0.2, 0.06), baseboardMat);
        trimF.position.set(0, 0.1, -l/2 + 0.03);
        trimF.castShadow = true;
        this.scene.add(trimF);

        // Back Trim
        const trimB = new THREE.Mesh(new THREE.BoxGeometry(w, 0.2, 0.06), baseboardMat);
        trimB.position.set(0, 0.1, l/2 - 0.03);
        trimB.castShadow = true;
        this.scene.add(trimB);

        // 2. Chair rail waist stripe (Y = 1.4)
        const railL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.1, l), chairRailMat);
        railL.position.set(-w/2 + 0.02, 1.4, 0);
        this.scene.add(railL);

        const railR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.1, l), chairRailMat);
        railR.position.set(w/2 - 0.02, 1.4, 0);
        this.scene.add(railR);

        const railF = new THREE.Mesh(new THREE.BoxGeometry(w, 0.1, 0.04), chairRailMat);
        railF.position.set(0, 1.4, -l/2 + 0.02);
        this.scene.add(railF);

        const railB = new THREE.Mesh(new THREE.BoxGeometry(w, 0.1, 0.04), chairRailMat);
        railB.position.set(0, 1.4, l/2 - 0.02);
        this.scene.add(railB);

        // --- 3D INDUSTRIAL CEILING VENT PIPES (Add color to the ceiling) ---
        const pipeMat1 = new THREE.MeshStandardMaterial({ color: 0xd35400, metalness: 0.8, roughness: 0.2 }); // Orange pipe
        const pipeMat2 = new THREE.MeshStandardMaterial({ color: 0xf1c40f, metalness: 0.8, roughness: 0.2 }); // Yellow pipe
        const bracketMat = new THREE.MeshStandardMaterial({ color: 0x5a5c60, metalness: 0.9, roughness: 0.1 });

        // Pipe 1 (Left Side of Ceiling: X = -9, Y = 7.2)
        const pipe1 = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, l, 16), pipeMat1);
        pipe1.rotation.x = Math.PI / 2;
        pipe1.position.set(-9.0, 7.2, 0);
        pipe1.castShadow = true;
        this.scene.add(pipe1);

        // Pipe 2 (Right Side of Ceiling: X = 9, Y = 7.2)
        const pipe2 = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, l, 16), pipeMat2);
        pipe2.rotation.x = Math.PI / 2;
        pipe2.position.set(9.0, 7.2, 0);
        pipe2.castShadow = true;
        this.scene.add(pipe2);

        // Mounting brackets for pipes
        const zOffsets = [-10.0, 0.0, 10.0];
        zOffsets.forEach(zVal => {
            const brL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.8, 0.3), bracketMat);
            brL.position.set(-9.0, 7.6, zVal);
            this.scene.add(brL);

            const brR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.8, 0.3), bracketMat);
            brR.position.set(9.0, 7.6, zVal);
            this.scene.add(brR);
        });

        // --- MANUALLY CALCULATED COLLIDERS FOR WALLS (To prevent sticking at 0,0,0) ---
        this.colliders.push(new THREE.Box3(new THREE.Vector3(-w / 2 - 0.5, 0, -l / 2 - 0.5), new THREE.Vector3(-w / 2, h, l / 2 + 0.5))); // Left Wall
        this.colliders.push(new THREE.Box3(new THREE.Vector3(w / 2, 0, -l / 2 - 0.5), new THREE.Vector3(w / 2 + 0.5, h, l / 2 + 0.5)));  // Right Wall
        this.colliders.push(new THREE.Box3(new THREE.Vector3(-w / 2 - 0.5, 0, -l / 2 - 0.5), new THREE.Vector3(w / 2 + 0.5, h, -l / 2))); // Front Wall
        this.colliders.push(new THREE.Box3(new THREE.Vector3(-w / 2 - 0.5, 0, l / 2), new THREE.Vector3(w / 2 + 0.5, h, l / 2 + 0.5)));  // Back Wall

        // Solid window frame column colliders (X = 16.0)
        for (let i = -1; i <= 1; i++) {
            const worldZ = i * 6.0;
            this.colliders.push(new THREE.Box3(
                new THREE.Vector3(15.7, 0, worldZ - 3.1),
                new THREE.Vector3(16.1, h, worldZ - 2.9)
            ));
        }
    }

    // Build all furniture props in classroom
    buildFurniture() {
        // --- 1. Blackboard (Front Wall: Z = -15.8) ---
        const blackboard = new THREE.Group();
        blackboard.position.set(0, 0, -15.8);

        // Frame
        const frame = new THREE.Mesh(new THREE.BoxGeometry(10.2, 3.2, 0.15), this.materials.darkWood);
        frame.position.set(0, 3.0, 0);
        frame.castShadow = true;
        blackboard.add(frame);

        // Green slate board
        const board = new THREE.Mesh(new THREE.BoxGeometry(9.8, 2.8, 0.05), this.materials.blackboard);
        board.position.set(0, 3.0, 0.06);
        board.castShadow = true;
        board.receiveShadow = true;
        blackboard.add(board);

        // Chalkboard dynamic canvas textures (math formulas in chalk style)
        const chalkCanvas = document.createElement('canvas');
        chalkCanvas.width = 1024;
        chalkCanvas.height = 512;
        const cctx = chalkCanvas.getContext('2d');
        cctx.fillStyle = '#1a331c';
        cctx.fillRect(0, 0, 1024, 512);

        // Draw coordinate axes
        cctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        cctx.lineWidth = 3;
        cctx.font = 'italic 28px Georgia, serif';
        
        // Write chalk lines
        cctx.strokeRect(50, 440, 924, 4);
        cctx.fillText("Maths 101: Advanced Calculus & Algebra Lecture", 50, 60);
        
        // Column 1
        cctx.fillText("sin²(θ) + cos²(θ) = 1", 80, 120);
        cctx.fillText("tan(θ) = sin(θ) / cos(θ)", 80, 170);
        cctx.fillText("d/dx [ e^x ] = e^x", 80, 220);
        cctx.fillText("∫ x^n dx = (x^(n+1))/(n+1) + C", 80, 270);
        cctx.fillText("f'(x) = lim[h→0] (f(x+h) - f(x))/h", 80, 320);
        cctx.fillText("e^(iπ) + 1 = 0 (Euler)", 80, 370);

        // Column 2 (Center graph)
        cctx.fillText("Unit Circle", 440, 120);
        cctx.beginPath();
        cctx.arc(500, 210, 60, 0, Math.PI * 2);
        cctx.moveTo(500, 210);
        cctx.lineTo(500 + 60 * Math.cos(Math.PI / 6), 210 - 60 * Math.sin(Math.PI / 6));
        cctx.moveTo(430, 210); cctx.lineTo(570, 210); // X axis
        cctx.moveTo(500, 140); cctx.lineTo(500, 280); // Y axis
        cctx.stroke();
        cctx.fillText("θ=30°", 540, 195);
        cctx.fillText("Σ_{k=1}^n k² = (n(n+1)(2n+1))/6", 360, 370);

        // Column 3
        cctx.fillText("Quadratic Formula:", 680, 120);
        cctx.fillText("x = [ -b ± √(b² - 4ac) ] / 2a", 680, 170);
        cctx.fillText("Matrix Transformation:", 680, 230);
        cctx.fillText("[ A ] = [ cosθ  -sinθ ]", 700, 280);
        cctx.fillText("        [ sinθ   cosθ ]", 700, 320);
        cctx.fillText("det(A) = ad - bc", 680, 370);

        const chalkTexture = new THREE.CanvasTexture(chalkCanvas);
        const chalkMat = new THREE.MeshBasicMaterial({ map: chalkTexture });
        const chalkMesh = new THREE.Mesh(new THREE.BoxGeometry(9.6, 2.6, 0.02), chalkMat);
        chalkMesh.position.set(0, 3.0, 0.1);
        blackboard.add(chalkMesh);

        this.furnitureGroup.add(blackboard);

        // MANUAL BLACKBOARD COLLIDER (Z = -15.8)
        this.colliders.push(new THREE.Box3(
            new THREE.Vector3(-5.1, 1.4, -15.9),
            new THREE.Vector3(5.1, 4.6, -15.7)
        ));

        // --- 2. Teacher's Desk & Chair (Z = -11.0) ---
        const teacherDesk = new THREE.Group();
        teacherDesk.position.set(0, 0, -11.0);

        // Desktop
        const tdTop = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.08, 1.4), this.materials.darkWood);
        tdTop.position.y = 1.5;
        tdTop.castShadow = true;
        tdTop.receiveShadow = true;
        teacherDesk.add(tdTop);

        // Side support panels
        const tdSideL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.5, 1.3), this.materials.darkWood);
        tdSideL.position.set(-1.42, 0.75, 0);
        tdSideL.castShadow = true;
        teacherDesk.add(tdSideL);

        const tdSideR = tdSideL.clone();
        tdSideR.position.x = 1.42;
        teacherDesk.add(tdSideR);

        // Front privacy board
        const tdFront = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.2, 0.05), this.materials.darkWood);
        tdFront.position.set(0, 0.9, -0.6);
        tdFront.castShadow = true;
        teacherDesk.add(tdFront);

        // Realistic Desk Side Drawer Cabinet (attached under the desk on the right side)
        const drawerUnit = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.9, 1.1), this.materials.darkWood);
        drawerUnit.position.set(0.9, 0.95, 0);
        drawerUnit.castShadow = true;
        teacherDesk.add(drawerUnit);

        // Individual drawer handle visual accents
        const handleMat = new THREE.MeshStandardMaterial({ color: 0xc0c0c0, metalness: 0.95, roughness: 0.1 });
        for (let i = 0; i < 3; i++) {
            // Drawers
            const drawerFace = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.22, 0.95), this.materials.darkWood);
            drawerFace.position.set(0.9 - 0.33, 1.25 - i * 0.28, 0);
            teacherDesk.add(drawerFace);

            const drHandle = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.28), handleMat);
            drHandle.position.set(0.9 - 0.35, 1.25 - i * 0.28, 0);
            teacherDesk.add(drHandle);
        }

        // Teacher Chair
        const teacherChair = new THREE.Group();
        teacherChair.position.set(0, 0, -12.5);

        const tcSeat = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.08, 0.7), this.materials.darkWood);
        tcSeat.position.y = 1.0;
        tcSeat.castShadow = true;
        teacherChair.add(tcSeat);

        const tcBack = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.6, 0.08), this.materials.darkWood);
        tcBack.position.set(0, 1.3, -0.31);
        tcBack.castShadow = true;
        teacherChair.add(tcBack);

        const tcLegs = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.0, 4), this.materials.metal);
        tcLegs.position.set(0, 0.5, 0);
        teacherChair.add(tcLegs);

        this.furnitureGroup.add(teacherDesk);
        this.furnitureGroup.add(teacherChair);

        // MANUAL TEACHER DESK COLLIDER (X: -1.55 to 1.55, Z: -11.7 to -10.3)
        this.colliders.push(new THREE.Box3(
            new THREE.Vector3(-1.55, 0, -11.7),
            new THREE.Vector3(1.55, 1.55, -10.3)
        ));
        // MANUAL TEACHER CHAIR COLLIDER (X: -0.4 to 0.4, Z: -13.0 to -12.1)
        this.colliders.push(new THREE.Box3(
            new THREE.Vector3(-0.4, 0, -13.0),
            new THREE.Vector3(0.4, 1.6, -12.1)
        ));

        // --- 3. Grid of Student Desks (16 Desks total: 4 columns x 4 rows) ---
        const rowZs = [-8.0, -2.0, 4.0, 10.0];
        const colXs = [-9.0, -3.0, 3.0, 9.0];
        const bagColors = [0xc62828, 0x7b1fa2, 0x0e5a88, 0x2e7d32, 0xe65100];

        rowZs.forEach((rz, rIdx) => {
            colXs.forEach((cx, cIdx) => {
                const deskGroup = this.createStudentDesk(cx, rz);
                this.furnitureGroup.add(deskGroup);

                // Add a bag next to the desk chair
                const bag = this.createBackpack(bagColors[(rIdx + cIdx) % bagColors.length]);
                bag.position.set(cx + 0.75, 0, rz + 0.75);
                bag.rotation.y = (rIdx + cIdx) * 1.35;
                this.furnitureGroup.add(bag);

                // --- MANUAL STUDENT DESK & CHAIR COLLIDERS (To prevent getting stuck) ---
                // Desk Table Collider
                this.colliders.push(new THREE.Box3(
                    new THREE.Vector3(cx - 0.75, 0, rz - 0.5),
                    new THREE.Vector3(cx + 0.75, 1.38, rz + 0.5)
                ));
                // Chair Bounding Box (offset by +1.2m behind the desk)
                this.colliders.push(new THREE.Box3(
                    new THREE.Vector3(cx - 0.3, 0, rz + 1.2 - 0.3),
                    new THREE.Vector3(cx + 0.3, 1.4, rz + 1.2 + 0.3)
                ));
            });
        });

        // --- 4. Bookshelf on Left Wall (X = -15.5, Z = 0) ---
        const bookshelf = new THREE.Group();
        bookshelf.position.set(-15.5, 0, 0);

        // Rebuilt Bookshelf as a highly realistic, hollow structure with separate panels!
        // 1. Back panel
        const bsBack = new THREE.Mesh(new THREE.BoxGeometry(0.04, 4.5, 3.2), this.materials.darkWood);
        bsBack.position.set(-0.38, 2.25, 0);
        bsBack.castShadow = true;
        bsBack.receiveShadow = true;
        bookshelf.add(bsBack);

        // 2. Left and Right side panels
        const bsSideL = new THREE.Mesh(new THREE.BoxGeometry(0.76, 4.5, 0.05), this.materials.darkWood);
        bsSideL.position.set(0.02, 2.25, -1.575);
        bsSideL.castShadow = true;
        bsSideL.receiveShadow = true;
        bookshelf.add(bsSideL);

        const bsSideR = bsSideL.clone();
        bsSideR.position.z = 1.575;
        bookshelf.add(bsSideR);

        // 3. Top panel
        const bsTop = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.05, 3.1), this.materials.darkWood);
        bsTop.position.set(0.02, 4.475, 0);
        bsTop.castShadow = true;
        bookshelf.add(bsTop);

        // 4. Bottom kickboard
        const bsBottom = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.15, 3.1), this.materials.darkWood);
        bsBottom.position.set(0.02, 0.075, 0);
        bsBottom.castShadow = true;
        bsBottom.receiveShadow = true;
        bookshelf.add(bsBottom);

        // 5. Horizontal shelf boards
        const shHeights = [1.1, 2.3, 3.5];
        shHeights.forEach(sh => {
            const shelfBoard = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.04, 3.1), this.materials.darkWood);
            shelfBoard.position.set(0.02, sh, 0);
            shelfBoard.castShadow = true;
            shelfBoard.receiveShadow = true;
            bookshelf.add(shelfBoard);
        });

        // Bookshelf interior shadows and book items
        const bookColors = [0xc62828, 0x1565c0, 0x2e7d32, 0xef6c00, 0x37474f];
        shHeights.forEach((sh, sIdx) => {
            // Shadow boxes inside each shelf partition to mimic depth shading
            const shadowBox = new THREE.Mesh(new THREE.BoxGeometry(0.72, 1.16, 3.06), new THREE.MeshStandardMaterial({
                color: 0x15100d,
                roughness: 0.95
            }));
            shadowBox.position.set(0.01, sh + 0.6, 0);
            bookshelf.add(shadowBox);

            // Spawn books in a natural, messy/slanted way
            let zPos = -1.35;
            for (let i = 0; i < 14; i++) {
                const bWidth = 0.08 + Math.random() * 0.04;
                const bHeight = 0.52 + Math.random() * 0.28;
                const bDepth = 0.52 + Math.random() * 0.12;
                const bMat = new THREE.MeshStandardMaterial({
                    color: bookColors[(sIdx + i) % bookColors.length],
                    roughness: 0.65
                });

                const book = new THREE.Mesh(new THREE.BoxGeometry(bDepth, bHeight, bWidth), bMat);
                book.castShadow = true;

                // Every 4th book, tilt it to make it lean realistically!
                if (i > 0 && i % 4 === 0) {
                    book.rotation.z = -0.32; // Lean to the left
                    book.position.set(0.08 - 0.08, sh - 0.5 + bHeight/2 - 0.03, zPos + bWidth/2);
                } else if (i === 11) {
                    // Lay a stack of 3 books flat horizontally
                    for (let stack = 0; stack < 3; stack++) {
                        const hBook = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.08, 0.45), new THREE.MeshStandardMaterial({
                            color: bookColors[(sIdx + stack) % bookColors.length],
                            roughness: 0.7
                        }));
                        hBook.position.set(0.08, sh - 0.5 + 0.04 + stack * 0.085, zPos + 0.1);
                        hBook.rotation.y = (stack * 0.08) - 0.04; // slight twist
                        hBook.castShadow = true;
                        bookshelf.add(hBook);
                    }
                    zPos += 0.55; // jump forward
                    continue;
                } else {
                    book.position.set(0.08, sh - 0.5 + bHeight/2, zPos + bWidth/2);
                }
                
                bookshelf.add(book);
                zPos += bWidth + 0.06;
            }
        });

        // Globe
        const globeGroup = new THREE.Group();
        globeGroup.position.set(0.05, 2.3, 1.0);
        const globeStand = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.08, 0.3, 8), this.materials.metal);
        globeGroup.add(globeStand);
        const globeSphere = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 12), new THREE.MeshStandardMaterial({
            color: 0x00838f,
            roughness: 0.8
        }));
        globeSphere.position.y = 0.32;
        globeSphere.castShadow = true;
        globeGroup.add(globeSphere);
        bookshelf.add(globeGroup);

        this.furnitureGroup.add(bookshelf);

        // MANUAL BOOKSHELF COLLIDER (X: -16.0 to -14.6, Z: -1.65 to 1.65)
        this.colliders.push(new THREE.Box3(
            new THREE.Vector3(-16.0, 0, -1.65),
            new THREE.Vector3(-14.6, 4.5, 1.65)
        ));

        // --- 5. Storage Cabinet on Right Wall (X = 15.5, Z = -5) ---
        const cabinet = new THREE.Group();
        cabinet.position.set(15.5, 0, -5.0);

        const cabBody = new THREE.Mesh(new THREE.BoxGeometry(0.8, 3.5, 2.2), this.materials.cabinetMetal);
        cabBody.position.y = 1.75;
        cabBody.castShadow = true;
        cabBody.receiveShadow = true;
        cabinet.add(cabBody);

        // Vertical split line
        const vLine = new THREE.Mesh(new THREE.BoxGeometry(0.82, 3.4, 0.02), new THREE.MeshStandardMaterial({ color: 0x263238 }));
        vLine.position.set(-0.02, 1.75, 0);
        cabinet.add(vLine);

        // Horizontal split line dividing cabinet into upper and lower sections
        const hLine = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.02, 2.16), new THREE.MeshStandardMaterial({ color: 0x263238 }));
        hLine.position.set(-0.02, 1.75, 0);
        cabinet.add(hLine);

        // 4 door panels for high realism
        const doorGeo = new THREE.BoxGeometry(0.02, 1.62, 1.02);
        const doorPositions = [
            { y: 2.58, z: -0.53 }, { y: 2.58, z: 0.53 }, // Upper doors
            { y: 0.92, z: -0.53 }, { y: 0.92, z: 0.53 }  // Lower doors
        ];
        
        // Vent slot geometry & lock plate
        const ventMat = new THREE.MeshStandardMaterial({ color: 0x212121, roughness: 0.9 });
        const lockPlateMat = new THREE.MeshStandardMaterial({ color: 0x90a4ae, metalness: 0.9, roughness: 0.2 });

        doorPositions.forEach((dpos, dIdx) => {
            const door = new THREE.Mesh(doorGeo, this.materials.cabinetMetal);
            door.position.set(0.405, dpos.y, dpos.z);
            door.castShadow = true;
            cabinet.add(door);

            // Add raised door panel moldings for high realism
            const panelMolding = new THREE.Mesh(new THREE.BoxGeometry(0.015, 1.46, 0.86), this.materials.cabinetMetal);
            panelMolding.position.set(0.415, dpos.y, dpos.z);
            panelMolding.castShadow = true;
            cabinet.add(panelMolding);

            // Add three horizontal louver ventilation slits near the top of each door
            for (let v = 0; v < 3; v++) {
                const ventSlit = new THREE.Mesh(new THREE.BoxGeometry(0.002, 0.02, 0.32), ventMat);
                ventSlit.position.set(0.425, dpos.y + 0.6 - v * 0.06, dpos.z);
                cabinet.add(ventSlit);
            }

            // Add cylinder cabinet keyhole locks on the upper door pair
            if (dpos.y > 2.0 && dIdx === 1) {
                const lockCylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.02, 8), lockPlateMat);
                lockCylinder.rotation.z = Math.PI / 2;
                lockCylinder.position.set(0.42, dpos.y, dpos.z - 0.42);
                cabinet.add(lockCylinder);
            }
        });

        // 4 Handles
        const cabHandleMat = new THREE.MeshStandardMaterial({ color: 0xb0bec5, metalness: 0.8, roughness: 0.2 });
        doorPositions.forEach(dpos => {
            const hdl = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.22, 0.04), cabHandleMat);
            // Handles are clustered near the center split column (Z = 0)
            hdl.position.set(0.42, dpos.y, dpos.z > 0 ? 0.08 : -0.08);
            cabinet.add(hdl);
        });

        // Hinge nodes on outer sides
        const hingeGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.08, 8);
        const hingePositions = [
            { y: 3.1, z: -1.05 }, { y: 2.0, z: -1.05 }, // Left upper
            { y: 1.4, z: -1.05 }, { y: 0.4, z: -1.05 }, // Left lower
            { y: 3.1, z: 1.05 }, { y: 2.0, z: 1.05 },  // Right upper
            { y: 1.4, z: 1.05 }, { y: 0.4, z: 1.05 }   // Right lower
        ];
        hingePositions.forEach(hpos => {
            const hinge = new THREE.Mesh(hingeGeo, new THREE.MeshStandardMaterial({ color: 0x37474f }));
            hinge.position.set(0.38, hpos.y, hpos.z);
            cabinet.add(hinge);
        });

        this.furnitureGroup.add(cabinet);

        // MANUAL CABINET COLLIDER (X: 14.6 to 16.0, Z: -6.15 to -3.85)
        this.colliders.push(new THREE.Box3(
            new THREE.Vector3(14.6, 0, -6.15),
            new THREE.Vector3(16.0, 3.5, -3.85)
        ));

        // --- 6. Classroom Wall Clock (Back Wall: Z = 15.92) ---
        const clock = new THREE.Group();
        clock.position.set(0, 4.8, 15.92);
        clock.rotation.y = 0; // Face the classroom (no PI rotation so it points to negative Z!)

        const clockFrame = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.08, 48), this.materials.chairPlastic);
        clockFrame.rotation.x = Math.PI / 2;
        clock.add(clockFrame);

        const clockFace = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.01, 48), this.materials.matteWhite);
        clockFace.position.z = -0.045;
        clockFace.rotation.x = Math.PI / 2;
        clock.add(clockFace);

        // Hour markings (12 tick marks around the dial)
        const tickMat = new THREE.MeshStandardMaterial({ color: 0x212121, roughness: 0.5 });
        for (let h = 0; h < 12; h++) {
            const angle = (h * Math.PI * 2) / 12;
            const tick = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.07, 0.01), tickMat);
            tick.position.set(0.32 * Math.sin(angle), 0.32 * Math.cos(angle), -0.052);
            tick.rotation.z = -angle;
            clock.add(tick);
        }

        // Clock hands (Pivoted Hierarchically around the center spindle!)
        const handMat = new THREE.MeshStandardMaterial({ color: 0x212121, roughness: 0.4 });
        
        // Hour hand pivot group (points towards 10 o'clock)
        const hourPivot = new THREE.Group();
        hourPivot.position.set(0, 0, -0.052);
        const hourMesh = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.18, 0.01), handMat);
        hourMesh.position.y = 0.09; // bottom tip is at center pivot
        hourPivot.add(hourMesh);
        hourPivot.rotation.z = (10 * Math.PI) / 6;
        clock.add(hourPivot);

        // Minute hand pivot group (points towards 2 / 10 minutes)
        const minPivot = new THREE.Group();
        minPivot.position.set(0, 0, -0.054);
        const minMesh = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.28, 0.01), handMat);
        minMesh.position.y = 0.14; // bottom tip is at center pivot
        minPivot.add(minMesh);
        minPivot.rotation.z = (2 * Math.PI) / 6;
        clock.add(minPivot);

        // Second hand pivot group (red, points towards 7 / 35 seconds)
        const secHandMat = new THREE.MeshBasicMaterial({ color: 0xd32f2f });
        const secPivot = new THREE.Group();
        secPivot.position.set(0, 0, -0.056);
        const secMesh = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.32, 0.01), secHandMat);
        secMesh.position.y = 0.16; // bottom tip is at center pivot
        secPivot.add(secMesh);
        secPivot.rotation.z = (7 * Math.PI) / 6;
        clock.add(secPivot);

        // Center pin
        const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.02, 10), handMat);
        pin.position.set(0, 0, -0.057);
        pin.rotation.x = Math.PI / 2;
        clock.add(pin);

        this.scene.add(clock);

        // --- 7. Recycle Trash Bin (X: -13.5, Z: 13.5) ---
        const trash = new THREE.Group();
        trash.position.set(-13.5, 0, 13.5);
        const bin = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.28, 0.9, 24), new THREE.MeshStandardMaterial({
            color: 0x1565c0,
            roughness: 0.6
        }));
        bin.position.y = 0.45;
        bin.castShadow = true;
        trash.add(bin);
        this.furnitureGroup.add(trash);

        // MANUAL TRASH CAN COLLIDER (X: -13.9 to -13.1, Z: 13.1 to 13.9)
        this.colliders.push(new THREE.Box3(
            new THREE.Vector3(-13.9, 0, 13.1),
            new THREE.Vector3(-13.1, 0.95, 13.9)
        ));

        // --- 8. Populate classroom walls with multiple math / physics charts ---
        // Left Wall posters
        const posterL1 = this.createPoster("GEOMETRY", 0xf9f9f9, 0xb71c1c);
        posterL1.position.set(-15.95, 3.5, -8.0);
        posterL1.rotation.y = Math.PI / 2;
        this.scene.add(posterL1);

        const posterL2 = this.createPoster("ALGEBRA", 0xf9f9f9, 0x0d47a1);
        posterL2.position.set(-15.95, 3.5, -2.0);
        posterL2.rotation.y = Math.PI / 2;
        this.scene.add(posterL2);

        const posterL3 = this.createPoster("CALCULUS", 0xf9f9f9, 0x1b5e20);
        posterL3.position.set(-15.95, 3.5, 4.0);
        posterL3.rotation.y = Math.PI / 2;
        this.scene.add(posterL3);

        const posterL4 = this.createPoster("PHYSICS", 0xf9f9f9, 0xe65100);
        posterL4.position.set(-15.95, 3.5, 10.0);
        posterL4.rotation.y = Math.PI / 2;
        this.scene.add(posterL4);

        // Right Wall posters (placed between windows)
        const posterR1 = this.createPoster("TRIG", 0xf9f9f9, 0x4a148c);
        posterR1.position.set(15.95, 3.5, -11.0);
        posterR1.rotation.y = -Math.PI / 2;
        this.scene.add(posterR1);

        const posterR2 = this.createPoster("FRACTALS", 0xf9f9f9, 0x006064);
        posterR2.position.set(15.95, 3.5, -3.0);
        posterR2.rotation.y = -Math.PI / 2;
        this.scene.add(posterR2);

        // Back Wall large welcome banner
        const bannerGroup = new THREE.Group();
        bannerGroup.position.set(0, 5.0, 15.94);
        bannerGroup.rotation.y = Math.PI;

        const bannerCanvas = document.createElement('canvas');
        bannerCanvas.width = 512;
        bannerCanvas.height = 128;
        const bctx = bannerCanvas.getContext('2d');
        bctx.fillStyle = '#1565c0';
        bctx.fillRect(0, 0, 512, 128);
        bctx.strokeStyle = '#ffb703';
        bctx.lineWidth = 6;
        bctx.strokeRect(10, 10, 492, 108);
        bctx.fillStyle = '#ffffff';
        bctx.font = 'bold 36px Orbitron, sans-serif';
        bctx.textAlign = 'center';
        bctx.fillText("WELCOME TO CLASS", 256, 75);

        const bannerTex = new THREE.CanvasTexture(bannerCanvas);
        const bannerMesh = new THREE.Mesh(new THREE.BoxGeometry(6.0, 1.5, 0.02), new THREE.MeshBasicMaterial({ map: bannerTex }));
        bannerGroup.add(bannerMesh);
        this.scene.add(bannerGroup);
    }

    // Helper: Create student desk top and leg meshes
    createStudentDesk(x, z) {
        const deskGroup = new THREE.Group();
        deskGroup.position.set(x, 0, z);

        // 1. Desk Top
        const top = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.06, 0.9), this.materials.wood);
        top.position.y = 1.34;
        top.castShadow = true;
        top.receiveShadow = true;
        deskGroup.add(top);

        // Metal desk legs (smoothed segments)
        const legGeo = new THREE.CylinderGeometry(0.025, 0.025, 1.34, 16);
        const legOffsets = [
            { x: -0.65, z: -0.4 }, { x: 0.65, z: -0.4 },
            { x: -0.65, z: 0.4 }, { x: 0.65, z: 0.4 }
        ];
        legOffsets.forEach(pos => {
            const leg = new THREE.Mesh(legGeo, this.materials.metal);
            leg.position.set(pos.x, 0.67, pos.z);
            deskGroup.add(leg);

            // Black rubber feet/glides at bottom of desk legs
            const tfoot = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.04, 8), new THREE.MeshStandardMaterial({ color: 0x1a1a1a }));
            tfoot.position.set(pos.x, 0.02, pos.z);
            deskGroup.add(tfoot);
        });

        // Structural metal support struts connecting legs (Left-to-Right side braces)
        const strutL = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.8, 8), this.materials.metal);
        strutL.rotation.x = Math.PI / 2;
        strutL.position.set(-0.65, 0.25, 0);
        deskGroup.add(strutL);

        const strutR = strutL.clone();
        strutR.position.x = 0.65;
        deskGroup.add(strutR);

        // Open book cubby frame under table
        const cubby = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.18, 0.8), new THREE.MeshStandardMaterial({
            color: 0x181a1d,
            roughness: 0.9
        }));
        cubby.position.y = 1.15;
        deskGroup.add(cubby);

        // 2. Student Chair (Vibrant colors!)
        const chair = new THREE.Group();
        chair.position.set(0, 0, 1.2); // Sits 1.2m behind table

        const chairColors = [0x1565c0, 0xc62828, 0x2e7d32, 0xef6c00, 0x6a1b9a, 0x00838f];
        const randomColor = chairColors[Math.floor(Math.random() * chairColors.length)];
        const colorfulChairMat = new THREE.MeshStandardMaterial({
            color: randomColor,
            roughness: 0.65,
            metalness: 0.08
        });

        const seat = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.06, 0.55), colorfulChairMat);
        seat.position.y = 0.9;
        seat.castShadow = true;
        chair.add(seat);

        const back = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.35, 0.06), colorfulChairMat);
        back.position.set(0, 1.25, 0.25);
        back.castShadow = true;
        chair.add(back);

        // 4 bent metal legs for realism (smoothed segments)
        const cLegGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.9, 16);
        const cLegOffsets = [
            { x: -0.23, z: -0.23 }, { x: 0.23, z: -0.23 },
            { x: -0.23, z: 0.23 }, { x: 0.23, z: 0.23 }
        ];
        cLegOffsets.forEach(pos => {
            const leg = new THREE.Mesh(cLegGeo, this.materials.metal);
            leg.position.set(pos.x, 0.45, pos.z);
            // Splay legs outward slightly for realistic classroom look
            leg.rotation.z = pos.x > 0 ? -0.06 : 0.06;
            leg.rotation.x = pos.z > 0 ? -0.06 : 0.06;
            chair.add(leg);

            // Black rubber glides at bottom of chair legs
            const cfoot = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.04, 8), new THREE.MeshStandardMaterial({ color: 0x1a1a1a }));
            cfoot.position.set(pos.x * 1.05, 0.02, pos.z * 1.05);
            chair.add(cfoot);
        });

        // 2 vertical metal support tubes connecting backrest to seat
        const backSupportL = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.4, 8), this.materials.metal);
        backSupportL.position.set(-0.2, 1.05, 0.22);
        backSupportL.rotation.x = 0.08;
        chair.add(backSupportL);

        // 2 vertical metal support tubes connecting backrest to seat
        const backSupportR = backSupportL.clone();
        backSupportR.position.x = 0.2;
        chair.add(backSupportR);

        deskGroup.add(chair);

        // Lived-in classroom student desk clutter (distributed randomly using deterministic position seed)
        const deskSeed = Math.abs(Math.floor(x * 13 + z * 7)) % 100;
        if (deskSeed < 30) {
            // Desk Clutter Set A: Opened notebook and a pencil
            const notebookGroup = new THREE.Group();
            notebookGroup.position.set(0.18, 1.37, 0.08);
            notebookGroup.rotation.y = -0.15;

            // Notebook cover
            const cover = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.01, 0.24), new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6 }));
            notebookGroup.add(cover);

            // Notebook pages (cream/white)
            const pages = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.016, 0.22), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 }));
            pages.position.y = 0.008;
            notebookGroup.add(pages);

            deskGroup.add(notebookGroup);

            // Pencil lying at random angle next to notebook
            const pencil = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.14, 6), new THREE.MeshStandardMaterial({ color: 0xffd54f }));
            pencil.position.set(0.2, 1.38, -0.12);
            pencil.rotation.y = 0.85;
            pencil.rotation.z = Math.PI / 2; // flat on desk
            deskGroup.add(pencil);
        } else if (deskSeed >= 30 && deskSeed < 65) {
            // Desk Clutter Set B: Translucent Water Bottle and a Pencil Holder cup
            const bottle = new THREE.Group();
            bottle.position.set(-0.35, 1.37, -0.15);

            // Bottle body
            const bBody = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.16, 8), new THREE.MeshPhysicalMaterial({ color: 0x00bcd4, transparent: true, opacity: 0.6, roughness: 0.1 }));
            bBody.position.y = 0.08;
            bottle.add(bBody);

            // Cap
            const bCap = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.025, 8), new THREE.MeshStandardMaterial({ color: 0x212121 }));
            bCap.position.y = 0.17;
            bottle.add(bCap);

            deskGroup.add(bottle);

            // Pencil holder cup
            const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.10, 8), new THREE.MeshStandardMaterial({ color: 0x78909c, metalness: 0.3, roughness: 0.5 }));
            cup.position.set(0.38, 1.38, 0.15);
            deskGroup.add(cup);

            // Pens inside cup
            for (let p = 0; p < 3; p++) {
                const pen = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.13, 6), new THREE.MeshStandardMaterial({ color: p === 0 ? 0x1565c0 : 0xc62828 }));
                pen.position.set(0.38 + (p - 1) * 0.015, 1.43, 0.15 + (Math.random() - 0.5) * 0.02);
                pen.rotation.z = (p - 1) * 0.22; // splayed out
                deskGroup.add(pen);
            }
        } else {
            // Desk Clutter Set C: A closed textbook
            const book = new THREE.Mesh(
                new THREE.BoxGeometry(0.35, 0.04, 0.25),
                new THREE.MeshStandardMaterial({
                    color: deskSeed % 2 === 0 ? 0x2e7d32 : 0xef6c00,
                    roughness: 0.75
                })
            );
            book.position.set(0.15, 1.39, 0.1);
            book.rotation.y = 0.12;
            deskGroup.add(book);
        }

        return deskGroup;
    }

    // Helper: Backpack school bag model
    createBackpack(colorHex) {
        const bag = new THREE.Group();

        const bagMat = new THREE.MeshStandardMaterial({
            color: colorHex,
            roughness: 0.85
        });

        // 1. Main pouch body
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.45, 0.22), bagMat);
        body.position.y = 0.225;
        body.castShadow = true;
        body.receiveShadow = true;
        bag.add(body);

        // 2. Small front pocket pouch
        const pocket = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.26, 0.06), bagMat);
        pocket.position.set(0, 0.16, 0.14);
        pocket.castShadow = true;
        bag.add(pocket);

        // 3. Small leather brand patch logo on front pocket
        const patchMat = new THREE.MeshStandardMaterial({ color: 0x8d6e63, roughness: 0.7 }); // tan leather
        const patch = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.05, 0.004), patchMat);
        patch.position.set(0, 0.16, 0.171);
        bag.add(patch);

        // 4. Front pocket zipper pull line
        const zipperMat = new THREE.MeshStandardMaterial({ color: 0x424242, roughness: 0.5 });
        const zipper = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.012, 0.008), zipperMat);
        zipper.position.set(0, 0.28, 0.13);
        bag.add(zipper);

        // 5. Realistic flat fabric shoulder straps running down the back
        const strapMat = new THREE.MeshStandardMaterial({ color: 0x212121, roughness: 0.9 });
        const strapL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.42, 0.015), strapMat);
        strapL.position.set(-0.09, 0.225, -0.115);
        strapL.rotation.x = 0.05; // slight lean
        strapL.castShadow = true;
        bag.add(strapL);

        const strapR = strapL.clone();
        strapR.position.x = 0.09;
        bag.add(strapR);

        // 6. Small top carry handle loop
        const handleGeo = new THREE.TorusGeometry(0.05, 0.012, 6, 12, Math.PI);
        const topHandle = new THREE.Mesh(handleGeo, strapMat);
        topHandle.position.set(0, 0.44, 0.0);
        // orient handle loop standing vertically on top
        topHandle.rotation.x = -Math.PI / 2;
        topHandle.castShadow = true;
        bag.add(topHandle);

        return bag;
    }

    // Helper: Simple geometry chart posters
    createPoster(title, paperColor, drawColor) {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 192;
        const pctx = canvas.getContext('2d');
        pctx.fillStyle = '#' + paperColor.toString(16).padStart(6, '0');
        pctx.fillRect(0, 0, 128, 192);

        pctx.fillStyle = '#' + drawColor.toString(16).padStart(6, '0');
        pctx.font = 'bold 16px sans-serif';
        pctx.textAlign = 'center';
        pctx.fillText(title, 64, 30);

        pctx.strokeStyle = '#' + drawColor.toString(16).padStart(6, '0');
        pctx.lineWidth = 3;
        
        if (title === "GEOMETRY") {
            pctx.beginPath();
            pctx.moveTo(64, 60);
            pctx.lineTo(24, 130);
            pctx.lineTo(104, 130);
            pctx.closePath();
            pctx.stroke();

            pctx.fillStyle = '#666';
            pctx.font = 'italic 10px Georgia';
            pctx.fillText("a² + b² = c²", 64, 155);
        } else if (title === "ALGEBRA") {
            pctx.beginPath();
            pctx.arc(64, 95, 35, 0, Math.PI * 2);
            pctx.stroke();

            pctx.fillStyle = '#666';
            pctx.font = 'italic 10px Georgia';
            pctx.fillText("A = π r²", 64, 155);
        } else if (title === "CALCULUS") {
            pctx.fillStyle = '#' + drawColor.toString(16).padStart(6, '0');
            pctx.font = 'bold 24px Georgia';
            pctx.fillText("∫ f(x)dx", 64, 95);

            pctx.fillStyle = '#666';
            pctx.font = 'italic 10px Georgia';
            pctx.fillText("F'(x) = f(x)", 64, 155);
        } else if (title === "PHYSICS") {
            pctx.fillStyle = '#' + drawColor.toString(16).padStart(6, '0');
            pctx.font = 'bold 26px sans-serif';
            pctx.fillText("F = ma", 64, 95);

            pctx.fillStyle = '#666';
            pctx.font = 'italic 10px Georgia';
            pctx.fillText("E = mc²", 64, 155);
        } else if (title === "TRIG") {
            pctx.fillStyle = '#' + drawColor.toString(16).padStart(6, '0');
            pctx.font = 'bold 22px Georgia';
            pctx.fillText("sin(x)", 64, 95);

            pctx.fillStyle = '#666';
            pctx.font = 'italic 10px Georgia';
            pctx.fillText("cos(π/2) = 0", 64, 155);
        } else if (title === "FRACTALS") {
            pctx.strokeStyle = '#' + drawColor.toString(16).padStart(6, '0');
            pctx.beginPath();
            let x = 64, y = 95, r = 4;
            pctx.moveTo(x, y);
            for (let t = 0; t < Math.PI * 6; t += 0.1) {
                r = 1.18 ** t;
                pctx.lineTo(x + Math.cos(t) * r, y + Math.sin(t) * r);
            }
            pctx.stroke();
            pctx.fillStyle = '#666';
            pctx.font = 'italic 10px Georgia';
            pctx.fillText("Golden Spiral", 64, 160);
        }

        const texture = new THREE.CanvasTexture(canvas);
        const mat = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.6 });

        const posterGroup = new THREE.Group();
        const paper = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.4, 0.02), mat);
        posterGroup.add(paper);

        const border = new THREE.Mesh(new THREE.BoxGeometry(1.7, 2.5, 0.04), this.materials.darkWood);
        border.position.z = -0.02;
        posterGroup.add(border);

        return posterGroup;
    }

    // Classroom lighting: bright uniform fluorescent tubes + warm window sunlight
    setupLights() {
        // 1. Hemisphere Light: simulates cool blue sky light from above and warm ground bounce from below (highly realistic!)
        const hemiLight = new THREE.HemisphereLight(0xd9e8f5, 0xe0d4c3, 0.52);
        this.scene.add(hemiLight);

        // 2. Ambient Light - soft warm daylight fill
        const ambientLight = new THREE.AmbientLight(0xfff9e6, 0.38);
        this.scene.add(ambientLight);

        // 3. Strong warm directional sunlight coming from the windows (Right wall X = 16)
        const sunLight = new THREE.DirectionalLight(0xffecc2, 2.5); // Golden sunlight
        sunLight.position.set(24, 11.0, 0);
        sunLight.castShadow = true;
        
        sunLight.shadow.mapSize.width = 1024; // Optimized shadow resolution for high frame rates
        sunLight.shadow.mapSize.height = 1024;
        sunLight.shadow.camera.near = 0.5;
        sunLight.shadow.camera.far = 42;
        sunLight.shadow.camera.left = -17;
        sunLight.shadow.camera.right = 17;
        sunLight.shadow.camera.top = 17;
        sunLight.shadow.camera.bottom = -17;
        sunLight.shadow.bias = -0.001; // Adjusted bias for 1024px shadow map size

        this.scene.add(sunLight);

        // 3. Classroom fluorescent tube lights on ceiling
        const tubePositions = [
            // Row 1 (Front: Z = -11)
            { x: -9, z: -11 }, { x: 0, z: -11 }, { x: 9, z: -11 },
            // Row 2 (Middle-Front: Z = -3)
            { x: -9, z: -3 },  { x: 0, z: -3 },  { x: 9, z: -3 },
            // Row 3 (Middle-Back: Z = 5)
            { x: -9, z: 5 },   { x: 0, z: 5 },   { x: 9, z: 5 },
            // Row 4 (Back: Z = 12)
            { x: -9, z: 12 },  { x: 0, z: 12 },  { x: 9, z: 12 }
        ];

        const fixtureGeo = new THREE.BoxGeometry(2.0, 0.04, 0.4);

        tubePositions.forEach(pos => {
            // Glowing visual geometry
            const fixture = new THREE.Mesh(fixtureGeo, this.materials.glowLight);
            fixture.position.set(pos.x, CONFIG.roomHeight - 0.02, pos.z);
            this.scene.add(fixture);

            // PointLight - warm uniform fluorescent white light
            const light = new THREE.PointLight(0xffffff, 14.0, 18, 1.2);
            light.position.set(pos.x, CONFIG.roomHeight - 0.3, pos.z);
            
            // Disable PointLight shadows (PointLight cube map shadows are extremely heavy and cause stutters)
            light.castShadow = false;
            this.scene.add(light);
        });
    }

    // Build external city skyline and sun visible through the windows
    buildOutsideScenery() {
        const sceneryGroup = new THREE.Group();
        sceneryGroup.name = "outside-scenery";

        // 1. The Sun (large glowing sphere outside the windows)
        const sunGeo = new THREE.SphereGeometry(3.2, 24, 24);
        const sunMat = new THREE.MeshBasicMaterial({
            color: 0xffd54f, // warm golden yellow sun
        });
        const sunMesh = new THREE.Mesh(sunGeo, sunMat);
        sunMesh.position.set(38, 9.5, -4.0); // Matches the sunlight angle
        sceneryGroup.add(sunMesh);

        // 2. City Buildings (Rectangular blocks of varying heights)
        const buildingMat = new THREE.MeshStandardMaterial({
            color: 0x303e45, // Slate blue silhouette
            roughness: 0.9,
            metalness: 0.05
        });

        const windowLightMat = new THREE.MeshBasicMaterial({
            color: 0xffe082, // Warm glowing yellow windows
        });

        // 7 skyscraper profiles
        const buildingPositions = [
            { x: 32, z: -14, w: 7, d: 7, h: 20 },
            { x: 36, z: -7, w: 6, d: 6, h: 28 },
            { x: 28, z: -1, w: 5, d: 5, h: 14 },
            { x: 33, z: 5, w: 7, d: 7, h: 24 },
            { x: 30, z: 12, w: 5, d: 6, h: 18 },
            { x: 37, z: -18, w: 6, d: 6, h: 16 },
            { x: 35, z: 18, w: 6, d: 6, h: 25 }
        ];

        buildingPositions.forEach(b => {
            const bMesh = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h, b.d), buildingMat);
            bMesh.position.set(b.x, b.h / 2 - 2.0, b.z); // Offset slightly below floor
            bMesh.castShadow = true;
            bMesh.receiveShadow = true;
            sceneryGroup.add(bMesh);

            // Add windows grids on the building face facing the classroom (-X face)
            const numFloors = Math.floor(b.h / 2.5);
            for (let floor = 2; floor < numFloors - 1; floor++) {
                const yPos = (floor * 2.5) - 2.0;
                for (let zOffset = -b.d/2 + 1.2; zOffset < b.d/2 - 0.5; zOffset += 1.8) {
                    const win = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.4, 0.4), windowLightMat);
                    win.position.set(-b.w/2 - 0.03, yPos, zOffset);
                    bMesh.add(win);
                }
            }
        });

        // 3. Grass ground plane outside
        const groundMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.85 }); // Rich green lawn
        const outsideGround = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), groundMat);
        outsideGround.rotation.x = -Math.PI / 2;
        outsideGround.position.set(40, -0.05, 0);
        outsideGround.receiveShadow = true;
        sceneryGroup.add(outsideGround);

        this.scene.add(sceneryGroup);
    }

    // Add extra decorative props to populate the walls and floor
    buildProps() {
        // 1. Chalkboard Eraser and Chalk pieces (on chalkboard ledge)
        const eraserMat = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.85 }); // brown wood back
        const eraser = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.05, 0.08), eraserMat);
        eraser.position.set(-0.8, 1.405, -15.4);
        eraser.castShadow = true;
        this.scene.add(eraser);

        const chalkMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });
        for (let i = 0; i < 3; i++) {
            const chalk = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.06, 6), chalkMat);
            chalk.rotation.z = Math.PI / 2 + (Math.random() - 0.5) * 0.4;
            chalk.position.set(0.2 + i * 0.12, 1.39, -15.4);
            chalk.castShadow = true;
            this.scene.add(chalk);
        }

        // 2. Teacher's Briefcase (standing on floor next to teacher's desk)
        const caseMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.85, metalness: 0.1 }); // brown leather
        const briefcase = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.38, 0.48), caseMat);
        briefcase.position.set(-2.0, 0.19, -11.0);
        briefcase.rotation.y = 0.15; // natural rotation angle
        briefcase.castShadow = true;
        briefcase.receiveShadow = true;
        this.scene.add(briefcase);

        // Add metal locks on briefcase
        const lockMat = new THREE.MeshStandardMaterial({ color: 0xffd54f, metalness: 0.8, roughness: 0.2 });
        const lockL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.04), lockMat);
        lockL.position.set(0.08, 0.28, -0.12);
        briefcase.add(lockL);

        const lockR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.04), lockMat);
        lockR.position.set(0.08, 0.28, 0.12);
        briefcase.add(lockR);

        // 3. Fire Extinguisher (hanging on back wall near recycle bin)
        const extGroup = new THREE.Group();
        extGroup.position.set(-13.5, 1.8, 15.82); // back wall

        const cylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.45, 12), new THREE.MeshStandardMaterial({ color: 0xb71c1c, roughness: 0.4 }));
        cylinder.castShadow = true;
        extGroup.add(cylinder);

        // Black nozzle bracket
        const nozzle = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.06, 0.1), new THREE.MeshStandardMaterial({ color: 0x212121 }));
        nozzle.position.set(0, 0.23, -0.04);
        extGroup.add(nozzle);

        this.scene.add(extGroup);

        // 4. Extra Student Backpack (lying flat on floor next to student desk 5)
        const bagMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.75 }); // dark green bag
        const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.18, 0.42), bagMat);
        backpack.position.set(-7.0, 0.09, 8.8);
        backpack.rotation.set(0.1, 0.5, -0.05);
        backpack.castShadow = true;
        backpack.receiveShadow = true;
        this.scene.add(backpack);

        // 5. Classroom Thermostat (hanging on left wall)
        const thermo = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.15, 0.12), new THREE.MeshStandardMaterial({ color: 0xefefef, roughness: 0.5 }));
        thermo.position.set(-15.96, 1.6, 6.0); // left wall
        this.scene.add(thermo);

        // 6. Stacked Cardboard Storage Boxes (under the bookshelf)
        const boxMat = new THREE.MeshStandardMaterial({ color: 0xd7ccc8, roughness: 0.9 }); // light cardboard cardboard
        
        const box1 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.6), boxMat);
        box1.position.set(-15.1, 0.2, 2.8);
        box1.rotation.y = 0.05;
        box1.castShadow = true;
        box1.receiveShadow = true;
        this.scene.add(box1);

        const box2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.5), boxMat);
        box2.position.set(-15.0, 0.575, 2.75);
        box2.rotation.y = -0.12;
        box2.castShadow = true;
        box2.receiveShadow = true;
        this.scene.add(box2);

        // Call new prop sub-builders to populate room
        this.buildPlants();
        this.buildMorePosters();
        this.buildWindowTrees();
        this.buildProjectionScreen();
        this.buildComputer();
        this.buildHumans();
        this.buildDoors();
        this.buildWallDetails();
        this.buildACDuctsAndFans();
    }

    // Potted plants in the classroom corners and on desk/bookshelf sills
    buildPlants() {
        const createPlant = (x, y, z, scale = 1.0) => {
            const plantGroup = new THREE.Group();
            plantGroup.position.set(x, y, z);
            plantGroup.scale.setScalar(scale);

            // 1. Pot (Terracotta pot)
            const potHeight = 0.45;
            const potMat = new THREE.MeshStandardMaterial({ color: 0xc25e3a, roughness: 0.8 });
            const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.18, potHeight, 12), potMat);
            // Pot sits exactly at Y = 0 locally
            pot.position.y = potHeight / 2;
            pot.castShadow = true;
            pot.receiveShadow = true;
            plantGroup.add(pot);

            // Soil
            const soilMat = new THREE.MeshStandardMaterial({ color: 0x4e3629, roughness: 0.95 });
            const soil = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.22, 0.05, 12), soilMat);
            soil.position.y = potHeight - 0.03;
            plantGroup.add(soil);

            // 2. Trunk/Stem
            const stemHeight = 0.5;
            const stemMat = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.9 });
            const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, stemHeight, 8), stemMat);
            stem.position.y = potHeight + stemHeight / 2 - 0.05;
            stem.castShadow = true;
            plantGroup.add(stem);

            // 3. Leafy clusters (spheres stacked organically)
            const leafMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.8 });
            const stemTopY = potHeight + stemHeight - 0.05;
            const leafPositions = [
                { x: 0, y: stemTopY + 0.2, z: 0, r: 0.22 },
                { x: -0.12, y: stemTopY + 0.12, z: 0.08, r: 0.18 },
                { x: 0.12, y: stemTopY + 0.12, z: -0.08, r: 0.18 },
                { x: 0.08, y: stemTopY + 0.08, z: 0.12, r: 0.16 },
                { x: -0.08, y: stemTopY + 0.08, z: -0.12, r: 0.16 }
            ];

            leafPositions.forEach(lp => {
                const leaf = new THREE.Mesh(new THREE.SphereGeometry(lp.r, 8, 8), leafMat);
                leaf.position.set(lp.x, lp.y, lp.z);
                leaf.castShadow = true;
                plantGroup.add(leaf);
            });

            this.scene.add(plantGroup);
        };

        // Front-left classroom corner (flat on floor)
        createPlant(-14.0, 0.0, -14.0, 1.4);
        // Back-right classroom corner (flat on floor)
        createPlant(14.0, 0.0, 14.0, 1.4);
        // Small decorative succulent on bookshelf top shelf
        createPlant(-15.1, 3.5, 1.0, 0.6);
        // Small decorative plant flat on the corner window sill (top of rwBottom which is Y=1.2)
        createPlant(15.55, 1.2, 11.5, 0.65);
    }

    // Additional posters/paintings with mathematical/creative art themes
    buildMorePosters() {
        const createPoster = (x, y, z, w, h, rotationY, title, canvasColor, drawFunc) => {
            const posterGroup = new THREE.Group();
            posterGroup.position.set(x, y, z);
            posterGroup.rotation.y = rotationY;

            // 1. Dark wood outer frame
            const frameMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.75 });
            const frame = new THREE.Mesh(new THREE.BoxGeometry(w + 0.12, h + 0.12, 0.04), frameMat);
            frame.castShadow = true;
            posterGroup.add(frame);

            // 2. White cardboard inner mat
            const matMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95 });
            const mat = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.045), matMat);
            posterGroup.add(mat);

            // 3. Artistic custom drawing canvas
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 256;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = canvasColor;
            ctx.fillRect(0, 0, 256, 256);
            
            drawFunc(ctx);

            const posterTex = new THREE.CanvasTexture(canvas);
            const artMat = new THREE.MeshBasicMaterial({ map: posterTex });
            const art = new THREE.Mesh(new THREE.BoxGeometry(w - 0.12, h - 0.12, 0.05), artMat);
            posterGroup.add(art);

            this.scene.add(posterGroup);
        };

        // Poster 3: Chemistry Periodic Table (Left Wall)
        createPoster(-15.95, 3.2, -4.0, 1.5, 1.8, Math.PI / 2, "Chemistry", "#eceff1", (ctx) => {
            // Periodic Table grid lines
            ctx.fillStyle = "#37474f";
            ctx.font = "bold 16px sans-serif";
            ctx.fillText("PERIODIC TABLE OF ELEMENTS", 10, 30);
            
            ctx.strokeStyle = "#78909c";
            ctx.lineWidth = 2;
            for (let row = 0; row < 6; row++) {
                for (let col = 0; col < 12; col++) {
                    if (row === 0 && col > 0 && col < 11) continue; // skip transition blocks
                    ctx.strokeRect(15 + col * 18, 55 + row * 22, 16, 20);
                    ctx.fillStyle = "#cfd8dc";
                    ctx.fillRect(16 + col * 18, 56 + row * 22, 14, 18);
                }
            }
        });

        // Poster 4: Golden Spiral / Math Art (Back Wall left)
        createPoster(-5.0, 3.4, 15.93, 1.6, 1.6, Math.PI, "Fibonacci Spiral", "#1e1e24", (ctx) => {
            // Draw Fibonacci Spiral
            ctx.strokeStyle = "#ffd54f";
            ctx.lineWidth = 3;
            ctx.beginPath();
            let cx = 90, cy = 128;
            let radius = 2;
            for (let angle = 0; angle < Math.PI * 5.8; angle += 0.05) {
                let x = cx + radius * Math.cos(angle);
                let y = cy + radius * Math.sin(angle);
                if (angle === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
                radius += 0.7;
            }
            ctx.stroke();

            // Sketched Portrait of Leonardo Fibonacci
            ctx.fillStyle = "#3e2723"; // Dark frame/hood oval
            ctx.beginPath();
            ctx.arc(195, 80, 28, 0, Math.PI * 2);
            ctx.fill();
            // face skin
            ctx.fillStyle = "#ffecd2";
            ctx.beginPath();
            ctx.arc(195, 84, 18, 0, Math.PI * 2);
            ctx.fill();
            // hood wrap
            ctx.strokeStyle = "#8d6e63";
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(195, 75, 22, Math.PI, 0);
            ctx.stroke();
            // eyes/nose dots
            ctx.fillStyle = "#3e2723";
            ctx.fillRect(188, 80, 3, 3);
            ctx.fillRect(199, 80, 3, 3);
            // beard
            ctx.fillStyle = "#5d4037";
            ctx.beginPath();
            ctx.arc(195, 96, 12, 0, Math.PI);
            ctx.fill();
            
            ctx.fillStyle = "#8d6e63";
            ctx.font = "bold 9px sans-serif";
            ctx.fillText("L. Fibonacci", 168, 122);

            ctx.fillStyle = "#ffffff";
            ctx.font = "italic 11px sans-serif";
            ctx.fillText("The Golden Spiral: 1, 1, 2, 3, 5...", 10, 235);
        });

        // Poster 5: Geometry Fractals (Back Wall right)
        createPoster(5.0, 3.4, 15.93, 1.6, 1.6, Math.PI, "Sierpinski Gasket", "#0f172a", (ctx) => {
            // Draw a Sierpinski Triangle fractal (shifted left)
            ctx.strokeStyle = "#38bdf8";
            ctx.lineWidth = 2;
            
            const drawTriangle = (x1, y1, x2, y2, x3, y3, depth) => {
                if (depth === 0) {
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.lineTo(x3, y3);
                    ctx.closePath();
                    ctx.stroke();
                } else {
                    const x12 = (x1 + x2) / 2, y12 = (y1 + y2) / 2;
                    const x23 = (x2 + x3) / 2, y23 = (y2 + y3) / 2;
                    const x31 = (x3 + x1) / 2, y31 = (y3 + y1) / 2;
                    drawTriangle(x1, y1, x12, y12, x31, y31, depth - 1);
                    drawTriangle(x12, y12, x2, y2, x23, y23, depth - 1);
                    drawTriangle(x31, y31, x23, y23, x3, y3, depth - 1);
                }
            };
            drawTriangle(90, 30, 15, 210, 165, 210, 4);

            // Sketched Portrait of Wacław Sierpiński (Polish mathematician)
            // Portrait oval (suit jacket)
            ctx.fillStyle = "#2d3748";
            ctx.beginPath();
            ctx.ellipse(205, 120, 24, 32, 0, 0, Math.PI*2);
            ctx.fill();
            // skin head
            ctx.fillStyle = "#fddcb9";
            ctx.beginPath();
            ctx.arc(205, 90, 18, 0, Math.PI*2);
            ctx.fill();
            // grey hair
            ctx.fillStyle = "#718096";
            ctx.beginPath();
            ctx.arc(205, 76, 15, Math.PI, 0);
            ctx.fill();
            // black spectacles
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 1.8;
            ctx.strokeRect(194, 85, 9, 7);
            ctx.strokeRect(207, 85, 9, 7);
            ctx.beginPath();
            ctx.moveTo(203, 89); ctx.lineTo(207, 89);
            ctx.stroke();
            // nose/mouth
            ctx.fillStyle = "#4a5568";
            ctx.fillRect(204, 93, 2, 4);
            ctx.fillStyle = "#e53e3e";
            ctx.fillRect(200, 100, 10, 2);
            // white collar shirt
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.moveTo(198, 108); ctx.lineTo(205, 116); ctx.lineTo(212, 108);
            ctx.fill();
            
            ctx.fillStyle = "#cbd5e1";
            ctx.font = "bold 9px sans-serif";
            ctx.fillText("W. Sierpiński", 178, 162);
        });

        // Poster 6: Graph Theory / Network Diagram (Left Wall)
        createPoster(-15.95, 3.2, 5.0, 1.5, 1.8, Math.PI / 2, "Graph Theory", "#f8fafc", (ctx) => {
            ctx.fillStyle = "#1e293b";
            ctx.font = "bold 15px sans-serif";
            ctx.fillText("GRAPH THEORY NETWORKS", 10, 30);
            
            // Draw nodes and links (shifted left)
            const nodes = [
                { x: 40, y: 80 }, { x: 140, y: 70 }, { x: 90, y: 130 },
                { x: 50, y: 190 }, { x: 130, y: 180 }
            ];
            
            ctx.strokeStyle = "#94a3b8";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(nodes[0].x, nodes[0].y); ctx.lineTo(nodes[1].x, nodes[1].y);
            ctx.moveTo(nodes[0].x, nodes[0].y); ctx.lineTo(nodes[2].x, nodes[2].y);
            ctx.moveTo(nodes[1].x, nodes[1].y); ctx.lineTo(nodes[2].x, nodes[2].y);
            ctx.moveTo(nodes[2].x, nodes[2].y); ctx.lineTo(nodes[3].x, nodes[3].y);
            ctx.moveTo(nodes[2].x, nodes[2].y); ctx.lineTo(nodes[4].x, nodes[4].y);
            ctx.moveTo(nodes[3].x, nodes[3].y); ctx.lineTo(nodes[4].x, nodes[4].y);
            ctx.stroke();

            nodes.forEach(n => {
                ctx.fillStyle = "#ef4444";
                ctx.beginPath();
                ctx.arc(n.x, n.y, 7, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = "#ffffff";
                ctx.lineWidth = 1.5;
                ctx.stroke();
            });

            // Sketched Portrait of Leonhard Euler
            ctx.fillStyle = "#1e3a8a"; // Blue coat
            ctx.beginPath();
            ctx.ellipse(195, 120, 25, 30, 0, 0, Math.PI*2);
            ctx.fill();
            // Face
            ctx.fillStyle = "#ffe0bd";
            ctx.beginPath();
            ctx.arc(195, 90, 18, 0, Math.PI*2);
            ctx.fill();
            // Euler's famous cap/turban (red silk cap)
            ctx.fillStyle = "#b91c1c";
            ctx.beginPath();
            ctx.arc(195, 78, 19, Math.PI, 0);
            ctx.fill();
            // cap band
            ctx.fillStyle = "#fbbf24";
            ctx.fillRect(176, 78, 38, 5);
            // eyes/mouth
            ctx.fillStyle = "#111827";
            ctx.fillRect(188, 87, 2, 2);
            ctx.fillRect(200, 87, 2, 2);
            ctx.fillStyle = "#ef4444";
            ctx.fillRect(190, 98, 10, 2);

            ctx.fillStyle = "#64748b";
            ctx.font = "bold 9px sans-serif";
            ctx.fillText("L. Euler", 178, 160);
        });

        // Poster 7: Trigonometry Unit Circle (Front Wall right of board)
        createPoster(8.0, 3.2, -15.93, 1.5, 1.5, 0, "Unit Circle", "#fdfefe", (ctx) => {
            ctx.fillStyle = "#1e293b";
            ctx.font = "bold 15px sans-serif";
            ctx.fillText("TRIGONOMETRIC UNIT CIRCLE", 12, 30);
            
            const cx = 90, cy = 135, r = 60;
            // Draw axis lines
            ctx.strokeStyle = "#cbd5e1";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(cx - 75, cy); ctx.lineTo(cx + 75, cy);
            ctx.moveTo(cx, cy - 75); ctx.lineTo(cx, cy + 75);
            ctx.stroke();

            // Draw circle
            ctx.strokeStyle = "#3b82f6";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.stroke();

            // Draw radius at 45 degrees
            ctx.strokeStyle = "#ef4444";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + r * Math.cos(-Math.PI / 4), cy + r * Math.sin(-Math.PI / 4));
            ctx.stroke();

            ctx.fillStyle = "#0f172a";
            ctx.font = "10px monospace";
            ctx.fillText("θ = 45° (π/4)", cx + 5, cy - 25);

            // Sketched Portrait of René Descartes next to unit circle
            ctx.fillStyle = "#1e293b"; // Dark cloak
            ctx.beginPath();
            ctx.ellipse(195, 130, 26, 32, 0, 0, Math.PI*2);
            ctx.fill();
            // Face
            ctx.fillStyle = "#ffe0bd"; // skin
            ctx.beginPath();
            ctx.arc(195, 98, 17, 0, Math.PI*2);
            ctx.fill();
            // Wavy long black hair
            ctx.fillStyle = "#0f172a";
            ctx.beginPath();
            ctx.arc(182, 96, 9, 0, Math.PI*2);
            ctx.arc(208, 96, 9, 0, Math.PI*2);
            ctx.arc(195, 84, 15, Math.PI, 0);
            ctx.fill();
            // Mustache/goatee
            ctx.fillStyle = "#0f172a";
            ctx.fillRect(188, 103, 14, 2); // mustache
            ctx.fillRect(194, 108, 2, 4); // goatee
            
            ctx.fillStyle = "#475569";
            ctx.font = "bold 9px sans-serif";
            ctx.fillText("R. Descartes", 168, 172);
        });

        // Poster 8: Classroom Calendar / Schedule (Back Wall)
        createPoster(-8.0, 3.2, 15.93, 1.5, 1.5, Math.PI, "Schedule", "#fffbeb", (ctx) => {
            ctx.fillStyle = "#78350f";
            ctx.font = "bold 15px sans-serif";
            ctx.fillText("ACADEMIC CALENDAR", 12, 30);
            
            // Draw calendar grid
            ctx.strokeStyle = "#d97706";
            ctx.lineWidth = 1.5;
            for (let r = 0; r < 5; r++) {
                for (let c = 0; c < 7; c++) {
                    ctx.strokeRect(15 + c * 32, 50 + r * 32, 30, 30);
                    ctx.fillStyle = "#fef3c7";
                    ctx.fillRect(16 + c * 32, 51 + r * 32, 28, 28);
                }
            }
        });

        // Poster 9: Isaac Newton & Prism (Back Wall Right)
        createPoster(11.0, 3.2, 15.93, 1.5, 1.5, Math.PI, "Newton & Light", "#f8fafc", (ctx) => {
            ctx.fillStyle = "#1e293b";
            ctx.font = "bold 15px sans-serif";
            ctx.fillText("ISAAC NEWTON & LIGHT", 10, 30);

            // Prism light ray split
            ctx.strokeStyle = "#475569";
            ctx.lineWidth = 2.5;
            // Draw prism triangle
            ctx.beginPath();
            ctx.moveTo(80, 160); ctx.lineTo(140, 160); ctx.lineTo(110, 100);
            ctx.closePath();
            ctx.stroke();

            // Incident white ray
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(20, 140); ctx.lineTo(95, 130);
            ctx.stroke();

            // Exiting rainbow spectrum
            const rainbow = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#a855f7"];
            rainbow.forEach((color, idx) => {
                ctx.strokeStyle = color;
                ctx.lineWidth = 1.8;
                ctx.beginPath();
                ctx.moveTo(125, 130);
                ctx.lineTo(180, 115 + idx * 8);
                ctx.stroke();
            });

            // Newton portrait profile sketch
            ctx.fillStyle = "#1e293b"; // dark coat
            ctx.beginPath();
            ctx.ellipse(205, 200, 24, 30, 0, 0, Math.PI*2);
            ctx.fill();
            // skin head
            ctx.fillStyle = "#ffe0bd";
            ctx.beginPath();
            ctx.arc(205, 170, 17, 0, Math.PI*2);
            ctx.fill();
            // Wavy long white hair
            ctx.fillStyle = "#e2e8f0";
            ctx.beginPath();
            ctx.arc(192, 168, 10, 0, Math.PI*2);
            ctx.arc(218, 168, 10, 0, Math.PI*2);
            ctx.arc(205, 155, 16, Math.PI, 0);
            ctx.fill();
            // collar
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.moveTo(197, 185); ctx.lineTo(205, 195); ctx.lineTo(213, 185);
            ctx.fill();

            ctx.fillStyle = "#64748b";
            ctx.font = "bold 9px sans-serif";
            ctx.fillText("I. Newton", 188, 230);
        });

        // Poster 10: Albert Einstein (Front Wall left)
        createPoster(-10.0, 3.2, -15.93, 1.5, 1.5, 0, "Albert Einstein", "#fffbeb", (ctx) => {
            ctx.fillStyle = "#78350f";
            ctx.font = "bold 15px sans-serif";
            ctx.fillText("ALBERT EINSTEIN", 12, 30);
            
            // Draw crazy formula E=mc²
            ctx.fillStyle = "#b91c1c";
            ctx.font = "bold 28px Georgia";
            ctx.fillText("E = mc²", 25, 120);

            // Einstein portrait profile sketch
            ctx.fillStyle = "#451a03"; // dark coat
            ctx.beginPath();
            ctx.ellipse(195, 140, 25, 32, 0, 0, Math.PI*2);
            ctx.fill();
            // skin head
            ctx.fillStyle = "#ffe0bd";
            ctx.beginPath();
            ctx.arc(195, 110, 18, 0, Math.PI*2);
            ctx.fill();
            // Crazy white hair
            ctx.fillStyle = "#f5f5f5";
            for (let i = 0; i < 8; i++) {
                ctx.beginPath();
                ctx.arc(178 + Math.random()*34, 88 + Math.random()*20, 12, 0, Math.PI*2);
                ctx.fill();
            }
            // Mustache
            ctx.fillStyle = "#f5f5f5";
            ctx.fillRect(188, 118, 14, 3);

            ctx.fillStyle = "#78350f";
            ctx.font = "bold 9px sans-serif";
            ctx.fillText("A. Einstein", 175, 172);

            ctx.fillStyle = "#78350f";
            ctx.font = "italic 11px sans-serif";
            ctx.fillText("Relativity Theory (1915)", 12, 230);
        });
    }

    // Low-poly pine/oak trees outside the right glass windows to enrich window scenery
    buildWindowTrees() {
        const treeGroup = new THREE.Group();
        treeGroup.name = "outside-trees";

        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4e3629, roughness: 0.9 });
        const leafMat = new THREE.MeshStandardMaterial({ color: 0x1b5e20, roughness: 0.8 }); // forest green

        const createOutsideTree = (tx, tz, scale = 1.0) => {
            const singleTree = new THREE.Group();
            singleTree.position.set(tx, 0, tz);
            singleTree.scale.setScalar(scale);

            // Trunk
            const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.22, 2.5, 8), trunkMat);
            trunk.position.y = 1.25;
            trunk.castShadow = true;
            singleTree.add(trunk);

            // Canopy (3 stacked low-poly cones)
            for (let i = 0; i < 3; i++) {
                const cone = new THREE.Mesh(new THREE.ConeGeometry(0.9 - i * 0.18, 1.6, 6), leafMat);
                cone.position.y = 2.0 + i * 0.9;
                cone.castShadow = true;
                singleTree.add(cone);
            }
            treeGroup.add(singleTree);
        };

        // Generate 4 trees along the right lawn outside the windows
        createOutsideTree(25, -9, 1.5);
        createOutsideTree(26, -2, 1.6);
        createOutsideTree(27, 4, 1.4);
        createOutsideTree(25, 11, 1.7);

        this.scene.add(treeGroup);
    }

    // Roll-down projection screen above the front chalkboard
    buildProjectionScreen() {
        const screenGroup = new THREE.Group();
        screenGroup.position.set(0, 5.2, -15.8);

        // 1. Horizontal roll casing
        const caseMat = new THREE.MeshStandardMaterial({ color: 0xdde4eb, roughness: 0.3 });
        const casing = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 6.2, 12), caseMat);
        casing.rotation.z = Math.PI / 2;
        screenGroup.add(casing);

        // 2. Matte-white projection surface
        const surfaceMat = new THREE.MeshStandardMaterial({ color: 0xf5f6f8, roughness: 0.9 });
        const surface = new THREE.Mesh(new THREE.BoxGeometry(5.8, 2.0, 0.015), surfaceMat);
        surface.position.set(0, -1.0, 0.02);
        screenGroup.add(surface);

        // 3. Black bottom handle pull-bar
        const barMat = new THREE.MeshStandardMaterial({ color: 0x212121 });
        const bar = new THREE.Mesh(new THREE.BoxGeometry(5.9, 0.04, 0.04), barMat);
        bar.position.set(0, -2.0, 0.025);
        screenGroup.add(bar);

        this.scene.add(screenGroup);
    }

    // Interactive computer setup on the teacher's desk
    buildComputer() {
        const pcGroup = new THREE.Group();
        pcGroup.position.set(0, 1.54, -11.0); // Sitting flat on teacher's desk

        const plasticMat = new THREE.MeshStandardMaterial({ color: 0x2d3238, roughness: 0.5 });

        // 1. Monitor Screen Frame
        const screenFrame = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.36, 0.03), plasticMat);
        screenFrame.position.set(0, 0.28, -0.2);
        screenFrame.rotation.y = 0.1; // natural angle
        screenFrame.castShadow = true;
        pcGroup.add(screenFrame);

        // Monitor LCD screen pane (glowing mathematical dashboard!)
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#0a0f1d';
        ctx.fillRect(0, 0, 128, 128);
        ctx.fillStyle = '#00f2fe';
        ctx.font = 'bold 12px monospace';
        ctx.fillText("SIMULATION RUN", 10, 25);
        ctx.fillStyle = '#39ff14';
        ctx.font = '8px monospace';
        ctx.fillText("CHAMELEONS: Active", 10, 45);
        ctx.fillText("TARGETS: Active", 10, 60);
        ctx.strokeStyle = '#00f2fe';
        ctx.lineWidth = 1;
        ctx.strokeRect(10, 75, 108, 40);
        ctx.beginPath();
        for (let i = 0; i < 100; i += 10) {
            ctx.lineTo(15 + i, 95 + Math.sin(i * 0.1) * 12);
        }
        ctx.stroke();

        const screenTex = new THREE.CanvasTexture(canvas);
        const lcdMat = new THREE.MeshBasicMaterial({ map: screenTex });
        const lcd = new THREE.Mesh(new THREE.BoxGeometry(0.51, 0.32, 0.005), lcdMat);
        lcd.position.copy(screenFrame.position);
        lcd.rotation.copy(screenFrame.rotation);
        lcd.position.z += 0.016;
        pcGroup.add(lcd);

        // Monitor Base/Stand
        const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.18, 8), plasticMat);
        stand.position.set(0, 0.09, -0.2);
        stand.castShadow = true;
        pcGroup.add(stand);

        const foot = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.02, 0.16), plasticMat);
        foot.position.set(0, 0.01, -0.2);
        pcGroup.add(foot);

        // 2. Keyboard (light grey board)
        const kb = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.012, 0.14), new THREE.MeshStandardMaterial({ color: 0x90a4ae, roughness: 0.7 }));
        kb.position.set(-0.05, 0.01, 0.12);
        kb.rotation.y = 0.06;
        kb.castShadow = true;
        pcGroup.add(kb);

        this.scene.add(pcGroup);
    }

    // Generate 3D humanoid classmate figures sitting and standing around the classroom
    buildHumans() {
        // Classmate 1 (Sitting at Desk Col 1, Row 2: X = -9.0, Z = -2.0)
        const student1 = this.createHumanModel(0xe91e63, 0x3f51b5, 0xffe0bd, 0x795548, true);
        student1.position.set(-9.0, -0.315, -0.68); // Shifted down/back to sit flush on scaled chair
        student1.rotation.y = 0.05;
        this.scene.add(student1);

        // Classmate 2 (Sitting at Desk Col 4, Row 1: X = 9.0, Z = -8.0)
        const student2 = this.createHumanModel(0x00bcd4, 0x212121, 0xe0ac69, 0x1a1a1a, true);
        student2.position.set(9.0, -0.315, -6.68); // Shifted down/back to sit flush on scaled chair
        student2.rotation.y = -0.12;
        this.scene.add(student2);

        // Classmate 3 (Sitting at Desk Col 2, Row 3: X = -3.0, Z = 4.0)
        const student3 = this.createHumanModel(0xffeb3b, 0x4caf50, 0xffe0bd, 0xff9800, true);
        student3.position.set(-3.0, -0.315, 5.32); // Shifted down/back to sit flush on scaled chair
        student3.rotation.y = 0.08;
        this.scene.add(student3);

        // Classmate 4 (Standing near chalkboard: X = -6.0, Z = -13.5)
        const student4 = this.createHumanModel(0x673ab7, 0x607d8b, 0x8d5524, 0x1a1a1a, false);
        student4.position.set(-6.0, 0.0, -13.5);
        student4.rotation.y = 0.6;
        this.scene.add(student4);

        // Bounding Box collider for standing student 4 (Updated to fit 35% taller / 32% wider scale)
        this.colliders.push(new THREE.Box3(
            new THREE.Vector3(-6.46, 0, -13.96),
            new THREE.Vector3(-5.54, 2.43, -13.04)
        ));

        // Classmate 5 (Standing studying calculus poster on left wall: X = -14.2, Z = 4.0)
        const student5 = this.createHumanModel(0xff5722, 0x3f51b5, 0xffe0bd, 0x5c3a21, false);
        student5.position.set(-14.2, 0.0, 4.0);
        student5.rotation.y = Math.PI / 2; // facing wall
        this.scene.add(student5);

        // Bounding Box collider for standing student 5 (Updated to fit 35% taller / 32% wider scale)
        this.colliders.push(new THREE.Box3(
            new THREE.Vector3(-14.66, 0, 3.54),
            new THREE.Vector3(-13.74, 2.43, 4.46)
        ));

        // Teacher (Sitting at Teacher's Desk: X = 0.0, Y = 0.0, Z = -12.5)
        const teacher = this.createHumanModel(0x37474f, 0x263238, 0xe0ac69, 0x212121, true); // sitting teacher
        teacher.position.set(0.0, -0.35, -12.45); // Shifted down/back to sit flush on scaled teacher chair
        teacher.rotation.y = Math.PI; // Face the classroom
        this.scene.add(teacher);
    }

    // Build classroom wooden entry/exit door with a metal frame and brass door handle
    buildDoors() {
        const doorGroup = new THREE.Group();
        doorGroup.position.set(-11.0, 0, 15.90); // Flush on the back wall

        // 1. Outer metal frame (hollow frame: left border, right border, top border)
        const frameMat = new THREE.MeshStandardMaterial({ color: 0x37474f, roughness: 0.5 });
        
        // Left border
        const frameL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 3.3, 0.1), frameMat);
        frameL.position.set(-0.91, 1.65, 0.0);
        doorGroup.add(frameL);

        // Right border
        const frameR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 3.3, 0.1), frameMat);
        frameR.position.set(0.91, 1.65, 0.0);
        doorGroup.add(frameR);

        // Top border
        const frameT = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.08, 0.1), frameMat);
        frameT.position.set(0.0, 3.26, 0.0);
        doorGroup.add(frameT);

        // 2. Door wood leaf (Uses classroom wood material for seamless camouflage target matching)
        const leafMat = this.materials.wood;
        const leaf = new THREE.Mesh(new THREE.BoxGeometry(1.8, 3.2, 0.05), leafMat);
        leaf.position.set(0, 1.6, 0.0);
        leaf.castShadow = true;
        leaf.receiveShadow = true;
        doorGroup.add(leaf);

        // Add 4 realistic wood door panel moldings (inset panels) facing the classroom (negative Z)
        const pOffsets = [
            { x: -0.38, y: 2.38 }, { x: 0.38, y: 2.38 }, // Upper panels
            { x: -0.38, y: 0.82 }, { x: 0.38, y: 0.82 }  // Lower panels
        ];
        pOffsets.forEach(pos => {
            const pPanel = new THREE.Mesh(new THREE.BoxGeometry(0.62, 1.15, 0.012), leafMat);
            pPanel.position.set(pos.x, pos.y, -0.03); // Sitting on classroom-facing side
            pPanel.castShadow = true;
            doorGroup.add(pPanel);
        });

        // Add commercial steel kick plate at bottom of door facing classroom
        const steelMat = new THREE.MeshStandardMaterial({ color: 0x90a4ae, metalness: 0.85, roughness: 0.25 });
        const kickPlate = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.28, 0.005), steelMat);
        kickPlate.position.set(0, 0.16, -0.026); // Sitting on classroom-facing side
        kickPlate.castShadow = true;
        doorGroup.add(kickPlate);

        // 3. Brass door handle/knob (pointing out into the classroom)
        const brassMat = new THREE.MeshStandardMaterial({ color: 0xffd54f, metalness: 0.8, roughness: 0.1 });
        const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.15, 8), brassMat);
        handle.rotation.x = Math.PI / 2;
        // Shifted to the right side of the door and projecting forward
        handle.position.set(0.72, 1.6, -0.06);
        doorGroup.add(handle);

        const lockBase = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), brassMat);
        lockBase.position.set(0.72, 1.6, -0.04);
        doorGroup.add(lockBase);

        // Add metal hinges on the left side
        const hingeGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.12, 8);
        const hingeMat = new THREE.MeshStandardMaterial({ color: 0x5a5c60, metalness: 0.8, roughness: 0.4 });
        const hingeHeights = [0.4, 1.6, 2.8];
        hingeHeights.forEach(hy => {
            const hinge = new THREE.Mesh(hingeGeo, hingeMat);
            hinge.position.set(-0.89, hy, 0.02);
            doorGroup.add(hinge);
        });

        // Add a hydraulic automatic door closer assembly at the top of the door
        const closerBody = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.07, 0.07), hingeMat);
        closerBody.position.set(0.48, 3.12, 0.06);
        closerBody.castShadow = true;
        doorGroup.add(closerBody);

        const closerArm1 = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.28, 6), hingeMat);
        closerArm1.rotation.x = Math.PI / 2;
        closerArm1.position.set(0.48, 3.19, 0.15);
        doorGroup.add(closerArm1);

        this.scene.add(doorGroup);

        // Door Solid Bounding Box Collider
        this.colliders.push(new THREE.Box3(
            new THREE.Vector3(-12.0, 0, 15.8),
            new THREE.Vector3(-10.0, 3.3, 16.0)
        ));
    }

    // Low-poly stylized humanoid model generator (torso/clothes, legs, head, hair, face features, shoes, posable arms/hands)
    createHumanModel(shirtColor, pantsColor, skinColor, hairColor, isSitting = false) {
        const group = new THREE.Group();

        // Materials
        const shirtMat = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.65 });
        const pantsMat = new THREE.MeshStandardMaterial({ color: pantsColor, roughness: 0.75 });
        const skinMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.52 });
        const hairMat = new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.85 });
        const shoeMat = new THREE.MeshStandardMaterial({ color: 0x212121, roughness: 0.6 });
        const shoeSoleMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.8 }); // white soles
        const sockMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85 });

        const torsoY = 1.15; // Ground reference Y

        // 1. Torso - chest/waist box
        const torsoGroup = new THREE.Group();
        torsoGroup.position.y = torsoY;

        // Shirt Body
        const shirtBody = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.46, 0.18), shirtMat);
        shirtBody.castShadow = true;
        shirtBody.receiveShadow = true;
        torsoGroup.add(shirtBody);

        // Hips (pants top)
        const hips = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.12, 0.18), pantsMat);
        hips.position.y = -0.25;
        hips.castShadow = true;
        torsoGroup.add(hips);

        // Shirt sleeves details (shoulder caps)
        const sleeveL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.15, 0.12), shirtMat);
        sleeveL.position.set(-0.19, 0.12, 0);
        sleeveL.rotation.z = 0.12;
        torsoGroup.add(sleeveL);

        const sleeveR = sleeveL.clone();
        sleeveR.position.x = 0.19;
        sleeveR.rotation.z = -0.12;
        torsoGroup.add(sleeveR);

        group.add(torsoGroup);

        // 2. Head & Face Details
        const headGroup = new THREE.Group();
        headGroup.position.set(0, torsoY + 0.38, 0);

        // Neck
        const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.1, 16), skinMat);
        neck.position.y = -0.12;
        headGroup.add(neck);

        // Head shape
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 32, 32), skinMat);
        headGroup.add(head);

        // Face features (facing negative Z direction)
        // Eyes
        const eyeGeo = new THREE.SphereGeometry(0.014, 8, 8);
        const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1 });
        const pupilMat = new THREE.MeshBasicMaterial({ color: 0x111111 });

        const eyeL = new THREE.Mesh(eyeGeo, eyeWhiteMat);
        eyeL.position.set(-0.045, 0.02, -0.125);
        const pupilL = new THREE.Mesh(new THREE.SphereGeometry(0.008, 8, 8), pupilMat);
        pupilL.position.set(0, 0, -0.008);
        eyeL.add(pupilL);
        headGroup.add(eyeL);

        const eyeR = eyeL.clone();
        eyeR.position.x = 0.045;
        headGroup.add(eyeR);

        // Eyebrows
        const browMat = new THREE.MeshBasicMaterial({ color: hairColor });
        const browL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.008, 0.006), browMat);
        browL.position.set(-0.045, 0.06, -0.13);
        browL.rotation.z = 0.08;
        headGroup.add(browL);

        const browR = browL.clone();
        browR.position.x = 0.045;
        browR.rotation.z = -0.08;
        headGroup.add(browR);

        // Nose
        const nose = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.04, 0.022), skinMat);
        nose.position.set(0, -0.015, -0.14);
        headGroup.add(nose);

        // Mouth (Smile)
        const mouthMat = new THREE.MeshBasicMaterial({ color: 0x9e2a2b });
        const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.008, 0.008), mouthMat);
        mouth.position.set(0, -0.05, -0.132);
        headGroup.add(mouth);

        // Ears
        const earL = new THREE.Mesh(new THREE.SphereGeometry(0.022, 12, 12), skinMat);
        earL.position.set(-0.145, 0.0, 0.0);
        headGroup.add(earL);

        const earR = earL.clone();
        earR.position.x = 0.145;
        headGroup.add(earR);

        // Stylized haircut (clean low-poly mesh block look!)
        const hairGroup = new THREE.Group();
        hairGroup.position.set(0, 0.02, 0.02);

        // Base hair cap covering back/sides
        const hairCap = new THREE.Mesh(new THREE.SphereGeometry(0.143, 24, 24), hairMat);
        hairCap.scale.set(1.02, 1.05, 1.05);
        hairGroup.add(hairCap);

        // Sideburns/fringe block
        const hairFringe = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, 0.14), hairMat);
        hairFringe.position.set(0, 0.05, -0.06);
        hairGroup.add(hairFringe);

        // Swooping bangs detail
        const hairBangs = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.08, 0.06), hairMat);
        hairBangs.position.set(0, 0.03, -0.12);
        hairBangs.rotation.x = 0.15;
        hairGroup.add(hairBangs);

        headGroup.add(hairGroup);
        group.add(headGroup);

        // 3. Posable Arms & Hands (Hierarchical modeling!)
        // Left Arm Group
        const armLGroup = new THREE.Group();
        armLGroup.position.set(-0.20, torsoY + 0.12, 0.0);

        // Left Upper Arm
        const upperArmL = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.18, 12), skinMat);
        upperArmL.position.y = -0.09;
        armLGroup.add(upperArmL);

        // Left Forearm Group (attached at bottom of upper arm)
        const foreArmLGroup = new THREE.Group();
        foreArmLGroup.position.y = -0.18;

        const foreArmL = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.028, 0.18, 12), skinMat);
        foreArmL.position.y = -0.09;
        foreArmLGroup.add(foreArmL);

        // Left Hand (attached at bottom of forearm)
        const handL = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 16), skinMat);
        handL.position.y = -0.18;
        foreArmLGroup.add(handL);

        armLGroup.add(foreArmLGroup);
        group.add(armLGroup);

        // Right Arm Group
        const armRGroup = new THREE.Group();
        armRGroup.position.set(0.20, torsoY + 0.12, 0.0);

        // Right Upper Arm
        const upperArmR = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.18, 12), skinMat);
        upperArmR.position.y = -0.09;
        armRGroup.add(upperArmR);

        // Right Forearm Group
        const foreArmRGroup = new THREE.Group();
        foreArmRGroup.position.y = -0.18;

        const foreArmR = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.028, 0.18, 12), skinMat);
        foreArmR.position.y = -0.09;
        foreArmRGroup.add(foreArmR);

        // Right Hand
        const handR = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 16), skinMat);
        handR.position.y = -0.18;
        foreArmRGroup.add(handR);

        armRGroup.add(foreArmRGroup);
        group.add(armRGroup);

        // Posable posing
        if (isSitting) {
            // Left Arm posable angle (positive X tilts it forward!)
            armLGroup.rotation.set(0.6, 0, -0.05);
            foreArmLGroup.rotation.set(1.2, 0.0, 0);

            // Right Arm posable angle (positive X tilts it forward!)
            armRGroup.rotation.set(0.6, 0, 0.05);
            foreArmRGroup.rotation.set(1.2, 0.0, 0);
        } else {
            // Standing pose
            armLGroup.rotation.set(0, 0, 0.08);
            foreArmLGroup.rotation.set(0.1, 0, 0);

            armRGroup.rotation.set(0, 0, -0.08);
            foreArmRGroup.rotation.set(0.1, 0, 0);
        }

        // 4. Legs & Shoes
        const legLGroup = new THREE.Group();
        const legRGroup = new THREE.Group();

        if (isSitting) {
            legLGroup.position.set(-0.09, 0.9, 0.0);
            legRGroup.position.set(0.09, 0.9, 0.0);

            // Thighs: horizontal forward
            const thighL = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.05, 0.38, 16), pantsMat);
            thighL.position.z = -0.19;
            thighL.rotation.x = -Math.PI / 2;
            legLGroup.add(thighL);

            const thighR = thighL.clone();
            legRGroup.add(thighR);

            // Calves: vertical down from knee
            const calfL = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.042, 0.82, 16), pantsMat);
            calfL.position.set(0, -0.41, -0.38);
            legLGroup.add(calfL);

            const calfR = calfL.clone();
            legRGroup.add(calfR);

            // Shoes (flush on floor at Y = 0)
            const shoeL = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.06, 0.15), shoeMat);
            shoeL.position.set(0, -0.82, -0.40);
            legLGroup.add(shoeL);

            const soleL = new THREE.Mesh(new THREE.BoxGeometry(0.096, 0.02, 0.156), shoeSoleMat);
            soleL.position.set(0, -0.85, -0.40);
            legLGroup.add(soleL);

            const shoeR = shoeL.clone();
            shoeR.position.x = 0;
            legRGroup.add(shoeR);

            const soleR = soleL.clone();
            soleR.position.x = 0;
            legRGroup.add(soleR);
        } else {
            // Standing Legs
            legLGroup.position.set(-0.09, 0.86, 0.0);
            legRGroup.position.set(0.09, 0.86, 0.0);

            // Thigh
            const thighL = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.05, 0.40, 16), pantsMat);
            thighL.position.y = -0.20;
            legLGroup.add(thighL);

            const thighR = thighL.clone();
            legRGroup.add(thighR);

            // Calf
            const calfL = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.042, 0.38, 16), pantsMat);
            calfL.position.y = -0.59;
            legLGroup.add(calfL);

            const calfR = calfL.clone();
            legRGroup.add(calfR);

            // Socks
            const sockL = new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.046, 0.08, 16), sockMat);
            sockL.position.set(0, -0.78, 0.04);
            legLGroup.add(sockL);

            const sockR = sockL.clone();
            legRGroup.add(sockR);

            // Shoes
            const shoeL = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.06, 0.15), shoeMat);
            shoeL.position.set(0, -0.82, 0.04);
            legLGroup.add(shoeL);

            const soleL = new THREE.Mesh(new THREE.BoxGeometry(0.096, 0.02, 0.156), shoeSoleMat);
            soleL.position.set(0, -0.85, 0.04);
            legLGroup.add(soleL);

            const shoeR = shoeL.clone();
            shoeR.position.x = 0;
            legRGroup.add(shoeR);

            const soleR = soleL.clone();
            soleR.position.x = 0;
            legRGroup.add(soleR);
        }

        group.add(legLGroup);
        group.add(legRGroup);

        // Scale up human model by 32% wider (X, Z) and 35% taller (Y)
        group.scale.set(1.32, 1.35, 1.32);

        return group;
    }

    // Build wall features: electrical outlets/sockets, light switches, and a cork bulletin board
    buildWallDetails() {
        const wallDetailsGroup = new THREE.Group();
        wallDetailsGroup.name = "wall-details";

        const outletMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.3 });
        const socketMat = new THREE.MeshStandardMaterial({ color: 0x37474f, roughness: 0.8 });

        // Helper: Create an outlet flat on a wall
        const createOutlet = (x, y, z, rotY) => {
            const outGroup = new THREE.Group();
            outGroup.position.set(x, y, z);
            outGroup.rotation.y = rotY;

            // Plate
            const plate = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.15, 0.02), outletMat);
            outGroup.add(plate);

            // Sockets
            const s1 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.01), socketMat);
            s1.position.set(0, 0.03, 0.01);
            outGroup.add(s1);

            const s2 = s1.clone();
            s2.position.y = -0.03;
            outGroup.add(s2);

            wallDetailsGroup.add(outGroup);
        };

        // Spawn outlets along wall base levels
        createOutlet(-15.93, 1.0, -10.0, Math.PI / 2);
        createOutlet(-15.93, 1.0, 10.0, Math.PI / 2);
        createOutlet(15.93, 1.0, -9.0, -Math.PI / 2);
        createOutlet(15.93, 1.0, 9.0, -Math.PI / 2);
        createOutlet(-6.0, 1.0, -15.93, 0); // front wall left
        createOutlet(6.0, 1.0, -15.93, 0);  // front wall right
        createOutlet(5.0, 1.0, 15.93, Math.PI); // back wall right

        // Cork Bulletin Board (Left Wall, Z = -6.0) next to bookshelf
        const boardGroup = new THREE.Group();
        boardGroup.position.set(-15.93, 3.2, -6.0);
        boardGroup.rotation.y = Math.PI / 2;

        // Frame
        const bFrame = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.3, 0.06), this.materials.darkWood);
        boardGroup.add(bFrame);

        // Cork base
        const corkMat = new THREE.MeshStandardMaterial({ color: 0xa1887f, roughness: 0.95 }); // cork brown
        const cork = new THREE.Mesh(new THREE.BoxGeometry(1.68, 1.18, 0.05), corkMat);
        boardGroup.add(cork);

        // Colored paper notes pinned to board
        const noteColors = [0xffeb3b, 0x00bcd4, 0xe91e63, 0x4caf50];
        for (let i = 0; i < 6; i++) {
            const noteMat = new THREE.MeshStandardMaterial({ color: noteColors[i % noteColors.length], roughness: 0.7 });
            const note = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 0.01), noteMat);
            
            // Random placement on cork board
            const nx = -0.6 + i * 0.24 + (Math.random() - 0.5) * 0.05;
            const ny = (i % 2 === 0 ? 0.2 : -0.2) + (Math.random() - 0.5) * 0.05;
            note.position.set(nx, ny, 0.035);
            note.rotation.z = (Math.random() - 0.5) * 0.2; // slight tilt
            boardGroup.add(note);
        }

        wallDetailsGroup.add(boardGroup);
        this.scene.add(wallDetailsGroup);
    }

    // Volumetric metal AC ducts and spinning ceiling fans
    buildACDuctsAndFans() {
        const ductMat = new THREE.MeshStandardMaterial({
            color: 0xb0bec5, // light grey-blue galvanized steel duct
            roughness: 0.28,
            metalness: 0.72
        });
        const bracketMat = new THREE.MeshStandardMaterial({ color: 0x37474f, roughness: 0.5 });

        // 1. AC Ventilation Ducts (Left Wall corner & Right Wall corner near ceiling)
        const ductL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 31.8), ductMat);
        ductL.position.set(-15.0, 7.6, 0.0);
        this.scene.add(ductL);

        const ductR = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 31.8), ductMat);
        ductR.position.set(15.0, 7.6, 0.0);
        this.scene.add(ductR);

        // Duct brackets & vents details
        for (let z = -14.0; z <= 14.0; z += 6.0) {
            const braceL = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.44, 0.05), bracketMat);
            braceL.position.set(-15.0, 7.6, z);
            this.scene.add(braceL);

            const braceR = braceL.clone();
            braceR.position.x = 15.0;
            this.scene.add(braceR);

            const ventL = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.04, 10), bracketMat);
            ventL.position.set(-15.0, 7.38, z + 2.0);
            this.scene.add(ventL);

            const ventR = ventL.clone();
            ventR.position.x = 15.0;
            this.scene.add(ventR);
        }

        // 2. Ceiling Fans (4 fans distributed symmetrically hanging from Y = 8.0 ceiling)
        this.ceilingFans = [];
        const fanPositions = [
            { x: -5.0, z: -6.0 },
            { x: 5.0, z: -6.0 },
            { x: -5.0, z: 6.0 },
            { x: 5.0, z: 6.0 }
        ];

        const fanMat = new THREE.MeshStandardMaterial({
            color: 0x37474f,
            roughness: 0.45,
            metalness: 0.4
        });

        fanPositions.forEach(pos => {
            const fanGroup = new THREE.Group();
            fanGroup.position.set(pos.x, CONFIG.roomHeight, pos.z);

            // Ceiling Canopy (realistic mounting cup)
            const canopy = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.08, 16), fanMat);
            canopy.position.y = -0.04;
            canopy.rotation.x = Math.PI; // inverted cone
            fanGroup.add(canopy);

            // Vertical hanging downrod
            const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.65, 8), fanMat);
            rod.position.y = -0.325;
            fanGroup.add(rod);

            // Central rotating motor hub
            const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.12, 12), fanMat);
            hub.position.y = -0.65;
            fanGroup.add(hub);

            // 3 rotating blade meshes
            const bladesGroup = new THREE.Group();
            bladesGroup.position.y = -0.65;

            for (let b = 0; b < 3; b++) {
                const bladePivot = new THREE.Group();
                bladePivot.rotation.y = (b * Math.PI * 2) / 3;

                // Metal blade bracket/arm connecting hub to blade
                const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.014, 0.03), new THREE.MeshStandardMaterial({ color: 0xb0bec5, metalness: 0.8 }));
                bracket.position.x = 0.14;
                bladePivot.add(bracket);

                // Aerofoil tapered fan blade
                const blade = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.008, 0.12), fanMat);
                blade.position.x = 0.52; // splayed outward
                blade.rotation.x = 0.08; // realistic pitched angle to push air!
                bladePivot.add(blade);

                bladesGroup.add(bladePivot);
            }

            fanGroup.add(bladesGroup);
            this.scene.add(fanGroup);
            this.ceilingFans.push(bladesGroup);
        });
    }

    // Lightweight animation loop for fans
    update(delta) {
        if (this.ceilingFans) {
            this.ceilingFans.forEach(fan => {
                fan.rotation.y += 2.8 * delta;
            });
        }
    }

    // Helper: Collision detection check for the player (Zero GC allocations for butter-smooth movement)
    checkCollision(newPosition, radius) {
        const feetY = newPosition.y - CONFIG.playerHeight;
        _minVec.set(newPosition.x - radius, feetY + 0.4, newPosition.z - radius);
        _maxVec.set(newPosition.x + radius, feetY + 1.7, newPosition.z + radius);
        _playerBox.set(_minVec, _maxVec);

        for (let i = 0; i < this.colliders.length; i++) {
            if (_playerBox.intersectsBox(this.colliders[i])) {
                return true; // Collision detected
            }
        }
        return false; // No collision
    }
}
export default Environment;
