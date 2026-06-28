export const DB_NAME = "BracketDB";

export const DB_VERSION = 1;

export const STORE_NAME = "brackets";

export let db;

// ##### OPEN DATABASE

export function openDatabase() {

    return new Promise((resolve, reject) => {

        const request =
            indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {

            db = event.target.result;

            if (!db.objectStoreNames.contains(STORE_NAME)) {

                db.createObjectStore(STORE_NAME, {

                    keyPath: "id",

                    autoIncrement: true
                });
            }
        };

        request.onsuccess = (event) => {

            db = event.target.result;

            resolve(db);
        };

        request.onerror = () => {

            reject(request.error);
        };
    });
}

// ##### GET ALL BRACKETS

export function getAllBrackets() {

    return new Promise((resolve, reject) => {

        const transaction =
            db.transaction(STORE_NAME, "readonly");

        const store =
            transaction.objectStore(STORE_NAME);

        const request =
            store.getAll();

        request.onsuccess = () => {

            resolve(request.result);
        };

        request.onerror = () => {

            reject(request.error);
        };
    });
}

// ##### ADD BRACKET

export function addBracket(bracket) {

    return new Promise((resolve, reject) => {

        const transaction =
            db.transaction(STORE_NAME, "readwrite");

        const store =
            transaction.objectStore(STORE_NAME);

        const request =
            store.add(bracket);

        request.onsuccess = () => {

            resolve(request.result);
        };

        request.onerror = () => {

            reject(request.error);
        };
    });
}

// ##### GET BRACKET BY ID

export function getBracketById(id) {

    return new Promise((resolve, reject) => {

        const transaction = db.transaction(STORE_NAME, "readonly");

        const store = transaction.objectStore(STORE_NAME);

        const request = store.get(Number(id));

        request.onsuccess = () => {

            resolve(request.result);
        };

        request.onerror = () => {

            reject(request.error);
        };
    });
}

// ##### UPDATE BRACKET

export function updateBracket(bracket) {

    return new Promise((resolve, reject) => {

        const transaction = db.transaction(STORE_NAME, "readwrite");

        const store = transaction.objectStore(STORE_NAME);

        const request = store.put(bracket);

        request.onsuccess = () => {

            resolve(request.result);
        };

        request.onerror = () => {

            reject(request.error);
        };
    });
}

export async function deleteBracket(id) {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");

        tx.objectStore(STORE_NAME).delete(id);

        tx.oncomplete = resolve;
        tx.onerror = reject;
    });
}