// function from https://gist.github.com/rakeden/508ca124fabe97eba6d5734f2efcea32
function CSVToArray( strData, strDelimiter ){
    strDelimiter = (strDelimiter || ",");

    // Create a regular expression to parse the CSV values.
    var objPattern = new RegExp(
        (
            // Delimiters.
            "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +

            // Quoted fields.
            "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

            // Standard fields.
            "([^\"\\" + strDelimiter + "\\r\\n]*))"
        ),
        "gi"
        );
    var arrData = [[]];

    // Create an array to hold our individual pattern
    // matching groups.
    var arrMatches = null;

    var headers = [];

    var isHeaders = true;

    // Keep looping over the regular expression matches
    // until we can no longer find a match.
    while (arrMatches = objPattern.exec( strData )){

        // Get the delimiter that was found.
        var strMatchedDelimiter = arrMatches[ 1 ];

        // Check to see if the given delimiter has a length
        // (is not the start of string) and if it matches
        // field delimiter. If id does not, then we know
        // that this delimiter is a row delimiter.
        if (
            strMatchedDelimiter.length &&
            (strMatchedDelimiter != strDelimiter)
            ){

            // Since we have reached a new row of data,
            // add an empty row to our data array.
            if (!isHeaders)
                arrData.push( [] );
            else 
                isHeaders = false;

        }
        // Now that we have our delimiter out of the way,
        // let's check to see which kind of value we
        // captured (quoted or unquoted).
        if (arrMatches[ 2 ]){

            // We found a quoted value. When we capture
            // this value, unescape any double quotes.
            var strMatchedValue = arrMatches[ 2 ].replace(
                new RegExp( "\"\"", "g" ),
                "\""
                );

        } else {
            // We found a non-quoted value.
            var strMatchedValue = arrMatches[ 3 ];
        }

        if (!isHeaders)
            arrData[ arrData.length - 1 ].push( strMatchedValue );
        else
            headers.push( strMatchedValue );
    }
    
    // convert to JSON
    return arrData.map(row => {
        const rowObject = {};
        row.forEach((value, index) => {
            rowObject[headers[index]] = value;
        });
        return rowObject
    });
}

const Communes = {
    "33318": "Pessac",
    "33063": "Bordeaux",
    "33522": "Talence",
    "33069": "Le Bouscat",
    "33075": "Bruges",
    "33032": "Bassens",
    "33249": "Lormont",
    "33350": "Cenon",
    "33449": "Saint-Médard-en-Jalles",
    "33273": "Martignas-sur-Jalle",
    "33039": "Bègles",
    "33192": "Gradignan",
    "33281": "Mérignac",
    "33550": "Villenave-d'Ornon",
    "33004": "Ambès",
    "33003": "Ambarès-et-Lagrave",
    "33312": "Parempuyre",
    "33056": "Blanquefort",
    "33376": "Saint-Aubin-de-Médoc",
    "33434": "Saint-Louis-de-Montferrand",
    "33487": "Saint-Vincent-de-Paul",
    "33096": "Carbon-Blanc",
    "33167": "Floirac",
    "33013": "Artigues-près-Bordeaux",
    "33119": "Cenon",
    "33065": "Bouliac",
    "33200": "Le Haillan",
    "33162": "Eysines",
    "33519": "Le Taillan-Médoc"
};

// Initialize map
const map = L.map('map').setView([44.84151, -0.56997], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

const infoContent = document.getElementById('info-content');

let previousLayer = null;
let previousFeature = null;

function onEachFeature(feature, layer) {
    layer.on('click', function() {
        // reset the color of the previous clicked layer
        if (previousLayer)
            previousLayer.setStyle(colorSection(previousFeature, currentDisplayMode));
        previousLayer = layer;
        previousFeature = feature;
        layer.setStyle({fillColor: 'pink'});

        if (sectionStats[feature.properties.id] === undefined) {
            infoContent.innerHTML = `
            <div class="info-block"><b>Section</b></div>
            <div>Commune: ${Communes[feature.properties.commune]}</div>
            <div>Code de la section cadastrale: ${feature.properties.code}</div>
            <div>Aucun Airbnb enregistré dans cette section ou les données sont manquantes.</div>
        `;
        } else {
            infoContent.innerHTML = `
                <div class="info-block"><b>Section</b></div>
                <div>Commune: ${Communes[feature.properties.commune]}</div>
                <div>Code de la section cadastrale: ${feature.properties.code}</div>
                <div>Prix moyen: ${sectionStats[feature.properties.id]['avg_price']}</div>
                <div>Avis moyen: ${sectionStats[feature.properties.id]['avg_rating']}</div>
            `;
        }
    });
}

let sections = null;
await fetch("epci-243300316-sections.json").then((response) => response.json()).then((data) => {
    sections = data;
});

let sectionStats = null;
await fetch("bordeaux_final_process.json").then((response) => response.json()).then((data) => {
    sectionStats = data;
});

let global_stats = null;
await fetch("global_stats.json").then((response) => response.json()).then((data) => {
    global_stats = data;
});

const colorMap = ['green', 'limegreen', 'greenyellow', 'yellow', 'orange', 'red', 'darkred'];

function colorSection(feature, mode) {
    // if no data
    if (sectionStats[feature.properties.id] === undefined) {
        // Default style
        return {
            fillColor: 'gray',
            weight: 1,
            opacity: 1,
            color: 'white',
            fillOpacity: 0.7
        };
    }

    let value = null;
    if (mode === 'price') {
        value = sectionStats[feature.properties.id]["avg_price"];
    } else if (mode === 'rating') {
        value = sectionStats[feature.properties.id]["avg_rating"];
    }
    for (let i = 0; i < global_stats[mode].length - 1; i++) {
        const range = global_stats[mode][i];
        const nextRange = global_stats[mode][i + 1];
        if (value >= range && value < nextRange) {
            let fillColor = null;
            if (mode === 'price') {
               fillColor = colorMap[i];
            } else if (mode === 'rating') {
               fillColor = colorMap[global_stats[mode].length - 2 - i];
            }
            return {
                fillColor: fillColor,
                weight: 1,
                opacity: 1,
                color: 'white',
                fillOpacity: 0.7
            };
        }
    }
    // If value is above the last range (top 5%)
    const lastIndex = global_stats[mode].length - 1;
    if (value >= global_stats[mode][lastIndex]) {
        let fillColor = null;
            if (mode === 'price') {
               fillColor = `DarkViolet`
            } else if (mode === 'rating') {
               fillColor = `cyan`
            }
        return {
            fillColor: fillColor,
            weight: 1,
            opacity: 1,
            color: 'white',
            fillOpacity: 0.7
        };
    }

    return {
            fillColor: 'gray',
            weight: 1,
            opacity: 1,
            color: 'white',
            fillOpacity: 0.7
        };
}

async function drawSections(mode) {
    L.geoJSON(sections, {
        style: (feature) => colorSection(feature, mode),
        onEachFeature: onEachFeature
    }).addTo(map);
}

let currentJsonData = null;
let currentDisplayMode = 'price';


// Load and display markers
await fetch("pre_listings_bordeaux.csv").then((response) => response.text()).then((data) => {
    currentJsonData = CSVToArray(data, ',');
    console.log(currentJsonData);
});

const customIcon = L.icon({
        iconUrl: 'marker_icon.png',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    });

function placeMarkers( map, jsonData, displayMode = 'price' ) {
    jsonData.forEach( row => {
        const marker = L.marker([row["latitude"], row["longitude"]], { icon: customIcon }).addTo(map);
        marker.on('click', function() {
            let content = `<div class="info-block"><b>${row["name"]}</b></div>`;
            if (displayMode === 'price') {
                content += `<div>${row["price"]}/nuitée</div>`;
            } else if (displayMode === 'rating') {
                content += `<div>Rating: ${row["review_scores_rating"] || 'N/A'}</div>`;
                content += `<div>Reviews: ${row["number_of_reviews"] || 0}</div>`;
            }
            infoContent.innerHTML += content;
        });
    });
}

// Handle display mode selection
const displaySelector = document.getElementById('display-selector');

displaySelector.addEventListener('change', function() {
    currentDisplayMode = this.value;
    console.log("Display mode changed to:", currentDisplayMode);
    // Clear existing markers and GeoJSON layers
    map.eachLayer(layer => {
        if (layer instanceof L.Marker || layer instanceof L.GeoJSON) {
            map.removeLayer(layer);
        }
    });
    
    drawSections(currentDisplayMode);
    // Redraw with new display mode
    if (currentJsonData) {
        //placeMarkers(map, currentJsonData, currentDisplayMode);
    }
});

// Initial draw
drawSections(currentDisplayMode);
