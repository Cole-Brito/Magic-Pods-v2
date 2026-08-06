let podSize = 4;
const players = [];
const playHistory = {};

let playerCount = 0;

function saveData() {
    localStorage.setItem("players", JSON.stringify(players));
    localStorage.setItem("playHistory", JSON.stringify(playHistory));
    localStorage.setItem("podSize", podSize);
}


function loadData() {
    const savedPlayers = localStorage.getItem("players");
    const savedHistory = localStorage.getItem("playHistory");
    const savedPodSize = localStorage.getItem("podSize");

    if (savedPodSize) {
        podSize = Number(savedPodSize);
        document.getElementById("podSize").value = podSize;
    }

    if (savedPlayers) {
        players.push(...JSON.parse(savedPlayers));
        playerCount = players.length;
    }

    if (savedHistory) {
        Object.assign(playHistory, JSON.parse(savedHistory));
    }

    displayPlayers();
}

function createPlayer(name) {
    const player = {
        name: name
    };
    players.push(player);
    playerCount++;

    saveData();
    displayPlayers();

    return player;
}

function shufflePods(inputPlayers = players) {
    const shuffled = [...inputPlayers];

    //Yates algo : https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const groups = [];
    for (let i = 0; i < shuffled.length; i += podSize) {
        groups.push(shuffled.slice(i, i + podSize));
    }

    let output = "Pods:\n";
    groups.forEach((group, index) => {
        const names = group.map(user => user.name || String(user)).join(", ");
        output += `Group ${index + 1}: ${names}\n`;
    });

    return { groups, output };
}

function balancedShufflePods(inputPlayers = players) {

    let bestGroups = null;
    let bestScore = Infinity;


    for (let attempt = 0; attempt < 500; attempt++) {

        const { groups } = shufflePods(inputPlayers);

        const score = scorePods(groups);


        if (score < bestScore) {
            bestScore = score;
            bestGroups = groups;
        }
    }


    return {
        groups: bestGroups,
        score: bestScore
    };
}

function displayPlayers() {
    const playerList = document.getElementById("playerList");

    // clear current list
    playerList.innerHTML = "";

    players.forEach((player, index) => {
        const listItem = document.createElement("li");

        listItem.textContent = player.name;

        const removeButton = document.createElement("button");
        removeButton.textContent = "X";

        removeButton.addEventListener("click", () => {
            removePlayer(index);
        });

        listItem.appendChild(removeButton);
        playerList.appendChild(listItem);
    });
}

function displayPods(groups) {
    const podDisplay = document.getElementById("podDisplay");

    podDisplay.innerHTML = "";

    groups.forEach((group, index) => {
        const pod = document.createElement("div");

        pod.innerHTML = `
            <h3>Group ${index + 1}</h3>
            <ul>
                ${group.map(player => `<li>${player.name}</li>`).join("")}
            </ul>
        `;

        podDisplay.appendChild(pod);
    });
}

function removePlayer(index) {
    const player = players[index];

    if(confirm(`Remove ${player.name}?`)) {
        players.splice(index, 1);
        playerCount--;
        saveData();
        displayPlayers();
    }
}

// makes a unique key for a pair of players regardless of order
function getPairKey(player1, player2) {
    return [player1.name, player2.name]
        .sort()
        .join("|");
}

function scorePods(groups) {
    let score = 0;

    groups.forEach(group => {

        for (let i = 0; i < group.length; i++) {

            for (let j = i + 1; j < group.length; j++) {

                const key = getPairKey(group[i], group[j]);

                score += playHistory[key] || 0;
            }
        }
    });

    return score;
}

function updateHistory(groups) {

    groups.forEach(group => {

        for (let i = 0; i < group.length; i++) {

            for (let j = i + 1; j < group.length; j++) {

                const key = getPairKey(group[i], group[j]);

                playHistory[key] = (playHistory[key] || 0) + 1;
            }
        }
    });
}
// Listeners ---------

// Add player listener
document.getElementById("submitBtn").addEventListener("click", () => {
    const username = document.getElementById("username").value.trim();

    if (username === "") {
        alert("Please enter a username");
        return;
    }

    createPlayer(username);
});

// Shuffle pods listener
document.getElementById("shuffleBtn").addEventListener("click", () => {

    const { groups, score } = balancedShufflePods();

    console.log("Pod score:", score);

    displayPods(groups);

    updateHistory(groups);

    saveData();
});

document.getElementById("resetBtn").addEventListener("click", () => {

    if(confirm("Clear all players and history?")) {

        localStorage.clear();

        players.length = 0;

        Object.keys(playHistory).forEach(key => {
            delete playHistory[key];
        });

        playerCount = 0;

        displayPlayers();
        displayPods([]);
    }

});

const podSizeSelect = document.getElementById("podSize");

podSizeSelect.addEventListener("change", () => {
    podSize = Number(podSizeSelect.value);
});

const themeButton = document.getElementById("themeBtn");

// Load saved theme
if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark-mode");
    themeButton.textContent = "Light Mode";
}

themeButton.addEventListener("click", () => {

    document.body.classList.toggle("dark-mode");

    const dark = document.body.classList.contains("dark-mode");

    if (dark) {
        localStorage.setItem("theme", "dark");
        themeButton.textContent = "Light Mode";
    } else {
        localStorage.setItem("theme", "light");
        themeButton.textContent = "Dark Mode";
    }

});

loadData();