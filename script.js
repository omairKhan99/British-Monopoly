// --- Game Constants ---
const TOTAL_SPACES = 40;
const PASS_GO_SALARY = 200;
const STARTING_MONEY = 1500;
const PLAYER_REPRESENTATIONS = ['🐎', '🐆', '🐘', '🐅', '🐒', '🐕']; // Animal tokens
const PLAYER_UI_COLORS = ['#FF0000', '#0000FF', '#00AA00', '#FF8C00', '#800080', '#D2691E']; // Colors for UI elements
const JAIL_POSITION = 10; // Index of Jail space on the board
const JAIL_FINE = 50; // Cost to get out of jail by paying
const MAX_JAIL_ROLL_ATTEMPTS = 3; // Max attempts to roll doubles to get out of jail
const MAX_HOUSES = 4; 
const HOTEL_LEVEL = 5; 



const GO_POSITION = 0;
const KINGS_CROSS_POSITION = 5; const MARYLEBONE_POSITION = 15; const FENCHURCH_ST_POSITION = 25; const LIVERPOOL_ST_POSITION = 35;
const PALL_MALL_POSITION = 11; const MAYFAIR_POSITION = 39; const TRAFALGAR_SQ_POSITION = 24;
const ELECTRIC_COMPANY_POSITION = 12; const WATER_WORKS_POSITION = 28;




let players = []; // Array to hold player objects
let currentPlayerIndex = 0; // Index of the current player in the players array
let dice = [0, 0]; // Array to store the result of the two dice
let gameInitialized = false; // Flag to check if the game setup is complete
let boardData = []; // Array to hold data for each space on the board
let chanceCards = []; // Array for Chance cards
let communityChestCards = []; // Array for Community Chest cards
let chanceCardIndex = 0; // Current index for drawing Chance cards
let communityChestCardIndex = 0; // Current index for drawing Community Chest cards
let rolledDoublesToGetOutOfJailThisAction = false; // Flag for specific jail roll action in a turn
let propertyManagementActionInProgress = false; 



// --- DOM Elements ---
// Getting references to HTML elements to interact with them
const rollDiceButton = document.getElementById('rollDiceButton');
const managePropertiesButton = document.getElementById('managePropertiesButton'); 
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

// --- Card Definitions & Management ---
/**
 * Initializes the Chance and Community Chest card decks.
 * Defines card text and effects, then shuffles the decks.
 */
function initializeDecks() {
    // Standard British Chance Cards (simplified/adapted)
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

    // Standard British Community Chest Cards (simplified/adapted)
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
function drawCard(deckType) { let card; if (deckType === 'chance') { card = chanceCards[chanceCardIndex]; chanceCardIndex = (chanceCardIndex + 1) % chanceCards.length; 
    
} else { card = communityChestCards[communityChestCardIndex]; communityChestCardIndex = (communityChestCardIndex + 1) % communityChestCards.length; } logMessage(`${players[currentPlayerIndex].name} drew a ${deckType} card: "${card.text}"`); updateCardPileDisplays(); return card; }
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


/**
 * Shows a modal dialog with a title, message, and configurable buttons.
 * @param {string} title - The title of the modal.
 * @param {string} message - The main message content (can include HTML).
 * @param {Array<object>} buttonsConfig - Array of button configurations. Each object: {text: string, action: function, class?: string, disabled?: boolean}.
 */
function showModal(title, message, buttonsConfig = [{ text: "OK", action: null }]) {
    modalTitle.textContent = title;
    modalMessage.innerHTML = message; // Use innerHTML to allow basic formatting
    modalButtons.innerHTML = ''; // Clear previous buttons

    buttonsConfig.forEach(btnConfig => {
        const button = document.createElement('button');
        button.textContent = btnConfig.text;
        button.classList.add('modal-button');
        if (btnConfig.class) button.classList.add(btnConfig.class);
        if (btnConfig.disabled) button.disabled = true; // Set disabled state
        button.onclick = () => {
            hideModal(); // Always hide modal after any button click
            if (btnConfig.action) btnConfig.action(); // Execute the button's action
        };
        modalButtons.appendChild(button);
    });
    eventModal.classList.add('visible'); // Make the modal overlay visible
}

/**
 * Hides the event modal.
 */
function hideModal() {
    eventModal.classList.remove('visible');
}

// --- Game Initialization ---
/**
 * Initializes the game: sets up board data, card decks, players, and UI.
 * @param {number} numPlayers - The number of players for the game (default 2).
 */
function initializeGame(numPlayers = 2) {
    if (gameInitialized) {
        logMessage("Game already initialized.");
        return;
    }
    initializeBoardData();
    initializeDecks(); // Initialize and shuffle card decks

    players = [];
    currentPlayerIndex = 0;
    playerInfoContainer.innerHTML = ''; // Clear any existing player info
    document.querySelectorAll('.player-token').forEach(token => token.remove()); // Clear old tokens
    document.querySelectorAll('.owner-marker').forEach(marker => marker.style.backgroundColor = 'transparent'); // Reset owner markers


    for (let i = 0; i < numPlayers; i++) {
        const player = {
            id: i,
            name: `Player ${i + 1}`,
            tokenRepresentation: PLAYER_REPRESENTATIONS[i % PLAYER_REPRESENTATIONS.length],
            uiColor: PLAYER_UI_COLORS[i % PLAYER_UI_COLORS.length],
            money: STARTING_MONEY,
            currentPosition: 0, // Start at GO
            propertiesOwned: [], // Array of space IDs owned by the player
            inJail: false,
            jailTurnsAttempted: 0, // Turns spent trying to roll out of jail
            getOutOfJailFreeCards: 0,
            tokenElement: null, // DOM element for the player's token
            infoElement: null   // DOM element for the player's info display
        };
        players.push(player);
        createPlayerToken(player);
        createPlayerInfoDisplay(player);
    }
    updateAllPlayerInfoDisplays();
    updateCurrentPlayerDisplay();
    logMessage(`Monopoly game started with ${numPlayers} players. ${players[0].name}'s turn.`);
    gameInitialized = true;
    rollDiceButton.disabled = false; // Enable dice rolling
}

// --- Player Token and Info Display Functions ---
/**
 * Creates a visual token for a player and adds it to the 'GO' space initially.
 * @param {object} player - The player object.
 */
function createPlayerToken(player) {
    const token = document.createElement('div');
    token.classList.add('player-token');
    token.innerHTML = player.tokenRepresentation; // Use emoji as token
    token.setAttribute('title', player.name); // Tooltip for player name
    player.tokenElement = token;
    placeTokenOnBoard(player); // Place on GO
}

/**
 * Creates the UI element to display a player's information (name, money, position, etc.).
 * @param {object} player - The player object.
 */
function createPlayerInfoDisplay(player) {
    const infoDiv = document.createElement('div');
    infoDiv.classList.add('player-info');
    infoDiv.id = `player-info-${player.id}`;
    infoDiv.innerHTML = `
        <h3 style="color: ${player.uiColor};">${player.name} (${player.tokenRepresentation})</h3>
        <p>Money: <span class="money-display">£${player.money}</span></p>
        <p>Position: <span class="position-display">GO</span></p>
        <p>Properties: <span class="properties-display">0</span></p>
        <p>GOOJFC: <span class="goojfc-display">0</span></p>
    `;
    player.infoElement = infoDiv;
    playerInfoContainer.appendChild(infoDiv);
}

/**
 * Updates the displayed information for a single player (money, position, properties, GOOJFC).
 * Also handles highlighting the active player.
 * @param {object} player - The player object to update.
 */
function updatePlayerInfoDisplay(player) {
    if (player.infoElement) {
        player.infoElement.querySelector('.money-display').textContent = `£${player.money}`;
        const spaceData = boardData[player.currentPosition];
        player.infoElement.querySelector('.position-display').textContent = spaceData.name.split('<br>')[0]; // Show first line of name
        player.infoElement.querySelector('.properties-display').textContent = player.propertiesOwned.length;
        player.infoElement.querySelector('.goojfc-display').textContent = player.getOutOfJailFreeCards;
    }
    // Highlight the active player
    document.querySelectorAll('.player-info').forEach(el => el.classList.remove('active-player'));
    if (players[currentPlayerIndex] && players[currentPlayerIndex].infoElement) {
        players[currentPlayerIndex].infoElement.classList.add('active-player');
    }
}

/**
 * Updates the information display for all players.
 */
function updateAllPlayerInfoDisplays() {
    players.forEach(p => updatePlayerInfoDisplay(p));
}

/**
 * Places or moves a player's token to their currentPosition on the board.
 * @param {object} player - The player object.
 */
function placeTokenOnBoard(player) {
    const currentSpaceHtmlId = boardData[player.currentPosition].id; // Get HTML ID from boardData
    const spaceElement = document.getElementById(currentSpaceHtmlId);
    if (spaceElement) {
        const tokenContainer = spaceElement.querySelector('.token-container');
        if (tokenContainer) {
            // Remove token from old position if it exists and has a parent
            if (player.tokenElement.parentNode) {
                player.tokenElement.parentNode.removeChild(player.tokenElement);
            }
            tokenContainer.appendChild(player.tokenElement); // Add to new space
        }
    }
}

/**
 * Updates the visual owner marker (color strip) on a board space.
 * @param {number} spaceIndex - The index of the space in `boardData`.
 */
function updateOwnerMarker(spaceIndex) {
    const spaceData = boardData[spaceIndex];
    const spaceElement = document.getElementById(spaceData.id);
    if (spaceElement && (spaceData.type === 'property' || spaceData.type === 'station' || spaceData.type === 'utility')) {
        const ownerMarkerElement = spaceElement.querySelector('.owner-marker');
        if (ownerMarkerElement) {
            if (spaceData.ownerId !== null && players[spaceData.ownerId]) {
                ownerMarkerElement.style.backgroundColor = players[spaceData.ownerId].uiColor;
            } else {
                ownerMarkerElement.style.backgroundColor = 'transparent'; // Unowned or no valid owner
            }
        }
    }
}

// --- Dice Rolling ---
/**
 * Simulates rolling two dice and updates the UI display.
 * @returns {Array<number>} - Array containing results of two dice [d1, d2].
 */
function rollDice() {
    dice[0] = Math.floor(Math.random() * 6) + 1;
    dice[1] = Math.floor(Math.random() * 6) + 1;
    dice1Display.textContent = dice[0];
    dice2Display.textContent = dice[1];
    diceTotalDisplay.textContent = dice[0] + dice[1];
    return dice; // Return the dice array
}

// --- Main Turn Handling ---
/**
 * Handles the current player's turn.
 * Checks if player is in jail or takes a normal turn.
 */
function handlePlayerTurn() {
    if (!gameInitialized) {
        logMessage("Please initialize the game first.");
        return;
    }
    const currentPlayer = players[currentPlayerIndex];
    rolledDoublesToGetOutOfJailThisAction = false; // Reset this flag for the current action

    if (currentPlayer.inJail) {
        handleJailTurn(currentPlayer); // Show jail options modal
    } else {
        performNormalRollAndMove(currentPlayer); // Normal dice roll and move
    }
}

/**
 * Handles a normal turn: rolls dice, moves player, and processes landing on a space.
 * @param {object} player - The current player.
 */
function performNormalRollAndMove(player) {
    rollDiceButton.disabled = true; // Disable button during turn processing
    const diceResult = rollDice(); // Roll the dice
    const steps = diceResult[0] + diceResult[1];
    logMessage(`${player.name} (${player.tokenRepresentation}) rolled ${diceResult[0]} + ${diceResult[1]} = ${steps}.`);

    const oldPosition = player.currentPosition;
    let newPosition = (oldPosition + steps) % TOTAL_SPACES; // Calculate new position with wrap-around

    // Check for passing GO, only if not sent to Jail directly by the dice roll
    if (newPosition < oldPosition && (oldPosition + steps) >= TOTAL_SPACES) {
         player.money += PASS_GO_SALARY;
         logMessage(`${player.name} passed GO and collected £${PASS_GO_SALARY}.`);
    }
    player.currentPosition = newPosition;

    placeTokenOnBoard(player); // Move token visually
    updatePlayerInfoDisplay(player); // Update info after potential GO collection
    logMessage(`${player.name} landed on ${boardData[player.currentPosition].name.split('<br>')[0]}.`);
    handleLandingOnSpace(player); // Process actions for the landed space
}

// --- Jail Specific Logic ---
/**
 * Handles a turn for a player who is in jail.
 * Presents options: roll for doubles, pay fine, use card.
 * @param {object} player - The player currently in jail.
 */
function handleJailTurn(player) {
    player.jailTurnsAttempted = player.jailTurnsAttempted || 0; // Ensure it's initialized
    player.jailTurnsAttempted++; // Increment attempt count for this turn in jail

    let modalMessageText = `${player.name}, you are in Jail (Attempt ${player.jailTurnsAttempted}/${MAX_JAIL_ROLL_ATTEMPTS} to roll doubles).`;
    let options = [];

    // Option 1: Try to Roll Doubles (if attempts remaining)
    if (player.jailTurnsAttempted <= MAX_JAIL_ROLL_ATTEMPTS) {
        options.push({
            text: `Roll for Doubles (Attempt ${player.jailTurnsAttempted})`,
            action: () => tryRollOutOfJail(player)
        });
    }

    // Option 2: Pay Fine
    options.push({
        text: `Pay £${JAIL_FINE} Fine`,
        action: () => payFineToGetOutOfJail(player),
        disabled: player.money < JAIL_FINE // Disable if player can't afford
    });

    // Option 3: Use Get Out of Jail Free Card
    if (player.getOutOfJailFreeCards > 0) {
        options.push({
            text: `Use Get Out of Jail Free Card (${player.getOutOfJailFreeCards} left)`,
            action: () => useCardToGetOutOfJail(player)
        });
    }
    
    // If 3rd attempt failed (and not already out by other means this turn), must pay or use card
    if (player.jailTurnsAttempted > MAX_JAIL_ROLL_ATTEMPTS && player.inJail) { // Check if still in jail
         modalMessageText = `${player.name}, you are in Jail. Max roll attempts reached. You must pay the fine or use a card if available.`;
         // Filter options to only show Pay/Use Card if they exist and are viable
         options = options.filter(opt => opt.text.startsWith("Pay") || opt.text.startsWith("Use"));
         
         // If no options left (e.g., no money for fine, no card), they are stuck for this turn.
         // In a full game, this could lead to needing to mortgage/sell. For now, turn ends.
         if (options.length === 0 || (options.every(opt => opt.disabled))) {
            logMessage(`${player.name} is stuck in jail! No money for fine and no GOOJFC.`);
            // Player remains in jail. Reset attempts for next time they are in jail.
            // Note: This doesn't reset attempts for *this current* jail sentence if they stay in.
            // The current model is they get 3 tries *per sentence*.
            endTurnActions(); // End their turn; they stay in jail.
            return;
         }
    }
    showModal("In Jail!", modalMessageText, options);
}

/**
 * Handles the player's attempt to roll doubles to get out of jail.
 * @param {object} player - The player in jail.
 */
function tryRollOutOfJail(player) {
    const d = rollDice(); // rollDice also updates the global dice display
    logMessage(`${player.name} (in jail) rolled ${d[0]} and ${d[1]}.`);
    if (d[0] === d[1]) { // Rolled doubles
        player.inJail = false;
        player.jailTurnsAttempted = 0; // Reset attempts as they are out
        rolledDoublesToGetOutOfJailThisAction = true; // Set flag for this specific action
        logMessage("Doubles! You're out of jail. You move " + (d[0] + d[1]) + " spaces.");
        
        // Move player from JAIL_POSITION by the sum of dice. No GO collection.
        player.currentPosition = (JAIL_POSITION + d[0] + d[1]) % TOTAL_SPACES;
        placeTokenOnBoard(player);
        updatePlayerInfoDisplay(player);
        logMessage(`${player.name} moved to ${boardData[player.currentPosition].name.split('<br>')[0]}.`);
        handleLandingOnSpace(player); // Process landing on the new space
    } else { // Did not roll doubles
        logMessage("No doubles.");
        if (player.jailTurnsAttempted >= MAX_JAIL_ROLL_ATTEMPTS) {
            logMessage("Max roll attempts reached. You must pay or use a card next turn if you haven't already this turn.");
            // The modal logic in handleJailTurn will re-evaluate options next time or force pay/card.
        }
        endTurnActions(); // End turn if no doubles
    }
}

/**
 * Handles player paying a fine to get out of jail.
 * @param {object} player - The player in jail.
 */
function payFineToGetOutOfJail(player) {
    if (player.money >= JAIL_FINE) {
        player.money -= JAIL_FINE;
        player.inJail = false;
        player.jailTurnsAttempted = 0; // Reset attempts
        logMessage(`${player.name} paid £${JAIL_FINE} and is out of jail. Roll for your turn.`);
        updatePlayerInfoDisplay(player);
        rollDiceButton.disabled = false; // Allow them to take their normal turn (roll and move)
        // The modal is hidden by its button handler. The player can now click "Roll Dice".
        // No automatic roll here; player initiates their normal turn roll.
    } else {
        logMessage(`${player.name} does not have £${JAIL_FINE} to pay the fine.`);
        // Player remains in jail. Modal will re-appear next turn or they need to choose another option if this was one of several.
        // To force re-showing modal with updated state if this was the only action from a forced state:
        if (player.jailTurnsAttempted > MAX_JAIL_ROLL_ATTEMPTS) {
            handleJailTurn(player); // Re-present options if they were forced to pay but couldn't
        } else {
            endTurnActions(); // Otherwise, just end this attempt.
        }
    }
}

/**
 * Handles player using a "Get Out of Jail Free" card.
 * @param {object} player - The player in jail.
 */
function useCardToGetOutOfJail(player) {
    if (player.getOutOfJailFreeCards > 0) {
        player.getOutOfJailFreeCards--;
        player.inJail = false;
        player.jailTurnsAttempted = 0; // Reset attempts
        logMessage(`${player.name} used a Get Out of Jail Free card and is out of jail. Roll for your turn.`);
        updatePlayerInfoDisplay(player);
        rollDiceButton.disabled = false; // Allow them to take their normal turn (roll and move)
    } else {
         logMessage(`${player.name} has no Get Out of Jail Free cards.`);
         // Similar to failing to pay fine, if forced, re-present options.
         if (player.jailTurnsAttempted > MAX_JAIL_ROLL_ATTEMPTS) {
            handleJailTurn(player);
        } else {
            endTurnActions();
        }
    }
}

// --- Landing Actions, Card Effects, Property Logic ---
/**
 * Determines action based on the space the player landed on.
 * @param {object} player - The current player.
 */
function handleLandingOnSpace(player) {
    const space = boardData[player.currentPosition];
    let subsequentAction = () => endTurnActions(); // Default action after modal unless overridden

    switch (space.type) {
        case 'property': case 'station': case 'utility':
            handleOwnableSpace(player, space); // This function will manage its own flow and call endTurnActions
            return; // Prevent double call to endTurnActions
        case 'go-to-jail':
            goToJail(player); // This also manages its own flow
            return;
        case 'chance':
            const chanceCard = drawCard('chance');
            showModal("Chance Card!", chanceCard.text, [{ text: "OK", action: () => applyCardEffect(player, chanceCard) }]);
            return; // applyCardEffect will call endTurnActions or chain to another action handler
        case 'community-chest':
            const communityCard = drawCard('community-chest');
            showModal("Community Chest Card!", communityCard.text, [{ text: "OK", action: () => applyCardEffect(player, communityCard) }]);
            return; // applyCardEffect will call endTurnActions or chain
        case 'tax':
            payTax(player, space); // Manages its own flow
            return;
        case 'go':
            logMessage(`${player.name} landed on GO. Collect £${PASS_GO_SALARY}.`);
            // Salary for *landing* on GO is typically collected in addition to passing GO.
            // Our pass GO logic handles the "pass" part. This handles the "land".
            if (player.currentPosition === GO_POSITION) {
                 player.money += PASS_GO_SALARY; 
                 updatePlayerInfoDisplay(player);
            }
            break; 
        case 'jail': // Just visiting
            logMessage(`${player.name} is just visiting Jail.`);
            break; 
        case 'free-parking':
            logMessage(`${player.name} landed on Free Parking. Take a break!`);
            break; 
        default: // Should not happen if boardData is complete
            logMessage(`Landed on ${space.name} - no special action defined.`);
            break; 
    }
    subsequentAction(); // Call endTurnActions if not handled by specific cases that return early
}

/**
 * Applies the effect of a drawn Chance or Community Chest card.
 * @param {object} player - The current player.
 * @param {object} card - The card object with its text and effect details.
 */
function applyCardEffect(player, card) {
    logMessage(`Applying card: ${card.text}`);
    let passedGoOnCardMove = false;
    let actionLeadsToNewSpace = false; // Does the card move the player?
    let newSpaceToHandle = null;       // If so, which space?

    switch (card.type) {
        case 'moveTo':
            const oldPos = player.currentPosition;
            player.currentPosition = card.value; // Move to specified position
            // Check for passing GO if card allows it and movement implies it
            if (card.collectGo && player.currentPosition < oldPos && oldPos !== player.currentPosition) { 
                player.money += PASS_GO_SALARY; passedGoOnCardMove = true;
                logMessage(`${player.name} passed GO by card and collected £${PASS_GO_SALARY}.`);
            } else if (card.collectGo && card.value === GO_POSITION && oldPos !== GO_POSITION) { // Specifically "Advance to Go"
                player.money += PASS_GO_SALARY; passedGoOnCardMove = true;
                logMessage(`${player.name} advanced to GO by card and collected £${PASS_GO_SALARY}.`);
            }
            placeTokenOnBoard(player);
            logMessage(`${player.name} moved to ${boardData[player.currentPosition].name}.`);
            actionLeadsToNewSpace = true; newSpaceToHandle = boardData[player.currentPosition];
            break;
        case 'moveToNearest': // 'station' or 'utility'
            let nearestPosition = -1;
            const originalPos = player.currentPosition;
            // Search forward from current position
            for (let i = 1; i <= TOTAL_SPACES; i++) { // Check all spaces starting from next
                const checkPos = (originalPos + i) % TOTAL_SPACES;
                if (boardData[checkPos].type === card.value) { // card.value is 'station' or 'utility'
                    nearestPosition = checkPos;
                    break; // Found the next one
                }
            }

            if (nearestPosition !== -1) {
                const oldP = player.currentPosition;
                player.currentPosition = nearestPosition;
                if (player.currentPosition < oldP) { // Passed GO
                     player.money += PASS_GO_SALARY; passedGoOnCardMove = true;
                     logMessage(`${player.name} passed GO and collected £${PASS_GO_SALARY}.`);
                }
                placeTokenOnBoard(player);
                logMessage(`${player.name} moved to nearest ${card.value}: ${boardData[player.currentPosition].name}.`);
                actionLeadsToNewSpace = true; newSpaceToHandle = boardData[player.currentPosition];
                // Special rent logic for these will be handled by handleOwnableSpace if it's an ownable space.
                // The card might specify double rent or 10x dice roll. This info needs to be passed or handled.
                // For now, handleOwnableSpace will use its standard rent logic.
                // We can add a temporary flag to player object if card specifies modified rent.
                if (newSpaceToHandle.ownerId !== null && newSpaceToHandle.ownerId !== player.id) {
                    if (card.subType === "payDoubleRentOrBuy" && newSpaceToHandle.type === "station") {
                        logMessage("Rent will be doubled for this station (handled by property logic).");
                        player.cardRentModifier = { type: "doubleStationRent" };
                    } else if (card.subType === "payDiceRollRentOrBuy" && newSpaceToHandle.type === "utility") {
                        logMessage("Rent will be 10x dice roll for this utility (handled by property logic).");
                        player.cardRentModifier = { type: "diceRollUtilityRent" };
                    }
                }
            }
            break;
        case 'collectMoney':
            player.money += card.value;
            logMessage(`${player.name} collected £${card.value}.`);
            break;
        case 'payMoney':
            player.money -= card.value; // Check bankruptcy later
            logMessage(`${player.name} paid £${card.value}.`);
            break;
        case 'getOutOfJailFree':
            player.getOutOfJailFreeCards++;
            logMessage(`${player.name} received a "Get Out of Jail Free" card.`);
            break;
        case 'goToJail':
            goToJail(player, true); // Pass true to indicate it's from a card (might affect "doubles" rule later)
            return; // goToJail now handles modal & endTurnActions
        case 'moveSpaces': // e.g., Go Back 3 Spaces
            const prevPos = player.currentPosition;
            player.currentPosition = (player.currentPosition + card.value + TOTAL_SPACES) % TOTAL_SPACES; // Ensure positive index
            // Typically, "Go Back 3 Spaces" does not collect GO salary even if you pass it backwards.
            placeTokenOnBoard(player);
            logMessage(`${player.name} moved ${card.value > 0 ? card.value : -card.value} spaces ${card.value > 0 ? 'forward' : 'back'} to ${boardData[player.currentPosition].name}.`);
            actionLeadsToNewSpace = true; newSpaceToHandle = boardData[player.currentPosition];
            break;
        case 'streetRepairs':
            // This needs house/hotel data on properties. For now, simplified.
            let totalRepairCost = 0;
            player.propertiesOwned.forEach(propId => {
                const propData = boardData.find(s => s.id === propId);
                // Only actual properties, not stations/utilities, and assuming houses/hotels exist for cost
                if (propData && propData.type === 'property') {
                    // When houses are implemented:
                    // totalRepairCost += (propData.houses === 5 ? card.hotelCost : propData.houses * card.houseCost);
                    totalRepairCost += 10; // Placeholder: £10 per property for now
                }
            });
            if (totalRepairCost > 0) {
                player.money -= totalRepairCost; // Check bankruptcy later
                logMessage(`${player.name} paid £${totalRepairCost} for street repairs (simplified).`);
            } else {
                logMessage(`${player.name} has no properties for street repairs, or no developed ones.`);
            }
            break;
        case 'payEachPlayer':
            players.forEach(p => {
                if (p.id !== player.id) { // Don't pay self
                    player.money -= card.value; // Current player pays
                    p.money += card.value;      // Other player receives
                    updatePlayerInfoDisplay(p); // Update other player's money display
                }
            });
            logMessage(`${player.name} paid each player £${card.value}.`);
            break;
        case 'collectFromPlayers':
             players.forEach(p => {
                if (p.id !== player.id) {
                    p.money -= card.value; // Other players pay
                    player.money += card.value; // Current player collects
                    updatePlayerInfoDisplay(p);
                }
            });
             logMessage(`${player.name} collected £${card.value} from each player.`);
            break;
    }
    updateAllPlayerInfoDisplays(); // Update all displays after card effects
    
    // If card moved player, handle landing on new space recursively
    // but prevent infinite loops if card moves to another card space.
    if(actionLeadsToNewSpace && newSpaceToHandle) {
        if (newSpaceToHandle.type === 'chance' || newSpaceToHandle.type === 'community-chest') {
            logMessage(`Landed on ${newSpaceToHandle.name} due to a card. No further card draw this turn.`);
            endTurnActions();
        } else {
            // For other space types, call handleLandingOnSpace.
            // This will correctly process properties, taxes, Go To Jail etc.
            // handleLandingOnSpace will then call endTurnActions.
            handleLandingOnSpace(player);
        }
    } else {
        // If card didn't move player or no further action needed from move, end turn.
        endTurnActions();
    }
}

/**
 * Handles player landing on an ownable space (property, station, utility).
 * Offers to buy if unowned, or charges rent if owned by another.
 * @param {object} player - The current player.
 * @param {object} space - The boardData object for the landed space.
 */
function handleOwnableSpace(player, space) {
    if (space.ownerId === null) { // Unowned
        const buyCost = space.price;
        showModal(
            `For Sale: ${space.name}`,
            `This property is unowned. Would you like to buy it for £${buyCost}? <br>Your money: £${player.money}`,
            [
                { text: `Buy (£${buyCost})`, action: () => { tryBuyProperty(player, space); }, disabled: player.money < buyCost },
                { text: "Pass", action: () => { logMessage(`${player.name} decided not to buy ${space.name}.`); endTurnActions(); }, class: 'secondary' }
            ]
        );
    } else if (space.ownerId !== player.id) { // Owned by someone else
        const owner = players[space.ownerId];
        let rentAmount = 0;
        // Calculate rent based on type and development
        if (space.type === 'property') {
            rentAmount = space.rent[space.houses || 0]; // Use houses count (0-5) for rent index
        } else if (space.type === 'station') {
            const stationsOwned = owner.propertiesOwned.filter(pId => {
                const sData = boardData.find(s => s.id === pId);
                return sData && sData.type === 'station';
            }).length;
            rentAmount = space.rent[stationsOwned - 1] || 25; // Default to base if array out of bounds
        } else if (space.type === 'utility') {
            const utilitiesOwned = owner.propertiesOwned.filter(pId => {
                 const sData = boardData.find(s => s.id === pId);
                 return sData && sData.type === 'utility';
            }).length;
            const lastRollTotal = dice[0] + dice[1]; // Use current turn's dice roll for utility rent
            
            // Check for card-modified rent for utilities
            if (player.cardRentModifier && player.cardRentModifier.type === "diceRollUtilityRent") {
                const utilityCardDiceRoll = Math.floor(Math.random() * 6) + 1 + Math.floor(Math.random() * 6) + 1;
                logMessage(`${player.name} rolled ${utilityCardDiceRoll} for utility rent due to card.`);
                rentAmount = utilityCardDiceRoll * 10;
                delete player.cardRentModifier; // Use modifier once
            } else {
                 rentAmount = utilitiesOwned === 1 ? lastRollTotal * 4 : lastRollTotal * 10;
            }
        }
        // Check for card-modified rent for stations (double rent)
        if (player.cardRentModifier && player.cardRentModifier.type === "doubleStationRent" && space.type === "station") {
            rentAmount *= 2;
            logMessage(`Station rent doubled due to card: £${rentAmount}`);
            delete player.cardRentModifier; // Use modifier once
        }


        if (rentAmount > 0) {
             showModal(
                "Rent Due!",
                `This property is owned by ${owner.name}. You owe £${rentAmount} in rent.`,
                [{ text: `Pay £${rentAmount}`, action: () => payRent(player, owner, rentAmount) }]
            );
        } else { // Should not happen if property is owned and not mortgaged (mortgage not yet impl.)
             logMessage(`${space.name} is owned by ${owner.name}, but no rent due (possibly mortgaged - TBD).`);
             endTurnActions();
        }
    } else { // Owned by the current player
        logMessage(`${player.name} landed on their own property: ${space.name}.`);
        endTurnActions();
    }
}

/**
 * Handles the logic for a player attempting to buy a property.
 * @param {object} player - The current player.
 * @param {object} space - The boardData for the property.
 */
function tryBuyProperty(player, space) {
    const cost = space.price;
    if (player.money >= cost) {
        player.money -= cost;
        space.ownerId = player.id; // Assign owner
        player.propertiesOwned.push(space.id); // Add to player's list of owned properties
        logMessage(`${player.name} bought ${space.name} for £${cost}.`);
        updatePlayerInfoDisplay(player);
        updateOwnerMarker(boardData.indexOf(space)); // Update visual marker on board
    } else {
        logMessage(`${player.name} does not have enough money to buy ${space.name}.`);
    }
    endTurnActions(); // Proceed to end turn
}

/**
 * Handles payment of rent from one player to another.
 * @param {object} payer - The player paying rent.
 * @param {object} owner - The player receiving rent.
 * @param {number} amount - The amount of rent to pay.
 */
function payRent(payer, owner, amount) {
     if (payer.money >= amount) {
        payer.money -= amount;
        owner.money += amount;
        logMessage(`${payer.name} paid £${amount} rent to ${owner.name}.`);
    } else { // Not enough money to pay full rent
        const amountPaid = payer.money;
        owner.money += amountPaid;
        payer.money = 0;
        logMessage(`${payer.name} could only pay £${amountPaid} of £${amount} rent to ${owner.name}. ${payer.name} is bankrupt! (Bankruptcy logic TBD)`);
        // Future: Implement bankruptcy (sell houses, mortgage properties, or lose game).
    }
    updatePlayerInfoDisplay(payer);
    updatePlayerInfoDisplay(owner);
    endTurnActions(); // Proceed to end turn
}

/**
 * Handles player paying a tax.
 * @param {object} player - The current player.
 * @param {object} space - The boardData for the tax space.
 */
function payTax(player, space) {
    const taxAmount = space.amount;
    player.money -= taxAmount; // Deduct tax
    logMessage(`${player.name} paid £${taxAmount} for ${space.name}.`);
    updatePlayerInfoDisplay(player);
    // Show modal, then end turn via modal's OK button
    showModal(
        space.name,
        `You landed on ${space.name}. <br>Pay £${taxAmount}.`,
        [{ text: "OK", action: endTurnActions }]
    );
}

/**
 * Sends the player to Jail.
 * @param {object} player - The player to be sent to jail.
 * @param {boolean} fromCard - Optional: True if sent by a card (might affect rules later).
 */
function goToJail(player, fromCard = false) {
    player.currentPosition = JAIL_POSITION; // Move to jail space index
    player.inJail = true;
    player.jailTurnsAttempted = 0; // Reset jail roll attempts
    placeTokenOnBoard(player); // Move token visually
    updatePlayerInfoDisplay(player);
    logMessage(`${player.name} was sent to Jail!`);
    // Show modal, then end turn via modal's OK button
    showModal(
        "🚓 Go To Jail! 🚓",
        "Oh no! You've been caught and sent directly to Jail. Do not pass Go, do not collect £200.",
        [{ text: "Bummer!", action: endTurnActions }] 
    );
}


// --- Turn Progression ---
/**
 * Finalizes actions for the current turn and determines if player gets another roll (doubles) or switches to next player.
 */
function endTurnActions() {
    const currentPlayer = players[currentPlayerIndex];

    // Check for "roll again" on doubles, if not in jail and not from a "get out of jail by rolling doubles" action
    if (dice[0] === dice[1] && !currentPlayer.inJail && !rolledDoublesToGetOutOfJailThisAction && rollDiceButton.disabled) {
        logMessage(`${currentPlayer.name} rolled doubles! Roll again.`);
        rollDiceButton.disabled = false; // Allow current player to roll again
        // Do not switch turn yet
    } else {
        // Normal turn end, or turn ends after a jail sequence where no immediate re-roll is granted.
        // If rollDiceButton is enabled, it means they got out by paying/card and are ABOUT to roll for their turn. So don't switch yet.
        if (!rollDiceButton.disabled && !currentPlayer.inJail) {
            // This case means they paid/used card to get out of jail, rollDiceButton is enabled for their normal turn.
            // Their next action is to click it. So, do nothing here, let them click.
        } else {
            // All other cases (normal turn ended, or failed to get out of jail by rolling, or got out by rolling doubles): switch turn.
            setTimeout(() => { 
                switchTurn(); 
                rollDiceButton.disabled = false; // Enable for next player
            }, 300); // Short delay for readability
        }
    }
    rolledDoublesToGetOutOfJailThisAction = false; // Reset this flag for the next actual turn/action
}


/**
 * Switches to the next player's turn and updates UI.
 */
function switchTurn() {
    currentPlayerIndex = (currentPlayerIndex + 1) % players.length; // Cycle through players
    updateCurrentPlayerDisplay();
    logMessage(`${players[currentPlayerIndex].name}'s (${players[currentPlayerIndex].tokenRepresentation}) turn.`);
    updateAllPlayerInfoDisplays(); // To update active player highlight
}

/**
 * Updates the display for whose turn it is.
 */
function updateCurrentPlayerDisplay() {
    if (players.length > 0) {
        currentPlayerNameDisplay.textContent = `${players[currentPlayerIndex].name} (${players[currentPlayerIndex].tokenRepresentation})`;
    }
}

/**
 * Logs a message to the game's on-screen message log.
 * @param {string} message - The message to log.
 */
function logMessage(message) {
    const previousMessage = messageLog.innerHTML;
    // Add new message at the top, keep limited history
    messageLog.innerHTML = message + (previousMessage ? '<br>' + previousMessage.split('<br>').slice(0, 9).join('<br>') : '');
}

// --- Event Listeners & Game Initialization ---
// Add event listener for the roll dice button
rollDiceButton.addEventListener('click', handlePlayerTurn);

// Initialize the game when the window loads
window.onload = () => {
    // Ensure all board spaces have the necessary sub-divs (.content, .token-container, .owner-marker-container)
    // This is a fallback in case HTML is not perfectly structured, but ideally HTML is correct.
    document.querySelectorAll('.board .space').forEach(spaceEl => {
        if (!spaceEl.querySelector('.content')) {
            const contentWrapper = document.createElement('div');
            contentWrapper.classList.add('content');
            while (spaceEl.firstChild) { contentWrapper.appendChild(spaceEl.firstChild); }
            spaceEl.appendChild(contentWrapper);
        }
        if (!spaceEl.querySelector('.token-container')) {
            const tokenContainer = document.createElement('div');
            tokenContainer.classList.add('token-container');
            spaceEl.appendChild(tokenContainer);
        }
        if (!spaceEl.querySelector('.owner-marker-container')) {
            const ownerMarkerContainer = document.createElement('div');
            ownerMarkerContainer.classList.add('owner-marker-container');
            const ownerMarker = document.createElement('div'); // Actual marker div
            ownerMarker.classList.add('owner-marker');
            ownerMarkerContainer.appendChild(ownerMarker);
            spaceEl.appendChild(ownerMarkerContainer);
        }
    });
    initializeGame(2); // Start the game with 2 players by default
};
