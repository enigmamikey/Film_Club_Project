let SHEET_ID = "1G5MVxRUtbkhdOr41PhxSSczPskuqaH0_9bgcsUaO5pw"
let API_KEY = "AIzaSyBGlTopXKSbFuQwL_Hxu5WtwWFjqt7gjcA"

main()

async function main() {
    let data = await fetchAllData()
    let roundNums = getRoundNums(data)
    createRoundButtons(roundNums, data)
    let miniData = findSubData(data,roundNums.length,roundNums[roundNums.length - 1])
    displayRoundData(miniData)
}

function handleSelectMovie(i) {console.log(`movie ${i}`)}

function handleRateButtons(i) {console.log(`member ${i}`)}
    
function displayRoundData(data) {
    let grid = document.querySelector('#grid')
    grid.innerHTML = ''

    // Round i.j
    console.log(data)
    let v = data.movies[0].version_number
    let r = data.movies[0].round_number
    document.querySelector('#roundNum').textContent = `Round ${v}.${r}`

    let extraCol = {left: ['member', 'button'], right: ['ratCount']}
    let extraRow = {top: ['member', 'movie', 'button'], bottom: ['average']}

    let gridSize = calcGridSize()
    buildGrid()
    fillExtraCol()
    fillExtraRow()
    fillRatings()

    function fillRatings() {
        data.ratings.forEach((rat) => {
            let score = rat.score
            if (score != 0) {
                // figure out movie position
                let movID = rat.movie_id
                let movie = data.movies.find(v => v.movie_id == movID)
                let pos = movie.position - 1

                // figure out member
                let mem = rat.membership_id[3] - 1

                // display rating in appropriate square
                document.querySelector(`#d${extraRow.top.length + mem}-${extraCol.left.length + pos}`).textContent = score.toFixed(1)
            }
        })
    }

    function fillExtraRow() {
        let memNum = extraRow.top.findIndex(v => v == 'member')
        let movNum = extraRow.top.findIndex(v => v == 'movie')
        let butNum = extraRow.top.findIndex(v => v == 'button')
        data.movies.forEach((mov,i) => {
            // member row
            let member = data.members.find(mem => mem.membership_id == mov.membership_id)
            document.querySelector(`#d${memNum}-${i + extraCol.left.length}`).textContent = `Week ${i+1} - ${member.first_name}`
            // movie row
            document.querySelector(`#d${movNum}-${i + extraCol.left.length}`).textContent = mov.title
            // button row
            let button = document.createElement('button')
            button.id = `mb${i}`
            button.textContent = 'Pick Movie'
            document.querySelector(`#d${butNum}-${i + extraCol.left.length}`).appendChild(button)
            button.addEventListener('click', () => {
                handleSelectMovie(mov.position)
            })
        })
        // average row
        let avgNum = extraRow.bottom.findIndex(v => v == 'average')
        document.querySelector(`#d${extraRow.top.length + data.members.length + avgNum}-${0}`).textContent = 'Average Score'
    }

    function fillExtraCol() {
        let memNum = extraCol.left.findIndex(v => v == 'member')
        let butNum = extraCol.left.findIndex(v => v == 'button')
        data.members.forEach((mem,i) => {
            // member column
            document.querySelector(`#d${i + extraRow.top.length}-${memNum}`).textContent = mem.first_name 
            // button column
            let button = document.createElement('button')
            button.id = `rb${i}`
            button.textContent = 'Rate Movies'
            document.querySelector(`#d${i + extraRow.top.length}-${butNum}`).appendChild(button)
            button.addEventListener('click', () => {
                handleRateButtons(mem.membership_id[3])
            })
        })
        // rating count column
        let ratNum = extraCol.right.findIndex(v => v == 'ratCount')
        document.querySelector(`#d${0}-${extraCol.left.length + data.movies.length + ratNum}`).innerHTML = 'Rating Count'
    }

    function buildGrid() {
        grid.style.setProperty('--colNum',gridSize.col)
        for (let i = 0; i < gridSize.row; i++) {
            for (let j = 0; j < gridSize.col; j++) {
                let div = document.createElement('div')
                div.id = `d${i}-${j}`
                // div.textContent = div.id
                div.classList.add('item')
                grid.appendChild(div)
            }
        }
    }

    function calcGridSize() {
        return {
            col: data.movies.length + extraCol.left.length + extraCol.right.length,
            row: data.members.length + extraRow.top.length + extraRow.bottom.length,
        }
    }
}

function findSubData(data,v,r) {
    return {
        members: data.members.filter(e => e.version_number == v),
        movies: data.movies.filter(e => e.version_number == v && e.round_number == r),
        ratings: data.ratings.filter(e => e.version_number == v && e.round_number == r),
    }
}

function createRoundButtons(roundNums, data) {
    let container = document.querySelector('#rbsContainer')
    for (let i = 1; i <= roundNums.length; i++) {
        let section = document.createElement('section')
        section.classList.add('rbc')
        container.appendChild(section)
        for (let j = roundNums[i-1]; j >= 1; j--) {
            let button = document.createElement('button')
            button.innerHTML = `Round ${i}.${j}`
            button.addEventListener('click', () => {
                let miniData = findSubData(data,i,j)
                displayRoundData(miniData)
            }) 
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
    // allData.ratings.forEach(v => v.score = Number(v.score.toFixed(1)))
    return allData
}