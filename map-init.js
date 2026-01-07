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
        // Now that we have our value string, let's add
        // it to the data array.
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

function placeMarkers( map, jsonData ) {
    jsonData.forEach( row => {
        if (row["illegal"] == 1) {
            const marker = L.marker([row["latitude"], row["longitude"]]).addTo(map);
            marker.on('click', function() {
                infoContent.innerHTML = `
                    <div class="info-block"><b>${row["name"]}</b></div>
                    <div>${row["price"]}/nuitée</div>
                `;
            });
        }
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

function onEachFeature(feature, layer) {
    layer.on('click', function() {
        infoContent.innerHTML = `
            <div class="info-block"><b>Section</b></div>
            <div>Commune: ${Communes[feature.properties.commune]}</div>
            <div>Code: ${feature.properties.code}</div>
        `;
    });
}

await fetch("epci-243300316-sections.json").then((response) => response.json()).then((data) => {
    L.geoJSON(data, {
        style: function (feature) {
            return {color: "#a0497f", weight: 1, fillOpacity: 0.3};
        },
        onEachFeature: onEachFeature
    }).addTo(map);
});

/*await fetch("pre_listings_bordeaux.csv").then((response) => response.text()).then((data) => {
    let jsonData = CSVToArray(data, ',');
    placeMarkers(map, jsonData);
});*/

const infoContent = document.getElementById('info-content');

/*// Example: update info when marker is clicked
marker.on('click', function() {
    infoContent.innerHTML = `
        <div class="info-block"><b>Marker</b></div>
        <div>Location: Paris</div>
        <div>Coordinates: 48.8566, 2.3522</div>
    `;
});*/