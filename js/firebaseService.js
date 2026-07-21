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
function withTimeout(promise, ms = 2500) {
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

    // 2. Save to Firestore with 2.5s timeout race
    if (isFirebaseInitialized && db) {
        try {
            const savePromise = addDoc(collection(db, "leaderboard"), {
                ...record,
                createdAt: serverTimestamp()
            });
            const docRef = await withTimeout(savePromise, 2500);
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
 * Fetch Leaderboard Data with Player Rank calculation
 */
export async function getLeaderboardData({ limitCount = 10, currentPlayerName = null, currentScore = null, currentTimestamp = null } = {}) {
    let allScores = [];

    if (isFirebaseInitialized && db) {
        try {
            const leaderboardRef = collection(db, "leaderboard");
            const q = query(leaderboardRef, orderBy("score", "desc"), limit(50));
            const querySnapshot = await withTimeout(getDocs(q), 2500);
            
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
        } catch (error) {
            console.warn("Firestore query failed, using local storage:", error.message);
        }
    }

    if (allScores.length === 0) {
        allScores = getFromLocalStorage(50);
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
 * Export all local player records as an Excel-compatible CSV file download
 */
export function exportRecordsToCSV() {
    try {
        const allRecords = JSON.parse(localStorage.getItem(LOCAL_ALL_RECORDS_KEY) || '[]');
        const cachedLeaderboard = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
        
        // Combine records, removing duplicate timestamps if any
        const recordsMap = new Map();
        [...allRecords, ...cachedLeaderboard].forEach(r => {
            if (r.timestamp) recordsMap.set(r.timestamp, r);
            else recordsMap.set(JSON.stringify(r), r);
        });

        const records = Array.from(recordsMap.values());

        if (records.length === 0) {
            alert("No local player records found to export yet. Play a game round first!");
            return false;
        }

        // CSV Headers
        const headers = ["Name", "Phone / Reg No", "Score", "Symbols Found", "Accuracy (%)", "Time Taken (s)", "Timestamp"];
        const csvRows = [headers.join(",")];

        records.forEach(r => {
            const row = [
                `"${(r.name || 'Anonymous').replace(/"/g, '""')}"`,
                `"${(r.number || '').replace(/"/g, '""')}"`,
                r.score || 0,
                r.found !== undefined ? r.found : 0,
                `${r.accuracy !== undefined ? r.accuracy : 0}%`,
                r.timeTaken || 0,
                `"${(r.timestamp || '').replace(/"/g, '""')}"`
            ];
            csvRows.push(row.join(","));
        });

        const csvString = csvRows.join("\n");
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `Mecha_Chameleon_Players_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return true;
    } catch (e) {
        console.error("CSV Export error:", e);
        alert("Failed to export player records: " + e.message);
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
