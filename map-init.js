function CSVToArray( strData, strDelimiter ){
    // Check to see if the delimiter is defined. If not,
    // then default to comma.
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


    // Create an array to hold our data. Give the array
    // a default empty first row.
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

// Initialize map
const map = L.map('map').setView([44.84151, -0.56997], 12);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

await fetch("pre_listings_bordeaux.csv").then((response) => response.text()).then((data) => {
    let arrData = CSVToArray(data, ',');
    console.log(arrData);
});

// Example marker with popup
const marker = L.marker([44.84151, -0.56997]).addTo(map)
    .bindPopup('Coucou !');

const infoContent = document.getElementById('info-content');

// Show clicked coordinates and zoom in the info panel
map.on('click', function(e) {
    const lat = e.latlng.lat.toFixed(6);
    const lng = e.latlng.lng.toFixed(6);
    infoContent.innerHTML = `
        <div class="info-block"><b>Map clicked</b></div>
        <div>Latitude: ${lat}</div>
        <div>Longitude: ${lng}</div>
        <div>Zoom: ${map.getZoom()}</div>
    `;
});

// Example: update info when marker is clicked
marker.on('click', function() {
    infoContent.innerHTML = `
        <div class="info-block"><b>Marker</b></div>
        <div>Location: Paris</div>
        <div>Coordinates: 48.8566, 2.3522</div>
    `;
});