let SHEET_ID = "1G5MVxRUtbkhdOr41PhxSSczPskuqaH0_9bgcsUaO5pw"
let API_KEY = "AIzaSyA9xA5JdeoEwP2W5HOBYAmnKm7e6K_Xmcw"

main()

async function main() {
    let data = await fetchAllData()
    let roundNums = getRoundNums(data)
    createRoundButtons(roundNums)
    console.log(data)
}

async function fetchAllData() {
    // 1. Define the ranges for each sheet  
    let ranges = {
        rounds: "Rounds!A:D", 
        members: "Members!A:E",
        movies: "Movies!A:G",
        ratings: "Ratings!A:G"
    }

    // 1.5. Declare which parameters need to be numbers (instead of string)
    const numericFields = {
        rounds:  ["round_number", "version_number"],
        members: ["version_number"],
        movies:  ["position", "round_number", "version_number"],
        ratings: ["score", "round_number", "version_number"]
    }

    // 2. Build URLs for each range
    let urls = {}
    for (let key in ranges) {
        let range = ranges[key]
        urls[key] = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}?key=${API_KEY}`
    }

    // 3. Start all fetches at once and store the promises
    let fetchPromises = []
    let keys = []
    for (let k in urls) {
        keys.push(k)
        fetchPromises.push(fetch(urls[k]))
    }

    // 4. Wait for all fetches to finish
    let responses = await Promise.all(fetchPromises)

    // 5. Convert each response to JSON
    let jsonPromises = []
    for (let i = 0; i < responses.length; i++) jsonPromises.push(responses[i].json())
    let jsonData = await Promise.all(jsonPromises)

    let allData = {}
    for (let i = 0; i < keys.length; i++) {
        let key = keys[i]
        let data = jsonData[i]
        let headers = data.values[0]
        let rows = data.values.slice(1)
        let records = []
        for (let r = 0; r < rows.length; r++) {
            let row = rows[r]
            let obj = {}
            for (let c = 0; c < headers.length; c++) {
                let field = headers[c]
                let value = row[c]
                if (numericFields[key]?.includes(field)) value = Number(value)
                obj[field] = value
            }
            records.push(obj)
        }
        allData[key] = records    
    }
    return allData
}


function createRoundButtons(roundNums) {
    console.log(roundNums)
    let container = document.querySelector('#rbsContainer')
    for (let i = 1; i <= roundNums.length; i++) {
        let section = document.createElement('section')
        section.classList.add('rbc')
        container.appendChild(section)
        for (let j = roundNums[i-1]; j >= 1; j--) {
            let button = document.createElement('button')
            button.innerHTML = `Round ${i}.${j}`
            section.appendChild(button)
        }
    }
}

function getRoundNums(data) {
    let roundNums = []
    let totalVersions = Math.max(...data.rounds.map(r => r.version_number))
    for (let i = 1; i <= totalVersions; i++) {
        roundNums.push(Math.max(...data.rounds.filter(r => r.version_number == i).map(r => r.round_number)))
    }
    return roundNums
}

