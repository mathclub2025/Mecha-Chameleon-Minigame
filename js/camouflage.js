// Classroom Camouflage Material Assignment and Blending System
import * as THREE from 'three';

export class CamouflageManager {
    
    // Applies material camouflage to all parts of the mathematical symbol
    static applyCamouflage(character, spawnPoint, environmentMaterials) {
        const parts = character.userData.blendParts;
        if (!parts || parts.length === 0) return;

        const color = spawnPoint.hostColor;
        const type = spawnPoint.hostType;

        let baseMaterial;

        // CRITICAL UPDATE: Inherit actual textures, bumpMaps, and roughness from classroom assets
        if (environmentMaterials) {
            switch (type) {
                case 'wood':
                    baseMaterial = environmentMaterials.wood.clone();
                    break;
                case 'darkWood':
                    baseMaterial = environmentMaterials.darkWood.clone();
                    break;
                case 'blackboard':
                    baseMaterial = environmentMaterials.blackboard.clone();
                    break;
                case 'wall':
                    baseMaterial = environmentMaterials.wall.clone();
                    
                    // Create dynamic vertical gradient texture to match wall bands at exact heights!
                    const canvas = document.createElement('canvas');
                    canvas.width = 16;
                    canvas.height = 256;
                    const ctx = canvas.getContext('2d');

                    // Calculate the world Y bounds of this symbol
                    const targetScale = spawnPoint.scale * 0.95;
                    const approxHeight = 0.8 * targetScale;
                    const yMin = spawnPoint.position.y - approxHeight / 2;
                    const yMax = spawnPoint.position.y + approxHeight / 2;

                    // Fill canvas with color bands based on world Y
                    for (let i = 0; i < 256; i++) {
                        const ratio = i / 255;
                        // V coordinate goes from 0 (bottom) to 1 (top). So yWorld runs from yMin to yMax
                        const yWorld = yMin + ratio * (yMax - yMin);

                        let colorStr = '#ebdcb9'; // default wall cream
                        if (yWorld <= 0.22) {
                            colorStr = '#1f4a56'; // baseboard blue/black
                        } else if (yWorld >= 1.34 && yWorld <= 1.46) {
                            colorStr = '#8b2635'; // chair rail red
                        }

                        ctx.fillStyle = colorStr;
                        ctx.fillRect(0, 255 - i, 16, 1); // Draw row from top-down
                    }

                    const gradientTexture = new THREE.CanvasTexture(canvas);
                    gradientTexture.wrapS = THREE.ClampToEdgeWrapping;
                    gradientTexture.wrapT = THREE.ClampToEdgeWrapping;

                    baseMaterial.map = gradientTexture;
                    baseMaterial.color.setHex(0xffffff); // reset color tint to white so texture colors show exactly!
                    break;
                case 'floor':
                    baseMaterial = environmentMaterials.floor.clone();
                    break;
                case 'ceiling':
                    baseMaterial = environmentMaterials.ceiling.clone();
                    break;
                case 'metal':
                    baseMaterial = environmentMaterials.metal.clone();
                    break;
                case 'cabinetMetal':
                    baseMaterial = environmentMaterials.cabinetMetal.clone();
                    break;
                case 'shadow':
                    baseMaterial = new THREE.MeshStandardMaterial({
                        color: color,
                        roughness: 1.0,
                        metalness: 0.0
                    });
                    break;
                default:
                    baseMaterial = new THREE.MeshStandardMaterial({
                        color: color,
                        roughness: 0.8,
                        metalness: 0.05
                    });
            }
        } else {
            // Fallback if materials list is not loaded
            baseMaterial = new THREE.MeshStandardMaterial({
                color: color,
                roughness: 0.7,
                metalness: 0.2
            });
        }

        // Apply exact point-to-point color matching to background host color
        if (color !== undefined) {
            // Do not override wood/darkWood/blackboard/wall colors because their texture maps are pre-colored
            // and multiplying them by hostColor turns them black or distorts them!
            if (type !== 'wood' && type !== 'darkWood' && type !== 'blackboard' && type !== 'wall') {
                baseMaterial.color.setHex(color);
            }
            // Remove color map for floor to prevent checkered color mismatch,
            // but RETAIN maps for wall and ceiling so their stipple/grid patterns blend seamlessly!
            if (type === 'floor') {
                baseMaterial.map = null;
            }
        }

        // NO BLINKING OR SCI-FI SHIMMERS
        baseMaterial.emissive = new THREE.Color(0x000000);
        baseMaterial.emissiveIntensity = 0.0;

        // Assign the camo material to all parts of the symbol mesh
        parts.forEach(part => {
            part.material = baseMaterial;
        });

        character.userData.camoMaterial = baseMaterial;
    }

    // Animate camouflage shimmers (No-op)
    static updateCamoEffects(characters, elapsed) {
        // No-op: Symbols are statically camouflaged.
    }

    // Reverts camouflage when found (reveals the 3D symbol in bright glowing orange)
    static revealCharacter(character) {
        const parts = character.userData.blendParts;
        if (!parts) return;

        const revealMat = new THREE.MeshStandardMaterial({
            color: 0xff3c00, // Safety Orange
            metalness: 0.8,
            roughness: 0.1,
            emissive: 0xff2a00,
            emissiveIntensity: 0.5
        });

        parts.forEach(part => {
            part.material = revealMat;
        });
    }
}
export default CamouflageManager;
