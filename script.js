//All the variables that I am using to make the js work

const canvas = document.getElementById("ecosystem")
const context = canvas.getContext("2d")
const startButton = document.getElementById("startButton")
const pauseButton = document.getElementById("pauseButton")
const resetButton = document.getElementById("resetButton")
const generationText = document.getElementById("generation")
const populationText = document.getElementById("population")
const foodText = document.getElementById("food")
const speciesText = document.getElementById("species")
const timeText = document.getElementById("time")
const populationChart = document.getElementById("populationChart")
const speedChart = document.getElementById("speedChart")
const sizeChart = document.getElementById("sizeChart")
const visionChart = document.getElementById("visionChart")
const statusIndicator = document.getElementById("statusIndicator")
const statusText = document.getElementById("statusText")
const winnerSpeedText = document.getElementById("winnerSpeed")
const winnerGenerationText = document.getElementById("winnerGeneration")
const winnerSizeText = document.getElementById("winnerSize")
const winnerVisionText = document.getElementById("winnerVision")
const generationTimelineText = document.getElementById("generationTimelineText")
const experimentComparison = document.getElementById("experimentComparison")
const endExperimentButton = document.getElementById("endExperimentButton")
const foodAvailability = document.getElementById("foodAvailability")
const foodRegeneration= document.getElementById("foodRegeneration")
const startingPopulation = document.getElementById("startingPopulation")
const inspectionContent = document.getElementById("inspectionContent")
const inspectionPanel = document.getElementById("inspectionPanel")
const closeInspection = document.getElementById("closeInspection")

let running = false
let foodScarcity = false
let selectedCreature = null
let generation = 0
let population = 0
let food = 0
let seconds = 0
let lastTime = 0
let statTimer = 0
let experimentNumber = 0
let creatures = []
let foods = []
let populationHistory = []
let averageSpeedHistory = []
let averageSizeHistory = []
let averageVisionHistory = []
let generationTimes = []
let experimentHistory = []

function resizeCanvas() {
    canvas.width = canvas.clientWidth; canvas.height = canvas.clientHeight
    drawBackground()
}

//basic functioning of the app like creating the creature, food and drawing it

function createCreature() {
    const creature = {
        x: Math.random() * canvas.width, y: Math.random() * canvas.height, 
        size: 7 + Math.random() * 2, speed: 0.8 + Math.random() * 2.2, direction: Math.random() * Math.PI * 2, vision: 100 + Math.random() * 200, energy: 100,
        age: 0, reproductionCooldown: 0, generation: 1, survivalPressure: 0, survialScore: 0
    }
    creatures.push(creature)
}

function updateSimulationTime(timestamp) {
    if(lastTime === 0) {
        lastTime = timestamp
    }
    const deltaTime = timestamp - lastTime
    if(deltaTime >= 1000) {
        seconds += Math.floor(deltaTime / 1000)
        lastTime = timestamp
    }
} 

function updateGenerationTimeline() {
    if(generationTimes.length === 0) {
        generationTimelineText.textContent = "Waiting for generations... Start the simulation!"
        return
    }
    generationTimelineText.textContent = generationTimes
    .map(entry => `Generation ${entry.generation}: ${entry.time}s`)
    .join(", ")
}

function createFood() {
    const food = {
        x: Math.random() * canvas.width, y: Math.random() * canvas.height, size: 4
    }

    foods.push(food)
}

function createFoodSupply() {
    foods = []
    let startingFood = 50

    if(foodAvailability.value === "scarce") {
        startingFood = 20
    }

    if(foodAvailability.value === "alot") {
        startingFood = 100
    }

    for(let i = 0; i < startingFood; i++) {
        createFood()
    }

    food = foods.length
}

function regenerateLifeLabFood() {
    let maximumFoodSupply = 50

    if(foodAvailability.value === "scarce") {
        maximumFoodSupply = 20
    }

    if(foodAvailability.value === "alot") {
        maximumFoodSupply = 100
    }

    let regenerationChance = 0.025

    if(foodRegeneration.value === "slow") {
        regenerationChance = 0.01
    }

    if(foodRegeneration.value === "fast") {
        regenerationChance = 0.09
    }

    if(foods.length < maximumFoodSupply) {
        if(Math.random() < regenerationChance) {
            createFood()
        }
    }

    food = foods.length
}

function updateEnvironment() {
    /*if(seconds >= 20 && seconds < 40) {
        foodScarcity = true
    } else {
        foodScarcity = false
    }*/
}

function drawFood() {
    for(const item of foods) {
        context.beginPath()
        context.arc(item.x, item.y, item.size, 0, Math.PI * 2)
        context.fillStyle = "#a7f36b"
        context.fill()
    }
}

//This is where teh math kind of comes in because it is like the main for the whole system

function checkFood() {
    for(let i = foods.length - 1; i >= 0; i--) {
        const item = foods[i]
        for (const creature of creatures) {
            const distance = Math.hypot(creature.x - item.x, creature.y - item.y)

            if(distance < creature.size + item.size) {
                foods.splice(i, 1)
                const foodEnergy = 35 + creature.size * 1.5
                creature.energy += foodEnergy

                if(creature.energy > 100) {
                    creature.energy = 100
                }

                food = foods.length
                break
            }
        }
    }
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value))
}

function calculateEnergyCost(creature) {
    let cost = 0.012

    cost += creature.speed * 0.008
    cost += creature.size * 0.0025
    cost += creature.vision * 0.00004
    return cost
}

function calculateSurvivalPressure(creature) {
    let survivalPressure = 0

    if(creature.energy < 30) {
        survivalPressure += 0.5
    }

    if(creature.energy < 15) {
        survivalPressure += 0.3
    }

    const energyCost = calculateEnergyCost(creature)
    if(energyCost > 0.04) {
        survivalPressure += 0.2
    }

    return clamp(survivalPressure, 0, 1)
}

function updateSurvivalScore(creature) {
    let score = 0
    score += creature.age * 0.1
    if(creature.energy > 60) {score += 1}
    if(creature.energy > 80) {score += 0.5}
    score += (1 - creature.survivalPressure) * 0.5
    creature.survivalScore = score
}

function reproduceCreature() {
    const newCreatures = []
    for (const creature of creatures) {
        const offspringSuccessChance = clamp(0.08 + creature.survialScore * 0.1, 0.03, 0.20)
        const canReproduceCreature = creature.energy >= 80 && creature.age >= 10 && creature.reproductionCooldown <= 0

        if (
            canReproduceCreature && Math.random() < offspringSuccessChance) 
            {const baby = {
            x: clamp(creature.x + (Math.random() - 0.5) * 20, 5, canvas.width - 5),
            y: clamp(creature.y + (Math.random() - 0.5) * 20, 5, canvas.height - 5),
            size: clamp(creature.size +(Math.random() - 0.5) * 0.8, 4, 12),
            speed: clamp(creature.speed + (Math.random() - 0.5) * 0.3, 0.5, 3 ),
            vision: clamp(creature.vision + (Math.random() - 0.5) * 25, 100, 300),
            direction: Math.random() * Math.PI * 2,
            energy: 50,
            age: 0,
            reproductionCooldown: 10,
            generation: creature.generation + 1,
            survivalPressure: 0,
            survialScore:0
            }

        newCreatures.push(baby)
        creature.energy -= 40
        creature.reproductionCooldown = 10
        }
    }
    creatures.push(...newCreatures)
    population = creatures.length
}

function removeDeadCreatures() {
    for(let i = creatures.length - 1; i >= 0; i--) {
        if(creatures[i].energy <= 0) {
            creatures.splice(i, 1)
        }
    }

    population = creatures.length

    if(population === 0 && running) {
        saveExperimentResult()
        running = false
        startButton.textContent = "Start Simulation"
    }
}

function createPopulation() {
    creatures = []
    let populationSize = Number(startingPopulation.value)
    populationSize = Math.max(10, Math.min(50, populationSize))
    startingPopulation.value = populationSize
    
    for (let i = 0; i < populationSize; i++) {
        createCreature()
    }
    population = creatures.length
}

function updateCreatures() {
    for (const creature of creatures) {
        let closestFood = null
        let closestDistance = Infinity

        for (const item of foods) {
            const distance = Math.hypot(creature.x - item.x, creature.y - item.y)

            if(distance < closestDistance) {
                closestDistance = distance
                closestFood = item
            }
        }

        if(closestFood && closestDistance < creature.vision) {
            const dx = closestFood.x - creature.x
            const dy = closestFood.y - creature.y
            const angle = Math.atan2(dy, dx)
            creature.direction = angle
        }

        creature.x += Math.cos(creature.direction) * creature.speed
        creature.y += Math.sin(creature.direction) * creature.speed
        const energyCost = calculateEnergyCost(creature)
        creature.energy -= energyCost 
        creature.survivalPressure = calculateSurvivalPressure(creature)
        creature.age += 0.016
        updateSurvivalScore(creature)

        if(creature.reproductionCooldown > 0) {
            creature.reproductionCooldown -= 0.016
        }
        
        if(creature.x <= creature.size || creature.x >= canvas.width - creature.size) {creature.direction = Math.PI - creature.direction}
        if(creature.y <= creature.size || creature.y >= canvas.height - creature.size) {creature.direction = -creature.direction}
    }
}

function updateCreatureInspection() {
    if(!selectedCreature) {
        inspectionContent.innerHTML = "<p>No creature selected</p>"
        return
    }

    inspectionContent.innerHTML = `
    <div class="inspectionStat">
        <div class="inspectionStat">
            <span>Speed</span>
            <strong>${selectedCreature.speed.toFixed(2)}</strong>
        </div>
        <div class="inspectionStat">
            <span>Vision</span>
            <strong>${selectedCreature.vision.toFixed(2)}</strong>
        </div>
        <div class="inspectionStat">
            <span>Energy</span>
            <strong>${selectedCreature.energy.toFixed(1)}</strong>
        </div>
        <div class="inspectionStat">
            <span>Size</span
            <strong>${selectedCreature.size.toFixed(2)}</strong>
        </div>
        <div class="inspectionStat">
            <span>Generation</span
            <strong>${selectedCreature.generation}</strong>
        </div>
        <div class="inspectionStat">
            <span>Survival Score</span
            <strong>${selectedCreature.survivalScore.toFixed(2)}</strong>
        </div>
        <div class="inspectionStat">
            <span>Age</span
            <strong>${selectedCreature.age.toFixed(2)}</strong>
        </div>
    </div>`
}

//this si where the code for the graphs comes in and all

function updateEcosystemStatus() {
    if (!running && creatures.length === 0) {
        statusText.textContent = "Ready"
        statusIndicator.style.background = "#8cffb0"
        return
    }

    if(creatures.length == 0) {
        statusText.textContent = "Ecosystem Collapsed"
        statusIndicator.style.background = "#ff6464"
        statusIndicator.style.boxShadow = "0 0 8px rgba(255, 100, 100, 0.7)"
        return
    }

    if(!running) {
        statusText.textContent = "Paused"
        statusIndicator.style.background = "#ffd166"
        statusIndicator.style.boxShadow = "0 0 8px rgba(155, 109, 102, 0.7)"
        return
    }

    if(foodScarcity && running) {
        statusText.textContent = "Food Scarcity"
        statusIndicator.style.background = "#ffd166"
        statusIndicator.style.boxShadow = "0 0 8px rgba(255, 209, 102, 0.7)"
        return
    }

    statusText.textContent = "Ecosytem Active"
    statusIndicator.style.background = "#8cffb0"
    statusIndicator.style.boxShadow = "0 0 8px rgba(140, 255, 176, 0.7)"
}

//the main loop

function gameLoop(timestamp) {
    drawBackground()

    if (running) {
        updateCreatures()
        updateSimulationTime(timestamp)
        updateEnvironment()
        checkFood()
        regenerateLifeLabFood()
        removeDeadCreatures()
        updateTraitWinners()
        reproduceCreature()
        statTimer += 1
        if(statTimer >= 60) {
            recordEvolutionStats()
            statTimer = 0
        }
    }

    drawFood()
    drawCreatures()
    updateStats()
    updateGenerationTimeline()
    updateEcosystemStatus()
    updateCreatureInspection()
    updateCharts()
   
    requestAnimationFrame(gameLoop)
}

function drawCreatures() {
    for (const creature of creatures) {

        context.beginPath()
        context.arc(creature.x, creature.y, creature.vision, 0, Math.PI * 2)

        context.strokeStyle = "rgba(100, 255, 150, 0.04)"
        context.lineWidth = 1
        context.stroke()

        const red = Math.floor(50 + (creature.speed / 3) * 205)
        const green = Math.floor(50 + ((creature.vision - 80) / 220) * 205)
        const blue = Math.floor(50 + ((creature.size - 4) / 8) * 205)
        
        context.beginPath()
        context.arc(creature.x, creature.y, creature.size, 0, Math.PI * 2)

        context.fillStyle = `rgb(${red}, ${green}, ${blue})`
        context.fill()

        if(creature === selectedCreature) {
            context.beginPath()
            context.arc(creature.x, creature.y, creature.size + 6, 0, Math.PI * 2)
            context.strokeStyle = "#ffffff"
            context.lineWidth = 2
            context.stroke()
        }
    }
}

//stuff about background, statistics and all

function drawBackground() {
    context.fillStyle = "#06100c"; context.fillRect(0,  0, canvas.width, canvas.height)
    context.strokeStyle = "#0c2117"; context.lineWidth = 1; 
    const gridSize = 40

    for (let x = 0; x < canvas.width; x += gridSize) {
        context.beginPath(); context.moveTo(x, 0); context.lineTo(x, canvas.height); context.stroke();
    }

    for (let y = 0; y < canvas.height; y += gridSize) {
        context.beginPath(); context.moveTo(0, y); context.lineTo(canvas.width, y); context.stroke();
    }
        
}

function updateStats() {
    generationText.textContent = generation
    populationText.textContent = population
    foodText.textContent = food
    timeText.textContent = `${seconds}s`
}

function calculateEvolutionStats() {
    if(creatures.length === 0) {
        return {
            averageSpeed: 0,
            averageSize: 0,
            averageVision: 0,
            highestGeneration: 0
        }
    }

    let totalSpeed = 0
    let totalSize = 0
    let totalVision = 0
    let highestGeneration = 0

    for(const creature of creatures) {
        totalSpeed += creature.speed
        totalSize += creature.size
        totalVision += creature.vision
        if(creature.generation > highestGeneration) {
            highestGeneration = creature.generation
        }
    }

    return {
        averageSpeed: totalSpeed / creatures.length,
        averageSize: totalSize / creatures.length,
        averageVision: totalVision / creatures.length,
        highestGeneration: highestGeneration
    }
}

function updateTraitWinners() {
    if(creatures.length === 0){
        winnerSpeedText.textContent = "0.00"
        winnerSizeText.textContent = "0.00"
        winnerVisionText.textContent = "0.00"
        winnerGenerationText.textContent = "0"
        return
    }

    let totalSize = 0
    let totalSpeed = 0
    let totalVision = 0
    let highestGeneration = 0

    for(const creature of creatures) {
        totalSpeed += creature.speed
        totalVision += creature.vision
        totalSize += creature.size

        if(creature.generation > highestGeneration) {
            highestGeneration = creature.generation
        }
    }

    const averageSize = totalSize / creatures.length
    const averageSpeed = totalSpeed / creatures.length
    const averageVision = totalVision / creatures.length

    winnerSizeText.textContent = averageSize.toFixed(2)
    winnerSpeedText.textContent = averageSpeed.toFixed(2)
    winnerVisionText.textContent = averageVision.toFixed(2)
    winnerGenerationText.textContent = highestGeneration
}

//drawing fo the charts

function recordEvolutionStats() {
    const stats = calculateEvolutionStats()
    populationHistory.push(creatures.length)
    averageSizeHistory.push(stats.averageSize)
    averageSpeedHistory.push(stats.averageSpeed)
    averageVisionHistory.push(stats.averageVision)
    if(stats.highestGeneration > generation) {
        generation = stats.highestGeneration
        generationTimes.push({generation: generation, time: seconds})
    }
}

function drawChart(chart, data, maxValue, label) {

    const context = chart.getContext("2d")

    const width =  chart.clientWidth * devicePixelRatio
    const height = chart.clientHeight * devicePixelRatio

    if(chart.width !== width || chart.height !== height) {
        chart.width = width
        chart.height = height
    }

    context.clearRect(0, 0, width, height)

    // No data yet
    if (data.length === 0) {
        context.fillStyle = "#52705d"
        context.font = `${13 * devicePixelRatio}px Arial`
        context.fillText("Waiting for data...", 15, height / 2)
        return
    }

    if (data.length === 1) {
        context.fillStyle = "#52705d"
        context.font = `${13 * devicePixelRatio}px Arial`
        context.fillText("Collecting data...", 15, height / 2)
        const currentValue = data[0]

        if (typeof currentValue === "number") {
            context.fillStyle = "#c9fbd7"
            context.fillText( `${label}: ${currentValue.toFixed(2)}`, 15, 25)
        }
        return
    }

    const padding = 25 * devicePixelRatio
    context.strokeStyle = "rgba(100, 255, 150, 0.12)"
    context.lineWidth = 1 * devicePixelRatio

    for (let i = 0; i <= 4; i++) {

        const y = padding + (height - padding * 2) * (i / 4)

        context.beginPath()
        context.moveTo(padding, y)
        context.lineTo(width - padding, y)
        context.stroke()
    }

    context.beginPath()

    data.forEach((value, index) => {

        const x = padding + (index / (data.length - 1)) * (width - padding * 2)

        const y = height - padding - (value / maxValue) * (height - padding * 2)

        if (index === 0) {
            context.moveTo(x, y)
        } else {
            context.lineTo(x, y)
        }
    })

    context.strokeStyle = "#72f59b"
    context.lineWidth = 2 * devicePixelRatio
    context.stroke()

    const currentValue = data[data.length - 1]

    if (typeof currentValue === "number") {
        context.fillStyle = "#c9fbd7"
        context.font = `${12 * devicePixelRatio}px Arial`
        context.fillText(
            `${label}: ${currentValue.toFixed(2)}`, padding, padding)
    }
}

function updateCharts() {
    drawChart(populationChart, populationHistory, Math.max(...populationHistory, 20), "Population")
    drawChart(speedChart, averageSpeedHistory, 3, "Speed")
    drawChart(visionChart, averageVisionHistory, 300, "Vision")
    drawChart(sizeChart, averageSizeHistory, 12, "Size")
}

startButton.addEventListener("click", () => {

    if(creatures.length === 0) {
        createPopulation()
        createFoodSupply()
        generation = 1
    }

    running = true;
    startButton.textContent = "Running..."
    updateStats()
})

pauseButton.addEventListener("click", () => {
    running = false;
    startButton.textContent = "Start Simulation"
})

function saveExperimentResult() {
    const stats = calculateEvolutionStats()
    const experiment = { 
        number:experimentHistory.length + 1, foodAvailability: foodAvailability.value, foodRegeneration: foodRegeneration.value, startingPopulation: startingPopulation.value, 
        population: creatures.length, generation: stats.highestGeneration, 
        averageSpeed: stats.averageSpeed, averageVision: stats.averageVision, 
        averageSize: stats.averageSize, time: seconds}
    experimentHistory.push(experiment)
    updateExperimentHistory()
    updateExperimentComparison()
}

function updateExperimentHistory() {
    if(experimentHistory.length === 0) {
        experimentResults.innerHTML = "<p>No experiments completed yet</p>"
        return
    }

    experimentResults.innerHTML = experimentHistory.map(experiment => `
        <div class="experimentCard">
            <h3>Experiment: ${experiment.number}</h3>

            <div class="experimentEnvironment">
                <h4>Environment</h4>
                <p>Food Availabitlity: ${experiment.foodAvailability}</p>
                <p>Food Regeneration: ${experiment.foodRegeneration}</p>
                <p>Starting Population: ${experiment.startingPopulation}</p>
            </div>
            
            <div class="experimentResults">
                <h4>Results</h4>
                <p>Population: ${experiment.population}</p>
                <p>Generation: ${experiment.generation}</p>
                <p>Average Vision: ${experiment.averageVision.toFixed(2)}</p>
                <p>Average Speed: ${experiment.averageSpeed.toFixed(2)}</p>
                <p>Average Size: ${experiment.averageSize.toFixed(2)}</p>
                <p>Time: ${experiment.time}</p>
            </div>
        </div>`).join("")
}

function calculatePercentageChangeExperiment(previous, current) {
    if(previous === 0) {
        return current === 0 ? 0 : 100
    }
    return ((current - previous) / previous) * 100
}

function updateExperimentComparison() {
    if(experimentHistory.length < 2) {
        experimentComparison.innerHTML = "<p>Complete two experiments to compare them</p>"
        return
    }

    const previous = experimentHistory[experimentHistory.length - 2]
    const current = experimentHistory[experimentHistory.length - 1]
    const visionChange = current.averageVision - previous.averageVision
    const speedChange = current.averageSpeed - previous.averageSpeed
    const sizeChange = current.averageSize - previous.averageSize
    const populationChange = current.population - previous.population
    const timeChange = current.time - previous.time
    const visionPercent = calculatePercentageChangeExperiment(previous.averageVision, current.averageVision)
    const sizePercent = calculatePercentageChangeExperiment(previous.averageSize, current.averageSize)
    const speedPercent = calculatePercentageChangeExperiment(previous.averageSpeed, current.averageSpeed)
    const populationPercent = calculatePercentageChangeExperiment(previous.population, current.population)

    experimentComparison.innerHTML = `
    <h3>Experiment ${current.number} vs Experiment ${previous.number}</h3>
    <div class="comparisonEnvironment">
        <h4>Environment</h4>
        <p>Food Availability: ${previous.foodAvailability}→${current.foodAvailability}</p>
        <p>Food Regeneration: ${previous.foodRegeneration}→${current.foodRegeneration}</p>
        <p> Starting Population: ${previous.startingPopulation}→${current.startingPopulation}</p>
    </div>
    <div class="comparisonResult">
        <h4>Changes</h4>
        <p>Speed: ${speedChange >= 0 ? "+" : ""}${speedChange.toFixed(2)}(${speedPercent >= 0 ? "+" : ""}${speedPercent.toFixed(1)}%)</p>
        <p>Size: ${sizeChange >= 0 ? "+" : ""}${sizeChange.toFixed(2)}(${sizePercent >= 0 ? "+" : ""}${sizePercent.toFixed(1)}%)</p>
        <p>Vision: ${visionChange >= 0 ? "+" : ""}${visionChange.toFixed(2)}(${visionPercent >= 0 ? "+" : ""}${visionPercent.toFixed(1)}%)</p>
        <p>Population: ${populationChange >= 0 ? "+" : ""}${populationChange}(${populationPercent >= 0 ? "+" : ""}${populationPercent.toFixed(1)}%)</p>
        <p>Time: ${timeChange >= 0 ? "+" : ""}${timeChange}s</p>`
}

endExperimentButton.addEventListener("click", () => {
    if(!running || creatures.length === 0) {
        return
    } 
    saveExperimentResult()
    running = false
    startButton.textContent = "Start Simulation"
})

canvas.addEventListener("click", (event) => {
    const rect = canvas.getBoundingClientRect()
    const mouseX = (event.clientX - rect.left) * (canvas.width / rect.width)
    const mouseY = (event.clientY - rect.top) * (canvas.height / rect.height)

    selectedCreature = null
    for(const creature of creatures) {
        const distance = Math.hypot(mouseX - creature.x, mouseY - creature.y)
        if(distance <= creature.size + 25) {
            selectedCreature = creature
            inspectionPanel.classList.add("open")
            break
        }
    }
})

closeInspection.addEventListener("click", () => {
    selectedCreature = null
    inspectionPanel.classList.remove("open")
})

//reseting everythign and starting it over

resetButton.addEventListener("click", () => {
    running = false
    selectedCreature = null
    inspectionContent.innerHTML = "<p>No creature selected</p>"
    inspectionPanel.classList.remove("open")
    creatures = []
    foods = []
    populationHistory = []
    averageSizeHistory = []
    averageSpeedHistory = []
    averageVisionHistory = []
    generationTimes = []
    statTimer = 0
    generation = 0
    population = 0
    food = 0
    seconds = 0
    lastTime = 0
    startButton.textContent = "Start Simulation"
    updateStats()
    drawBackground()
})

window.addEventListener("resize", resizeCanvas)
resizeCanvas()
updateStats()
gameLoop()