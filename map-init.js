// Initialize map
const map = L.map('map').setView([44.84151, -0.56997], 12);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

// Read csv data



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