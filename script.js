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

let running = false
let generation = 0
let population = 0
let food = 0
let seconds = 0
let creatures = []
let foods = []
let populationHistory = []
let averageSpeedHistory = []
let averageSizeHistory = []
let averageVisionHistory = []
let statTimer = 0

function resizeCanvas() {
    canvas.width = canvas.clientWidth; canvas.height = canvas.clientHeight
    drawBackground()
}

//basic functioning of the app like creating the creature, food and drawing it!

function createCreature() {
    const creature = {
        x: Math.random() * canvas.width, y: Math.random() * canvas.height, 
        size: 7 + Math.random() * 2, speed: 1 + Math.random() * 1.5, direction: Math.random() * Math.PI * 2, vision: 150 + Math.random() * 60, energy: 100,
        age: 0, reproductionCooldown: 0, generation: 1
    }
    creatures.push(creature)
}

function createFood() {
    const food = {
        x: Math.random() * canvas.width, y: Math.random() * canvas.height, size: 4
    }

    foods.push(food)
}

function createFoodSupply() {
    foods = []

    for(let i = 0; i < 60; i++) {
        createFood()
    }

    food = foods.length
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
                creature.energy += 40

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

function reproduceCreature() {
    const newCreatures = []
    for (const creature of creatures) {

        if (
            creature.energy >= 80 &&
            creature.age >= 10 &&
            creature.reproductionCooldown <= 0
        ) {const baby = {
            x: clamp(creature.x + (Math.random() - 0.5) * 20, 5, canvas.width - 5),
            y: clamp(creature.y + (Math.random() - 0.5) * 20, 5, canvas.height - 5),
            size: clamp(creature.size +(Math.random() - 0.5) * 0.8, 4, 12),
            speed: clamp(creature.speed + (Math.random() - 0.5) * 0.3, 0.5, 3 ),
            vision: clamp(creature.vision + (Math.random() - 0.5) * 25, 80, 300),
            direction: Math.random() * Math.PI * 2,
            energy: 50,
            age: 0,
            reproductionCooldown: 10,
            generation: creature.generation + 1
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
}

function createPopulation() {
    creatures = []
    
    for (let i = 0; i < 20; i++) {
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
        creature.age += 0.016

        if(creature.reproductionCooldown > 0) {
            creature.reproductionCooldown -= 0.016
        }

        if(
            creature.x <= creature.size || creature.x >= canvas.width - creature.size
        )

        {creature.direction = Math.PI - creature.direction}

        if(
            creature.y <= creature.size || creature.y >= canvas.height - creature.size
        )

        {
            creature.direction = -creature.direction
        }
    }
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

    statusText.textContent = "Ecosytem Active"
    statusIndicator.style.background = "#8cffb0"
    statusIndicator.style.boxShadow = "0 0 8px rgba(140, 255, 176, 0.7)"
}

//the main loop

function gameLoop() {
    drawBackground()
    
    if (running) {
        updateCreatures()
        checkFood()
        removeDeadCreatures()
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
    updateEcosystemStatus()
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

//drawing fo the charts

function recordEvolutionStats() {
    const stats = calculateEvolutionStats()
    populationHistory.push(creatures.length)
    averageSizeHistory.push(stats.averageSize)
    averageSpeedHistory.push(stats.averageSpeed)
    averageVisionHistory.push(stats.averageVision)
    generation = stats.highestGeneration
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

//reseting everythign and starting it over

resetButton.addEventListener("click", () => {
    running = false
    creatures = []
    foods = []
    populationHistory = []
    averageSizeHistory = []
    averageSpeedHistory = []
    averageVisionHistory = []
    statTimer = 0
    generation = 0
    population = 0
    food = 0
    seconds = 0
    startButton.textContent = "Start Simulation"
    updateStats()
    drawBackground()
})

window.addEventListener("resize", resizeCanvas)
resizeCanvas()
updateStats()
gameLoop()