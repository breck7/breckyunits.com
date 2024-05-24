/*

Write a Javascript function `simulateLongJob()` that when you run it, returns the number of seconds elapsed and 1 of 3 states (success, aborted, or stillWaiting). The idea is that this function should simulate a job that would take a long time to run, such as reformatting a hard drive, downloading a huge file, or trying to book some complicated job online. It should be a realisitic simulation. So, for example, after a certain point no one should be in the "stillWaiting" point, but should have aborted or succeeded. Please choose an intelligent set of parameters for simulateLongJob. One of the parameters should be the random seed for reproducible runs. Then, write a function `populationSimulation`, which should takes parameters that let me run say, 10 million runs, or 1,000 runs, and it should return an array of points, sampling 100 points in time X, and having the # of people in the succesful state at that point, and the # of people in the aborted state at that point, and the # of people in the still waiting state at that point. Those 3 counts should always add up to 100% of the population.
*/

class AbortBar {
    constructor(historicalStatistics, width = 600, height = 100) {
        this.historicalStatistics = historicalStatistics
        this.width = width
        this.height = height
        this.maxSeconds =
            this.historicalStatistics[
                this.historicalStatistics.length - 1
            ].timeInSeconds
    }

    start() {
        let startTime = Date.now()
        this.interval = setInterval(() => {
            const secondsElapsed = (Date.now() - startTime) / 1000
            this.updateVerticalLine(secondsElapsed)
        }, 10)
        return this
    }

    stop() {
        clearInterval(this.interval)
        return this
    }

    // Function to update the vertical line
    updateVerticalLine(currentTime) {
        this.svg.selectAll(".time-line").remove() // Remove previous line if any
        if (currentTime > this.maxSeconds) {
            currentTime = this.maxSeconds
            this.stop()
        }
        this.svg
            .append("line")
            .attr("class", "time-line")
            .attr("x1", this.x(currentTime))
            .attr("x2", this.x(currentTime))
            .attr("y1", 0)
            .attr("y2", this.height)
            .attr("stroke", "black")
            .attr("stroke-width", 2)
    }

    draw() {
        // Prepare the data for the stacked area chart
        const stack = d3
            .stack()
            .keys(["remainingSuccesses", "remainingAborts"])
            .order(d3.stackOrderNone)
            .offset(d3.stackOffsetExpand) // Ensures areas add up to 100%

        const series = stack(
            this.historicalStatistics.map((d) => ({
                timeInSeconds: d.timeInSeconds,
                remainingSuccesses: d.remainingSuccesses,
                remainingAborts: d.remainingAborts || 1,
                stillWaiting: d.stillWaiting,
            })),
        )

        // Set the dimensions and margins of the graph
        const margin = { top: 0, right: 0, bottom: 0, left: 0 }
        const width = this.width - margin.left - margin.right
        const height = this.height - margin.top - margin.bottom

        // Append the svg object to the body of the page
        const svg = d3
            .select("#chart")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`)

        // Add X axis
        const x = d3
            .scaleLinear()
            .domain(d3.extent(simulationResults, (d) => d.timeInSeconds))
            .range([0, width])
        // svg.append("g")
        //     .attr("transform", `translate(0,${height})`)
        //     .call(d3.axisBottom(x).ticks(0)) // No tick marks or labels

        // Add Y axis
        const y = d3.scaleLinear().domain([0, 1]).range([height, 0])
        //svg.append("g").call(d3.axisLeft(y).ticks(0)) // No tick marks or labels

        // Add the areas
        const area = d3
            .area()
            .x((d) => x(d.data.timeInSeconds))
            .y0((d) => y(d[0]))
            .y1((d) => y(d[1]))

        svg.selectAll(".area")
            .data(series)
            .enter()
            .append("path")
            .attr("class", (d) => `area area-${d.key}`)
            .attr("d", area)
        this.svg = svg
        this.x = x
        return this
    }
}

class AbortBarSim {
    constructor(
        seed = Math.random(),
        params = {
            maxSeconds: 10 * 60,
            shape: 0.2, // Shape parameter for Gamma distribution
            scale: 100, // Scale parameter for Gamma distribution,
            abortProbabilityMultiplier: 1,
        },
    ) {
        this.seed = seed
        this.params = params
    }

    rand() {
        // Simple linear congruential generator (LCG) for reproducible results
        this.seed = (this.seed * 9301 + 49297) % 233280
        return this.seed / 233280
    }

    gammaRandom(shape, scale) {
        if (shape < 1) {
            // Use the method for shape < 1 by Marsaglia and Tsang
            const u = this.rand()
            return this.gammaRandom(1 + shape, scale) * Math.pow(u, 1 / shape)
        }

        // Use the method for shape >= 1 by Marsaglia and Tsang
        const d = shape - 1 / 3
        const c = 1 / Math.sqrt(9 * d)
        while (true) {
            let x, v
            do {
                x = this.rand()
                v = 1 + c * (x - 0.5)
            } while (v <= 0)
            v = v * v * v
            const u = this.rand()
            const x2 = x * x
            if (
                u < 1 - 0.0331 * x2 * x2 ||
                Math.log(u) < 0.5 * x2 + d * (1 - v + Math.log(v))
            ) {
                return scale * d * v
            }
        }
    }

    simulateLongRunningJob() {
        const { shape, scale, maxSeconds, abortProbabilityMultiplier } =
            this.params
        // Simulating the job duration using gamma distribution
        const duration = this.gammaRandom(shape, scale)

        // Calculating the probability of abort based on exponential growth over time
        const abortProbability = 1 - Math.exp(-duration / maxSeconds)

        // Determining if the job results in an abort or success
        const isAbort =
            this.rand() < abortProbabilityMultiplier * abortProbability
        const result = isAbort ? "abort" : "success"

        // Clamping the duration to the maximum time if it exceeds
        const clampedDuration = Math.min(duration, maxSeconds)

        return {
            result,
            duration: clampedDuration,
        }
    }

    populationSimulation(populationSize = 1000) {
        const summary = []

        // Generate job results
        const jobResults = Array(populationSize)
            .fill(null)
            .map(() => this.simulateLongRunningJob())

        // Determine the maximum duration
        let maxTime = Math.max(...jobResults.map((job) => job.duration)) + 1
        // always end in a failure
        jobResults.push({ result: "abort", duration: maxTime })

        // Generate 100 evenly spaced time intervals from 0 to maxTime
        const timeIntervals = Array.from(
            { length: 100 },
            (_, i) => (i / 99) * maxTime,
        )

        let totalSuccesses = 0
        let totalAborts = 0
        jobResults.forEach((run) => {
            if (run.result === "success") totalSuccesses++
            else totalAborts++
        })

        for (const timeInSeconds of timeIntervals) {
            let successCount = 0
            let abortedCount = 0
            let stillWaitingCount = 0

            jobResults.forEach((job) => {
                if (job.duration <= timeInSeconds) {
                    if (job.result === "success") {
                        successCount++
                    } else if (job.result === "abort") {
                        abortedCount++
                    }
                } else {
                    stillWaitingCount++
                }
            })

            summary.push({
                timeInSeconds,
                remainingSuccesses: totalSuccesses - successCount,
                remainingAborts: totalAborts - abortedCount,
                success: (successCount / populationSize) * 100,
                aborted: (abortedCount / populationSize) * 100,
                stillWaiting: (stillWaitingCount / populationSize) * 100,
            })
        }

        return summary
    }
}

const simulationResults = new AbortBarSim().populationSimulation()
console.log(simulationResults)
const abortBar = new AbortBar(
    simulationResults,
    document.querySelector(".scrollParagraph").offsetWidth,
)
    .draw()
    .start()
