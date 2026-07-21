// Game Configurations and Predefined Spacious Classroom Hiding Spots

export const CONFIG = {
    // Game Rules
    gameDuration: 45, // seconds
    chameleonsToSpawn: 8,
    wrongClickPenalty: 0,
    missedPenalty: 50,
    foundChameleonScore: 100,
    foundSageScore: 150,
    timeScoreMultiplier: 10,
    sageTimeBonus: 15,

    // Player Physics
    playerSpeed: 8.5,
    playerRunMultiplier: 1.5,
    playerHeight: 1.8,
    playerRadius: 0.22,
    interactionDistance: 45.0,
    fov: 75,

    // Large Spacious Classroom
    roomWidth: 32,
    roomLength: 32,
    roomHeight: 8,
};

// Famous mathematician representing the Sage
export const MATHEMATICAL_SAGES = [
    { symbol: "ramanujan", name: "Srinivasa Ramanujan" }
];

// Predefined 75 Classroom Hiding Spots with Category classification
// Categories: "wall" | "furniture" (cupboards/blackboard) | "table" | "floor" | "ceiling"
export const SPAWN_POINTS = [
    // --- 1. Blackboard & Easel Area (Front Wall) ---
    {
        id: "blackboard-behind-frame-left",
        name: "On the Front Wall, to the left of the blackboard frame",
        position: { x: -5.8, y: 3.0, z: -15.60 },
        rotation: { x: 0, y: 0, z: 0.1 },
        scale: 0.8,
        hostColor: 0xebdcb9,
        hostType: "wall",
        category: "wall"
    },
    {
        id: "blackboard-behind-frame-right",
        name: "On the Front Wall, to the right of the blackboard frame",
        position: { x: 5.8, y: 3.0, z: -15.60 },
        rotation: { x: 0, y: 0, z: -0.1 },
        scale: 0.8,
        hostColor: 0xebdcb9,
        hostType: "wall",
        category: "wall"
    },
    {
        id: "blackboard-ledge-under-left",
        name: "On the Front Wall, to the far left of the chalkboard (upper)",
        position: { x: -5.8, y: 4.4, z: -15.60 },
        rotation: { x: 0, y: 0, z: 0.0 },
        scale: 0.75,
        hostColor: 0xebdcb9,
        hostType: "wall",
        category: "wall"
    },
    {
        id: "blackboard-ledge-under-right",
        name: "On the Front Wall, to the far right of the chalkboard (upper)",
        position: { x: 5.8, y: 4.4, z: -15.60 },
        rotation: { x: 0, y: 0, z: 0.0 },
        scale: 0.75,
        hostColor: 0xebdcb9,
        hostType: "wall",
        category: "blackboard"
    },
    {
        id: "blackboard-surface-left",
        name: "Flat on the green blackboard surface (left)",
        position: { x: -2.0, y: 2.8, z: -15.55 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: 0.8,
        hostColor: 0x2e5a44,
        hostType: "blackboard",
        category: "blackboard"
    },
    {
        id: "blackboard-surface-right",
        name: "Flat on the green blackboard surface (right)",
        position: { x: 2.0, y: 2.8, z: -15.55 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: 0.8,
        hostColor: 0x2e5a44,
        hostType: "blackboard",
        category: "blackboard"
    },

    // --- 2. Teacher's Desk Area (Front) ---
    {
        id: "teacher-desk-legroom-shadow",
        name: "Lying flat on the floor in front of teacher's desk",
        position: { x: 0.0, y: 0.08, z: -9.2 },
        rotation: { x: Math.PI / 2, y: 0, z: 0 },
        scale: 0.9,
        hostColor: 0xdfd1b0,
        hostType: "floor",
        category: "floor"
    },
    {
        id: "teacher-desk-side-outer-left",
        name: "Flat against the teacher's desk left side panel",
        position: { x: -1.52, y: 0.6, z: -11.0 },
        rotation: { x: 0, y: -Math.PI / 2, z: 0.2 },
        scale: 0.85,
        hostColor: 0x5c381c,
        hostType: "darkWood",
        category: "table"
    },
    {
        id: "teacher-desk-side-outer-right",
        name: "Flat against the teacher's desk right side panel",
        position: { x: 1.52, y: 0.6, z: -11.0 },
        rotation: { x: 0, y: Math.PI / 2, z: -0.15 },
        scale: 0.85,
        hostColor: 0x5c381c,
        hostType: "darkWood",
        category: "table"
    },
    {
        id: "teacher-chair-backrest-rear",
        name: "Clinging flat to the rear of teacher's chair backrest",
        position: { x: 0.0, y: 1.25, z: -13.02 },
        rotation: { x: 0, y: Math.PI, z: 0 },
        scale: 0.75,
        hostColor: 0x5c381c,
        hostType: "darkWood",
        category: "table"
    },
    {
        id: "teacher-desk-trash-behind",
        name: "Clinging to the Front Wall near teacher's desk",
        position: { x: -3.2, y: 0.8, z: -15.91 },
        rotation: { x: 0, y: 0, z: 0.1 },
        scale: 0.85,
        hostColor: 0xebdcb9,
        hostType: "wall",
        category: "floor"
    },

    // --- 3. Student Desk Row 1 ---
    {
        id: "student-desk-1a-cubby",
        name: "On the floor beside Student Desk 1 (Left)",
        position: { x: -9.8, y: 0.08, z: -8.0 },
        rotation: { x: Math.PI / 2, y: 0, z: 0.25 },
        scale: 0.75,
        hostColor: 0xdfd1b0,
        hostType: "floor",
        category: "floor"
    },
    {
        id: "student-desk-1a-leg-left",
        name: "Sitting flat on Student Desk 1 Top (Left Corner)",
        position: { x: -9.6, y: 1.39, z: -8.4 },
        rotation: { x: Math.PI / 2, y: 0, z: 0.1 },
        scale: 0.7,
        hostColor: 0xc79863,
        hostType: "wood",
        category: "table"
    },
    {
        id: "student-desk-1a-under-chair",
        name: "On the floor behind Student Chair 1",
        position: { x: -9.0, y: 0.08, z: -6.0 },
        rotation: { x: Math.PI / 2, y: 0, z: -0.35 },
        scale: 0.8,
        hostColor: 0xdfd1b0,
        hostType: "floor",
        category: "floor"
    },
    {
        id: "student-desk-1b-cubby",
        name: "On the floor beside Student Desk 2 (Right)",
        position: { x: 9.8, y: 0.08, z: -8.0 },
        rotation: { x: Math.PI / 2, y: 0, z: 0.45 },
        scale: 0.75,
        hostColor: 0xdfd1b0,
        hostType: "floor",
        category: "floor"
    },
    {
        id: "student-desk-1b-under-chair",
        name: "On the floor behind Student Chair 2",
        position: { x: 9.0, y: 0.08, z: -6.0 },
        rotation: { x: Math.PI / 2, y: 0, z: -0.15 },
        scale: 0.8,
        hostColor: 0xdfd1b0,
        hostType: "floor",
        category: "floor"
    },
    {
        id: "student-desk-1b-backpack-behind",
        name: "Tucked flat on floor behind backpack (Desk 2)",
        position: { x: 10.1, y: 0.08, z: -7.1 },
        rotation: { x: Math.PI / 2, y: 0, z: 0.75 },
        scale: 0.8,
        hostColor: 0xdfd1b0,
        hostType: "floor",
        category: "floor"
    },

    // --- 4. Student Desk Row 2 ---
    {
        id: "student-desk-2a-cubby",
        name: "On the floor beside Student Desk 3 (Left)",
        position: { x: -9.8, y: 0.08, z: -2.0 },
        rotation: { x: Math.PI / 2, y: 0, z: -0.5 },
        scale: 0.75,
        hostColor: 0xdfd1b0,
        hostType: "floor",
        category: "floor"
    },
    {
        id: "student-desk-2a-backpack-rear",
        name: "Behind the backpack on floor (Desk 3)",
        position: { x: -9.0, y: 0.08, z: 0.2 },
        rotation: { x: Math.PI / 2, y: 0, z: 0.1 },
        scale: 0.75,
        hostColor: 0xdfd1b0,
        hostType: "floor",
        category: "floor"
    },
    {
        id: "student-desk-2a-desk-top",
        name: "Lying flat on Student Desk 3 Top (Center)",
        position: { x: -9.0, y: 1.41, z: -2.0 },
        rotation: { x: Math.PI / 2, y: 0, z: 0.0 },
        scale: 0.75,
        hostColor: 0xc79863,
        hostType: "wood",
        category: "table"
    },
    {
        id: "student-desk-2b-cubby",
        name: "On the floor beside Student Desk 4 (Right)",
        position: { x: 9.8, y: 0.08, z: -2.0 },
        rotation: { x: Math.PI / 2, y: 0, z: 0.3 },
        scale: 0.75,
        hostColor: 0xdfd1b0,
        hostType: "floor",
        category: "floor"
    },
    {
        id: "student-desk-2b-under-chair",
        name: "On the floor behind Student Chair 4",
        position: { x: 9.0, y: 0.08, z: 0.0 },
        rotation: { x: Math.PI / 2, y: 0, z: -0.2 },
        scale: 0.8,
        hostColor: 0xdfd1b0,
        hostType: "floor",
        category: "floor"
    },
    {
        id: "student-desk-2b-pencilbox-behind",
        name: "On the floor behind Desk 4 legs",
        position: { x: 9.8, y: 0.08, z: -2.35 },
        rotation: { x: Math.PI / 2, y: 0, z: 0.4 },
        scale: 0.65,
        hostColor: 0xdfd1b0,
        hostType: "floor",
        category: "floor"
    },

    // --- 5. Student Desk Row 3 ---
    {
        id: "student-desk-3a-cubby",
        name: "On the floor beside Student Desk 5 (Left)",
        position: { x: -3.8, y: 0.08, z: 4.0 },
        rotation: { x: Math.PI / 2, y: 0, z: -0.3 },
        scale: 0.75,
        hostColor: 0xdfd1b0,
        hostType: "floor",
        category: "floor"
    },
    {
        id: "student-desk-3a-under-chair",
        name: "On the floor behind Student Chair 5",
        position: { x: -3.0, y: 0.08, z: 6.0 },
        rotation: { x: Math.PI / 2, y: 0, z: 0.2 },
        scale: 0.8,
        hostColor: 0xdfd1b0,
        hostType: "floor",
        category: "floor"
    },
    {
        id: "student-desk-3b-cubby",
        name: "On the floor beside Student Desk 6 (Right)",
        position: { x: 3.8, y: 0.08, z: 4.0 },
        rotation: { x: Math.PI / 2, y: 0, z: -0.25 },
        scale: 0.75,
        hostColor: 0xdfd1b0,
        hostType: "floor",
        category: "floor"
    },
    {
        id: "student-desk-3b-under-chair",
        name: "On the floor behind Student Chair 6",
        position: { x: 3.0, y: 0.08, z: 6.0 },
        rotation: { x: Math.PI / 2, y: 0, z: 0.5 },
        scale: 0.8,
        hostColor: 0xdfd1b0,
        hostType: "floor",
        category: "floor"
    },
    {
        id: "student-desk-3b-backpack-behind",
        name: "Tucked flat behind the backpack on floor (Desk 6)",
        position: { x: 4.05, y: 0.08, z: 4.95 },
        rotation: { x: Math.PI / 2, y: 0, z: -0.4 },
        scale: 0.85,
        hostColor: 0xdfd1b0,
        hostType: "floor",
        category: "floor"
    },

    // --- 6. Bookshelf Unit (Left Wall) ---
    {
        id: "bookshelf-shelf1-behind-books",
        name: "On Bookshelf side panel, facing the front wall",
        position: { x: -15.5, y: 2.2, z: -1.62 },
        rotation: { x: 0, y: 0, z: 0.4 },
        scale: 0.75,
        hostColor: 0x6d3c1c,
        hostType: "darkWood",
        category: "furniture"
    },
    {
        id: "bookshelf-shelf2-behind-globe",
        name: "On Bookshelf side panel, facing the back wall",
        position: { x: -15.5, y: 2.2, z: 1.62 },
        rotation: { x: 0, y: 0, z: -0.3 },
        scale: 0.8,
        hostColor: 0x6d3c1c,
        hostType: "darkWood",
        category: "furniture"
    },
    {
        id: "bookshelf-shelf3-behind-binders",
        name: "On Bookshelf front vertical frame, facing room",
        position: { x: -15.08, y: 2.2, z: 0.0 },
        rotation: { x: 0, y: Math.PI / 2, z: 0 },
        scale: 0.75,
        hostColor: 0x6d3c1c,
        hostType: "darkWood",
        category: "furniture"
    },
    {
        id: "bookshelf-behind-shadow",
        name: "Lying flat on the floor beside the bookshelf",
        position: { x: -14.9, y: 0.08, z: 1.8 },
        rotation: { x: Math.PI / 2, y: 0, z: 0.0 },
        scale: 0.8,
        hostColor: 0xdfd1b0,
        hostType: "floor",
        category: "furniture"
    },

    // --- 7. Storage Cabinet (Right Wall) ---
    {
        id: "cabinet-behind-shadow",
        name: "On Cabinet side panel, facing the front wall",
        position: { x: 15.5, y: 1.8, z: -6.12 },
        rotation: { x: 0, y: 0, z: 0.25 },
        scale: 0.85,
        hostColor: 0x78909c,
        hostType: "cabinetMetal",
        category: "furniture"
    },
    {
        id: "cupboard-door-upper",
        name: "Flat on the upper metal cupboard door",
        position: { x: 15.08, y: 2.3, z: -5.4 },
        rotation: { x: 0, y: -Math.PI / 2, z: 0 },
        scale: 0.9,
        hostColor: 0x78909c,
        hostType: "cabinetMetal",
        category: "cupboard"
    },
    {
        id: "cupboard-door-lower",
        name: "Flat on the lower metal cupboard door",
        position: { x: 15.08, y: 1.1, z: -4.5 },
        rotation: { x: 0, y: -Math.PI / 2, z: 0 },
        scale: 0.9,
        hostColor: 0x78909c,
        hostType: "cabinetMetal",
        category: "cupboard"
    },


    // --- 8. Windows & Sill (Right Wall) ---
    {
        id: "window-sill-left-corner",
        name: "On the window sill corner frame (left)",
        position: { x: 15.55, y: 1.14, z: 2.8 },
        rotation: { x: 0, y: -Math.PI / 2, z: 0 },
        scale: 0.8,
        hostColor: 0xebdcb9,
        hostType: "wall",
        category: "furniture"
    },
    {
        id: "window-sill-center-behind-frame",
        name: "On the window sill, behind the center metal strut",
        position: { x: 15.55, y: 1.14, z: 6.0 },
        rotation: { x: 0, y: -Math.PI / 2, z: 0 },
        scale: 0.8,
        hostColor: 0x1a3d4b,
        hostType: "metal",
        category: "furniture"
    },

    // --- 9. Wall Posters & Wall Clocks ---
    {
        id: "classroom-clock-rear",
        name: "On the Back Wall, beside the banner",
        position: { x: -4.5, y: 4.6, z: 15.91 },
        rotation: { x: 0, y: Math.PI, z: 0 },
        scale: 0.8,
        hostColor: 0xebdcb9,
        hostType: "wall",
        category: "wall"
    },
    {
        id: "poster-left-wall-1-behind",
        name: "On the Left Wall stipple (center-back)",
        position: { x: -15.92, y: 3.2, z: 8.0 },
        rotation: { x: 0, y: Math.PI / 2, z: 0 },
        scale: 0.8,
        hostColor: 0xebdcb9,
        hostType: "wall",
        category: "wall"
    },
    {
        id: "poster-left-wall-2-behind",
        name: "On the Left Wall stipple (center-front)",
        position: { x: -15.92, y: 3.2, z: -5.0 },
        rotation: { x: 0, y: Math.PI / 2, z: 0 },
        scale: 0.8,
        hostColor: 0xebdcb9,
        hostType: "wall",
        category: "wall"
    },

    // --- 10. Floor & Miscellaneous Corner Items ---
    {
        id: "classroom-trash-can-behind",
        name: "Lying flat on the floor beside the recycle bin",
        position: { x: -12.7, y: 0.08, z: 13.5 },
        rotation: { x: Math.PI / 2, y: 0, z: 0.5 },
        scale: 0.85,
        hostColor: 0xdfd1b0,
        hostType: "floor",
        category: "floor"
    },
    {
        id: "back-right-corner-shadow",
        name: "Tucked flat in the back-right classroom corner",
        position: { x: 14.8, y: 0.08, z: 14.8 },
        rotation: { x: Math.PI / 2, y: 0, z: -0.4 },
        scale: 0.95,
        hostColor: 0xdfd1b0,
        hostType: "floor",
        category: "floor"
    },

    // --- 11. Ceiling Fixtures & Lights ---
    {
        id: "ceiling-projector-mount-top",
        name: "Mounted flat on the ceiling next to the projector",
        position: { x: 0.0, y: 7.95, z: 0.0 },
        rotation: { x: Math.PI, y: 0, z: 0 },
        scale: 0.85,
        hostColor: 0xe5ebf0,
        hostType: "ceiling",
        category: "ceiling"
    },
    {
        id: "ceiling-light-front-left-casing",
        name: "Mounted flat on the ceiling (front-left section)",
        position: { x: -7.0, y: 7.95, z: -9.0 },
        rotation: { x: Math.PI, y: 0, z: 0 },
        scale: 0.8,
        hostColor: 0xe5ebf0,
        hostType: "ceiling",
        category: "ceiling"
    },

    // --- 12. WALL CAMOUFLAGE SPOTS ---
    {
        id: "wall-poster-left-3",
        name: "Clinging next to the Calculus Chart (Left Wall)",
        position: { x: -15.9, y: 3.2, z: 3.0 },
        rotation: { x: 0, y: Math.PI / 2, z: 0 },
        scale: 0.8,
        hostColor: 0xebdcb9,
        hostType: "wall",
        category: "wall"
    },
    {
        id: "wall-poster-right-3",
        name: "Clinging next to the Fractal Chart (Right Wall)",
        position: { x: 15.9, y: 3.2, z: -2.0 },
        rotation: { x: 0, y: -Math.PI / 2, z: 0 },
        scale: 0.8,
        hostColor: 0xebdcb9,
        hostType: "wall",
        category: "wall"
    },
    {
        id: "wall-front-crimson-rail-left",
        name: "Embedded on the Front Wall crimson chair-rail (left)",
        position: { x: -8.0, y: 1.4, z: -15.92 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: 0.75,
        hostColor: 0x8b2635,
        hostType: "wall",
        category: "wall"
    },
    {
        id: "wall-front-crimson-rail-right",
        name: "Embedded on the Front Wall crimson chair-rail (right)",
        position: { x: 8.0, y: 1.4, z: -15.92 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: 0.75,
        hostColor: 0x8b2635,
        hostType: "wall",
        category: "wall"
    },
    {
        id: "wall-back-crimson-rail-middle",
        name: "Embedded on the Back Wall crimson chair-rail (center)",
        position: { x: 0.0, y: 1.4, z: 15.92 },
        rotation: { x: 0, y: Math.PI, z: 0 },
        scale: 0.75,
        hostColor: 0x8b2635,
        hostType: "wall",
        category: "wall"
    },
    {
        id: "wall-front-baseboard-left",
        name: "Embedded on the Front Wall blue baseboard (left)",
        position: { x: -11.0, y: 0.15, z: -15.92 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: 0.8,
        hostColor: 0x1f4a56,
        hostType: "wall",
        category: "wall"
    },
    {
        id: "wall-front-baseboard-right",
        name: "Embedded on the Front Wall blue baseboard (right)",
        position: { x: 11.0, y: 0.15, z: -15.92 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: 0.8,
        hostColor: 0x1f4a56,
        hostType: "wall",
        category: "wall"
    },
    {
        id: "wall-left-baseboard-center",
        name: "Embedded on the Left Wall blue baseboard (center)",
        position: { x: -15.92, y: 0.15, z: 0.0 },
        rotation: { x: 0, y: Math.PI / 2, z: 0 },
        scale: 0.8,
        hostColor: 0x1f4a56,
        hostType: "wall",
        category: "wall"
    },
    {
        id: "wall-window-frame-pillar-1",
        name: "Clinging to the blue window column (front)",
        position: { x: 15.82, y: 3.0, z: -3.0 },
        rotation: { x: 0, y: -Math.PI / 2, z: 0 },
        scale: 0.8,
        hostColor: 0x1a3d4b,
        hostType: "metal",
        category: "wall"
    },
    {
        id: "wall-window-frame-pillar-2",
        name: "Clinging to the blue window column (back)",
        position: { x: 15.82, y: 3.0, z: 3.0 },
        rotation: { x: 0, y: -Math.PI / 2, z: 0 },
        scale: 0.8,
        hostColor: 0x1a3d4b,
        hostType: "metal",
        category: "wall"
    },

    // --- 13. SPOTS ON TOP OF BENCHES / TABLES (Lying Flat) ---
    {
        id: "table-student-desk-1a-top",
        name: "Sitting clearly on Student Desk 1 Top (Left)",
        position: { x: -9.0, y: 1.39, z: -8.0 },
        rotation: { x: Math.PI / 2, y: 0, z: 0.1 },
        scale: 0.75,
        hostColor: 0xc79863,
        hostType: "wood",
        category: "table"
    },
    {
        id: "table-student-desk-1b-top",
        name: "Sitting clearly on Student Desk 2 Top (Right)",
        position: { x: 9.0, y: 1.39, z: -8.0 },
        rotation: { x: Math.PI / 2, y: 0, z: -0.2 },
        scale: 0.75,
        hostColor: 0xc79863,
        hostType: "wood",
        category: "table"
    },
    {
        id: "table-student-desk-2a-top",
        name: "Sitting clearly on Student Desk 3 Top (Left)",
        position: { x: -9.0, y: 1.39, z: -2.0 },
        rotation: { x: Math.PI / 2, y: 0, z: 0.3 },
        scale: 0.75,
        hostColor: 0xc79863,
        hostType: "wood",
        category: "table"
    },
    {
        id: "table-student-desk-2b-top",
        name: "Sitting clearly on Student Desk 4 Top (Right)",
        position: { x: 9.0, y: 1.39, z: -2.0 },
        rotation: { x: Math.PI / 2, y: 0, z: -0.15 },
        scale: 0.75,
        hostColor: 0xc79863,
        hostType: "wood",
        category: "table"
    },
    {
        id: "table-student-desk-3a-top",
        name: "Sitting clearly on Student Desk 5 Top (Left)",
        position: { x: -3.0, y: 1.39, z: 4.0 },
        rotation: { x: Math.PI / 2, y: 0, z: 0.2 },
        scale: 0.75,
        hostColor: 0xc79863,
        hostType: "wood",
        category: "table"
    },
    {
        id: "table-student-desk-3b-top",
        name: "Sitting clearly on Student Desk 6 Top (Right)",
        position: { x: 3.0, y: 1.39, z: 4.0 },
        rotation: { x: Math.PI / 2, y: 0, z: -0.1 },
        scale: 0.75,
        hostColor: 0xc79863,
        hostType: "wood",
        category: "table"
    },

    // --- 14. SPOTS ON THE CEILING (Hanging below fixtures, with ceiling material mapping) ---
    {
        id: "ceiling-light-front-right-casing",
        name: "Mounted flat on the ceiling (front-right section)",
        position: { x: 7.0, y: 7.95, z: -9.0 },
        rotation: { x: Math.PI, y: 0, z: 0 },
        scale: 0.8,
        hostColor: 0xe5ebf0,
        hostType: "ceiling",
        category: "ceiling"
    },
    {
        id: "ceiling-light-back-left-casing",
        name: "Mounted flat on the ceiling (back-left section)",
        position: { x: -7.0, y: 7.95, z: 9.0 },
        rotation: { x: Math.PI, y: 0, z: 0 },
        scale: 0.8,
        hostColor: 0xe5ebf0,
        hostType: "ceiling",
        category: "ceiling"
    },
    {
        id: "ceiling-light-back-right-casing",
        name: "Mounted flat on the ceiling (back-right section)",
        position: { x: 7.0, y: 7.95, z: 9.0 },
        rotation: { x: Math.PI, y: 0, z: 0 },
        scale: 0.8,
        hostColor: 0xe5ebf0,
        hostType: "ceiling",
        category: "ceiling"
    },
    {
        id: "ceiling-pipe-left-vent",
        name: "Clinging to the orange ceiling ventilation pipe",
        position: { x: -9.0, y: 7.02, z: 4.0 },
        rotation: { x: Math.PI, y: 0, z: 0 },
        scale: 0.8,
        hostColor: 0xd35400,
        hostType: "metal",
        category: "ceiling"
    },
    {
        id: "ceiling-pipe-right-vent",
        name: "Clinging to the yellow ceiling ventilation pipe",
        position: { x: 9.0, y: 7.02, z: -4.0 },
        rotation: { x: Math.PI, y: 0, z: 0 },
        scale: 0.8,
        hostColor: 0xf1c40f,
        hostType: "metal",
        category: "ceiling"
    },

    // --- 15. NEW ADDITIONAL RANDOM HIDING PLACES (Total 75 spots) ---
    {
        id: "ceiling-pipe-left-bracket",
        name: "Clinging to the left orange pipe mounting bracket",
        position: { x: -9.0, y: 7.15, z: -10.0 },
        rotation: { x: Math.PI, y: 0, z: 0 },
        scale: 0.85,
        hostColor: 0x5a5c60,
        hostType: "metal",
        category: "ceiling"
    },
    {
        id: "ceiling-pipe-right-bracket",
        name: "Clinging to the right yellow pipe mounting bracket",
        position: { x: 9.0, y: 7.15, z: 10.0 },
        rotation: { x: Math.PI, y: 0, z: 0 },
        scale: 0.85,
        hostColor: 0x5a5c60,
        hostType: "metal",
        category: "ceiling"
    },
    {
        id: "wall-clock-side-frame",
        name: "Sitting tilted on the side of the clock",
        position: { x: -0.8, y: 4.5, z: 15.82 },
        rotation: { x: 0, y: Math.PI, z: 0.25 },
        scale: 0.75,
        hostColor: 0xebdcb9,
        hostType: "wall",
        category: "wall"
    },
    {
        id: "wall-algebra-poster-top-edge",
        name: "Clinging on the top edge of the Algebra poster",
        position: { x: -15.9, y: 2.2, z: -7.5 },
        rotation: { x: 0, y: Math.PI / 2, z: -0.15 },
        scale: 0.8,
        hostColor: 0xebdcb9,
        hostType: "wall",
        category: "wall"
    },
    {
        id: "wall-geometry-poster-top-edge",
        name: "Clinging on the top edge of the Geometry poster",
        position: { x: -15.9, y: 2.2, z: 8.5 },
        rotation: { x: 0, y: Math.PI / 2, z: 0.12 },
        scale: 0.8,
        hostColor: 0xebdcb9,
        hostType: "wall",
        category: "wall"
    },
    {
        id: "wall-front-left-chalkboard-border",
        name: "On the front wall wood panel to the left of the board",
        position: { x: -7.5, y: 3.0, z: -15.92 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: 0.8,
        hostColor: 0xebdcb9,
        hostType: "wall",
        category: "wall"
    },
    {
        id: "wall-front-right-chalkboard-border",
        name: "On the front wall wood panel to the right of the board",
        position: { x: 7.5, y: 3.0, z: -15.92 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: 0.8,
        hostColor: 0xebdcb9,
        hostType: "wall",
        category: "wall"
    },
    {
        id: "wall-back-high-corner-left",
        name: "Clinging high up in the back left wall corner",
        position: { x: -13.0, y: 5.2, z: 15.92 },
        rotation: { x: 0, y: Math.PI, z: 0 },
        scale: 0.8,
        hostColor: 0xebdcb9,
        hostType: "wall",
        category: "wall"
    },
    {
        id: "wall-back-high-corner-right",
        name: "Clinging high up in the back right wall corner",
        position: { x: 13.0, y: 5.2, z: 15.92 },
        rotation: { x: 0, y: Math.PI, z: 0 },
        scale: 0.8,
        hostColor: 0xebdcb9,
        hostType: "wall",
        category: "wall"
    },
    {
        id: "furniture-bookshelf-very-top",
        name: "Sitting flat on top of the oak bookshelf",
        position: { x: -15.10, y: 4.48, z: 0.0 },
        rotation: { x: 0, y: Math.PI / 2, z: 0 },
        scale: 0.8,
        hostColor: 0x6d3c1c,
        hostType: "darkWood",
        category: "furniture"
    },
    {
        id: "furniture-cabinet-shelf-middle-lip",
        name: "Clinging to the front door panel of the cabinet",
        position: { x: 15.08, y: 2.2, z: -5.0 },
        rotation: { x: 0, y: -Math.PI / 2, z: 0 },
        scale: 0.8,
        hostColor: 0x78909c,
        hostType: "cabinetMetal",
        category: "furniture"
    },
    {
        id: "table-teacher-desk-front-panel-clinger",
        name: "Clinging flat on the vertical front wood panel of teacher's desk",
        position: { x: 0.0, y: 0.7, z: -10.05 },
        rotation: { x: 0, y: 0, z: 1.57 },
        scale: 0.8,
        hostColor: 0x5c381c,
        hostType: "darkWood",
        category: "table"
    },
    {
        id: "floor-center-corridor-front",
        name: "On the center corridor tiles (front section)",
        position: { x: 0.0, y: 0.08, z: -1.0 },
        rotation: { x: Math.PI / 2, y: 0, z: 0.2 },
        scale: 0.85,
        hostColor: 0xdfd1b0,
        hostType: "floor",
        category: "floor"
    },
    {
        id: "floor-center-corridor-back",
        name: "On the center corridor tiles (back section)",
        position: { x: 0.0, y: 0.08, z: 5.0 },
        rotation: { x: Math.PI / 2, y: 0, z: -0.3 },
        scale: 0.85,
        hostColor: 0xdfd1b0,
        hostType: "floor",
        category: "floor"
    },
    {
        id: "floor-back-left-corner-clearance",
        name: "Lying flat in the back-left corner (clear tiled zone)",
        position: { x: -14.5, y: 0.08, z: 14.5 },
        rotation: { x: Math.PI / 2, y: 0, z: 0.5 },
        scale: 0.9,
        hostColor: 0xdfd1b0,
        hostType: "floor",
        category: "floor"
    },
    {
        id: "door-leaf-wood",
        name: "Lying flat on the classroom's wooden door leaf",
        position: { x: -11.0, y: 1.6, z: 15.84 },
        rotation: { x: 0, y: Math.PI, z: 0 },
        scale: 0.85,
        hostColor: 0xc79863,
        hostType: "wood",
        category: "wall"
    },
    {
        id: "door-surface-lower",
        name: "Lying flat on the lower door wood panel",
        position: { x: -11.0, y: 0.8, z: 15.84 },
        rotation: { x: 0, y: Math.PI, z: 0.2 },
        scale: 0.8,
        hostColor: 0xc79863,
        hostType: "wood",
        category: "wall"
    },
    {
        id: "door-handle-brass",
        name: "Clinging to the wooden door leaf beside the handle",
        position: { x: -10.42, y: 1.6, z: 15.82 },
        rotation: { x: 0, y: Math.PI, z: 0.1 },
        scale: 0.8,
        hostColor: 0xc79863,
        hostType: "wood",
        category: "wall"
    }
];
