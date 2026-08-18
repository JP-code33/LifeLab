exports.handler = async function(event) {
    try {
        const {question, experiments} = JSON.parse(event.body)
        if(!question) {
            return{
                statusCode: 400, 
                body:JSON.stringify({error: "No question provided"
                })
            }
        }
        const prompt = `
        You are the LifeLab Evolution Analyst.
        LifeLab is an ecosystem evolution simulator where organisms have traits like speed, vision, size, energy, generation and population.
        Your job is to analyze experimental data scientifically. 
        DO NOT invent data that isn't provided.
        When explaining results: identify important patterns, explain possible evolutionary reasons, connect environmental conditions to the results, distinguish between correlation and certainty, keep the explaination understandable to a student and if the data is not enought for a strong conclusion, say no
        Experiment data: ${JSON.stringify(experiments, null, 2)}
        User question: ${question}
        `
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {"Content-Type": "application/json", 
                "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: "openai/gpt-oss-20b",
                messages: [{
                    role: "system",
                    content: "You are a scientific analysis assistant for the LifeLab ecosytem simulator."
                }, 
                {
                    role: "user",
                    content: prompt
                }], temperature: 0.3, max_tokens: 1400
            })
        })
        if(!response.ok) {
            const errorText = await response.text()
            console.error("Groq status:", response.status)
            console.error("Groq error:", errorText)
            return {
                statusCode: 500,
                body: JSON.stringify({error: "AI analysis failed"})
            }
        }
        const data = await response.json()
        const answer = data.choices?.[0].message?.content
        if(!answer) {
            return {
                statusCode: 500,
                body: JSON.stringify({error: "No response from AI"})
            }
        }
        return {
            statusCode: 200,
            body: JSON.stringify({answer})
        }
    } catch(error) {
        console.error("Analysis function error:", error)
        return {
            statusCode: 500,
            body: JSON.stringify({error: "Something went wrong"})
        }
    }
}