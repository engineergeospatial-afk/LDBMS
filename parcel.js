// Initialize the map - centered on the new parcel location
const map = L.map('map').setView([-1.648, 36.877], 18);

// Base layers
const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
});

const satelliteLayer = L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
    maxZoom: 20,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    attribution: '© Google Satellite'
});

// Add default layer
osmLayer.addTo(map);

// Layer control
const baseLayers = {
    "OpenStreetMap": osmLayer,
    "Satellite": satelliteLayer
};

L.control.layers(baseLayers).addTo(map);

// Initialize draw control
let drawControl;
let drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

// Sample parcel data
let parcels = [
    {
        id: 1,
        name: "Parcel 1",
        coordinates: [
            [-1.647753, 36.87670],
            [-1.647763, 36.87702],
            [-1.647801, 36.87706],
            [-1.648656, 36.87708],
            [-1.648663, 36.87671]
        ],
        owner: "To be assigned",
        area: 0.403,
        county: "Kajiado",
        plotNo: "109600",
        perimeter: 278.11,
        landUse: "",
        soilType: "",
        notes: ""
    }
];

// Style for parcels
const parcelStyle = {
    color: '#3388ff',
    weight: 2,
    opacity: 1,
    fillOpacity: 0.2
};

// Create parcel layers
const parcelLayers = L.layerGroup().addTo(map);

// Function to create popup content
function createPopupContent(parcel) {
    return `
        <div class="info-tooltip">
            <h4>${parcel.name}</h4>
            <p><strong>Plot No:</strong> ${parcel.plotNo}</p>
            <p><strong>Owner:</strong> ${parcel.owner}</p>
            <p><strong>County:</strong> ${parcel.county}</p>
            <p><strong>Area:</strong> ${parcel.area} ha</p>
            <p><strong>Perimeter:</strong> ${parcel.perimeter} m</p>
            <p><strong>Land Use:</strong> ${parcel.landUse || 'Not specified'}</p>
            <p><strong>Soil Type:</strong> ${parcel.soilType || 'Not specified'}</p>
            <p><strong>Notes:</strong> ${parcel.notes || 'No notes'}</p>
        </div>
    `;
}

// Function to load parcels
function loadParcels() {
    parcelLayers.clearLayers();
    
    parcels.forEach(parcel => {
        const polygon = L.polygon(parcel.coordinates, {
            ...parcelStyle,
            parcelId: parcel.id
        }).addTo(parcelLayers);

        // Bind popup
        polygon.bindPopup(createPopupContent(parcel));

        // Add hover events
        polygon.on('mouseover', function(e) {
            this.setStyle({fillOpacity: 0.4});
            showParcelInfo(parcel);
        });

        polygon.on('mouseout', function(e) {
            this.setStyle({fillOpacity: 0.2});
        });

        polygon.on('click', function(e) {
            showEditForm(parcel);
        });
    });
}

// Function to show parcel info in sidebar
function showParcelInfo(parcel) {
    const infoDiv = document.getElementById('parcelInfo');
    const contentDiv = document.getElementById('infoContent');
    
    contentDiv.innerHTML = `
        <p><strong>Parcel ID:</strong> ${parcel.id}</p>
        <p><strong>Name:</strong> ${parcel.name}</p>
        <p><strong>Plot No:</strong> ${parcel.plotNo}</p>
        <p><strong>Owner:</strong> ${parcel.owner}</p>
        <p><strong>County:</strong> ${parcel.county}</p>
        <p><strong>Area:</strong> ${parcel.area} hectares</p>
        <p><strong>Perimeter:</strong> ${parcel.perimeter} meters</p>
        <p><strong>Land Use:</strong> ${parcel.landUse || 'Not specified'}</p>
        <p><strong>Soil Type:</strong> ${parcel.soilType || 'Not specified'}</p>
        <p><strong>Notes:</strong> ${parcel.notes || 'No notes'}</p>
    `;
    
    infoDiv.style.display = 'block';
}

// Function to show edit form
function showEditForm(parcel) {
    document.getElementById('parcelInfo').style.display = 'none';
    document.getElementById('editForm').style.display = 'block';
    
    // Fill form with parcel data
    document.getElementById('parcelId').value = parcel.id;
    document.getElementById('parcelName').value = parcel.name;
    document.getElementById('ownerName').value = parcel.owner;
    document.getElementById('area').value = parcel.area;
    document.getElementById('county').value = parcel.county;
    document.getElementById('plotNo').value = parcel.plotNo;
    document.getElementById('perimeter').value = parcel.perimeter;
    document.getElementById('landUse').value = parcel.landUse;
    document.getElementById('soilType').value = parcel.soilType;
    document.getElementById('notes').value = parcel.notes;
}

// Function to start drawing
function startDrawing(type) {
    // Hide other UI elements
    document.getElementById('parcelInfo').style.display = 'none';
    document.getElementById('editForm').style.display = 'none';
    document.getElementById('coordInputControls').style.display = 'none';
    document.getElementById('drawControls').style.display = 'block';
    document.getElementById('cancelDrawBtn').style.display = 'inline-block';
    
    // Update button states
    document.getElementById('drawPolygonBtn').classList.add('drawing-active');
    
    // Initialize draw control
    drawControl = new L.Control.Draw({
        draw: {
            polygon: {
                allowIntersection: false,
                drawError: {
                    color: '#e1e100',
                    message: '<strong>Error:</strong> Polygon edges cannot cross!'
                },
                shapeOptions: {
                    color: '#970098'
                },
                showArea: true
            },
            polyline: false,
            rectangle: false,
            circle: false,
            circlemarker: false,
            marker: false
        },
        edit: false
    });
    
    map.addControl(drawControl);
    
    // Set up draw events
    map.on(L.Draw.Event.CREATED, function (e) {
        const layer = e.layer;
        const coords = getCoordinatesFromLayer(layer);
        
        // Show coordinates
        updateCoordinatesDisplay(coords);
        
        // Add to map temporarily
        drawnItems.clearLayers();
        drawnItems.addLayer(layer);
        
        // Show save button
        document.getElementById('saveDrawingBtn').style.display = 'block';
        
        // Calculate area and perimeter
        const area = L.GeometryUtil.geodesicArea(layer.getLatLngs()[0]);
        const areaHectares = area / 10000; // Convert to hectares
        const perimeter = calculatePerimeter(layer.getLatLngs()[0]);
        
        // Store calculated values
        document.getElementById('saveDrawingBtn').dataset.coords = JSON.stringify(coords);
        document.getElementById('saveDrawingBtn').dataset.area = areaHectares;
        document.getElementById('saveDrawingBtn').dataset.perimeter = perimeter;
    });
    
    map.on(L.Draw.Event.DRAWVERTEX, function (e) {
        const layers = e.layers;
        layers.eachLayer(function(layer) {
            if (layer instanceof L.Polygon) {
                const coords = getCoordinatesFromLayer(layer);
                updateCoordinatesDisplay(coords);
            }
        });
    });
}

// Function to start coordinate input
function startCoordinateInput() {
    // Hide other UI elements
    document.getElementById('parcelInfo').style.display = 'none';
    document.getElementById('editForm').style.display = 'none';
    document.getElementById('drawControls').style.display = 'none';
    document.getElementById('coordInputControls').style.display = 'block';
    document.getElementById('cancelDrawBtn').style.display = 'inline-block';
    document.getElementById('coordPreview').style.display = 'none';
    
    // Update button states
    document.getElementById('inputCoordinatesBtn').classList.add('drawing-active');
    
    // Clear any existing preview
    drawnItems.clearLayers();
}

// Function to get coordinates from layer
function getCoordinatesFromLayer(layer) {
    if (layer instanceof L.Polygon) {
        return layer.getLatLngs()[0].map(latlng => [latlng.lat, latlng.lng]);
    }
    return [];
}

// Function to update coordinates display
function updateCoordinatesDisplay(coords) {
    const display = document.getElementById('coordinatesDisplay');
    if (coords.length > 0) {
        display.innerHTML = coords.map(coord => 
            `${coord[0].toFixed(6)}, ${coord[1].toFixed(6)}`
        ).join('<br>');
    } else {
        display.innerHTML = 'No coordinates added yet...';
    }
}

// Function to calculate perimeter
function calculatePerimeter(latlngs) {
    let perimeter = 0;
    for (let i = 0; i < latlngs.length; i++) {
        const current = latlngs[i];
        const next = latlngs[(i + 1) % latlngs.length];
        perimeter += current.distanceTo(next);
    }
    return perimeter;
}

// Function to get coordinates from input fields
function getCoordinatesFromInputs() {
    const coordGroups = document.querySelectorAll('.coord-input-group');
    const coordinates = [];
    
    coordGroups.forEach(group => {
        const latInput = group.querySelector('.coord-lat');
        const lngInput = group.querySelector('.coord-lng');
        
        if (latInput.value && lngInput.value) {
            coordinates.push([
                parseFloat(latInput.value),
                parseFloat(lngInput.value)
            ]);
        }
    });
    
    return coordinates;
}

// Function to preview coordinates on map
function previewCoordinates() {
    const coordinates = getCoordinatesFromInputs();
    
    if (coordinates.length < 3) {
        alert('Please enter at least 3 coordinates to form a polygon.');
        return;
    }
    
    // Close the polygon if not already closed
    if (coordinates.length > 0 && 
        (coordinates[0][0] !== coordinates[coordinates.length-1][0] || 
         coordinates[0][1] !== coordinates[coordinates.length-1][1])) {
        coordinates.push([coordinates[0][0], coordinates[0][1]]);
    }
    
    // Create polygon
    const polygon = L.polygon(coordinates, {
        color: '#970098',
        weight: 2,
        fillOpacity: 0.3
    });
    
    // Clear previous preview and add new one
    drawnItems.clearLayers();
    drawnItems.addLayer(polygon);
    
    // Calculate area and perimeter
    const latLngs = coordinates.map(coord => L.latLng(coord[0], coord[1]));
    const area = L.GeometryUtil.geodesicArea(latLngs);
    const areaHectares = area / 10000;
    const perimeter = calculatePerimeter(latLngs);
    
    // Show preview info
    document.getElementById('previewInfo').innerHTML = `
        <p><strong>Corners:</strong> ${coordinates.length - 1}</p>
        <p><strong>Area:</strong> ${areaHectares.toFixed(4)} hectares</p>
        <p><strong>Perimeter:</strong> ${perimeter.toFixed(2)} meters</p>
        <p><strong>Coordinates:</strong><br>${coordinates.map(coord => 
            `${coord[0].toFixed(6)}, ${coord[1].toFixed(6)}`
        ).join('<br>')}</p>
    `;
    
    document.getElementById('coordPreview').style.display = 'block';
    
    // Store calculated values
    document.getElementById('saveCoordsBtn').dataset.coords = JSON.stringify(coordinates);
    document.getElementById('saveCoordsBtn').dataset.area = areaHectares;
    document.getElementById('saveCoordsBtn').dataset.perimeter = perimeter;
    
    // Fit map to show the polygon
    map.fitBounds(polygon.getBounds());
}

// Function to add new coordinate input field
function addCoordinateInput() {
    const coordInputs = document.getElementById('coordInputs');
    const coordCount = coordInputs.children.length + 1;
    
    const newCoordGroup = document.createElement('div');
    newCoordGroup.className = 'coord-input-group';
    newCoordGroup.innerHTML = `
        <span class="coord-number">${coordCount}</span>
        <input type="number" step="any" placeholder="Latitude" class="coord-lat">
        <input type="number" step="any" placeholder="Longitude" class="coord-lng">
        <button type="button" class="remove-coord-btn" style="padding: 5px 8px; background: #e74c3c;">×</button>
    `;
    
    coordInputs.appendChild(newCoordGroup);
    
    // Add event listener to remove button
    newCoordGroup.querySelector('.remove-coord-btn').addEventListener('click', function() {
        coordInputs.removeChild(newCoordGroup);
        updateCoordinateNumbers();
    });
}

// Function to update coordinate numbers
function updateCoordinateNumbers() {
    const coordGroups = document.querySelectorAll('.coord-input-group');
    coordGroups.forEach((group, index) => {
        group.querySelector('.coord-number').textContent = index + 1;
    });
}

// Function to cancel drawing/input
function cancelDrawing() {
    if (drawControl) {
        map.removeControl(drawControl);
    }
    drawnItems.clearLayers();
    document.getElementById('drawControls').style.display = 'none';
    document.getElementById('coordInputControls').style.display = 'none';
    document.getElementById('cancelDrawBtn').style.display = 'none';
    document.getElementById('drawPolygonBtn').classList.remove('drawing-active');
    document.getElementById('inputCoordinatesBtn').classList.remove('drawing-active');
}

// Function to save new parcel from drawing
function saveNewParcel() {
    const coords = JSON.parse(document.getElementById('saveDrawingBtn').dataset.coords);
    const area = parseFloat(document.getElementById('saveDrawingBtn').dataset.area);
    const perimeter = parseFloat(document.getElementById('saveDrawingBtn').dataset.perimeter);
    
    createNewParcel(coords, area, perimeter);
}

// Function to save new parcel from coordinates
function saveNewParcelFromCoords() {
    const coords = JSON.parse(document.getElementById('saveCoordsBtn').dataset.coords);
    const area = parseFloat(document.getElementById('saveCoordsBtn').dataset.area);
    const perimeter = parseFloat(document.getElementById('saveCoordsBtn').dataset.perimeter);
    
    createNewParcel(coords, area, perimeter);
}

// Function to create new parcel
function createNewParcel(coords, area, perimeter) {
    const newParcel = {
        id: parcels.length > 0 ? Math.max(...parcels.map(p => p.id)) + 1 : 1,
        name: `Parcel ${parcels.length + 1}`,
        coordinates: coords,
        owner: "To be assigned",
        area: area,
        county: "",
        plotNo: "",
        perimeter: perimeter,
        landUse: "",
        soilType: "",
        notes: ""
    };
    
    parcels.push(newParcel);
    loadParcels();
    cancelDrawing();
    
    // Show the new parcel in edit form
    showEditForm(newParcel);
    
    alert('New parcel added successfully! Please fill in the details.');
}

// Event listeners
document.getElementById('drawPolygonBtn').addEventListener('click', function() {
    startDrawing('polygon');
});

document.getElementById('inputCoordinatesBtn').addEventListener('click', startCoordinateInput);

document.getElementById('cancelDrawBtn').addEventListener('click', cancelDrawing);

document.getElementById('saveDrawingBtn').addEventListener('click', saveNewParcel);

document.getElementById('addCoordBtn').addEventListener('click', addCoordinateInput);

document.getElementById('previewCoordsBtn').addEventListener('click', previewCoordinates);

document.getElementById('saveCoordsBtn').addEventListener('click', saveNewParcelFromCoords);

// Add event listeners to existing remove buttons
document.querySelectorAll('.remove-coord-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        this.parentElement.remove();
        updateCoordinateNumbers();
    });
});

// Form submission handler
document.getElementById('parcelForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const parcelId = parseInt(document.getElementById('parcelId').value);
    const parcelIndex = parcels.findIndex(p => p.id === parcelId);
    
    if (parcelIndex !== -1) {
        parcels[parcelIndex] = {
            ...parcels[parcelIndex],
            name: document.getElementById('parcelName').value,
            owner: document.getElementById('ownerName').value,
            area: parseFloat(document.getElementById('area').value),
            county: document.getElementById('county').value,
            plotNo: document.getElementById('plotNo').value,
            perimeter: parseFloat(document.getElementById('perimeter').value),
            landUse: document.getElementById('landUse').value,
            soilType: document.getElementById('soilType').value,
            notes: document.getElementById('notes').value
        };
        
        console.log('Updated parcel:', parcels[parcelIndex]);
        
        loadParcels();
        document.getElementById('editForm').style.display = 'none';
        alert('Parcel updated successfully!');
    }
});

// Cancel edit
document.getElementById('cancelEdit').addEventListener('click', function() {
    document.getElementById('editForm').style.display = 'none';
});

// Add new parcel button
document.getElementById('addParcelBtn').addEventListener('click', function() {
    startCoordinateInput();
});

// Edit parcel button
document.getElementById('editParcelBtn').addEventListener('click', function() {
    const infoContent = document.getElementById('infoContent');
    const parcelId = parseInt(infoContent.querySelector('p:first-child').textContent.split(': ')[1]);
    const parcel = parcels.find(p => p.id === parcelId);
    
    if (parcel) {
        showEditForm(parcel);
    }
});

// Layer change handlers
document.querySelectorAll('input[name="baseLayer"]').forEach(radio => {
    radio.addEventListener('change', function() {
        if (this.value === 'osm') {
            map.removeLayer(satelliteLayer);
            osmLayer.addTo(map);
        } else if (this.value === 'satellite') {
            map.removeLayer(osmLayer);
            satelliteLayer.addTo(map);
        }
    });
});

// Initial load
loadParcels();