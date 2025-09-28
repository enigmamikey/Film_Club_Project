let SHEET_ID = "1G5MVxRUtbkhdOr41PhxSSczPskuqaH0_9bgcsUaO5pw"
let API_KEY = "AIzaSyBGlTopXKSbFuQwL_Hxu5WtwWFjqt7gjcA"

main()

async function main() {
    let data = await fetchAllData()
    console.log(data)
    let roundNums = getRoundNums(data)
    console.log(roundNums)
    createRoundButtons(roundNums)
}

function createRoundButtons(roundNums) {
    let container = document.querySelector('#rbsContainer')
    for (let i = 1; i <= roundNums.length; i++) {
        let section = document.createElement('section')
        section.classList.add('rbc')
        container.appendChild(section)
        for (let j = roundNums[i-1]; j >= 1; j--) {
            let button = document.createElement('button')
            button.innerHTML = `Round ${i}.${j}`
            button.addEventListener('click', () => {console.log(`Round ${i}.${j}`)})
            section.appendChild(button)
        }
    }
}

function getRoundNums(data) {
    let roundNums = []
    let totalVersions = Math.max(
        ...data.rounds
        .map(r => r.version_number))
    for (let i = 1; i <= totalVersions; i++) {
        let maxRoundsForVersion = Math.max(
            ...data.rounds
            .filter(r => r.version_number == i)
            .map(r => r.round_number))
        roundNums.push(maxRoundsForVersion)
    }
    return roundNums
}

async function fetchAllData() {
    // 1. Define the ranges for each sheet  
    let ranges = {
        members: "Members",
        movies: "Movies",
        ratings: "Ratings",
        rounds: "Rounds",
    }

    // 1.5. Declare which parameters need to be numbers (instead of string)
    let numericFields = {
        members: ["version_number"],
        movies:  ["position", "round_number", "version_number"],
        ratings: ["score", "round_number", "version_number"],
        rounds:  ["round_number", "version_number"],
    }

    // 2. Build URLs for each range
    let urls = {}
    for (let key in ranges) {
        let range = ranges[key]
        urls[key] = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}?key=${API_KEY}`
    }

    // 3. Start all fetches at once and store the promises
    let keys = Object.keys(urls)
    let fetchPromises = keys.map(k => fetch(urls[k]))

    // 4. Wait for all fetches to finish
    let responses = await Promise.all(fetchPromises)

    // 5. Convert each response to JSON
    let jsonPromises = responses.map(e => e.json())
    let jsonData = await Promise.all(jsonPromises)

    let allData = keys.reduce((acc, key, i) => {
        let data = jsonData[i]
        let headers = data.values[0]
        let rows = data.values.slice(1)
        let records = rows.map(row => {
            return headers.reduce((obj, field, i) => {
                let value = row[i]
                if (numericFields[key].includes(field)) {
                    value = Number(value)
                }
                obj[field] = value
                return obj
            }, {})
        })
        acc[key] = records
        return acc
    }, {})
    return allData
}