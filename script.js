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

    // Timer Logic
    function startTimer() {
        startTime = Date.now();
        timerRunning = true;
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
            listItem.textContent = `Solve ${index + 1}: ${solve.dnf ? "DNF" : (solve.time + solve.penalty).toFixed(3)}s`;

            const plusTwoButton = document.createElement("button");
            plusTwoButton.textContent = "+2";
            plusTwoButton.onclick = () => markAsPlusTwo(index);

            const dnfButton = document.createElement("button");
            dnfButton.textContent = "DNF";
            dnfButton.onclick = () => markAsDNF(index);

            const actions = document.createElement("span");
            actions.appendChild(plusTwoButton);
            actions.appendChild(dnfButton);

            listItem.appendChild(actions);
            solveList.appendChild(listItem);
        });
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

        statsDisplay.innerHTML = `
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
});
