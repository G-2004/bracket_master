import {
    openDatabase,
    getBracketById,
    updateBracket
} from "./db.js";

// ##### STATE

let currentBracket = null;

let selectedCompetitorImage = null;

// ##### DOM

const bracketTitle =
    document.getElementById("bracket-title");

const bracketName =
    document.getElementById("bracket-name");

const bracketThumbnail =
    document.getElementById("bracket-thumbnail");

const competitorGrid =
    document.getElementById("competitor-grid");

const emptyCompetitors =
    document.getElementById("empty-competitors");

// modal

const addCompetitorBtn =
    document.getElementById("add-competitor-btn");

const addCompetitorModal =
    document.getElementById("add-competitor-modal");

const closeAddModalBtn =
    document.getElementById("close-add-modal-btn");

const competitorNameInput =
    document.getElementById("competitor-name-input");

const competitorDescriptionInput =
    document.getElementById("competitor-description-input");

const competitorImageInput =
    document.getElementById("competitor-image-input");

const competitorPreview =
    document.getElementById("competitor-preview");

const saveCompetitorBtn =
    document.getElementById("save-competitor-btn");

// ##### URL PARAMS

const params =
    new URLSearchParams(window.location.search);

const bracketId = params.get("id");

// ##### OPEN DATABASE

openDatabase()
    .then(() => {
        loadBracket();
    })
    .catch((error) => {
        console.error(error);
    });

// ##### LOAD BRACKET

async function loadBracket() {

    if (!bracketId) {

        console.error("Missing bracket ID");

        return;
    }

    const bracket =
        await getBracketById(Number(bracketId));

    if (!bracket) {

        console.error("Bracket not found");

        return;
    }

    // ensure competitors array exists

    if (!bracket.competitors) {

        bracket.competitors = [];
    }

    currentBracket = bracket;

    // load header

    bracketTitle.textContent =
        bracket.name;

    bracketName.textContent =
        bracket.name;

    bracketThumbnail.src =
        bracket.thumbnail;

    // load competitors

    renderCompetitors();
}

// ##### OPEN MODAL

addCompetitorBtn.addEventListener("click", () => {

    addCompetitorModal.classList.remove("hidden");
});

// ##### CLOSE MODAL

closeAddModalBtn.addEventListener("click", () => {

    addCompetitorModal.classList.add("hidden");
});

// ##### IMAGE PREVIEW

competitorImageInput.addEventListener("change", (event) => {

    const file = event.target.files[0];

    if (!file) return;

    selectedCompetitorImage = file;

    const reader = new FileReader();

    reader.readAsDataURL(file);

    reader.onload = () => {

        competitorPreview.src =
            reader.result;

        competitorPreview.hidden = false;
    };
});

// ##### FILE TO BASE64

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

// ##### SAVE COMPETITOR

saveCompetitorBtn.addEventListener("click", async () => {

    const name = competitorNameInput.value.trim();

    const description = competitorDescriptionInput.value.trim();

    if (!name || !selectedCompetitorImage) {

        alert("Missing competitor name or image.");

        return;
    }

    const imageBase64 = await fileToBase64(selectedCompetitorImage);

    const competitor = {

        id: crypto.randomUUID(),

        name: name,

        description: description,

        image: imageBase64
    };

    currentBracket.competitors.push(competitor);

    await updateBracket(currentBracket);

    renderCompetitors();

    resetCompetitorModal();
});

// ##### RENDER COMPETITORS

function renderCompetitors() {

    competitorGrid.replaceChildren();

    if (
        !currentBracket ||
        !currentBracket.competitors ||
        currentBracket.competitors.length === 0
    ) {

        emptyCompetitors.style.display = "block";

        return;
    }

    emptyCompetitors.style.display = "none";

    currentBracket.competitors.forEach((competitor) => {

        const card =
            document.createElement("div");

        card.classList.add("competitorCard");

        const image =
            document.createElement("img");

        image.src =
            competitor.image;

        image.alt =
            competitor.name;

        const title =
            document.createElement("h3");

        title.textContent =
            competitor.name;

        card.appendChild(image);

        card.appendChild(title);

        competitorGrid.appendChild(card);
    });
}

// ##### RESET MODAL

function resetCompetitorModal() {

    addCompetitorModal.classList.add("hidden");

    competitorNameInput.value = "";

    competitorDescriptionInput.value = "";

    competitorImageInput.value = "";

    competitorPreview.src = "";

    competitorPreview.hidden = true;

    selectedCompetitorImage = null;
}