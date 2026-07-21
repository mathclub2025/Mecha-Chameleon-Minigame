// Firebase Service Module (Firestore Leaderboard CRUD operations with robust timeout fallback & CSV export)
import { initializeApp } from 'firebase/app';
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    query, 
    orderBy, 
    limit, 
    serverTimestamp 
} from 'firebase/firestore';
import { firebaseConfig } from './firebaseConfig.js';

let app = null;
let db = null;
let isFirebaseInitialized = false;

// Local storage keys
const LOCAL_STORAGE_KEY = 'mecha_chameleon_leaderboard';
const LOCAL_ALL_RECORDS_KEY = 'mecha_chameleon_all_records';

// Helper: Timeout race wrapper so Firebase network delay never hangs the game UI
function withTimeout(promise, ms = 12000) {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error(`Firebase request timed out after ${ms}ms`)), ms))
    ]);
}

// Initialize Firebase App & Firestore
try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    isFirebaseInitialized = true;
    console.log("Firebase initialized successfully.");
} catch (error) {
    console.warn("Firebase initialization failed, operating in fallback local storage mode:", error);
}

/**
 * Save player score to Firestore 'leaderboard' collection AND Local Storage (Every single attempt saved locally regardless of network!)
 */
export async function saveScore({ name, number = "", score, found, total = 8, accuracy, timeRemaining, timeTaken }) {
    const record = {
        name: name.trim(),
        number: number.trim(), // Stored in Firebase & local records for event organizers
        score: Number(score),
        found: Number(found),
        total: Number(total),
        accuracy: Number((accuracy * 100).toFixed(0)), // Percentage integer
        timeRemaining: Number(timeRemaining.toFixed(1)),
        timeTaken: Number(timeTaken.toFixed(1)),
        timestamp: new Date().toISOString()
    };

    // 1. ALWAYS save to Local Storage (both top 50 cache & uncapped full log)
    saveToLocalStorage(record);

    // 2. Save to Firestore with 12s timeout race
    if (isFirebaseInitialized && db) {
        try {
            const savePromise = addDoc(collection(db, "leaderboard"), {
                ...record,
                createdAt: serverTimestamp()
            });
            const docRef = await withTimeout(savePromise, 12000);
            console.log("Score saved to Firestore with ID:", docRef.id);
            return { success: true, id: docRef.id, isLocal: false, record };
        } catch (error) {
            console.warn("Firestore save timed out or error, safely preserved in local storage:", error.message);
            return { success: true, error: error.message, isLocal: true, record };
        }
    }

    return { success: true, isLocal: true, record };
}

/**
 * Fetch top N scores for Main Menu Leaderboard display
 */
export async function getTopScores(limitCount = 10) {
    return getLeaderboardData({ limitCount });
}

/**
 * Fetch Leaderboard Data with Player Rank calculation and Offline support (caching + disk JSON merging)
 */
export async function getLeaderboardData({ limitCount = 10, currentPlayerName = null, currentScore = null, currentTimestamp = null } = {}) {
    let allScores = [];
    let querySucceeded = false;

    // 1. Fetch top scores from Firebase Firestore
    if (isFirebaseInitialized && db) {
        try {
            const leaderboardRef = collection(db, "leaderboard");
            const q = query(leaderboardRef, orderBy("score", "desc"), limit(50));
            const querySnapshot = await withTimeout(getDocs(q), 12000);
            
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                allScores.push({
                    id: doc.id,
                    name: data.name || "Anonymous",
                    score: Number(data.score || 0),
                    accuracy: data.accuracy !== undefined ? data.accuracy : 100,
                    timeTaken: Number(data.timeTaken || 0),
                    found: data.found || 0,
                    timestamp: data.timestamp || ""
                });
            });
            
            // Cache successful Firestore query in localStorage
            localStorage.setItem('firebase_leaderboard_cache', JSON.stringify(allScores));
            querySucceeded = true;
        } catch (error) {
            console.warn("Firestore query failed, using local cache fallback:", error.message);
        }
    }

    // 2. Fallback to cached leaderboard if query failed/offline
    if (!querySucceeded) {
        try {
            const cached = localStorage.getItem('firebase_leaderboard_cache');
            if (cached) {
                allScores = JSON.parse(cached);
            }
        } catch (e) {
            console.warn("Error parsing leaderboard cache:", e);
        }
    }

    if (allScores.length === 0) {
        allScores = getFromLocalStorage(50);
    }

    // 3. Retrieve local offline JSON files from disk and merge them to update the leaderboard
    try {
        const response = await fetch('/api/get-offline-results');
        if (response.ok) {
            const offlineFiles = await response.json();
            offlineFiles.forEach(item => {
                const data = item.data;
                const accuracyNum = data.accuracy ? Number(data.accuracy.replace('%', '')) : 100;
                
                // Add local unsynced game if not already inside allScores
                const exists = allScores.some(existing => 
                    existing.name === data.playerName && 
                    existing.score === Number(data.score) && 
                    existing.timestamp === data.timestamp
                );
                
                if (!exists) {
                    allScores.push({
                        id: 'local_' + item.filename,
                        name: data.playerName || "Anonymous",
                        score: Number(data.score || 0),
                        accuracy: accuracyNum,
                        timeTaken: Number(data.timeTaken || 0),
                        found: data.found || 0,
                        timestamp: data.timestamp || ""
                    });
                }
            });
        }
    } catch (err) {
        console.warn("Could not retrieve offline JSON files for leaderboard overlay:", err.message);
    }

    if (!allScores || allScores.length === 0) {
        return [];
    }

    // Sort descending by score, then ascending by time taken
    allScores.sort((a, b) => b.score - a.score || a.timeTaken - b.timeTaken);

    // Assign actual rank (1-indexed)
    allScores.forEach((item, idx) => {
        item.rank = idx + 1;
    });

    const top10 = allScores.slice(0, limitCount);

    if (!currentPlayerName || currentScore === null) {
        return top10;
    }

    // Check if player's current score is in top 10
    const inTop10Index = top10.findIndex(item => 
        item.name === currentPlayerName && 
        item.score === currentScore &&
        (!currentTimestamp || item.timestamp === currentTimestamp)
    );

    if (inTop10Index !== -1) {
        top10[inTop10Index].isCurrentPlayer = true;
        return top10;
    }

    const nameMatchTop10 = top10.findIndex(item => item.name === currentPlayerName && item.score === currentScore);
    if (nameMatchTop10 !== -1) {
        top10[nameMatchTop10].isCurrentPlayer = true;
        return top10;
    }

    // Player is NOT in top 10! Find player's entry in remaining scores (rank 11+)
    let playerEntry = allScores.find(item => 
        item.name === currentPlayerName && 
        item.score === currentScore &&
        (!currentTimestamp || item.timestamp === currentTimestamp)
    ) || allScores.find(item => item.name === currentPlayerName && item.score === currentScore);

    if (playerEntry) {
        const entryCopy = { ...playerEntry, isCurrentPlayer: true, isOutsideTop10: true };
        return [...top10, entryCopy];
    }

    const fallbackRank = allScores.length + 1;
    return [...top10, {
        rank: fallbackRank,
        name: currentPlayerName,
        score: currentScore,
        accuracy: 100,
        timeTaken: 45,
        isCurrentPlayer: true,
        isOutsideTop10: true
    }];
}

/**
 * Check connectivity and synchronize all local offline JSON files to Firebase, deleting them locally on success.
 */
export async function syncOfflineResultsToFirebase() {
    if (!isFirebaseInitialized || !db) {
        console.log("[Sync Service] Firebase not initialized. Skipping offline synchronization.");
        return false;
    }

    try {
        const response = await fetch('/api/get-offline-results');
        if (!response.ok) return false;

        const offlineRecords = await response.json();
        if (offlineRecords.length === 0) {
            console.log("[Sync Service] All local JSON records are synchronized.");
            return true;
        }

        console.log(`[Sync Service] Found ${offlineRecords.length} offline records to sync.`);
        let syncedCount = 0;

        for (const item of offlineRecords) {
            const data = item.data;
            const accuracyNum = data.accuracy ? Number(data.accuracy.replace('%', '')) : 100;
            
            try {
                // Upload to Firebase Firestore
                const record = {
                    name: data.playerName,
                    number: data.playerNumber || "",
                    score: Number(data.score),
                    found: Number(data.found),
                    total: Number(data.total),
                    accuracy: accuracyNum,
                    timeRemaining: Number(data.timeRemaining || 0),
                    timeTaken: Number(data.timeTaken || 0),
                    timestamp: data.timestamp || new Date().toISOString()
                };

                await addDoc(collection(db, "leaderboard"), {
                    ...record,
                    createdAt: serverTimestamp()
                });

                // Delete local JSON file from disk after successful Firebase write
                const deleteRes = await fetch('/api/delete-offline-result', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ filename: item.filename })
                });

                if (deleteRes.ok) {
                    syncedCount++;
                }
            } catch (err) {
                console.error(`[Sync Service] Error syncing record ${item.filename}:`, err);
            }
        }

        console.log(`[Sync Service] Successfully synchronized and cleaned up ${syncedCount} offline JSON records.`);
        return true;
    } catch (error) {
        console.error("[Sync Service] Sync error:", error);
        return false;
    }
}

/**
 * Save game result JSON file to local results/ folder on disk
 */
export async function saveLocalResultJSON(data) {
    const rawName = data.name || data.playerName || 'Agent';
    const safeName = rawName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}-${String(now.getMinutes()).padStart(2,'0')}-${String(now.getSeconds()).padStart(2,'0')}`;
    const fileName = `${safeName}-${timeStr}.json`;

    const payload = {
        playerName: rawName,
        playerNumber: data.number || "",
        score: data.score || 0,
        found: data.found || 0,
        total: data.total || 8,
        accuracy: data.accuracy !== undefined ? `${(data.accuracy * 100).toFixed(0)}%` : "100%",
        timeTaken: data.timeTaken || 0,
        timeRemaining: data.timeRemaining || 0,
        timestamp: data.timestamp || new Date().toISOString()
    };

    // 1. Post to Vite dev server API to write directly to results/ folder on disk
    try {
        const response = await fetch('/api/save-result', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (response.ok) {
            console.log(`[Results System] Successfully saved result JSON to results/${fileName}`);
            return true;
        }
    } catch (e) {
        console.warn("[Results System] Dev server API unavailable, falling back to browser download:", e);
    }

    // 2. Fallback: Trigger direct browser download named playername-time.json
    try {
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return true;
    } catch (e) {
        console.error("[Results System] Browser JSON download fallback failed:", e);
        return false;
    }
}

// Local Storage Helpers
function saveToLocalStorage(record) {
    try {
        // 1. Uncapped full event log key
        const allRecords = JSON.parse(localStorage.getItem(LOCAL_ALL_RECORDS_KEY) || '[]');
        allRecords.push(record);
        localStorage.setItem(LOCAL_ALL_RECORDS_KEY, JSON.stringify(allRecords));

        // 2. Top 50 cache key
        const existing = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
        existing.push(record);
        existing.sort((a, b) => b.score - a.score || a.timeTaken - b.timeTaken);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(existing.slice(0, 50)));
    } catch (e) {
        console.error("Local storage write error:", e);
    }
}

function getFromLocalStorage(limitCount = 50) {
    try {
        const existing = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
        if (existing.length > 0) {
            return existing.slice(0, limitCount).map(data => ({
                name: data.name || "Anonymous",
                score: Number(data.score || 0),
                accuracy: data.accuracy !== undefined ? data.accuracy : 100,
                timeTaken: Number(data.timeTaken || 0),
                found: data.found || 0,
                timestamp: data.timestamp || ""
            }));
        }

        const allRecords = JSON.parse(localStorage.getItem(LOCAL_ALL_RECORDS_KEY) || '[]');
        return allRecords.slice(0, limitCount).map(data => ({
            name: data.name || "Anonymous",
            score: Number(data.score || 0),
            accuracy: data.accuracy !== undefined ? data.accuracy : 100,
            timeTaken: Number(data.timeTaken || 0),
            found: data.found || 0,
            timestamp: data.timestamp || ""
        }));
    } catch (e) {
        return [];
    }
}
