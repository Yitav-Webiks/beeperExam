"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const LEBANON_BOUNDS = {
    north: 34.69,
    south: 33.05,
    east: 36.62,
    west: 35.10
};
const API_URL = 'http://localhost:3000/api';
let map;
let markers = {};
let currentBeeperId;
document.addEventListener('DOMContentLoaded', () => {
    var _a, _b, _c;
    initMap();
    loadBeepers();
    (_a = document.getElementById('add-beeper-form')) === null || _a === void 0 ? void 0 : _a.addEventListener('submit', handleAddBeeper);
    (_b = document.getElementById('confirmUpdate')) === null || _b === void 0 ? void 0 : _b.addEventListener('click', updateBeeper);
    (_c = document.getElementById('cancelUpdate')) === null || _c === void 0 ? void 0 : _c.addEventListener('click', closeModal);
});
function initMap() {
    map = L.map('map', {
        maxBounds: [
            [LEBANON_BOUNDS.south, LEBANON_BOUNDS.west],
            [LEBANON_BOUNDS.north, LEBANON_BOUNDS.east]
        ]
    }).setView([33.8938, 35.5018], 8); // Centered on Lebanon
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    map.on('click', onMapClick);
}
function loadBeepers() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield fetch(`${API_URL}/beepers`);
            const beepers = yield response.json();
            const beeperList = document.getElementById('beepers');
            if (beeperList) {
                beeperList.innerHTML = '';
                beepers.forEach(beeper => {
                    const li = document.createElement('li');
                    const shortId = beeper.id.substring(0, 8) + '...'; // Show first 8 characters of ID
                    const location = beeper.lat && beeper.lon ? `(${beeper.lat.toFixed(4)}, ${beeper.lon.toFixed(4)})` : 'N/A';
                    li.innerHTML = `
                    <div class="beeper-info">
                        <span>Beeper ${shortId} - Status: ${beeper.status}</span>
                        <br>
                        <span>Location: ${location}</span>
                    </div>
                    <div class="beeper-actions">
                        <button onclick="showUpdateModal('${beeper.id}', '${beeper.status}')">Update</button>
                        <button onclick="deleteBeeper('${beeper.id}')">Delete</button>
                        <button onclick="activateBeeper('${beeper.id}')">Activate</button>
                    </div>
                    <span class="countdown" id="countdown-${beeper.id}"></span>
                `;
                    beeperList.appendChild(li);
                    addMarkerToMap(beeper);
                });
            }
        }
        catch (error) {
            console.error('Error loading beepers:', error);
        }
    });
}
function handleAddBeeper(event) {
    return __awaiter(this, void 0, void 0, function* () {
        event.preventDefault();
        const form = event.target;
        const statusSelect = form.elements.namedItem('status');
        const status = statusSelect.value;
        try {
            const response = yield fetch(`${API_URL}/beepers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            if (response.ok) {
                loadBeepers();
                form.reset();
            }
        }
        catch (error) {
            console.error('Error adding beeper:', error);
        }
    });
}
function showUpdateModal(id, currentStatus) {
    currentBeeperId = id;
    const modal = document.getElementById('updateModal');
    const select = document.getElementById('statusSelect');
    const statusOptions = ['produced', 'explosives_added', 'shipped', 'deployed', 'detonated'];
    select.innerHTML = statusOptions.map(status => `<option value="${status}" ${status === currentStatus ? 'selected' : ''}>${status}</option>`).join('');
    modal.style.display = 'block';
}
function updateBeeper() {
    return __awaiter(this, void 0, void 0, function* () {
        const select = document.getElementById('statusSelect');
        const newStatus = select.value;
        try {
            const response = yield fetch(`${API_URL}/beepers/${currentBeeperId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            if (response.ok) {
                loadBeepers();
                closeModal();
            }
            else {
                const errorData = yield response.json();
                alert(`Failed to update beeper: ${errorData.message}`);
            }
        }
        catch (error) {
            console.error('Error updating beeper:', error);
            alert('Failed to update beeper. Please try again.');
        }
    });
}
function closeModal() {
    const modal = document.getElementById('updateModal');
    modal.style.display = 'none';
}
function deleteBeeper(id) {
    return __awaiter(this, void 0, void 0, function* () {
        if (confirm('Are you sure you want to delete this beeper?')) {
            try {
                const response = yield fetch(`${API_URL}/beepers/${id}`, {
                    method: 'DELETE'
                });
                if (response.ok) {
                    loadBeepers();
                }
            }
            catch (error) {
                console.error('Error deleting beeper:', error);
            }
        }
    });
}
function activateBeeper(id) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield fetch(`${API_URL}/beepers/${id}/activate`, {
                method: 'POST'
            });
            if (response.ok) {
                const { countdown } = yield response.json();
                startCountdown(id, countdown);
                updateBeeperStatus(id, 'deployed');
            }
            else {
                const errorData = yield response.json();
                console.error('Error activating beeper:', errorData.message);
                alert(`Failed to activate beeper: ${errorData.message}`);
            }
        }
        catch (error) {
            console.error('Error activating beeper:', error);
            alert('Failed to activate beeper. Please try again.');
        }
    });
}
function startCountdown(id, countdown) {
    const countdownElement = document.getElementById(`countdown-${id}`);
    if (countdownElement) {
        countdownElement.textContent = ` Detonating in ${countdown} seconds`;
        const interval = setInterval(() => {
            countdown--;
            if (countdown >= 0) {
                countdownElement.textContent = ` Detonating in ${countdown} seconds`;
            }
            else {
                clearInterval(interval);
                countdownElement.textContent = ' Detonated!';
                updateBeeperStatus(id, 'detonated');
            }
        }, 1000);
    }
}
function updateBeeperStatus(id, newStatus) {
    const beeperElement = document.querySelector(`li:has(button[onclick*="'${id}'"])`);
    if (beeperElement) {
        const statusSpan = beeperElement.querySelector('.beeper-info');
        if (statusSpan) {
            const shortId = id.length > 5 ? id.substring(0, 5) + '...' : id;
            const marker = markers[id];
            let location = 'N/A';
            if (marker) {
                const lat = marker.getLatLng().lat.toFixed(4);
                const lng = marker.getLatLng().lng.toFixed(4);
                location = `(${lat}, ${lng})`;
            }
            statusSpan.innerHTML = `
                <span>Beeper ${shortId} - Status: ${newStatus}</span>
                <br>
                <span>Location: ${location}</span>
            `;
        }
        if (markers[id]) {
            const shortId = id.length > 5 ? id.substring(0, 5) + '...' : id;
            markers[id].setPopupContent(`Beeper ${shortId}`);
        }
    }
}
function addMarkerToMap(beeper) {
    if (beeper.lat && beeper.lon) {
        const shortId = beeper.id.length > 5 ? beeper.id.substring(0, 5) + '...' : beeper.id;
        if (markers[beeper.id]) {
            markers[beeper.id].setLatLng([beeper.lat, beeper.lon]);
            markers[beeper.id].setPopupContent(`Beeper ${shortId}`);
        }
        else {
            const marker = L.marker([beeper.lat, beeper.lon]).addTo(map);
            marker.bindPopup(`Beeper ${shortId}`);
            markers[beeper.id] = marker;
        }
    }
}
function onMapClick(e) {
    return __awaiter(this, void 0, void 0, function* () {
        const { lat, lng } = e.latlng;
        if (lat < LEBANON_BOUNDS.south || lat > LEBANON_BOUNDS.north ||
            lng < LEBANON_BOUNDS.west || lng > LEBANON_BOUNDS.east) {
            alert("Please select a location within Lebanon.");
            return;
        }
        try {
            const response = yield fetch(`${API_URL}/beepers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lat, lon: lng, status: 'produced' })
            });
            if (response.ok) {
                const newBeeper = yield response.json();
                addMarkerToMap(newBeeper);
                loadBeepers();
            }
            else {
                const errorData = yield response.json();
                alert(`Failed to create beeper: ${errorData.message}`);
            }
        }
        catch (error) {
            console.error('Error creating beeper:', error);
            alert('Failed to create beeper. Please try again.');
        }
    });
}
// Make functions available globally
window.showUpdateModal = showUpdateModal;
window.deleteBeeper = deleteBeeper;
window.activateBeeper = activateBeeper;
