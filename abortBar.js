/*

Write a Javascript function `simulateLongJob()` that when you run it, returns the number of seconds elapsed and 1 of 3 states (success, aborted, or stillWaiting). The idea is that this function should simulate a job that would take a long time to run, such as reformatting a hard drive, downloading a huge file, or trying to book some complicated job online. It should be a realisitic simulation. So, for example, after a certain point no one should be in the "stillWaiting" point, but should have aborted or succeeded. Please choose an intelligent set of parameters for simulateLongJob. One of the parameters should be the random seed for reproducible runs. Then, write a function `populationSimulation`, which should takes parameters that let me run say, 10 million runs, or 1,000 runs, and it should return an array of points, sampling 100 points in time X, and having the # of people in the succesful state at that point, and the # of people in the aborted state at that point, and the # of people in the still waiting state at that point. Those 3 counts should always add up to 100% of the population.
*/

class AbortBar {
    constructor(historicalStatistics, width = 600, height = 25) {
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

    colors = {
        success: "rgb(101,170,102)",
        abort: "rgb(208,85,87)",
        border: "rgba(100,100,100,.5)",
        background: "rgba(200,200,200,.5)",
    }

    // Function to update the vertical line
    updateVerticalLine(currentTime) {
        if (currentTime > this.maxSeconds) {
            currentTime = this.maxSeconds
            this.stop()
            return
        }

        this.svg.selectAll(".time-line,.time-line-border").remove() // Remove previous line if any

        const { colors } = this

        // Find the closest data point to the given time
        const closestData = this.historicalStatistics.reduce((prev, curr) => {
            return Math.abs(curr.timeInSeconds - currentTime) <
                Math.abs(prev.timeInSeconds - currentTime)
                ? curr
                : prev
        })

        const total =
            closestData.remainingSuccesses + closestData.remainingAborts
        const abortProbability = total ? closestData.remainingAborts / total : 1

        // Calculate y-coordinates for splitting the line
        const splitY = this.height * abortProbability

        // Define the border color and width
        const borderColor = colors.border
        const borderWidth = 6 // Adjust the width as needed

        // Draw the success (green) part of the line with a border
        this.svg
            .append("line")
            .attr("class", "time-line-border")
            .attr("x1", this.x(currentTime))
            .attr("x2", this.x(currentTime))
            .attr("y1", splitY)
            .attr("y2", this.height)
            .attr("stroke", borderColor)
            .attr("stroke-width", borderWidth)

        this.svg
            .append("line")
            .attr("class", "time-line")
            .attr("x1", this.x(currentTime))
            .attr("x2", this.x(currentTime))
            .attr("y1", splitY)
            .attr("y2", this.height)
            .attr("stroke", colors.success)
            .attr("stroke-width", 4)

        // Draw the abort (red) part of the line with a border
        this.svg
            .append("line")
            .attr("class", "time-line-border")
            .attr("x1", this.x(currentTime))
            .attr("x2", this.x(currentTime))
            .attr("y1", 0)
            .attr("y2", splitY)
            .attr("stroke", borderColor)
            .attr("stroke-width", borderWidth)

        this.svg
            .append("line")
            .attr("class", "time-line")
            .attr("x1", this.x(currentTime))
            .attr("x2", this.x(currentTime))
            .attr("y1", 0)
            .attr("y2", splitY)
            .attr("stroke", colors.abort)
            .attr("stroke-width", 4)
    }

    draw() {
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
            .attr(
                "style",
                `border: 1px solid ${this.colors.border};background: ${this.colors.background};`,
            )
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`)
        this.svg = svg

        // Add X axis
        const x = d3
            .scaleLinear()
            .domain(d3.extent(simulationResults, (d) => d.timeInSeconds))
            .range([0, width])
        this.x = x

        // Add Y axis
        const maxY = d3.max(
            this.historicalStatistics,
            (d) => d.successInThisPeriod + d.abortedInThisPeriod,
        )
        const y = d3.scaleLinear().domain([0, maxY]).range([height, 0])

        // Prepare the data for the stacked area chart
        const stack = d3
            .stack()
            .keys(["successInThisPeriod", "abortedInThisPeriod"])
            .order(d3.stackOrderNone)
        // No offset specified, defaults to d3.stackOffsetNone which stacks the data without normalization

        const series = stack(
            this.historicalStatistics.map((d) => ({
                timeInSeconds: d.timeInSeconds,
                successInThisPeriod: d.successInThisPeriod,
                abortedInThisPeriod: d.abortedInThisPeriod,
            })),
        )

        // Add the areas
        const area = d3
            .area()
            .x((d) => x(d.data.timeInSeconds))
            .y0((d) => y(d[0]))
            .y1((d) => y(d[1]))

        const { colors } = this

        svg.selectAll(".area")
            .data(series)
            .enter()
            .append("path")
            .attr(
                "style",
                (d) =>
                    `fill:${
                        colors[d.key.includes("uccess") ? "success" : "abort"]
                    };`,
            )
            .attr("d", area)

        return this
    }
}

class AbortBarSim {
    constructor(
        seed = Math.random(),
        params = {
            minSeconds: 0,
            maxSeconds: 30,
            shape: 1, // Shape parameter for Gamma distribution
            scale: 10, // Scale parameter for Gamma distribution,
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
        const {
            shape,
            scale,
            maxSeconds,
            abortProbabilityMultiplier,
            minSeconds,
        } = this.params
        // Simulating the job duration using gamma distribution
        const duration = this.gammaRandom(shape, scale)

        // Calculating the probability of abort based on exponential growth over time
        const abortProbability = 1 - Math.exp(-duration / maxSeconds)

        // Determining if the job results in an abort or success
        const isAbort =
            this.rand() < abortProbabilityMultiplier * abortProbability
        const result = isAbort ? "abort" : "success"

        // Clamping the duration to the maximum time if it exceeds
        const clampedDuration = Math.max(
            minSeconds,
            Math.min(duration, maxSeconds),
        )

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

            let successInThisPeriod = 0
            let abortedInThisPeriod = 0
            jobResults
                .filter((job) => !job.accountedFor)
                .forEach((job) => {
                    if (job.duration <= timeInSeconds) {
                        if (job.result === "success") {
                            successInThisPeriod++
                        } else if (job.result === "abort") {
                            abortedInThisPeriod++
                        }
                        job.accountedFor = true
                    } else {
                    }
                })

            summary.push({
                timeInSeconds,
                successInThisPeriod,
                abortedInThisPeriod,
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
