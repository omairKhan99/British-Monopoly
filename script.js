// --- Game Constants ---
const TOTAL_SPACES = 40;
const PASS_GO_SALARY = 200;
const STARTING_MONEY = 1500;
const PLAYER_REPRESENTATIONS = ['🐎', '🐆', '🐘', '🐅', '🐒', '🐕'];
const PLAYER_UI_COLORS = ['#FF0000', '#0000FF', '#00AA00', '#FF8C00', '#800080', '#D2691E'];
const JAIL_POSITION = 10;
const JAIL_FINE = 50;
const MAX_JAIL_ROLL_ATTEMPTS = 3;
const MAX_HOUSES = 4; // Max houses before a hotel
const HOTEL_LEVEL = 5; // Represents a hotel in the 'houses' count

// Board position constants for cards & specific properties
const GO_POSITION = 0;
const KINGS_CROSS_POSITION = 5; const MARYLEBONE_POSITION = 15; const FENCHURCH_ST_POSITION = 25; const LIVERPOOL_ST_POSITION = 35;
const PALL_MALL_POSITION = 11; const MAYFAIR_POSITION = 39; const TRAFALGAR_SQ_POSITION = 24;
const ELECTRIC_COMPANY_POSITION = 12; const WATER_WORKS_POSITION = 28;


// --- Game State Variables ---
let players = [];
let currentPlayerIndex = 0;
let dice = [0, 0];
let gameInitialized = false;
let boardData = [];
let chanceCards = [];
let communityChestCards = [];
let chanceCardIndex = 0;
let communityChestCardIndex = 0;
let rolledDoublesToGetOutOfJailThisAction = false;
let propertyManagementActionInProgress = false; // Flag to prevent other actions during property management


// --- DOM Elements ---
const rollDiceButton = document.getElementById('rollDiceButton');
const managePropertiesButton = document.getElementById('managePropertiesButton'); // New button
const dice1Display = document.getElementById('dice1Display');
const dice2Display = document.getElementById('dice2Display');
const diceTotalDisplay = document.getElementById('diceTotalDisplay');
const currentPlayerNameDisplay = document.getElementById('currentPlayerName');
const playerInfoContainer = document.getElementById('playerInfoContainer');
const messageLog = document.getElementById('messageLog');
const eventModal = document.getElementById('eventModal');
const modalTitle = document.getElementById('modalTitle');
const modalMessage = document.getElementById('modalMessage');
const modalButtons = document.getElementById('modalButtons');
const chanceCardPileDisplay = document.getElementById('chanceCardPile');
const communityChestCardPileDisplay = document.getElementById('communityChestCardPile');

// --- Card Definitions & Management (Identical to previous version) ---
function initializeDecks() {
    chanceCards = [
        { text: "Advance to Go (Collect £200).", type: "moveTo", value: GO_POSITION, collectGo: true },
        { text: "Advance to Trafalgar Square. If you pass Go, collect £200.", type: "moveTo", value: TRAFALGAR_SQ_POSITION, collectGo: true },
        { text: "Advance to Mayfair.", type: "moveTo", value: MAYFAIR_POSITION, collectGo: false },
        { text: "Advance to Pall Mall. If you pass Go, collect £200.", type: "moveTo", value: PALL_MALL_POSITION, collectGo: true },
        { text: "Advance to the nearest Station. If unowned, you may buy it from the Bank. If owned, pay owner twice the rental to which they are otherwise entitled.", type: "moveToNearest", value: "station", subType: "payDoubleRentOrBuy" },
        { text: "Advance to the nearest Utility. If unowned, you may buy it from the Bank. If owned, throw dice and pay owner a total ten times amount thrown.", type: "moveToNearest", value: "utility", subType: "payDiceRollRentOrBuy" },
        { text: "Bank pays you dividend of £50.", type: "collectMoney", value: 50 },
        { text: "Get Out of Jail Free. This card may be kept until needed or sold.", type: "getOutOfJailFree" },
        { text: "Go Back 3 Spaces.", type: "moveSpaces", value: -3 },
        { text: "Go to Jail. Go directly to Jail, do not pass Go, do not collect £200.", type: "goToJail" },
        { text: "Make general repairs on all your property – for each house pay £25 – for each hotel pay £100.", type: "streetRepairs", houseCost: 25, hotelCost: 100 },
        { text: "Pay poor tax of £15.", type: "payMoney", value: 15 },
        { text: "Take a trip to King's Cross Station. If you pass Go, collect £200.", type: "moveTo", value: KINGS_CROSS_POSITION, collectGo: true },
        { text: "You have been elected Chairman of the Board. Pay each player £50.", type: "payEachPlayer", value: 50 },
        { text: "Your building loan matures. Collect £150.", type: "collectMoney", value: 150 },
    ];
    communityChestCards = [
        { text: "Advance to Go (Collect £200).", type: "moveTo", value: GO_POSITION, collectGo: true },
        { text: "Bank error in your favour. Collect £200.", type: "collectMoney", value: 200 },
        { text: "Doctor's fee. Pay £50.", type: "payMoney", value: 50 },
        { text: "From sale of stock you get £50.", type: "collectMoney", value: 50 },
        { text: "Get Out of Jail Free. This card may be kept until needed or sold.", type: "getOutOfJailFree" },
        { text: "Go to Jail. Go directly to Jail, do not pass Go, do not collect £200.", type: "goToJail" },
        { text: "Grand Opera Night. Collect £50 from every player for opening night seats.", type: "collectFromPlayers", value: 50 },
        { text: "Holiday Fund matures. Receive £100.", type: "collectMoney", value: 100 },
        { text: "Income tax refund. Collect £20.", type: "collectMoney", value: 20 },
        { text: "It is your birthday. Collect £10 from each player.", type: "collectFromPlayers", value: 10 },
        { text: "Pay hospital fees of £100.", type: "payMoney", value: 100 },
        { text: "Pay school fees of £50.", type: "payMoney", value: 50 },
        { text: "Receive £25 consultancy fee.", type: "collectMoney", value: 25 },
        { text: "You are assessed for street repairs. £40 per house, £115 per hotel.", type: "streetRepairs", houseCost: 40, hotelCost: 115 },
        { text: "You have won second prize in a beauty contest. Collect £10.", type: "collectMoney", value: 10 },
    ];
    shuffleDeck(chanceCards); shuffleDeck(communityChestCards); updateCardPileDisplays();
}
function shuffleDeck(deck) { for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; } }
function drawCard(deckType) { let card; if (deckType === 'chance') { card = chanceCards[chanceCardIndex]; chanceCardIndex = (chanceCardIndex + 1) % chanceCards.length; } else { card = communityChestCards[communityChestCardIndex]; communityChestCardIndex = (communityChestCardIndex + 1) % communityChestCards.length; } logMessage(`${players[currentPlayerIndex].name} drew a ${deckType} card: "${card.text}"`); updateCardPileDisplays(); return card; }
function updateCardPileDisplays() { chanceCardPileDisplay.innerHTML = `CHANCE <br> (${chanceCards.length} cards)`; communityChestCardPileDisplay.innerHTML = `COMMUNITY CHEST <br> (${communityChestCards.length} cards)`; }


// --- Board Data Initialization (Added 'houses: 0' to all properties) ---
function initializeBoardData() {
    boardData = [
        { id: 'space-0', name: "GO", type: "go", group: "corner" },
        { id: 'space-1', name: "Old Kent Road", type: "property", price: 60, rent: [2, 10, 30, 90, 160, 250], group: "brown", ownerId: null, houseCost: 50, houses: 0 },
        { id: 'space-2', name: "Community Chest", type: "community-chest", group: "event" },
        { id: 'space-3', name: "Whitechapel Road", type: "property", price: 60, rent: [4, 20, 60, 180, 320, 450], group: "brown", ownerId: null, houseCost: 50, houses: 0 },
        { id: 'space-4', name: "Income Tax", type: "tax", amount: 200, group: "event" },
        { id: 'space-5', name: "King's Cross Station", type: "station", price: 200, rent: [25, 50, 100, 200], group: "station", ownerId: null },
        { id: 'space-6', name: "The Angel, Islington", type: "property", price: 100, rent: [6, 30, 90, 270, 400, 550], group: "light-blue", ownerId: null, houseCost: 50, houses: 0 },
        { id: 'space-7', name: "Chance", type: "chance", group: "event" },
        { id: 'space-8', name: "Euston Road", type: "property", price: 100, rent: [6, 30, 90, 270, 400, 550], group: "light-blue", ownerId: null, houseCost: 50, houses: 0 },
        { id: 'space-9', name: "Pentonville Road", type: "property", price: 120, rent: [8, 40, 100, 300, 450, 600], group: "light-blue", ownerId: null, houseCost: 50, houses: 0 },
        { id: 'space-10', name: "Jail / Just Visiting", type: "jail", group: "corner" },
        { id: 'space-11', name: "Pall Mall", type: "property", price: 140, rent: [10, 50, 150, 450, 625, 750], group: "pink", ownerId: null, houseCost: 100, houses: 0 },
        { id: 'space-12', name: "Electric Company", type: "utility", price: 150, group: "utility", ownerId: null },
        { id: 'space-13', name: "Whitehall", type: "property", price: 140, rent: [10, 50, 150, 450, 625, 750], group: "pink", ownerId: null, houseCost: 100, houses: 0 },
        { id: 'space-14', name: "Northumberland Avenue", type: "property", price: 160, rent: [12, 60, 180, 500, 700, 900], group: "pink", ownerId: null, houseCost: 100, houses: 0 },
        { id: 'space-15', name: "Marylebone Station", type: "station", price: 200, rent: [25, 50, 100, 200], group: "station", ownerId: null },
        { id: 'space-16', name: "Bow Street", type: "property", price: 180, rent: [14, 70, 200, 550, 750, 950], group: "orange", ownerId: null, houseCost: 100, houses: 0 },
        { id: 'space-17', name: "Community Chest", type: "community-chest", group: "event" },
        { id: 'space-18', name: "Marlborough Street", type: "property", price: 180, rent: [14, 70, 200, 550, 750, 950], group: "orange", ownerId: null, houseCost: 100, houses: 0 },
        { id: 'space-19', name: "Vine Street", type: "property", price: 200, rent: [16, 80, 220, 600, 800, 1000], group: "orange", ownerId: null, houseCost: 100, houses: 0 },
        { id: 'space-20', name: "Free Parking", type: "free-parking", group: "corner" },
        { id: 'space-21', name: "Strand", type: "property", price: 220, rent: [18, 90, 250, 700, 875, 1050], group: "red", ownerId: null, houseCost: 150, houses: 0 },
        { id: 'space-22', name: "Chance", type: "chance", group: "event" },
        { id: 'space-23', name: "Fleet Street", type: "property", price: 220, rent: [18, 90, 250, 700, 875, 1050], group: "red", ownerId: null, houseCost: 150, houses: 0 },
        { id: 'space-24', name: "Trafalgar Square", type: "property", price: 240, rent: [20, 100, 300, 750, 925, 1100], group: "red", ownerId: null, houseCost: 150, houses: 0 },
        { id: 'space-25', name: "Fenchurch St. Station", type: "station", price: 200, rent: [25, 50, 100, 200], group: "station", ownerId: null },
        { id: 'space-26', name: "Leicester Square", type: "property", price: 260, rent: [22, 110, 330, 800, 975, 1150], group: "yellow", ownerId: null, houseCost: 150, houses: 0 },
        { id: 'space-27', name: "Coventry Street", type: "property", price: 260, rent: [22, 110, 330, 800, 975, 1150], group: "yellow", ownerId: null, houseCost: 150, houses: 0 },
        { id: 'space-28', name: "Water Works", type: "utility", price: 150, group: "utility", ownerId: null },
        { id: 'space-29', name: "Piccadilly", type: "property", price: 280, rent: [24, 120, 360, 850, 1025, 1200], group: "yellow", ownerId: null, houseCost: 150, houses: 0 },
        { id: 'space-30', name: "Go To Jail", type: "go-to-jail", group: "corner" },
        { id: 'space-31', name: "Regent Street", type: "property", price: 300, rent: [26, 130, 390, 900, 1100, 1275], group: "green", ownerId: null, houseCost: 200, houses: 0 },
        { id: 'space-32', name: "Oxford Street", type: "property", price: 300, rent: [26, 130, 390, 900, 1100, 1275], group: "green", ownerId: null, houseCost: 200, houses: 0 },
        { id: 'space-33', name: "Community Chest", type: "community-chest", group: "event" },
        { id: 'space-34', name: "Bond Street", type: "property", price: 320, rent: [28, 150, 450, 1000, 1200, 1400], group: "green", ownerId: null, houseCost: 200, houses: 0 },
        { id: 'space-35', name: "Liverpool St. Station", type: "station", price: 200, rent: [25, 50, 100, 200], group: "station", ownerId: null },
        { id: 'space-36', name: "Chance", type: "chance", group: "event" },
        { id: 'space-37', name: "Park Lane", type: "property", price: 350, rent: [35, 175, 500, 1100, 1300, 1500], group: "dark-blue", ownerId: null, houseCost: 200, houses: 0 },
        { id: 'space-38', name: "Super Tax", type: "tax", amount: 100, group: "event" },
        { id: 'space-39', name: "Mayfair", type: "property", price: 400, rent: [50, 200, 600, 1400, 1700, 2000], group: "dark-blue", ownerId: null, houseCost: 200, houses: 0 }
    ];
    boardData.forEach(space => {
        if (!('ownerId' in space) && (space.type === 'property' || space.type === 'station' || space.type === 'utility')) {
            space.ownerId = null;
        }
        if (space.type === 'property' && !('houses' in space)) { 
            space.houses = 0; 
        }
    });
}

// --- Modal Functions (Identical to previous version) ---
function showModal(title, message, buttonsConfig = [{ text: "OK", action: null }]) {
    modalTitle.textContent = title;
    modalMessage.innerHTML = message;
    modalButtons.innerHTML = '';
    buttonsConfig.forEach(btnConfig => {
        const button = document.createElement('button');
        button.textContent = btnConfig.text;
        button.classList.add('modal-button');
        if (btnConfig.class) button.classList.add(btnConfig.class);
        if (btnConfig.disabled) button.disabled = true;
        button.onclick = () => {
            hideModal(); 
            if (btnConfig.action) btnConfig.action();
        };
        modalButtons.appendChild(button);
    });
    eventModal.classList.add('visible');
}
function hideModal() { eventModal.classList.remove('visible'); }

// --- Game Initialization (Identical to previous version) ---
function initializeGame(numPlayers = 2) { 
    if (gameInitialized) { logMessage("Game already initialized."); return; }
    initializeBoardData(); initializeDecks(); 
    players = []; currentPlayerIndex = 0; playerInfoContainer.innerHTML = '';
    document.querySelectorAll('.player-token').forEach(token => token.remove());
    document.querySelectorAll('.owner-marker').forEach(marker => marker.style.backgroundColor = 'transparent');
    document.querySelectorAll('.house-hotel-display').forEach(disp => disp.textContent = ''); // Clear old house displays

    for (let i = 0; i < numPlayers; i++) {
        const player = {
            id: i, name: `Player ${i + 1}`,
            tokenRepresentation: PLAYER_REPRESENTATIONS[i % PLAYER_REPRESENTATIONS.length],
            uiColor: PLAYER_UI_COLORS[i % PLAYER_UI_COLORS.length],
            money: STARTING_MONEY, currentPosition: 0, propertiesOwned: [],
            inJail: false, jailTurnsAttempted: 0, getOutOfJailFreeCards: 0,
            tokenElement: null, infoElement: null
        };
        players.push(player); createPlayerToken(player); createPlayerInfoDisplay(player);
    }
    updateAllPlayerInfoDisplays(); updateCurrentPlayerDisplay();
    logMessage(`Monopoly game started with ${numPlayers} players. ${players[0].name}'s turn.`);
    gameInitialized = true; rollDiceButton.disabled = false; managePropertiesButton.disabled = false;
}

// --- Player Token and Info Display Functions (Identical to previous version) ---
function createPlayerToken(player) { const token = document.createElement('div'); token.classList.add('player-token'); token.innerHTML = player.tokenRepresentation; token.setAttribute('title', player.name); player.tokenElement = token; placeTokenOnBoard(player); }
function createPlayerInfoDisplay(player) {
    const infoDiv = document.createElement('div'); infoDiv.classList.add('player-info'); infoDiv.id = `player-info-${player.id}`;
    infoDiv.innerHTML = `
        <h3 style="color: ${player.uiColor};">${player.name} (${player.tokenRepresentation})</h3>
        <p>Money: <span class="money-display">£${player.money}</span></p>
        <p>Position: <span class="position-display">GO</span></p>
        <p>Properties: <span class="properties-display">0</span></p>
        <p>GOOJFC: <span class="goojfc-display">0</span></p>
    `;
    player.infoElement = infoDiv; playerInfoContainer.appendChild(infoDiv);
}
function updatePlayerInfoDisplay(player) {
     if (player.infoElement) {
        player.infoElement.querySelector('.money-display').textContent = `£${player.money}`;
        const spaceData = boardData[player.currentPosition];
        player.infoElement.querySelector('.position-display').textContent = spaceData.name.split('<br>')[0];
        player.infoElement.querySelector('.properties-display').textContent = player.propertiesOwned.length;
        player.infoElement.querySelector('.goojfc-display').textContent = player.getOutOfJailFreeCards;
    }
    document.querySelectorAll('.player-info').forEach(el => el.classList.remove('active-player'));
    if (players[currentPlayerIndex] && players[currentPlayerIndex].infoElement) {
        players[currentPlayerIndex].infoElement.classList.add('active-player');
    }
}
function updateAllPlayerInfoDisplays() { players.forEach(p => updatePlayerInfoDisplay(p)); }
function placeTokenOnBoard(player) { 
    const currentSpaceHtmlId = boardData[player.currentPosition].id;
    const spaceElement = document.getElementById(currentSpaceHtmlId);
    if (spaceElement) {
        const tokenContainer = spaceElement.querySelector('.token-container');
        if (tokenContainer) { if (player.tokenElement.parentNode) { player.tokenElement.parentNode.removeChild(player.tokenElement); } tokenContainer.appendChild(player.tokenElement); }
    }
}
function updateOwnerMarker(spaceIndex) { 
    const spaceData = boardData[spaceIndex];
    const spaceElement = document.getElementById(spaceData.id);
    if (spaceElement && (spaceData.type === 'property' || spaceData.type === 'station' || spaceData.type === 'utility')) {
        const ownerMarkerElement = spaceElement.querySelector('.owner-marker');
        if (ownerMarkerElement) { if (spaceData.ownerId !== null && players[spaceData.ownerId]) { ownerMarkerElement.style.backgroundColor = players[spaceData.ownerId].uiColor; } else { ownerMarkerElement.style.backgroundColor = 'transparent'; } }
    }
}
/**
 * Updates the visual display of houses/hotels on a given property space.
 * @param {number} spaceIndex - The index of the property in boardData.
 */
function updateHouseHotelDisplay(spaceIndex) {
    const property = boardData[spaceIndex];
    const spaceElement = document.getElementById(property.id);
    if (!spaceElement || property.type !== 'property') return;

    let displayElement = spaceElement.querySelector('.house-hotel-display');
    if (!displayElement) { // Create if it doesn't exist (should be in HTML)
        displayElement = document.createElement('div');
        displayElement.classList.add('house-hotel-display');
        // Try to insert it before the token container for better layout
        const tokenContainer = spaceElement.querySelector('.token-container');
        if (tokenContainer) {
            spaceElement.insertBefore(displayElement, tokenContainer);
        } else {
            spaceElement.appendChild(displayElement); // Fallback
        }
    }

    if (property.houses === HOTEL_LEVEL) {
        displayElement.textContent = "🏨"; // Hotel emoji
        displayElement.style.color = 'red';
    } else if (property.houses > 0) {
        displayElement.textContent = '🏠'.repeat(property.houses); // House emoji repeated
        displayElement.style.color = 'green';
    } else {
        displayElement.textContent = ''; // Clear if no houses/hotel
    }
}


// --- Dice Rolling (Identical to previous version) ---
function rollDice() { 
    dice[0] = Math.floor(Math.random() * 6) + 1; dice[1] = Math.floor(Math.random() * 6) + 1;
    dice1Display.textContent = dice[0]; dice2Display.textContent = dice[1]; diceTotalDisplay.textContent = dice[0] + dice[1];
    return dice; 
}

// --- Main Turn Handling (Identical to previous version) ---
function handlePlayerTurn() {
    if (!gameInitialized || propertyManagementActionInProgress) {
        if(!gameInitialized) logMessage("Please initialize the game first.");
        return;
    }
    const currentPlayer = players[currentPlayerIndex];
    rolledDoublesToGetOutOfJailThisAction = false; 

    if (currentPlayer.inJail) {
        handleJailTurn(currentPlayer); 
    } else {
        performNormalRollAndMove(currentPlayer); 
    }
}
function performNormalRollAndMove(player) {
    rollDiceButton.disabled = true; managePropertiesButton.disabled = true;
    const diceResult = rollDice(); 
    const steps = diceResult[0] + diceResult[1];
    logMessage(`${player.name} (${player.tokenRepresentation}) rolled ${diceResult[0]} + ${diceResult[1]} = ${steps}.`);

    const oldPosition = player.currentPosition;
    let newPosition = (oldPosition + steps) % TOTAL_SPACES; 

    if (newPosition < oldPosition && (oldPosition + steps) >= TOTAL_SPACES) {
         player.money += PASS_GO_SALARY;
         logMessage(`${player.name} passed GO and collected £${PASS_GO_SALARY}.`);
    }
    player.currentPosition = newPosition;

    placeTokenOnBoard(player); 
    updatePlayerInfoDisplay(player); 
    logMessage(`${player.name} landed on ${boardData[player.currentPosition].name.split('<br>')[0]}.`);
    handleLandingOnSpace(player); 
}

// --- Jail Specific Logic (Identical to previous version) ---
function handleJailTurn(player) { /* ... same ... */ 
    player.jailTurnsAttempted = player.jailTurnsAttempted || 0; 
    player.jailTurnsAttempted++; 
    let modalMessageText = `${player.name}, you are in Jail (Attempt ${player.jailTurnsAttempted}/${MAX_JAIL_ROLL_ATTEMPTS} to roll doubles).`;
    let options = [];
    if (player.jailTurnsAttempted <= MAX_JAIL_ROLL_ATTEMPTS) { options.push({ text: `Roll for Doubles (Attempt ${player.jailTurnsAttempted})`, action: () => tryRollOutOfJail(player) }); }
    options.push({ text: `Pay £${JAIL_FINE} Fine`, action: () => payFineToGetOutOfJail(player), disabled: player.money < JAIL_FINE });
    if (player.getOutOfJailFreeCards > 0) { options.push({ text: `Use Get Out of Jail Free Card (${player.getOutOfJailFreeCards} left)`, action: () => useCardToGetOutOfJail(player) }); }
    if (player.jailTurnsAttempted > MAX_JAIL_ROLL_ATTEMPTS && player.inJail) { 
         modalMessageText = `${player.name}, you are in Jail. Max roll attempts reached. You must pay the fine or use a card if available.`;
         options = options.filter(opt => opt.text.startsWith("Pay") || opt.text.startsWith("Use"));
         if (options.length === 0 || (options.every(opt => opt.disabled))) {
            logMessage(`${player.name} is stuck in jail! No money for fine and no GOOJFC.`);
            endTurnActions(); return;
         }
    }
    showModal("In Jail!", modalMessageText, options);
}
function tryRollOutOfJail(player) { /* ... same ... */ 
    const d = rollDice(); 
    logMessage(`${player.name} (in jail) rolled ${d[0]} and ${d[1]}.`);
    if (d[0] === d[1]) { 
        player.inJail = false; player.jailTurnsAttempted = 0; rolledDoublesToGetOutOfJailThisAction = true; 
        logMessage("Doubles! You're out of jail. You move " + (d[0] + d[1]) + " spaces.");
        player.currentPosition = (JAIL_POSITION + d[0] + d[1]) % TOTAL_SPACES;
        placeTokenOnBoard(player); updatePlayerInfoDisplay(player);
        logMessage(`${player.name} moved to ${boardData[player.currentPosition].name.split('<br>')[0]}.`);
        handleLandingOnSpace(player); 
    } else { 
        logMessage("No doubles.");
        if (player.jailTurnsAttempted >= MAX_JAIL_ROLL_ATTEMPTS) { logMessage("Max roll attempts reached. You must pay or use a card next turn if you haven't already this turn."); }
        endTurnActions(); 
    }
}
function payFineToGetOutOfJail(player) { /* ... same ... */ 
    if (player.money >= JAIL_FINE) {
        player.money -= JAIL_FINE; player.inJail = false; player.jailTurnsAttempted = 0; 
        logMessage(`${player.name} paid £${JAIL_FINE} and is out of jail. Roll for your turn.`);
        updatePlayerInfoDisplay(player); rollDiceButton.disabled = false; managePropertiesButton.disabled = false;
    } else {
        logMessage(`${player.name} does not have £${JAIL_FINE} to pay the fine.`);
        if (player.jailTurnsAttempted > MAX_JAIL_ROLL_ATTEMPTS) { handleJailTurn(player); } else { endTurnActions(); }
    }
}
function useCardToGetOutOfJail(player) { /* ... same ... */ 
    if (player.getOutOfJailFreeCards > 0) {
        player.getOutOfJailFreeCards--; player.inJail = false; player.jailTurnsAttempted = 0; 
        logMessage(`${player.name} used a Get Out of Jail Free card and is out of jail. Roll for your turn.`);
        updatePlayerInfoDisplay(player); rollDiceButton.disabled = false; managePropertiesButton.disabled = false;
    } else {
         logMessage(`${player.name} has no Get Out of Jail Free cards.`);
         if (player.jailTurnsAttempted > MAX_JAIL_ROLL_ATTEMPTS) { handleJailTurn(player); } else { endTurnActions(); }
    }
}

// --- Landing Actions, Card Effects, Property Logic (Identical to previous version, with minor rent calc update) ---
function handleLandingOnSpace(player) { /* ... same ... */ 
    const space = boardData[player.currentPosition];
    let subsequentAction = () => endTurnActions(); 
    rollDiceButton.disabled = true; managePropertiesButton.disabled = true; // Disable buttons during action processing

    switch (space.type) {
        case 'property': case 'station': case 'utility': handleOwnableSpace(player, space); return;
        case 'go-to-jail': goToJail(player); return;
        case 'chance': const chanceCard = drawCard('chance'); showModal("Chance Card!", chanceCard.text, [{ text: "OK", action: () => applyCardEffect(player, chanceCard) }]); return; 
        case 'community-chest': const communityCard = drawCard('community-chest'); showModal("Community Chest Card!", communityCard.text, [{ text: "OK", action: () => applyCardEffect(player, communityCard) }]); return; 
        case 'tax': payTax(player, space); return;
        case 'go': logMessage(`${player.name} landed on GO. Collect £${PASS_GO_SALARY}.`); if (player.currentPosition === GO_POSITION) { player.money += PASS_GO_SALARY; updatePlayerInfoDisplay(player); } break; 
        case 'jail': logMessage(`${player.name} is just visiting Jail.`); break; 
        case 'free-parking': logMessage(`${player.name} landed on Free Parking. Take a break!`); break; 
        default: logMessage(`Landed on ${space.name} - no special action defined.`); break; 
    }
    subsequentAction(); 
}
function applyCardEffect(player, card) { /* ... same ... */ 
    logMessage(`Applying card: ${card.text}`);
    let passedGoOnCardMove = false; let actionLeadsToNewSpace = false; let newSpaceToHandle = null;
    switch (card.type) {
        case 'moveTo': const oldPos = player.currentPosition; player.currentPosition = card.value; 
            if (card.collectGo && player.currentPosition < oldPos && oldPos !== player.currentPosition) { player.money += PASS_GO_SALARY; passedGoOnCardMove = true; logMessage(`${player.name} passed GO by card and collected £${PASS_GO_SALARY}.`); } 
            else if (card.collectGo && card.value === GO_POSITION && oldPos !== GO_POSITION) { player.money += PASS_GO_SALARY; passedGoOnCardMove = true; logMessage(`${player.name} advanced to GO by card and collected £${PASS_GO_SALARY}.`);}
            placeTokenOnBoard(player); logMessage(`${player.name} moved to ${boardData[player.currentPosition].name}.`); actionLeadsToNewSpace = true; newSpaceToHandle = boardData[player.currentPosition]; break;
        case 'moveToNearest': let nearestPosition = -1; const originalPos = player.currentPosition;
            for (let i = 1; i <= TOTAL_SPACES; i++) { const checkPos = (originalPos + i) % TOTAL_SPACES; if (boardData[checkPos].type === card.value) { nearestPosition = checkPos; break; } }
            if (nearestPosition !== -1) {
                const oldP = player.currentPosition; player.currentPosition = nearestPosition;
                if (player.currentPosition < oldP) { player.money += PASS_GO_SALARY; passedGoOnCardMove = true; logMessage(`${player.name} passed GO and collected £${PASS_GO_SALARY}.`); }
                placeTokenOnBoard(player); logMessage(`${player.name} moved to nearest ${card.value}: ${boardData[player.currentPosition].name}.`); actionLeadsToNewSpace = true; newSpaceToHandle = boardData[player.currentPosition];
                if (newSpaceToHandle.ownerId !== null && newSpaceToHandle.ownerId !== player.id) {
                    if (card.subType === "payDoubleRentOrBuy" && newSpaceToHandle.type === "station") { player.cardRentModifier = { type: "doubleStationRent" }; } 
                    else if (card.subType === "payDiceRollRentOrBuy" && newSpaceToHandle.type === "utility") { player.cardRentModifier = { type: "diceRollUtilityRent" }; }
                }
            } break;
        case 'collectMoney': player.money += card.value; logMessage(`${player.name} collected £${card.value}.`); break;
        case 'payMoney': player.money -= card.value; logMessage(`${player.name} paid £${card.value}.`); break;
        case 'getOutOfJailFree': player.getOutOfJailFreeCards++; logMessage(`${player.name} received a "Get Out of Jail Free" card.`); break;
        case 'goToJail': goToJail(player, true); return; 
        case 'moveSpaces': const prevPos = player.currentPosition; player.currentPosition = (player.currentPosition + card.value + TOTAL_SPACES) % TOTAL_SPACES; placeTokenOnBoard(player); logMessage(`${player.name} moved ${card.value > 0 ? card.value : -card.value} spaces ${card.value > 0 ? 'forward' : 'back'} to ${boardData[player.currentPosition].name}.`); actionLeadsToNewSpace = true; newSpaceToHandle = boardData[player.currentPosition]; break;
        case 'streetRepairs': let totalRepairCost = 0; 
            player.propertiesOwned.forEach(propId => {
                const propData = boardData.find(s => s.id === propId);
                if (propData && propData.type === 'property') { 
                    if (propData.houses === HOTEL_LEVEL) totalRepairCost += card.hotelCost;
                    else totalRepairCost += (propData.houses * card.houseCost);
                }
            });
            if (totalRepairCost > 0) { player.money -= totalRepairCost; logMessage(`${player.name} paid £${totalRepairCost} for street repairs.`); } 
            else { logMessage(`${player.name} has no developed properties for street repairs.`);}
            break;
        case 'payEachPlayer': players.forEach(p => { if (p.id !== player.id) { player.money -= card.value; p.money += card.value; updatePlayerInfoDisplay(p); } }); logMessage(`${player.name} paid each player £${card.value}.`); break;
        case 'collectFromPlayers': players.forEach(p => { if (p.id !== player.id) { p.money -= card.value; player.money += card.value; updatePlayerInfoDisplay(p); } }); logMessage(`${player.name} collected £${card.value} from each player.`); break;
    }
    updateAllPlayerInfoDisplays();
    if(actionLeadsToNewSpace && newSpaceToHandle) {
        if (newSpaceToHandle.type === 'chance' || newSpaceToHandle.type === 'community-chest') { logMessage(`Landed on ${newSpaceToHandle.name} due to a card. No further card draw this turn.`); endTurnActions(); } 
        else { handleLandingOnSpace(player); }
    } else { endTurnActions(); }
}
function handleOwnableSpace(player, space) { /* ... same, uses space.houses for rent ... */ 
    if (space.ownerId === null) { 
        const buyCost = space.price;
        showModal( `For Sale: ${space.name}`, `This property is unowned. Would you like to buy it for £${buyCost}? <br>Your money: £${player.money}`,
            [ { text: `Buy (£${buyCost})`, action: () => { tryBuyProperty(player, space); }, disabled: player.money < buyCost },
              { text: "Pass", action: () => { logMessage(`${player.name} decided not to buy ${space.name}.`); endTurnActions(); }, class: 'secondary' } ]
        );
    } else if (space.ownerId !== player.id) { 
        const owner = players[space.ownerId]; let rentAmount = 0;
        if (space.type === 'property') { rentAmount = space.rent[space.houses || 0]; } 
        else if (space.type === 'station') { const stationsOwned = owner.propertiesOwned.filter(pId => { const sData = boardData.find(s => s.id === pId); return sData && sData.type === 'station'; }).length; rentAmount = space.rent[stationsOwned - 1] || 25; } 
        else if (space.type === 'utility') { 
            const utilitiesOwned = owner.propertiesOwned.filter(pId => { const sData = boardData.find(s => s.id === pId); return sData && sData.type === 'utility'; }).length; 
            const lastRollTotal = dice[0] + dice[1]; 
            if (player.cardRentModifier && player.cardRentModifier.type === "diceRollUtilityRent") { const utilityCardDiceRoll = Math.floor(Math.random() * 6) + 1 + Math.floor(Math.random() * 6) + 1; logMessage(`${player.name} rolled ${utilityCardDiceRoll} for utility rent due to card.`); rentAmount = utilityCardDiceRoll * 10; delete player.cardRentModifier; } 
            else { rentAmount = utilitiesOwned === 1 ? lastRollTotal * 4 : lastRollTotal * 10; }
        }
        if (player.cardRentModifier && player.cardRentModifier.type === "doubleStationRent" && space.type === "station") { rentAmount *= 2; logMessage(`Station rent doubled due to card: £${rentAmount}`); delete player.cardRentModifier; }
        if (rentAmount > 0) { showModal( "Rent Due!", `This property is owned by ${owner.name}. You owe £${rentAmount} in rent.`, [{ text: `Pay £${rentAmount}`, action: () => payRent(player, owner, rentAmount) }] ); } 
        else { logMessage(`${space.name} is owned by ${owner.name}, but no rent due.`); endTurnActions(); }
    } else { logMessage(`${player.name} landed on their own property: ${space.name}.`); endTurnActions(); }
}
function tryBuyProperty(player, space) { /* ... same ... */ 
    const cost = space.price;
    if (player.money >= cost) { player.money -= cost; space.ownerId = player.id; player.propertiesOwned.push(space.id); logMessage(`${player.name} bought ${space.name} for £${cost}.`); updatePlayerInfoDisplay(player); updateOwnerMarker(boardData.indexOf(space)); } 
    else { logMessage(`${player.name} does not have enough money to buy ${space.name}.`); }
    endTurnActions();
}
function payRent(payer, owner, amount) { /* ... same ... */ 
     if (payer.money >= amount) { payer.money -= amount; owner.money += amount; logMessage(`${payer.name} paid £${amount} rent to ${owner.name}.`); } 
     else { const amountPaid = payer.money; owner.money += amountPaid; payer.money = 0; logMessage(`${payer.name} could only pay £${amountPaid} of £${amount} rent to ${owner.name}. ${payer.name} is bankrupt! (Bankruptcy logic TBD)`); }
    updatePlayerInfoDisplay(payer); updatePlayerInfoDisplay(owner); endTurnActions();
}
function payTax(player, space) { /* ... same ... */ 
    const taxAmount = space.amount; player.money -= taxAmount; logMessage(`${player.name} paid £${taxAmount} for ${space.name}.`); updatePlayerInfoDisplay(player);
    showModal( space.name, `You landed on ${space.name}. <br>Pay £${taxAmount}.`, [{ text: "OK", action: endTurnActions }] );
}
function goToJail(player, fromCard = false) { /* ... same ... */ 
    player.currentPosition = JAIL_POSITION; player.inJail = true; player.jailTurnsAttempted = 0; 
    placeTokenOnBoard(player); updatePlayerInfoDisplay(player);
    logMessage(`${player.name} was sent to Jail!`);
    showModal("🚓 Go To Jail! 🚓", "Oh no! You've been caught and sent directly to Jail. Do not pass Go, do not collect £200.",
        [{ text: "Bummer!", action: endTurnActions }] 
    );
}

// --- Property Management (Houses/Hotels) ---
/**
 * Checks if a player owns all properties in a given color group (monopoly).
 * @param {object} player - The player to check.
 * @param {string} groupColor - The color group (e.g., "brown", "light-blue").
 * @returns {Array<object>} Array of property objects in the group if monopoly, else empty array.
 */
function getMonopolyGroup(player, groupColor) {
    const groupProperties = boardData.filter(space => space.type === 'property' && space.group === groupColor);
    const ownedGroupProperties = groupProperties.filter(prop => player.propertiesOwned.includes(prop.id));
    return groupProperties.length === ownedGroupProperties.length ? groupProperties : [];
}

/**
 * Opens the property management modal for the current player.
 * Allows buying/selling houses/hotels on monopolized properties.
 */
function openPropertyManagementModal() {
    if (propertyManagementActionInProgress) return; // Prevent re-entry
    propertyManagementActionInProgress = true;
    rollDiceButton.disabled = true; // Disable dice roll during management
    managePropertiesButton.disabled = true;


    const player = players[currentPlayerIndex];
    let modalContentHtml = `<div class="text-left max-h-96 overflow-y-auto">`;
    modalContentHtml += `<p class="mb-2">Your Money: £${player.money}</p>`;
    let canManageAny = false;

    const propertyGroups = {}; // Group properties by color
    player.propertiesOwned.forEach(propId => {
        const prop = boardData.find(s => s.id === propId);
        if (prop && prop.type === 'property') {
            if (!propertyGroups[prop.group]) propertyGroups[prop.group] = [];
            propertyGroups[prop.group].push(prop);
        }
    });

    for (const groupColor in propertyGroups) {
        const monopolizedGroup = getMonopolyGroup(player, groupColor);
        if (monopolizedGroup.length > 0) { // Player has a monopoly in this group
            canManageAny = true;
            modalContentHtml += `<div class="mb-4 p-2 border border-gray-300 rounded">`;
            modalContentHtml += `<h4 class="font-semibold text-lg capitalize" style="color: ${player.uiColor}; border-bottom: 2px solid ${player.uiColor};">${groupColor.replace('-', ' ')} Properties</h4>`;
            
            monopolizedGroup.forEach(prop => {
                const propIndex = boardData.findIndex(s => s.id === prop.id); // Get index for boardData
                modalContentHtml += `<div class="my-2 py-2 border-b border-gray-200">`;
                modalContentHtml += `<p><strong>${prop.name}</strong> (Houses: ${prop.houses === HOTEL_LEVEL ? 'Hotel' : prop.houses}, Cost: £${prop.houseCost})</p>`;
                
                // Buy House Button
                if (prop.houses < MAX_HOUSES && player.money >= prop.houseCost) {
                    modalContentHtml += `<button class="modal-button text-xs py-1 px-2 mr-1" onclick="buyHouse(${propIndex})">Buy House</button>`;
                } else if (prop.houses < MAX_HOUSES) {
                     modalContentHtml += `<button class="modal-button text-xs py-1 px-2 mr-1" disabled>Buy House (Need £${prop.houseCost})</button>`;
                }

                // Buy Hotel Button (replaces Buy House if 4 houses exist)
                if (prop.houses === MAX_HOUSES && player.money >= prop.houseCost) { // Hotel cost is same as house cost per property
                    modalContentHtml += `<button class="modal-button text-xs py-1 px-2 mr-1 bg-red-500 hover:bg-red-600" onclick="buyHotel(${propIndex})">Buy Hotel</button>`;
                } else if (prop.houses === MAX_HOUSES) {
                     modalContentHtml += `<button class="modal-button text-xs py-1 px-2 mr-1 bg-red-500" disabled>Buy Hotel (Need £${prop.houseCost})</button>`;
                }
                
                // Sell House/Hotel Button
                if (prop.houses > 0) {
                    const salePrice = prop.houseCost / 2; // Sell for half price
                    const buildingType = prop.houses === HOTEL_LEVEL ? "Hotel" : "House";
                    modalContentHtml += `<button class="modal-button secondary text-xs py-1 px-2" onclick="sellBuilding(${propIndex})">Sell ${buildingType} (+£${salePrice})</button>`;
                }
                modalContentHtml += `</div>`;
            });
            modalContentHtml += `</div>`;
        }
    }

    if (!canManageAny) {
        modalContentHtml += "<p>You do not have any monopolies to manage yet, or no properties to develop.</p>";
    }
    modalContentHtml += `</div>`; // Close scrollable div

    showModal(
        `${player.name} - Manage Properties`,
        modalContentHtml,
        [{ text: "Done", action: () => { 
            propertyManagementActionInProgress = false; 
            // Only enable roll dice if it's still their turn and they haven't rolled yet
            // This depends on game flow - for now, assume management ends the "action" part of turn.
            // If they haven't rolled, they should still be able to.
            // If they have rolled, then it's end of turn actions.
            if(!rollDiceButton.disabled && player.inJail) { // if they got out of jail by paying/card, they can roll
                 managePropertiesButton.disabled = false;
            } else if (rollDiceButton.disabled && !player.inJail && dice[0] !== 0) { // if they already rolled this turn
                 endTurnActions(); // Proceed to end turn logic (check doubles etc)
            } else { // Default: enable buttons for next action or player
                 rollDiceButton.disabled = false;
                 managePropertiesButton.disabled = false;
            }
        }}]
    );
}

/**
 * Handles buying a house for a property.
 * @param {number} propIndex - Index of the property in boardData.
 */
function buyHouse(propIndex) {
    const player = players[currentPlayerIndex];
    const property = boardData[propIndex];

    // Check for even building: all other properties in this group must have at least prop.houses.
    const groupProperties = boardData.filter(p => p.group === property.group && p.type === 'property');
    for (let otherProp of groupProperties) {
        if (otherProp.id !== property.id && otherProp.houses < property.houses) {
            logMessage(`Cannot buy house on ${property.name}. Must build evenly across the group. ${otherProp.name} has fewer houses.`);
            openPropertyManagementModal(); // Refresh modal
            return;
        }
    }

    if (player.money >= property.houseCost && property.houses < MAX_HOUSES) {
        player.money -= property.houseCost;
        property.houses++;
        logMessage(`${player.name} bought a house for ${property.name}. Now has ${property.houses} house(s).`);
        updatePlayerInfoDisplay(player);
        updateHouseHotelDisplay(propIndex);
    } else {
        logMessage(`Cannot buy house for ${property.name}. Check funds or max houses.`);
    }
    openPropertyManagementModal(); // Refresh modal with updated state
}

/**
 * Handles buying a hotel for a property (replaces 4 houses).
 * @param {number} propIndex - Index of the property in boardData.
 */
function buyHotel(propIndex) {
    const player = players[currentPlayerIndex];
    const property = boardData[propIndex];

     // Check for even building: all other properties in this group must also have MAX_HOUSES (or a hotel)
    const groupProperties = boardData.filter(p => p.group === property.group && p.type === 'property');
    for (let otherProp of groupProperties) {
        if (otherProp.id !== property.id && otherProp.houses < MAX_HOUSES) { // otherProp.houses should be 4 to build hotel on current
            logMessage(`Cannot buy hotel on ${property.name}. All properties in group must have ${MAX_HOUSES} houses first. ${otherProp.name} has ${otherProp.houses}.`);
            openPropertyManagementModal();
            return;
        }
    }

    if (player.money >= property.houseCost && property.houses === MAX_HOUSES) { // Cost is still 'houseCost' for the 5th increment
        player.money -= property.houseCost;
        property.houses = HOTEL_LEVEL; // 5 represents a hotel
        logMessage(`${player.name} bought a hotel for ${property.name}.`);
        updatePlayerInfoDisplay(player);
        updateHouseHotelDisplay(propIndex);
    } else {
        logMessage(`Cannot buy hotel for ${property.name}. Check funds or ensure 4 houses are present.`);
    }
    openPropertyManagementModal(); // Refresh modal
}

/**
 * Handles selling a house or hotel from a property.
 * @param {number} propIndex - Index of the property in boardData.
 */
function sellBuilding(propIndex) {
    const player = players[currentPlayerIndex];
    const property = boardData[propIndex];
    const salePrice = property.houseCost / 2;

    // Check for even selling: this property must have more or equal houses than others in group
    const groupProperties = boardData.filter(p => p.group === property.group && p.type === 'property');
    for (let otherProp of groupProperties) {
        if (otherProp.id !== property.id && otherProp.houses > property.houses) {
            logMessage(`Cannot sell from ${property.name}. Must sell evenly. ${otherProp.name} has more houses/hotel.`);
            openPropertyManagementModal();
            return;
        }
    }

    if (property.houses > 0) {
        player.money += salePrice;
        if (property.houses === HOTEL_LEVEL) { // Selling a hotel
            property.houses = MAX_HOUSES; // Becomes 4 houses
            logMessage(`${player.name} sold a hotel on ${property.name} for £${salePrice}. (Now has 4 houses)`);
        } else { // Selling a house
            property.houses--;
            logMessage(`${player.name} sold a house on ${property.name} for £${salePrice}. Now has ${property.houses} house(s).`);
        }
        updatePlayerInfoDisplay(player);
        updateHouseHotelDisplay(propIndex);
    } else {
        logMessage(`No houses/hotel to sell on ${property.name}.`);
    }
    openPropertyManagementModal(); // Refresh modal
}


// --- Turn Progression (Small adjustment for property management disabling buttons) ---
function endTurnActions() {
    const currentPlayer = players[currentPlayerIndex];
    propertyManagementActionInProgress = false; // Ensure this is reset

    if (dice[0] === dice[1] && !currentPlayer.inJail && !rolledDoublesToGetOutOfJailThisAction && rollDiceButton.disabled) {
        logMessage(`${currentPlayer.name} rolled doubles! Roll again.`);
        rollDiceButton.disabled = false; 
        managePropertiesButton.disabled = false;
    } else {
        if (!rollDiceButton.disabled && !currentPlayer.inJail) {
            // Player got out of jail by paying/card, buttons are enabled for their turn.
            managePropertiesButton.disabled = false; // Also enable manage properties
        } else {
            setTimeout(() => { 
                switchTurn(); 
                rollDiceButton.disabled = false; 
                managePropertiesButton.disabled = false;
            }, 300);
        }
    }
    rolledDoublesToGetOutOfJailThisAction = false; 
}

function switchTurn() { 
    currentPlayerIndex = (currentPlayerIndex + 1) % players.length; 
    updateCurrentPlayerDisplay();
    logMessage(`${players[currentPlayerIndex].name}'s (${players[currentPlayerIndex].tokenRepresentation}) turn.`);
    updateAllPlayerInfoDisplays(); 
}
function updateCurrentPlayerDisplay() { 
    if (players.length > 0) {
        currentPlayerNameDisplay.textContent = `${players[currentPlayerIndex].name} (${players[currentPlayerIndex].tokenRepresentation})`;
    }
}
function logMessage(message) { 
    const previousMessage = messageLog.innerHTML;
    messageLog.innerHTML = message + (previousMessage ? '<br>' + previousMessage.split('<br>').slice(0, 9).join('<br>') : '');
}

// --- Event Listeners & Game Initialization ---
rollDiceButton.addEventListener('click', handlePlayerTurn);
managePropertiesButton.addEventListener('click', openPropertyManagementModal); // New listener

window.onload = () => { 
    document.querySelectorAll('.board .space').forEach(spaceEl => {
        if (!spaceEl.querySelector('.content')) { const contentWrapper = document.createElement('div'); contentWrapper.classList.add('content'); while (spaceEl.firstChild) { contentWrapper.appendChild(spaceEl.firstChild); } spaceEl.appendChild(contentWrapper); }
        if (!spaceEl.querySelector('.token-container')) { const tokenContainer = document.createElement('div'); tokenContainer.classList.add('token-container'); spaceEl.appendChild(tokenContainer); }
        
        // Add house/hotel display div to property spaces if not present
        if (spaceEl.classList.contains('property') && !spaceEl.querySelector('.house-hotel-display')) {
            const houseDisplay = document.createElement('div');
            houseDisplay.classList.add('house-hotel-display');
            // Insert it before the token container for better visual hierarchy
            const tokenCont = spaceEl.querySelector('.token-container');
            if (tokenCont) {
                spaceEl.insertBefore(houseDisplay, tokenCont);
            } else { // Fallback if token container somehow isn't there
                spaceEl.appendChild(houseDisplay);
            }
        }

        if (!spaceEl.querySelector('.owner-marker-container')) { const ownerMarkerContainer = document.createElement('div'); ownerMarkerContainer.classList.add('owner-marker-container'); const ownerMarker = document.createElement('div'); ownerMarker.classList.add('owner-marker'); ownerMarkerContainer.appendChild(ownerMarker); spaceEl.appendChild(ownerMarkerContainer); }
    });
    initializeGame(2);
};
