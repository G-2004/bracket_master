import {
    openDatabase,
    STORE_NAME,
    getAllBrackets,
    addBracket,
    updateBracket,
    deleteBracket
} from "./db.js";
// ##### DATABASE
openDatabase().then(() => {

        loadBrackets();
    })
    .catch((error) => {

        console.error(error);
    });

// ##### DOM ELEMENTS

const importBracketBtn = document.getElementById("import-bracket-btn");

const importBracketInput = document.getElementById("import-bracket-input");

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

    if (!name || !selectedImageFile) return;

    const base64Image = await fileToBase64(selectedImageFile);

    const bracket = {
        name,
        thumbnail: base64Image,
        createdAt: Date.now(),
        competitors:[],
        matches: []
    };

    await addBracket(bracket);

    nameInput.value = "";
    imageInput.value = "";
    selectedImageFile = null;
    imagePreview.hidden = true;

    loadBrackets();
}

// ##### CREATE BRACKET CARD

function createBracketCard(bracket) {

    const card = document.createElement("div");

    card.classList.add("bracketCard");

    //thumbnail

    const image = document.createElement("img");

    image.src = bracket.thumbnail;

    image.alt = bracket.name;

    //info

    const info = document.createElement("div");

    info.classList.add("bracketInfo");

    const title = document.createElement("h3");

    title.textContent = bracket.name;

    //menu button

    const menuButton = document.createElement("button");

    menuButton.classList.add("menuButton");

    menuButton.textContent = "\u22EE";//three vertical dots
    

    //dropdown menu

    const menu = document.createElement("div");

    menu.classList.add("cardMenu");

    menu.classList.remove("show");

    menu.addEventListener("click", (event) => {

        event.stopPropagation();
    });

    //internal buttons
    const editButton = document.createElement("button");

    editButton.textContent = "Edit";

    const deleteButton = document.createElement("button");

    deleteButton.textContent = "Delete";

    //menu events

    menuButton.addEventListener("click", (event) => {
        event.stopPropagation();
        menu.classList.toggle("show");
    });

    document.addEventListener("click", () => {

        menu.classList.remove("show");
    });

    //delete function
    let deleteArmed = false;

    deleteButton.addEventListener("click", async (e) => {
        e.stopPropagation();

        if (!deleteArmed) {
            deleteArmed = true;
            deleteButton.textContent = "Confirm Delete";
            deleteButton.classList.add("dangerButton");
            return;
        }

        await deleteBracket(bracket.id);
        loadBrackets();
    });

    deleteButton.addEventListener("mouseleave", () => {

        deleteArmed = false;

        deleteButton.textContent = "Delete";

        deleteButton.classList.remove("dangerButton");
    });

    //edit function
    editButton.addEventListener("click", () => {

        card.classList.add("editing");

        // name/title

        const titleInput = document.createElement("input");

        titleInput.type = "text";

        titleInput.value = bracket.name;

        titleInput.classList.add("editTitleInput");

        titleInput.addEventListener("click", (e) => {
            e.stopPropagation();
        });

        info.replaceChild(titleInput, title);

        // thumbnail

        image.classList.add("editableImage");

        image.title = "Click to change image";

        let updatedThumbnail = bracket.thumbnail;

        image.addEventListener("click", openImagePicker);

        image.addEventListener("click", (e) => {
            e.stopPropagation();
            openImagePicker();
        });

        function openImagePicker() {

            const tempInput = document.createElement("input");

            tempInput.type = "file";

            tempInput.accept = "image/*";

            tempInput.click();

            tempInput.onchange = async () => {

                const file = tempInput.files[0];

                if (!file) return;

                updatedThumbnail = await fileToBase64(file);

                image.src = updatedThumbnail;
            };
        }

        // save changes

        const saveButton = document.createElement("button");

        saveButton.textContent = "Save";

        saveButton.classList.add("saveButton");

        menu.replaceChildren(saveButton, deleteButton);

        saveButton.addEventListener("click", async (e) => {
            e.stopPropagation();

            bracket.name = titleInput.value.trim();
            bracket.thumbnail = updatedThumbnail;

            await updateBracket(bracket);

            loadBrackets();
        });
    });

    //redirect to bracket.html with bracket data
    card.addEventListener("click", () => {
        window.location.href = `bracket.html?id=${bracket.id}`;
    });

    // assemble card
    menu.appendChild(editButton);

    menu.appendChild(deleteButton);

    info.appendChild(title);

    info.appendChild(menuButton);

    info.appendChild(menu);

    card.appendChild(image);

    card.appendChild(info);

    return card;
}

// ##### LOAD BRACKETS

function loadBrackets() {

    bracketGrid.replaceChildren();

    getAllBrackets().then((brackets) => {

        if (!brackets || brackets.length === 0) {
            emptyMessage.style.display = "block";
            return;
        }

        emptyMessage.style.display = "none";

        brackets.forEach((bracket) => {
            const card = createBracketCard(bracket);
            bracketGrid.appendChild(card);
        });
    });
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
        //hopefully reset and allow same image to be loaded again
        imageInput.value = "";
    };
}
// ##### LISTENERS

createBtn.addEventListener("click", createBracket);

openFormBtn.addEventListener("click", () => {

    createSection.classList.toggle("hidden");
});

importBracketBtn.addEventListener("click", () => {
    importBracketInput.click();
});

importBracketInput.addEventListener(
    "change",
    async (event) => {

        const file = event.target.files[0];

        if (!file) return;

        try {
            const text = await file.text();

            const bracket = JSON.parse(text);

            await importBracket(bracket);

        } catch (err) {
            console.error(err);
            alert("Invalid bracket file.");
        }

        importBracketInput.value = "";
    }
);

async function importBracket(bracket) {
    if (
        typeof bracket.name !== "string" ||
        !Array.isArray(bracket.competitors) ||
        !Array.isArray(bracket.matches)
    ) {
        throw new Error("Invalid bracket format");
    }

    // Don't reuse existing DB id
    delete bracket.id;

    // Optional safety defaults
    bracket.createdAt ??= Date.now();
    bracket.competitors ??= [];
    bracket.matches ??= [];

    await addBracket(bracket);

    loadBrackets();
}