// Character Mesh Generators - Curvy 3D Math Symbols, 3D Ramanujan Sage, and Click Helpers
import * as THREE from 'three';
import ramanujanImg from '../ramanujan.jpg';

export class CharacterFactory {

    // Helper: Build a curvy 3D mathematical symbol geometry using cylinders and spheres
    static createMathSymbol(symbolName, material) {
        const group = new THREE.Group();
        group.name = "symbol-mesh";

        const radius = 0.046; // Perfect thickness: clearly visible while blending beautifully

        // Helper: Create a smooth cylinder strut with rounded spherical caps at endpoints
        const drawSmoothStrut = (x1, y1, z1, x2, y2, z2) => {
            const start = new THREE.Vector3(x1, y1, z1);
            const end = new THREE.Vector3(x2, y2, z2);
            const distance = start.distanceTo(end);
            
            const segmentGroup = new THREE.Group();
            
            // Sphere cap at start
            const capStart = new THREE.Mesh(new THREE.SphereGeometry(radius, 16, 16), material);
            capStart.position.copy(start);
            capStart.castShadow = true;
            capStart.receiveShadow = true;
            segmentGroup.add(capStart);
            
            // Sphere cap at end
            const capEnd = new THREE.Mesh(new THREE.SphereGeometry(radius, 16, 16), material);
            capEnd.position.copy(end);
            capEnd.castShadow = true;
            capEnd.receiveShadow = true;
            segmentGroup.add(capEnd);
            
            // Connecting cylinder
            if (distance > 0.001) {
                const cylGeo = new THREE.CylinderGeometry(radius, radius, distance, 16);
                const cyl = new THREE.Mesh(cylGeo, material);
                
                // Position in the middle of start and end
                const pos = start.clone().add(end).multiplyScalar(0.5);
                cyl.position.copy(pos);
                
                // Align cylinder axis along the vector path
                const direction = new THREE.Vector3().subVectors(end, start).normalize();
                const upVec = new THREE.Vector3(0, 1, 0);
                cyl.quaternion.setFromUnitVectors(upVec, direction);
                
                cyl.castShadow = true;
                cyl.receiveShadow = true;
                segmentGroup.add(cyl);
            }
            
            group.add(segmentGroup);
        };

        if (symbolName === 'π') {
            // Horizontal top bar
            drawSmoothStrut(-0.32, 0.75, 0, 0.32, 0.75, 0);
            // Left leg
            drawSmoothStrut(-0.16, 0.75, 0, -0.16, 0.15, 0);
            // Right leg
            drawSmoothStrut(0.16, 0.75, 0, 0.16, 0.25, 0);
            // Right hook foot detail
            drawSmoothStrut(0.16, 0.25, 0, 0.26, 0.20, 0);
        }
        else if (symbolName === 'Σ') {
            // Top horizontal bar
            drawSmoothStrut(-0.25, 0.8, 0, 0.22, 0.8, 0);
            // Bottom horizontal bar
            drawSmoothStrut(-0.25, 0.1, 0, 0.22, 0.1, 0);
            // Upper diagonal slant to inner center vertex
            drawSmoothStrut(-0.25, 0.8, 0, 0.08, 0.45, 0);
            // Lower diagonal slant to inner center vertex
            drawSmoothStrut(-0.25, 0.1, 0, 0.08, 0.45, 0);
        }
        else if (symbolName === 'κ') {
            // Left vertical trunk
            drawSmoothStrut(-0.16, 0.75, 0, -0.16, 0.15, 0);
            // Upper diagonal arm
            drawSmoothStrut(-0.16, 0.45, 0, 0.18, 0.75, 0);
            // Lower diagonal leg
            drawSmoothStrut(-0.16, 0.45, 0, 0.18, 0.15, 0);
        }
        else if (symbolName === 'θ') {
            // Theta loop drawn as connected thin segments along ellipse
            const segments = 24;
            const points = [];
            for (let i = 0; i <= segments; i++) {
                const t = (i / segments) * Math.PI * 2;
                const x = 0.22 * Math.cos(t);
                const y = 0.45 + 0.3 * Math.sin(t);
                points.push(new THREE.Vector3(x, y, 0));
            }
            for (let i = 0; i < segments; i++) {
                drawSmoothStrut(points[i].x, points[i].y, points[i].z, points[i+1].x, points[i+1].y, points[i+1].z);
            }
            // Center bar
            drawSmoothStrut(-0.2, 0.45, 0, 0.2, 0.45, 0);
        }
        else if (symbolName === '∞') {
            // Infinity loops drawn as connected thin segments along Lissajous curve
            const segments = 32;
            const points = [];
            for (let i = 0; i <= segments; i++) {
                const t = (i / segments) * Math.PI * 2;
                const x = 0.38 * Math.sin(t);
                const y = 0.45 + 0.18 * Math.sin(2 * t);
                points.push(new THREE.Vector3(x, y, 0));
            }
            for (let i = 0; i < segments; i++) {
                drawSmoothStrut(points[i].x, points[i].y, points[i].z, points[i+1].x, points[i+1].y, points[i+1].z);
            }
        }
        else if (symbolName === 'Δ') {
            // Delta (Triangle)
            drawSmoothStrut(-0.25, 0.15, 0, 0.25, 0.15, 0);
            drawSmoothStrut(-0.25, 0.15, 0, 0, 0.75, 0);
            drawSmoothStrut(0.25, 0.15, 0, 0, 0.75, 0);
        }
        else if (symbolName === 'Ω') {
            // Omega (Arch connected seamlessly to left and right feet)
            drawSmoothStrut(-0.35, 0.18, 0, -0.16, 0.18, 0);
            drawSmoothStrut(0.16, 0.18, 0, 0.35, 0.18, 0);
            const segments = 20;
            const points = [];
            const startAngle = Math.PI + 0.88; // ~230 degrees
            const endAngle = -0.88;            // ~-50 degrees
            const cx = 0;
            const cy = 0.38;
            const r = 0.256;
            for (let i = 0; i <= segments; i++) {
                const a = startAngle + (i / segments) * (endAngle - startAngle);
                const x = cx + r * Math.cos(a);
                const y = cy + r * Math.sin(a);
                points.push(new THREE.Vector3(x, y, 0));
            }
            for (let i = 0; i < segments; i++) {
                drawSmoothStrut(points[i].x, points[i].y, points[i].z, points[i+1].x, points[i+1].y, points[i+1].z);
            }
        }
        else if (symbolName === 'λ') {
            // Lambda (Main diagonal stroke + branching left leg)
            // Main long stroke from top-left to bottom-right
            drawSmoothStrut(-0.16, 0.78, 0, 0.22, 0.15, 0);
            // Branch stroke from bottom-left up to intersect main stroke
            drawSmoothStrut(-0.24, 0.15, 0, 0.0, 0.52, 0);
        }

        return group;
    }

    // Helper: Build a cute, soft-featured 3D model of Srinivasa Ramanujan
    static createRamanujanModel(goldMat) {
        const group = new THREE.Group();

        // 1. Torso/Coat (academic suit jacket style)
        const suitMat = new THREE.MeshStandardMaterial({
            color: 0xdddddd, // Light cream/grey coat
            roughness: 0.65,
            metalness: 0.05
        });
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.58, 16), suitMat);
        body.position.y = 0.29;
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);

        // 2. Collar & Shirt (white neck collar sleeve)
        const whiteMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.8
        });
        const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.13, 0.08, 16), whiteMat);
        collar.position.y = 0.58;
        group.add(collar);

        // 3. Head (Sphere with soft peach/golden skin)
        const skinMat = new THREE.MeshStandardMaterial({
            color: 0xc68b59, // Warm skin tone
            roughness: 0.5
        });
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 16), skinMat);
        head.position.y = 0.73;
        head.castShadow = true;
        group.add(head);

        // 4. Combed-Back Wavy Hair (Using overlapping dark spheres for a soft stylized human look)
        const hairMat = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a, // Dark wavy hair
            roughness: 0.9
        });
        
        // Hair top/back
        const hairBack = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), hairMat);
        hairBack.position.set(0, 0.77, -0.06);
        group.add(hairBack);

        // Hair top/front
        const hairFront = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 12), hairMat);
        hairFront.position.set(0, 0.83, 0.02);
        group.add(hairFront);

        // Hair side left
        const hairLeft = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 10), hairMat);
        hairLeft.position.set(-0.11, 0.76, -0.03);
        group.add(hairLeft);

        // Hair side right
        const hairRight = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 10), hairMat);
        hairRight.position.set(0.11, 0.76, -0.03);
        group.add(hairRight);

        // 5. Realistic Face Features (eyeballs, pupils, eyebrows, nose, mouth/lips)
        const eyeballMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1 });
        const pupilMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.3 });
        const browMat = new THREE.MeshStandardMaterial({ color: 0x212121, roughness: 0.9 });
        const lipMat = new THREE.MeshStandardMaterial({ color: 0xd32f2f, roughness: 0.6 }); // red lips

        // Eyeballs (facing positive Z)
        const eyeballL = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 8), eyeballMat);
        eyeballL.position.set(-0.055, 0.76, 0.14);
        group.add(eyeballL);

        const eyeballR = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 8), eyeballMat);
        eyeballR.position.set(0.055, 0.76, 0.14);
        group.add(eyeballR);

        // Pupils
        const pupilL = new THREE.Mesh(new THREE.SphereGeometry(0.01, 8, 8), pupilMat);
        pupilL.position.set(-0.055, 0.76, 0.158);
        group.add(pupilL);

        const pupilR = new THREE.Mesh(new THREE.SphereGeometry(0.01, 8, 8), pupilMat);
        pupilR.position.set(0.055, 0.76, 0.158);
        group.add(pupilR);

        // Eyebrows
        const browL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.012, 0.01), browMat);
        browL.position.set(-0.055, 0.79, 0.145);
        browL.rotation.z = 0.08;
        group.add(browL);

        const browR = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.012, 0.01), browMat);
        browR.position.set(0.055, 0.79, 0.145);
        browR.rotation.z = -0.08;
        group.add(browR);

        // Nose
        const nose = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 8), skinMat);
        nose.position.set(0, 0.725, 0.155);
        group.add(nose);

        // Mouth/Lips
        const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.014, 0.015), lipMat);
        mouth.position.set(0, 0.675, 0.146);
        group.add(mouth);

        // 6. Ramanujan's Iconic Math Notebook (pages + red folder cover)
        const noteMat = new THREE.MeshStandardMaterial({
            color: 0xfffdd0, // Creamy paper page
            roughness: 0.8
        });
        const notebook = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.18, 0.03), noteMat);
        notebook.rotation.set(0.2, -0.5, 0.3); // Tilted in hand
        notebook.position.set(0.15, 0.32, 0.16);
        notebook.castShadow = true;
        group.add(notebook);

        const coverMat = new THREE.MeshStandardMaterial({ color: 0xb71c1c, roughness: 0.5 });
        const cover = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.19, 0.01), coverMat);
        cover.position.copy(notebook.position);
        cover.rotation.copy(notebook.rotation);
        cover.position.z -= 0.01;
        cover.castShadow = true;
        group.add(cover);

        // 7. Ears
        const earGeo = new THREE.SphereGeometry(0.024, 8, 8);
        const earL = new THREE.Mesh(earGeo, skinMat);
        earL.position.set(-0.165, 0.73, 0);
        group.add(earL);

        const earR = earL.clone();
        earR.position.x = 0.165;
        group.add(earR);

        // 8. Arms & Hands (Jacket-colored sleeves + skin-toned hands holding notebook)
        const armGeo = new THREE.CylinderGeometry(0.042, 0.032, 0.28, 8);
        const handGeo = new THREE.SphereGeometry(0.03, 8, 8);

        // Left Arm (holding notebook from below)
        const armL = new THREE.Mesh(armGeo, suitMat);
        armL.position.set(-0.18, 0.35, 0.06);
        armL.rotation.z = 0.25;
        armL.rotation.x = -0.4;
        armL.castShadow = true;
        group.add(armL);

        const handL = new THREE.Mesh(handGeo, skinMat);
        handL.position.set(-0.21, 0.23, 0.14);
        group.add(handL);

        // Right Arm (reaching for the notebook)
        const armR = new THREE.Mesh(armGeo, suitMat);
        armR.position.set(0.18, 0.38, 0.08);
        armR.rotation.z = -0.45;
        armR.rotation.x = -0.55;
        armR.castShadow = true;
        group.add(armR);

        const handR = new THREE.Mesh(handGeo, skinMat);
        handR.position.set(0.13, 0.26, 0.18);
        group.add(handR);

        // 9. Golden Halo of mathematical genius floating over head
        const haloMat = new THREE.MeshStandardMaterial({
            color: 0xffb703,
            emissive: 0xffb703,
            emissiveIntensity: 0.45,
            metalness: 0.9,
            roughness: 0.1
        });
        const halo = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.016, 8, 24), haloMat);
        halo.rotation.x = Math.PI / 2;
        halo.position.set(0, 0.96, 0);
        group.add(halo);

        return group;
    }

    // Generates a 3D Camouflaged Math Symbol target
    static createChameleon(symbolName) {
        const group = new THREE.Group();
        group.name = "chameleon";

        // Base Camouflage Material (will be cloned and overwritten by camouflage.js)
        const camoMat = new THREE.MeshStandardMaterial({
            color: 0x666666,
            roughness: 0.5,
            metalness: 0.5
        });

        // Generate the curvy math symbol mesh
        const symbolMesh = this.createMathSymbol(symbolName, camoMat);
        symbolMesh.position.y = -0.15; // Shift down flush so the bottom rests on surface!
        group.add(symbolMesh);

        // Gather all meshes for material mapping
        const blendParts = [];
        symbolMesh.traverse(child => {
            if (child.isMesh) {
                blendParts.push(child);
            }
        });

        // CLICK RADAR DETECTOR (Enlarged click zone to 2.4m cube for easy clicking)
        const hitHelper = new THREE.Mesh(
            new THREE.BoxGeometry(2.4, 2.4, 2.4),
            new THREE.MeshBasicMaterial({
                color: 0x00f2fe,
                transparent: true,
                opacity: 0.0 // Fully invisible but raycastable
            })
        );
        hitHelper.position.set(0, 0.5, 0);
        group.add(hitHelper);

        // Store references
        group.userData = {
            blendParts: blendParts,
            interactionMesh: hitHelper,
            symbolName: symbolName,
            found: false
        };

        return group;
    }

    // Generates a Srinivasa Ramanujan framed photo portrait
    static createRamanujanPhoto() {
        const group = new THREE.Group();
        group.name = "sage"; // matches gameManager target identifier

        // Frame dimensions: compact size (0.45m wide, 0.58m high, 0.015m deep)
        const frameWidth = 0.45;
        const frameHeight = 0.58;
        const depth = 0.015;

        // 1. Dark wood frame casing
        const frameMat = new THREE.MeshStandardMaterial({
            color: 0x2d1b0f, // dark mahogany wood tone
            roughness: 0.6
        });
        const frame = new THREE.Mesh(new THREE.BoxGeometry(frameWidth, frameHeight, depth), frameMat);
        frame.castShadow = true;
        frame.receiveShadow = true;
        group.add(frame);

        // 2. White mat board inset
        const matMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.9 });
        const matMesh = new THREE.Mesh(new THREE.BoxGeometry(frameWidth - 0.05, frameHeight - 0.05, depth + 0.002), matMat);
        group.add(matMesh);

        // 3. Load actual high-quality image of Srinivasa Ramanujan (Vite compiled asset)
        const loader = new THREE.TextureLoader();
        loader.setCrossOrigin("anonymous"); // Enable CORS
        
        const portraitTex = loader.load(ramanujanImg);
        portraitTex.colorSpace = THREE.SRGBColorSpace; // correct sRGB color profile mapping
        
        const portraitMat = new THREE.MeshStandardMaterial({
            map: portraitTex,
            roughness: 0.3,
            metalness: 0.1
        });

        const portraitMesh = new THREE.Mesh(new THREE.BoxGeometry(frameWidth - 0.10, frameHeight - 0.10, depth + 0.004), portraitMat);
        group.add(portraitMesh);

        // Click interaction helper (invisible click box)
        const clickMat = new THREE.MeshBasicMaterial({ visible: false });
        const clickMesh = new THREE.Mesh(new THREE.BoxGeometry(frameWidth + 0.08, frameHeight + 0.08, 0.05), clickMat);
        group.add(clickMesh);
        
        // Store variables
        group.userData = {
            blendParts: [frame, matMesh, portraitMesh],
            symbolInfo: { name: "Srinivasa Ramanujan Portrait" },
            interactionMesh: clickMesh,
            found: false
        };

        return group;
    }

    // Tick animations for floating and rotations (Static now)
    static animateCharacters(characters, delta, elapsed) {
        // No-op: Keep symbols completely static resting on their surfaces
    }
}
export default CharacterFactory;
