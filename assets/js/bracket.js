import {
    openDatabase,
    getBracketById,
    updateBracket
} from "./db.js";

const searchInput = document.getElementById("competitor-search");

let searchQuery = "";

const slotContextMenu = document.getElementById("slot-context-menu");

let contextTargetMatch = null;
let contextTargetSlot = null;
// ##### STATE

let editingCompetitorId = null;
let currentBracket = null;
let selectedCompetitorId = null;
let selectedCompetitorImage = null;
let tournamentStarted = false;

// ##### DOM

const svg = document.getElementById("bracket-lines");

const bracketTitle = document.getElementById("bracket-title");
const bracketName = document.getElementById("bracket-name");
const bracketThumbnail = document.getElementById("bracket-thumbnail");

const competitorGrid = document.getElementById("competitor-grid");
const emptyCompetitors = document.getElementById("empty-competitors");

const addCompetitorBtn = document.getElementById("add-competitor-btn");
const addCompetitorModal = document.getElementById("add-competitor-modal");
const closeAddModalBtn = document.getElementById("close-add-modal-btn");

const competitorNameInput = document.getElementById("competitor-name-input");
const competitorDescriptionInput = document.getElementById("competitor-description-input");
const competitorImageInput = document.getElementById("competitor-image-input");
const competitorPreview = document.getElementById("competitor-preview");

const saveCompetitorBtn = document.getElementById("save-competitor-btn");

const bracketView = document.getElementById("bracket-view");
const bracketNodes = document.getElementById("bracket-nodes");

// ##### DB

async function saveBracket() {
    await updateBracket(currentBracket);
}

// ##### INIT

openDatabase()
    .then(loadBracket)
    .catch(console.error);

async function loadBracket() {
    const params = new URLSearchParams(window.location.search);
    const bracketId = params.get("id");

    if (!bracketId) return console.error("Missing bracket ID");

    const bracket = await getBracketById(Number(bracketId));
    if (!bracket) return console.error("Bracket not found");

    bracket.competitors ??= [];
    bracket.matches ??= [];

    currentBracket = bracket;

    bracketTitle.textContent = bracket.name;
    bracketName.textContent = bracket.name;
    bracketThumbnail.src = bracket.thumbnail;

    renderCompetitors();
    renderBracket();
}

// ##### UTILITY

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function shuffle(arr) {
    const copy = [...arr];

    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }

    return copy;
}

// ##### Competitors

saveCompetitorBtn.addEventListener("click", async () => {
    
    const name = competitorNameInput.value.trim();
    const description = competitorDescriptionInput.value.trim();

    if (!name || !selectedCompetitorImage) return;

    const imageBase64 = await fileToBase64(selectedCompetitorImage);

    currentBracket.competitors.push({
        id: crypto.randomUUID(),
        name,
        description,
        image: imageBase64
    });

    await saveBracket();
    resetModal();
    renderCompetitors();
});

function renderNormalCard(card, c){
    card.draggable = true;

    card.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("competitorId", c.id);
    });

    if (selectedCompetitorId === c.id) {
        card.classList.add("selectedCompetitor");
    }

    const img = document.createElement("img");
    img.src = c.image;

    const name = document.createElement("h3");
    name.textContent = c.name;

    card.onclick = () => {
        selectedCompetitorId = selectedCompetitorId === c.id ? null : c.id;

        renderCompetitors();
    };

        const deleteBtn = document.createElement("button");
        const icon = document.createElement("i");
        icon.className = "fa-solid fa-xmark";

        deleteBtn.appendChild(icon);
        deleteBtn.onclick = async (e) => {
            e.stopPropagation();

            currentBracket.competitors = currentBracket.competitors.filter(x => x.id !== c.id);

            if (selectedCompetitorId === c.id) {
                selectedCompetitorId = null;
            }

            await saveBracket();
            renderCompetitors();
        };
        deleteBtn.className = "competitorDeleteBtn";

        const editBtn = document.createElement("button");
        const iconEdit = document.createElement("i");
        iconEdit.className = "fa-solid fa-pen-to-square";

        editBtn.appendChild(iconEdit);
        editBtn.onclick = async (e) => {
            e.stopPropagation();

            editingCompetitorId = c.id;

            await saveBracket();
            renderCompetitors();
        };
        editBtn.className = "competitorSaveBtn";

        const ui = document.createElement("div");
        ui.classList.add("competitorActions");
        ui.append(editBtn, deleteBtn);

        card.append(img, name, ui);
        competitorGrid.appendChild(card);
}

function renderEditableCard(card, c){
        if (selectedCompetitorId === c.id) {
            card.classList.add("selectedCompetitor");
        }

        //image
        const img = document.createElement("img");
        img.src = c.image;
        img.classList.add("editableImage");

        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.style.display = "none";

        let newImg = c.image;

        img.onclick = () => {
            fileInput.click();
        };
        fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = () => {
                img.src = reader.result; // update preview
                newImg = reader.result;
            };
            reader.readAsDataURL(file);
        };

        //name
        const newName = document.createElement("input");
        newName.type = "text";
        newName.value = c.name;

        newName.classList.add("competitorTextBox");

        card.onclick = (e) => {
            e.stopPropagation();
        };

        const deleteBtn = document.createElement("button");
        const icon = document.createElement("i");
        icon.className = "fa-solid fa-xmark";

        deleteBtn.appendChild(icon);
        deleteBtn.onclick = async (e) => {
            e.stopPropagation();

            currentBracket.competitors = currentBracket.competitors.filter(x => x.id !== c.id);

            if (selectedCompetitorId === c.id) {
                selectedCompetitorId = null;
            }

            await saveBracket();
            renderCompetitors();
        };
        deleteBtn.className = "competitorDeleteBtn";

        const saveBtn = document.createElement("button");
        const iconSave = document.createElement("i");
        iconSave.className = "fa-solid fa-floppy-disk";

        saveBtn.appendChild(iconSave);
        saveBtn.onclick = async (e) => {
            e.stopPropagation();

            editingCompetitorId = null;
            c.name = newName.value;
            c.image = newImg;

            await saveBracket();
            renderCompetitors();
        };
        saveBtn.className = "competitorSaveBtn";

        const ui = document.createElement("div");
        ui.classList.add("competitorActions");
        ui.append(saveBtn, deleteBtn);

        card.append(img, newName, ui);
        card.append(fileInput);
        fileInput.style.display = "none";
        competitorGrid.appendChild(card);
}
function renderCompetitors() {
    competitorGrid.replaceChildren();

    if (!currentBracket?.competitors?.length) {
        emptyCompetitors.style.display = "block";
        return;
    }

    emptyCompetitors.style.display = "none";

    for (const c of currentBracket.competitors) {

        //display those tied to search only
        if (
            searchQuery &&
            !c.name.toLowerCase().includes(searchQuery)
        ) {
            continue;
        }

        const card = document.createElement("div");
        card.className = "competitorCard";

        //run special editable version
        if (editingCompetitorId === c.id) {
            renderEditableCard(card, c);
            //card.classList.add("editingCompetitor");
        }
        //run our normal existing code
        else {
            renderNormalCard(card, c);
        }

    }
}

// ##### TOURNAMENT CONSTRUCTOR

const startBtn = document.getElementById("start-bracket-btn");

startBtn.addEventListener("click", async () => {
    generateMatches();
    tournamentStarted = true;

    await saveBracket();
    renderBracket();
});

function generateMatches() {
    const players = shuffle(currentBracket.competitors);

    const competitorCount = currentBracket.competitors.length;
    const rounds = Math.ceil(Math.log2(competitorCount));

    let currentRound = [];

    // pair adjacent players in array into the initial matches
    for (let i = 0; i < players.length; i += 2) {
        currentRound.push(
            createMatch(
                1,
                players[i]?.id ?? null,
                players[i + 1]?.id ?? null
            )
        );
    }

    const allMatches = [...currentRound]; //stores all matches

    //we've already set up initial matches so anything after this is in round 2
    let roundNumber = 2;

    //so long as there's at least two matches in this round...
    while (currentRound.length > 1) {

        //... the next round will have half as many
        const nextRound = [];
        for (let i = 0; i < currentRound.length; i += 2) {
            const match = createMatch(roundNumber);
            nextRound.push(match);
        }

        // for every match in this round set up the next match and slot
        for (let i = 0; i < currentRound.length; i++) {
            const currentMatch = currentRound[i];
            const nextMatch = nextRound[Math.floor(i / 2)];

            currentMatch.nextMatchId = nextMatch.id;
            currentMatch.nextSlot = i % 2 === 0 ? "player1Id" : "player2Id";
        }

        // put all matches in next round into the all matches storage/array
        allMatches.push(...nextRound);
        
        //increment to next round and repeat while loop
        currentRound = nextRound;
        roundNumber++;
    }

    currentBracket.matches = allMatches;
}

function createMatch(round, p1Id = null, p2Id = null) {
    return {
        id: crypto.randomUUID(),
        round,
        player1Id: p1Id,
        player2Id: p2Id,
        winnerId: null,
        priorWinnerId: null,
        nextMatchId: null,
        nextSlot: null
    };
}
// ##### Winner Logic

function setWinner(match, competitorId) {
    if (match.winnerId){
        match.priorWinnerId = match.winnerId;
    }
    match.winnerId = competitorId;
    advanceWinner(match);
}

function advanceWinner(match) {
    if (!match.nextMatchId || !match.nextSlot) return;

    //locate which match winner moves in to.
    const nextMatch = currentBracket.matches.find(m => m.id === match.nextMatchId);
    if (!nextMatch) return;

    nextMatch[match.nextSlot] = match.winnerId;

    //if the winner of the next round was set echo downstream with the new winner in all its prior positions
    if (nextMatch.winnerId == match.priorWinnerId && nextMatch.winnerId != null){
        match.priorWinnerId = null;
        setWinner(nextMatch, match.winnerId);
    }
}

// ##### RENDER BRACKET
function renderBracket() {
    bracketNodes.replaceChildren();

    if (!currentBracket?.matches?.length) return;



    for (const match of currentBracket.matches) {
        const el = createMatchDOM(match);

        const matchHeight = getMatchHeight();
        const SPACING = matchHeight * 1.2;

        const yMap = computeLayout(currentBracket.matches, SPACING);

        const y = yMap.get(match.id) ?? 0;

        el.style.position = "absolute";
        el.style.top = `${y}px`;
        el.style.left = `${(match.round -1) * 260}px`;

        bracketNodes.appendChild(el);
    }
    bracketNodes.getBoundingClientRect();
    drawBrackets();
}

function createMatchDOM(match) {

    const card = document.createElement("div");
    card.className = "matchCard";
    card.dataset.id = match.id;

    const p1 = currentBracket.competitors.find(c => c.id === match.player1Id);
    const p2 = currentBracket.competitors.find(c => c.id === match.player2Id);

    const slot1 = slot(match, p1);
    const slot2 = slot(match, p2);

    card.append(slot1, slot2);

    return card;
}

// ##### MATCH UI
function clearDownstream(match) {
    match.winnerId = null;
    match.priorWinnerId = null;

    if (!match.nextMatchId) return;

    const nextMatch =
        currentBracket.matches.find(
            m => m.id === match.nextMatchId
        );

    if (!nextMatch) return;

    nextMatch[match.nextSlot] = null;
    nextMatch.winnerId = null;
    nextMatch.priorWinnerId = null;

    clearDownstream(nextMatch);
}

    document.addEventListener("click", () => {
        slotContextMenu.classList.add("hidden");
        contextTargetMatch = null;
        contextTargetSlot = null;
    });

    document.getElementById("swap-w-selected").addEventListener("click", async () => {
        if (!contextTargetMatch) return;
        if (!selectedCompetitorId) {
            return;
        }

        let oldCompetitorId = contextTargetMatch[contextTargetSlot];

        // find other versions of self and replace with old occupant of new slot
        for (const matchInner of currentBracket.matches) {
            if(matchInner.player1Id == selectedCompetitorId){
                matchInner.player1Id = oldCompetitorId;
                clearDownstream(matchInner);
            }
            else if (matchInner.player2Id == selectedCompetitorId){
                matchInner.player2Id = oldCompetitorId;
                clearDownstream(matchInner);
            }
        }

        // replace old tenant with new tenant
        contextTargetMatch[contextTargetSlot] = selectedCompetitorId;
        clearDownstream(contextTargetMatch);

        slotContextMenu.classList.add("hidden");

        await saveBracket();
        renderBracket();
    });

function slot(match, competitor) {
    //create slot div
    const div = document.createElement("div");
    div.className = "matchPlayer";

    //context menu
    div.addEventListener("contextmenu", (e) => {
        e.preventDefault();

        contextTargetMatch = match;

        contextTargetSlot =
            match.player1Id === competitor?.id
                ? "player1Id"
                : "player2Id";

        slotContextMenu.style.left = `${e.clientX}px`;
        slotContextMenu.style.top = `${e.clientY}px`;
        slotContextMenu.classList.remove("hidden");
    });
    
    //prevent default behavior
    div.addEventListener("dragover", (e) => {
        e.preventDefault();
    });
    div.addEventListener("drop", async (e) => {
        e.preventDefault();

        const competitorId = e.dataTransfer.getData("competitorId");
        
        // ADD SWAP/ADD VIA DRAG DROP HERE !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        //find id of current slot occupant
        let oldCompetitorId = competitor?.id;

        // find other versions of self and replace with old occupant of new slot
        const droppingIntoSlot =
        match.player1Id === competitor?.id
            ? "player1Id"
            : "player2Id";
            
        for (const matchInner of currentBracket.matches) {
            if(matchInner.player1Id == competitorId){
                matchInner.player1Id = oldCompetitorId;
                clearDownstream(matchInner);
            }
            else if (matchInner.player2Id == competitorId){
                matchInner.player2Id = oldCompetitorId;
                clearDownstream(matchInner);
            }
        }

        // replace old tenant with new tenant
        match[droppingIntoSlot] = competitorId;
        clearDownstream(match);
        //make sure winner chains are properly updated and rendered

        await saveBracket();
        renderBracket();
    });

    //create image
    const img = document.createElement("img");
    img.src = competitor?.image ?? "assets/images/noContestant.png";
    img.alt = competitor?.name ?? "TBD";

    const innerDiv = document.createElement("div");
    innerDiv.textContent = competitor?.name ?? "TBD";
    innerDiv.className = "matchPlayerName";

    div.append(img, innerDiv);

    if (match.winnerId === competitor?.id) {
        div.classList.add("winnerSlot");
    }

    div.onclick = async () => {
        if (!competitor?.id) return;

        setWinner(match, competitor.id);

        await saveBracket();
        renderBracket();
    };

    return div;
}

// ##### MODAL

function resetModal() {
    addCompetitorModal.classList.add("hidden");

    competitorNameInput.value = "";
    competitorDescriptionInput.value = "";
    competitorImageInput.value = "";
    competitorPreview.src = "";
    competitorPreview.hidden = true;

    selectedCompetitorImage = null;
}

//Unsorted
addCompetitorBtn.addEventListener("click", () => {
    addCompetitorModal.classList.remove("hidden");
});
closeAddModalBtn.addEventListener("click", () => {
    addCompetitorModal.classList.add("hidden");
});
competitorImageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    selectedCompetitorImage = file;
});

function getParentMatches(match) {
    return currentBracket.matches.filter(
        m => m.nextMatchId === match.id
    );
}

function computeLayout(matches, spacing) {
    const byId = Object.fromEntries(matches.map(m => [m.id, m]));

    const y = new Map();

    

    // 1. assign base y to round 1
    let index = 0;
    for (const m of matches.filter(m => m.round === 1)) {
        y.set(m.id, index * spacing);
        index++;
    }

    // 2. propagate upward round by round
    const rounds = [...new Set(matches.map(m => m.round))].sort();

    //skipping round 1
    for (const r of rounds.slice(1)) {
        for (const m of matches.filter(x => x.round === r)) {
            const parents = matches.filter(p => p.nextMatchId === m.id);

            if (parents.length === 2) {
                const y1 = y.get(parents[0].id);
                const y2 = y.get(parents[1].id);
                y.set(m.id, (y1 + y2) / 2);
            }
            else if (parents.length === 1) {
                const y1 = y.get(parents[0].id);
                y.set(m.id, y1);
            }
        }
    }

    return y;
}

function positionMatches() {
    for (const match of currentBracket.matches) {
        const parents = getParentMatches(match);

        if (parents.length !== 2) continue;

        const childEl = document.querySelector(`[data-id="${match.id}"]`);
        const p1 = document.querySelector(`[data-id="${parents[0].id}"]`);
        const p2 = document.querySelector(`[data-id="${parents[1].id}"]`);

        const y = centerBetween(p1, p2);

        childEl.style.position = "absolute";
        childEl.style.top = `${y}px`;
    }
}

function centerBetween(el1, el2) {
    const r1 = el1.getBoundingClientRect();
    const r2 = el2.getBoundingClientRect();

    const c1 = r1.top + r1.height / 2;
    const c2 = r2.top + r2.height / 2;

    return (c1 + c2) / 2;
}

function getMatchHeight() {
    const els = document.querySelectorAll(".matchCard");

    if (!els.length) return 100;

    let maxHeight = 0;

    for (const el of els) {
        const h = el.getBoundingClientRect().height;
        if (h > maxHeight) maxHeight = h;
    }

    return maxHeight;
}
function drawBrackets(){
    svg.replaceChildren();
    const bracket = currentBracket.matches
    const matchHeight = getMatchHeight();
    const spacing = matchHeight * 1.2;
    const matchYs = computeLayout(bracket, spacing);

    let maxX = 0;
    let maxY = 0;

    for (const match of currentBracket.matches) {
        maxX = Math.max(maxX, (match.round - 1) * 260);
    }

    const yMap = computeLayout(currentBracket.matches, spacing);

    for (const y of yMap.values()) {
        maxY = Math.max(maxY, y);
    }

    svg.setAttribute("width", maxX + 300);
    svg.setAttribute("height", maxY + 200);

    bracketNodes.style.width = `${maxX + 300}px`;
    bracketNodes.style.height = `${maxY + 200}px`;

    for (const m of bracket) { //for each match
        
        const x = (m.round -1) * 260;
        const parents = getParentMatches(m);
        if(parents.length === 2 ){
            const p1 = getMatchPos(parents[0], matchYs);
            const p2 = getMatchPos(parents[1], matchYs);
            const c  = getMatchPos(m, matchYs);

            //halfway xy
            const hx = (p1.x + c.x) / 2;
            const hy = (p1.y + p2.y) / 2;

            // (p1x p1y) to (hx p1y)
            // (p2x p2y) to (hx p2y)
            // (hx p1y) to (hx p2y)
            // (hx hy) to (c1x c1y)

            drawLine(p1.x, p1.y, hx, p1.y);
            drawLine(p2.x, p2.y, hx, p2.y);
            drawLine(hx, p1.y, hx, p2.y);
            drawLine(hx, hy, c.x, c.y);

        }else if(parents.length === 1){
            const p1x = (parents[0].round - 1) * 260;
            const p1y = matchYs.get(parents[0].id) + matchHeight / 2;

            const c1x = (m.round - 1) * 260;
            const c1y = matchYs.get(m.id) + matchHeight / 2;

            drawLine(p1x, p1y, c1x, c1y);
        }
    }
}

function drawLine(x1, y1, x2, y2){
    const line = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line"
    );

    line.setAttribute("x1", x1);
    line.setAttribute("y1", y1);

    line.setAttribute("x2", x2);
    line.setAttribute("y2", y2);

    line.setAttribute("stroke", "white");

    svg.appendChild(line);
}

function getMatchPos(match, matchYs) {
    const el = document.querySelector(`[data-id="${match.id}"]`);

    return {
        x: ((match.round - 1) * 260) + (el.offsetWidth / 2),
        y: (matchYs.get(match.id) ?? 0) + (el.offsetHeight / 2)
    };
}

document.addEventListener("click", (e) => {
    if (editingCompetitorId === null) return;

    const editingCard =
        document.querySelector(".editingCompetitor");

    if (!editingCard.contains(e.target)) {
        editingCompetitorId = null;
        renderCompetitors();
    }
});

const exportBtn = document.getElementById("export-bracket-btn");

exportBtn.addEventListener("click", exportBracket);

function exportBracket() {
    if (!currentBracket) return;

    const json = JSON.stringify(currentBracket, null, 2);

    const blob = new Blob(
        [json],
        { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentBracket.name}.json`;

    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
}

// Depricated
function syncSvgSize() {
    const rect = bracketNodes.getBoundingClientRect();
    svg.setAttribute("width", rect.width);
    svg.setAttribute("height", rect.height);
}

let dragScrolling = false;

document.addEventListener("dragover", (e) => {
    const rect = bracketView.getBoundingClientRect();

    const edgeSize = 200;
    const scrollSpeed = 50;

    // Horizontal
    if (e.clientX > rect.right - edgeSize) {
        bracketView.scrollLeft += scrollSpeed;
    }
    else if (e.clientX < rect.left + edgeSize) {
        bracketView.scrollLeft -= scrollSpeed;
    }

    // Vertical
    if (e.clientY > rect.bottom - edgeSize) {
        bracketView.scrollTop += scrollSpeed;
    }
    else if (e.clientY < rect.top + edgeSize) {
        bracketView.scrollTop -= scrollSpeed;
    }
});



searchInput.addEventListener("input", (e) => {
    searchQuery = e.target.value.toLowerCase();
    renderCompetitors();
});