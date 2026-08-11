function reproduceCreatures() {

    for (const creature of creatures) {

       
        if (creature.energy >= 80 && creature.age >= 10 && creature.reproductionCooldown <= 0
        ) {const baby = {
                x: creature.x + (Math.random() - 0.5) * 20,
                y: creature.y + (Math.random() - 0.5) * 20,

                size: creature.size,
                speed: creature.speed,
                direction: Math.random() * Math.PI * 2,

                energy: 50,

                age: 0,
                reproductionCooldown: 10
            }

            creatures.push(baby)
            creature.energy -= 40
            creature.reproductionCooldown = 10
        }
    }

    population = creatures.length
}