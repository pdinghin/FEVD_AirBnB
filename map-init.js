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
            previousLayer.setStyle(colorSection(previousFeature, currentMode));
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
                <div>Prix moyen: ${sectionStats[feature.properties.id]['avg_price']}€</div>
                <div>Avis moyen: ${sectionStats[feature.properties.id]['avg_rating']}/5</div>
                <div>Prix moyen par lit: ${Number(sectionStats[feature.properties.id]['avg_price_per_bed']).toFixed(2)}€</div>
                <div>Nombre total d'Airbnb: ${sectionStats[feature.properties.id]['num_source']}</div>
            `;
        }
    });
}

let sections = null;
await fetch("./data/epci-243300316-sections.json").then((response) => response.json()).then((data) => {
    sections = data;
});

let sectionStats = null;
await fetch("./data/bordeaux_final_process.json").then((response) => response.json()).then((data) => {
    sectionStats = data;
});

let global_stats = null;
await fetch("./data/global_stats.json").then((response) => response.json()).then((data) => {
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
    } else if (mode === 'price_per_bed') {
        value = sectionStats[feature.properties.id]["avg_price_per_bed"];
    } else if (mode === 'rating') {
        value = sectionStats[feature.properties.id]["avg_rating"];
    }
    for (let i = 0; i < global_stats[mode].length - 1; i++) {
        const range = global_stats[mode][i];
        const nextRange = global_stats[mode][i + 1];
        if (value >= range && value < nextRange) {
            let fillColor = null;
            if (mode === 'price' || mode === 'price_per_bed') {
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
            if (mode === 'price' || mode === 'price_per_bed') {
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

const percentiles = ["0%", "15%", "30%", "45%", "60%", "75%", "90%", "95%", "100%"];

function formatLegendValue(val, mode, i = null) {
    if (mode === 'price' || mode === 'price_per_bed') {
        // Round to nearest multiple of 5 for prices
        return Math.round(val / 5) * 5;
    } else {
        // Round to nearest 0.05 (5%) for ratings
        return percentiles[i];
    }
}

function updateLegend(mode) {
    const legendDiv = document.getElementById('legend');
    const ranges = global_stats[mode];
    
    let legendHTML = `<div class="legend-title">${mode === 'price' ? 'Prix moyen (€)' : mode === 'price_per_bed' ? 'Prix par lit (€)' : 'Avis moyen\n (% top des meilleures notes)'}</div>`;
    
    for (let i = 0; i < ranges.length - 1; i++) {
        let color = null;
        if (mode === 'price' || mode === 'price_per_bed') {
            color = colorMap[i];
        } else if (mode === 'rating') {
            color = colorMap[ranges.length - 2 - i];
        }
        
        const minVal = ranges[i];
        const maxVal = ranges[i + 1];
        const label = `${formatLegendValue(minVal, mode, i)} - ${formatLegendValue(maxVal, mode, i + 1)}`;
        
        legendHTML += `
            <div class="legend-item">
                <div class="legend-color" style="background-color: ${color};"></div>
                <div class="legend-label">${label}</div>
            </div>
        `;
    }
    
    // Add top range
    const lastIndex = ranges.length - 1;
    const topColor = (mode === 'price' || mode === 'price_per_bed') ? 'DarkViolet' : 'cyan';
    const topLabel = `≥ ${formatLegendValue(ranges[lastIndex], mode, lastIndex)}`;
    legendHTML += `
        <div class="legend-item">
            <div class="legend-color" style="background-color: ${topColor};"></div>
            <div class="legend-label">${topLabel}</div>
        </div>
    `;
    
    // Add no data
    legendHTML += `
        <div class="legend-item">
            <div class="legend-color" style="background-color: gray;"></div>
            <div class="legend-label">Pas de données</div>
        </div>
    `;
    
    legendDiv.innerHTML = legendHTML;
}

const customIconDefault = L.icon({
        iconUrl: 'marker_icon.png',
        iconSize: [10, 10],
        iconAnchor: [5, 10],
        popupAnchor: [0, -10]
    });

const customIconHighlight = L.icon({
        iconUrl: 'marker_icon_highlight.png',
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30]
    });

let lastMarker = null;

function placeMarkers( map, mode = 'price', displayMode = 'high',  ) {
    Object.values(sectionStats).forEach( section => {
        let listings = section["top_" + mode + "_" + displayMode];
        if (!listings || listings.length === 0) {
            return;
        }
        Object.values(listings).forEach( listing => {
            const marker = L.marker([listing["latitude"], listing["longitude"]], { icon: customIconDefault }).addTo(map);
            marker.on('click', function() {
                let content = `<div class="info-block"><b>${listing["name"]}</b></div>`;
                    content += `<div>Prix/nuitée: ${listing["price"]}€</div>`;
                    content += `<div>Prix/lit: ${Number(listing["price_per_bed"]).toFixed(2) || 'N/A'}€</div>`;
                    content += `<div>Lits: ${listing["bedrooms"] || 0}</div>`;
                    content += `<div>Note moyenne: ${listing["review_scores_rating"] || 'N/A'}/5</div>`;
                    content += `<div>Nombre d'avis: ${listing["number_of_reviews"] || 0}</div>`;
                    if (listing["room_type"] === "Entire home/apt") {
                        content += `<div>Type de logement: Logement entier</div>`;
                    } else if (listing["room_type"] === "Private room") {
                        content += `<div>Type de logement: Chambre privée</div>`;
                    } else if (listing["room_type"] === "Shared room") {
                        content += `<div>Type de logement: Chambre partagée</div>`;
                    }
                    content += `<div><a href="https://www.airbnb.com/rooms/${listing["id"]}" target="_blank">Voir l'annonce Airbnb</a></div>`;
                    content += `<div><br>Photo de profil de l'hôte:</div>`;
                    content += `<div><img src="${listing["host_picture_url"]}" alt="Listing Image" width="60%"></div>`;
                infoContent.innerHTML = content;
                marker.setIcon(customIconHighlight);
                if (lastMarker && lastMarker !== marker) {
                    lastMarker.setIcon(customIconDefault);
                }
                lastMarker = marker;
            });
        });
    });
}
// Handle display mode selection
let currentDisplayMode = 'high';
let currentMode = 'price';
let showMarkers = false;
const markerModeSelector = document.getElementById('display-mode-selector');
const modeSelector = document.getElementById('mode-selector');
const toggleMarkersCheckbox = document.getElementById('toggle-markers');

toggleMarkersCheckbox.addEventListener('change', function() {
    showMarkers = this.checked;
    console.log("Show markers:", showMarkers);
    // Clear existing markers
    map.eachLayer(layer => {
        if (layer instanceof L.Marker) {
            map.removeLayer(layer);
        }
    });
    // Redraw markers if enabled
    if (showMarkers) {
        placeMarkers(map, currentMode, currentDisplayMode);
    }
});

markerModeSelector.addEventListener('change', function() {
    currentDisplayMode = this.value;
    console.log("Marker display mode changed to:", currentDisplayMode);
    if (!showMarkers) return;
    // Clear existing markers
    map.eachLayer(layer => {
        if (layer instanceof L.Marker) {
            map.removeLayer(layer);
        }
    });
    // Redraw markers with new display mode
    placeMarkers(map, currentMode, currentDisplayMode);
});


modeSelector.addEventListener('change', function() {
    currentMode = this.value;
    console.log("Display mode changed to:", currentMode);
    // Clear existing markers and GeoJSON layers
    map.eachLayer(layer => {
        if (layer instanceof L.Marker || layer instanceof L.GeoJSON) {
            map.removeLayer(layer);
        }
    });
    // Redraw with new display mode
    drawSections(currentMode);
    updateLegend(currentMode);
    
    if (showMarkers)
        placeMarkers(map, currentMode, currentDisplayMode);
});

// Initial draw
drawSections(currentMode);
updateLegend(currentMode);
