// ##### DATABASE

const DB_NAME = "BracketDB";
const DB_VERSION = 1;
const STORE_NAME = "brackets";

let db;

// Open database
const request = indexedDB.open(DB_NAME, DB_VERSION);

// Create on first opening
request.onupgradeneeded = (event) => {

    db = event.target.result;

    if (!db.objectStoreNames.contains(STORE_NAME)) {

        db.createObjectStore(STORE_NAME, {
            keyPath: "id",
            autoIncrement: true
        });
    }
};

// Database ready
request.onsuccess = (event) => {

    db = event.target.result;

    loadBrackets();
};

request.onerror = (event) => {
    console.error("IndexedDB error:", event.target.error);
};

// ##### DOM ELEMENTS

const createBtn = document.getElementById("create-btn");

const bracketGrid = document.getElementById("bracket-grid");

const nameInput = document.getElementById("bracket-name");

const imageInput = document.getElementById("thumbnail-file");

const uploadArea = document.getElementById("upload-area")

const selectImageBtn = document.getElementById("select-image-btn")

const imagePreview = document.getElementById("image-preview")

const emptyMessage = document.getElementById("empty-message");

const openFormBtn = document.getElementById("open-form-btn");

const createSection = document.getElementById("create-section");

let selectedImageFile = null;

// ##### IMAGE TO BASE64

function fileToBase64(file) {

    return new Promise((resolve, reject) => {

        const reader = new FileReader();

        reader.readAsDataURL(file);

        reader.onload = () => {
            resolve(reader.result);
        };

        reader.onerror = (error) => {
            reject(error);
        };
    });
}

// ##### CREATE N SAVE BRACKET

async function createBracket() {

    const name = nameInput.value.trim();

    if (!name || !selectedImageFile) {

        alert("Missing name or thumbnail!");

        return;
    }

    const base64Image = await fileToBase64(selectedImageFile);

    const bracket = {

        name: name,

        thumbnail: base64Image,

        createdAt: Date.now()
    };

    const transaction = db.transaction(STORE_NAME, "readwrite");

    const store = transaction.objectStore(STORE_NAME);

    store.add(bracket);

    transaction.oncomplete = () => {

        nameInput.value = "";

        imageInput.value = "";

        selectedImageFile = null;

        imagePreview.hidden = true;

        loadBrackets();
    };
}

// ##### CREATE BRACKET CARD

function createBracketCard(bracket) {

    const card = document.createElement("div");

    card.classList.add("bracketCard");

    const image = document.createElement("img");

    image.src = bracket.thumbnail;

    image.alt = bracket.name;

    const info = document.createElement("div");

    info.classList.add("bracketInfo");

    const title = document.createElement("h3");

    title.textContent = bracket.name;

    info.appendChild(title);

    card.appendChild(image);

    card.appendChild(info);

    return card;
}

// ##### LOAD BRACKETS

function loadBrackets() {

    bracketGrid.replaceChildren();

    const transaction = db.transaction(STORE_NAME, "readonly");

    const store = transaction.objectStore(STORE_NAME);

    const request = store.getAll();

    request.onsuccess = () => {

        const brackets = request.result;

        if (brackets.length === 0) {

            emptyMessage.style.display = "block";

            return;
        }

        emptyMessage.style.display = "none";

        brackets.forEach((bracket) => {

            const card = createBracketCard(bracket);

            bracketGrid.appendChild(card);
        });
    };
}

// ##### OPEN FILE PICKER

selectImageBtn.addEventListener("click", () => {
    imageInput.click();
});

// ##### FILE SELECT

imageInput.addEventListener("change", (event) => {
    const file = event.target.files[0];

    if (!file) return;

    setSelectedImage(file);
});

// ##### DRAG DROP FILE

uploadArea.addEventListener("dragover", (event) => {
    event.preventDefault();
    uploadArea.classList.add("dragover");
});

uploadArea.addEventListener("dragleave", () => {

    uploadArea.classList.remove("dragover");
});

uploadArea.addEventListener("drop", (event) => {
    event.preventDefault();
    uploadArea.classList.remove("dragover");
    const file = event.dataTransfer.files[0];

    if (!file) return;

    setSelectedImage(file);
});

// ##### SET IMAGE
function setSelectedImage(file) {

    if (!file.type.startsWith("image/")) {
        alert("File must be an image.");
        return;
    }

    selectedImageFile = file; 
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        imagePreview.src = reader.result;
        imagePreview.hidden = false;
    };
}
// ##### LISTENERS

createBtn.addEventListener("click", createBracket);

openFormBtn.addEventListener("click", () => {

    createSection.classList.toggle("hidden");
});