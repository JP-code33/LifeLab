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

let running = false
let generation = 0
let population = 0
let food = 0
let seconds = 0
let creatures = []
let foods = []

function resizeCanvas() {
    canvas.width = canvas.clientWidth; canvas.height = canvas.clientHeight
    drawBackground()
}

function createCreature() {
    const creature = {
        x: Math.random() * canvas.width, y: Math.random() * canvas.height, 
        size: 7, speed: 1 + Math.random() * 1.5, direction: Math.random() * Math.PI * 2, energy: 100
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

        if(closestFood && closestDistance < 250) {
            const dx = closestFood.x - creature.x
            const dy = closestFood.y - creature.y
            const angle = Math.atan2(dy, dx)
            creature.direction = angle
        }

        creature.x += Math.cos(creature.direction) * creature.speed
        creature.y += Math.sin(creature.direction) * creature.speed
        creature.energy -= 0.03

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

function gameLoop() {
    drawBackground()
    
    if (running) {
        updateCreatures()
        checkFood()
        removeDeadCreatures()
    }

    drawFood()
    drawCreatures()
    updateStats()
   
    requestAnimationFrame(gameLoop)
}

function drawCreatures() {
    for (const creature of creatures) {
        context.beginPath()

        context.arc(creature.x, creature.y, creature.size, 0, Math.PI * 2)

        context.fillStyle = "#72f59b"
        context.fill()
    }
}

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

resetButton.addEventListener("click", () => {
    running = false
    creatures = []
    foods = []
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