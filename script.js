document.addEventListener("DOMContentLoaded", function () {
    const timeDisplay = document.getElementById("time-display");
    const scrambleText = document.getElementById("scramble-text");
    const solveList = document.getElementById("solve-list");
    const statsDisplay = document.getElementById("statistics");
    const clearDataButton = document.getElementById("clear-data");
    const generateScrambleButton = document.getElementById("generate-scramble");

    let timerRunning = false;
    let timerInterval;
    let startTime;
    let elapsedTime = 0;
    let solveTimes = JSON.parse(localStorage.getItem("solveTimes")) || [];
    let holdTimeout; // Used for the hold functionality
    let isHolding = false; // Tracks if the user is holding
    let solveCount = 0; // Initialize solve counter

    // Timer Logic
    function startTimer() {
        startTime = Date.now();
        timerRunning = true;
document.getElementById("scramble").style.display = "none";  // Hide scramble
document.getElementById("time-display").style.fontSize = "4em"; // Make timer big
document.getElementById("time-display").style.textAlign = "center";
        elapsedTime = 0;

        timerInterval = setInterval(() => {
            elapsedTime = Date.now() - startTime;
            timeDisplay.textContent = (elapsedTime / 1000).toFixed(3);
        }, 10);
        resetTimerStyle(); // Reset text color once the timer starts
    }

    function stopTimer() {
    clearInterval(timerInterval);
    timerRunning = false;

    // Show scramble again and reset timer display (without changing alignment)
    document.getElementById("scramble").style.display = "block";  
    document.getElementById("time-display").style.fontSize = "2em";  
        const solveTime = (elapsedTime / 1000).toFixed(3);
        timeDisplay.textContent = solveTime; // Final time display
        addSolve(parseFloat(solveTime)); // Save the solve
        generateNewScramble(); // Generate a new scramble
        resetTimerStyle();
    }

    function resetTimerStyle() {
        timeDisplay.style.color = ""; // Reset text color to default
    }

    function resetTimer() {
        elapsedTime = 0;
        timeDisplay.textContent = "0.000";
        resetTimerStyle();
    }

    // Scramble Generation
    function generateNewScramble() {
        const scrambleMoves = ["U", "U'", "U2", "D", "D'", "D2", "L", "L'", "L2", "R", "R'", "R2", "F", "F'", "F2", "B", "B'", "B2"];
        const moveGroups = {
            U: "U", D: "U",
            L: "L", R: "L",
            F: "F", B: "F"
        };

        let scramble = [];
        let lastGroup = null;

        for (let i = 0; i < 20; i++) {
            let move;
            let group;

            do {
                move = scrambleMoves[Math.floor(Math.random() * scrambleMoves.length)];
                group = moveGroups[move[0]];
            } while (group === lastGroup);

            scramble.push(move);
            lastGroup = group;
        }

        scrambleText.textContent = scramble.join(" ");
    }

    // Solve History and Statistics
    function addSolve(time) {
        solveTimes.push({ time: time, penalty: 0, dnf: false });
        saveData();
        updateSolveHistory();
        updateStatistics();
    }

    function saveData() {
        localStorage.setItem("solveTimes", JSON.stringify(solveTimes));
    }

    function updateSolveHistory() {
    solveList.innerHTML = "";
    solveTimes.forEach((solve, index) => {
        const listItem = document.createElement("li");
        listItem.textContent = `${solve.dnf ? "DNF" : (solve.time + solve.penalty).toFixed(3)}s`;

        // +2 Button
        const plusTwoButton = document.createElement("button");
        plusTwoButton.textContent = "+2";
        plusTwoButton.onclick = () => markAsPlusTwo(index);

        // DNF Button
        const dnfButton = document.createElement("button");
        dnfButton.textContent = "DNF";
        dnfButton.onclick = () => markAsDNF(index);

        // Delete Button (with SVG)
        const deleteButton = document.createElement("button");
        deleteButton.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" 
                                  stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                      <polyline points="3 6 5 6 21 6"></polyline>
                                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
                                      <line x1="10" y1="11" x2="10" y2="17"></line>
                                      <line x1="14" y1="11" x2="14" y2="17"></line>
                                  </svg>`;
        deleteButton.onclick = () => deleteSolve(index);

        // Append buttons
        const actions = document.createElement("span");
        actions.appendChild(plusTwoButton);
        actions.appendChild(dnfButton);
        actions.appendChild(deleteButton);

        listItem.appendChild(actions);
        solveList.appendChild(listItem);
    });
}

// Function to delete a single solve
function deleteSolve(index) {
    solveTimes.splice(index, 1); 
    saveData(); 
    updateSolveHistory(); 
    updateStatistics();
}

    function markAsPlusTwo(index) {
        solveTimes[index].penalty = 2;
        saveData();
        updateSolveHistory();
        updateStatistics();
    }

    function markAsDNF(index) {
        solveTimes[index].dnf = true;
        saveData();
        updateSolveHistory();
        updateStatistics();
    }

    function updateStatistics() {
    if (solveTimes.length === 0) {
        statsDisplay.innerHTML = `
            <p><strong>Number of Solves:</strong> 0</p>
            <p><strong>Best Time:</strong> N/A</p>
            <p><strong>Average of 5:</strong> N/A</p>
            <p><strong>Average of 12:</strong> N/A</p>
        `;
        return;
    }

    const validTimes = solveTimes.filter(solve => !solve.dnf).map(solve => solve.time + solve.penalty);
    const bestTime = Math.min(...validTimes).toFixed(3);
    const avg5 = calculateAverage(solveTimes.slice(-5));
    const avg12 = calculateAverage(solveTimes.slice(-12));
    const solveCount = solveTimes.length; // Count total solves

    statsDisplay.innerHTML = `
        <p><strong>Number of Solves:</strong> ${solveCount}</p>
        <p><strong>Best Time:</strong> ${bestTime}s</p>
        <p><strong>Average of 5:</strong> ${solveTimes.length >= 5 ? avg5 : "N/A"}</p>
        <p><strong>Average of 12:</strong> ${solveTimes.length >= 12 ? avg12 : "N/A"}</p>
    `;
}

    function calculateAverage(times) {
        const validTimes = times.filter(solve => !solve.dnf).map(solve => solve.time + solve.penalty);
        if (validTimes.length === 0) return "N/A";
        const total = validTimes.reduce((sum, time) => sum + time, 0);
        return (total / validTimes.length).toFixed(3);
    }

    // Clear Data
    clearDataButton.addEventListener("click", function () {
        localStorage.removeItem("solveTimes");
        solveTimes = [];
        updateSolveHistory();
        updateStatistics();
    });

    // Hold Logic for Mobile
    timeDisplay.addEventListener("touchstart", function () {
        if (timerRunning) {
            stopTimer();
            return;
        }

        isHolding = true;
        holdTimeout = setTimeout(() => {
            if (isHolding) {
                timeDisplay.style.color = "red"; // Change text color to red
            }
        }, 1000); // 1 second hold
    });

    timeDisplay.addEventListener("touchend", function () {
        clearTimeout(holdTimeout);
        if (!timerRunning && isHolding) {
            if (timeDisplay.style.color === "red") {
                startTimer();
            }
        }
        isHolding = false;
    });

    // Hold Logic for Desktop
    document.addEventListener("keydown", function (event) {
        if (event.code === "Space" && !isHolding) {
            if (timerRunning) {
                stopTimer();
                return;
            }

            isHolding = true;
            holdTimeout = setTimeout(() => {
                if (isHolding) {
                    timeDisplay.style.color = "red"; // Change text color to red
                }
            }, 1000); // 1 second hold
        }
    });

    document.addEventListener("keyup", function (event) {
        if (event.code === "Space") {
            clearTimeout(holdTimeout);
            if (!timerRunning && isHolding) {
                if (timeDisplay.style.color === "red") {
                    startTimer();
                }
            }
            isHolding = false;
        }
    });

    // Initialize
    generateScrambleButton.addEventListener("click", generateNewScramble);
    generateNewScramble();
    updateSolveHistory();
    updateStatistics();
    
    document.getElementById("year").textContent = new Date().getFullYear();
    
    document.addEventListener("contextmenu", function (e) {
    e.preventDefault();
    }, false);

    document.addEventListener("keydown", function (e) {
    if (e.ctrlKey && (e.key === "u" || e.key === "c" || e.key === "x" || e.key === "v" || e.key === "p" || e.key === "s" || e.key === "a")) {
        e.preventDefault();
    }
    }, false);
    
    
});
