class NearbyFinder {
    constructor() {
        this.currentLocation = null;
        this.currentCategory = 'coffee';
        this.results = [];
        this.filteredResults = [];
        
        this.initializeElements();
        this.attachEventListeners();
        this.getGeolocation();
    }

    initializeElements() {
        this.coffeeBtn = document.getElementById('coffeeBtn');
        this.beerBtn = document.getElementById('beerBtn');
        this.restaurantBtn = document.getElementById('restaurantBtn');
        this.radiusSlider = document.getElementById('radiusSlider');
        this.radiusValue = document.getElementById('radiusValue');
        this.sortSelect = document.getElementById('sortSelect');
        this.openNowToggle = document.getElementById('openNowToggle');
        this.resultsList = document.getElementById('resultsList');
        this.resultsTitle = document.getElementById('resultsTitle');
        this.resultCount = document.getElementById('resultCount');
        this.statusMsg = document.getElementById('statusMsg');
        this.statusText = document.getElementById('statusText');
        this.errorMsg = document.getElementById('errorMsg');
        this.errorText = document.getElementById('errorText');
    }

    attachEventListeners() {
        this.coffeeBtn.addEventListener('click', () => this.setCategory('coffee'));
        this.beerBtn.addEventListener('click', () => this.setCategory('beer'));
        this.restaurantBtn.addEventListener('click', () => this.setCategory('restaurant'));
        
        this.radiusSlider.addEventListener('input', (e) => {
            this.radiusValue.textContent = e.target.value;
            this.search();
        });
        
        this.sortSelect.addEventListener('change', () => this.applyFiltersAndSort());
        this.openNowToggle.addEventListener('change', () => this.applyFiltersAndSort());
    }

    setCategory(category) {
        this.currentCategory = category;
        
        [this.coffeeBtn, this.beerBtn, this.restaurantBtn].forEach(btn => {
            btn.classList.remove('bg-amber-600', 'hover:bg-amber-700');
            btn.classList.add('bg-slate-600', 'hover:bg-slate-500');
        });
        
        const activeBtn = category === 'coffee' ? this.coffeeBtn : 
                         category === 'beer' ? this.beerBtn : 
                         this.restaurantBtn;
        activeBtn.classList.remove('bg-slate-600', 'hover:bg-slate-500');
        activeBtn.classList.add('bg-amber-600', 'hover:bg-amber-700');
        
        this.search();
    }

    getGeolocation() {
        if (!navigator.geolocation) {
            this.showError('Geolocation is not supported by your browser');
            return;
        }

        this.showStatus('Getting your location...');
        navigator.geolocation.getCurrentPosition(
            (position) => {
                this.currentLocation = {
                    lat: position.coords.latitude,
                    lon: position.coords.longitude
                };
                this.hideStatus();
                this.search();
            },
            (error) => {
                this.showError('Unable to access your location. Please enable location services.');
                console.error('Geolocation error:', error);
            }
        );
    }

    async search() {
        if (!this.currentLocation) {
            this.showError('Location not available');
            return;
        }

        this.showStatus(`Searching for ${this.currentCategory}...`);
        
        try {
            const query = this.buildOverpassQuery();
            const data = await this.queryOverpass(query);
            this.results = this.parseResults(data);
            this.applyFiltersAndSort();
            this.hideStatus();
        } catch (error) {
            this.showError(`Search failed: ${error.message}`);
            console.error('Search error:', error);
        }
    }

    buildOverpassQuery() {
        const { lat, lon } = this.currentLocation;
        const radius = parseFloat(this.radiusSlider.value) * 1000;

        let amenity = '';
        if (this.currentCategory === 'coffee') {
            amenity = 'cafe';
        } else if (this.currentCategory === 'beer') {
            amenity = 'bar,pub';
        } else if (this.currentCategory === 'restaurant') {
            amenity = 'restaurant,fast_food';
        }

        return `
            [bbox:${lat - radius/111000},${lon - radius/111000},${lat + radius/111000},${lon + radius/111000}];
            (
                node["amenity"~"${amenity}"](${lat - radius/111000},${lon - radius/111000},${lat + radius/111000},${lon + radius/111000});
                way["amenity"~"${amenity}"](${lat - radius/111000},${lon - radius/111000},${lat + radius/111000},${lon + radius/111000});
                relation["amenity"~"${amenity}"](${lat - radius/111000},${lon - radius/111000},${lat + radius/111000},${lon + radius/111000});
            );
            out geom;
        `;
    }

    async queryOverpass(query) {
        const url = 'https://overpass-api.de/api/interpreter';
        const response = await fetch(url, {
            method: 'POST',
            body: query
        });

        if (!response.ok) {
            throw new Error(`Overpass API error: ${response.status}`);
        }

        return await response.json();
    }

    parseResults(data) {
        const results = [];
        const { lat: userLat, lon: userLon } = this.currentLocation;

        data.elements.forEach(element => {
            if (!element.tags || !element.tags.name) return;

            let elementLat, elementLon;
            if (element.lat !== undefined && element.lon !== undefined) {
                elementLat = element.lat;
                elementLon = element.lon;
            } else if (element.center) {
                elementLat = element.center.lat;
                elementLon = element.center.lon;
            } else {
                return;
            }

            const distance = this.calculateDistance(userLat, userLon, elementLat, elementLon);
            const relevance = this.calculateRelevance(element.tags);
            const isOpen = this.checkIfOpen(element.tags['opening_hours']);
            const openingHours = this.parseOpeningHours(element.tags['opening_hours']);

            results.push({
                id: element.id,
                name: element.tags.name,
                type: element.tags.amenity,
                address: element.tags['addr:street'] ? 
                    `${element.tags['addr:street']} ${element.tags['addr:housenumber'] || ''} ${element.tags['addr:postcode'] || ''} ${element.tags['addr:city'] || ''}`.trim() : 
                    'Address not available',
                phone: element.tags.phone || null,
                website: element.tags.website || element.tags.url || null,
                distance: distance,
                relevance: relevance,
                isOpen: isOpen,
                openingHours: openingHours,
                lat: elementLat,
                lon: elementLon
            });
        });

        return results;
    }

    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return (R * c).toFixed(2);
    }

    calculateRelevance(tags) {
        let score = 50;
        if (tags.website || tags.url) score += 20;
        if (tags.phone) score += 15;
        if (tags['opening_hours']) score += 10;
        if (tags.wheelchair) score += 5;
        return score;
    }

    checkIfOpen(openingHours) {
        if (!openingHours) return null;

        try {
            const now = new Date();
            const dayOfWeek = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'][now.getDay()];
            const currentTime = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');

            if (openingHours.includes('24/7')) return true;
            
            const parts = openingHours.split(';');
            for (const part of parts) {
                if (part.includes(dayOfWeek)) {
                    const timeRange = part.split(dayOfWeek)[1]?.trim();
                    if (timeRange && timeRange.includes('-')) {
                        const [start, end] = timeRange.split('-').map(t => t.trim().replace(/\D/g, ''));
                        if (currentTime >= start && currentTime < end) {
                            return true;
                        }
                    }
                }
            }
        } catch (e) {}

        return null;
    }

    parseOpeningHours(openingHours) {
        if (!openingHours) return 'Hours not available';
        if (openingHours.length > 100) {
            return openingHours.substring(0, 100) + '...';
        }
        return openingHours;
    }

    applyFiltersAndSort() {
        let filtered = [...this.results];

        if (this.openNowToggle.checked) {
            filtered = filtered.filter(result => result.isOpen === true);
        }

        const sortBy = this.sortSelect.value;
        if (sortBy === 'distance') {
            filtered.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
        } else if (sortBy === 'relevance') {
            filtered.sort((a, b) => b.relevance - a.relevance);
        }

        this.filteredResults = filtered;
        this.renderResults();
    }

    renderResults() {
        const categoryName = this.currentCategory.charAt(0).toUpperCase() + this.currentCategory.slice(1);
        this.resultsTitle.textContent = categoryName;
        this.resultCount.textContent = `(${this.filteredResults.length})`;

        if (this.filteredResults.length === 0) {
            this.resultsList.innerHTML = `
                <div class="col-span-full p-8 text-center text-gray-400">
                    <i class="fas fa-search text-4xl mb-3 opacity-50"></i>
                    <p>No results found. Try adjusting your search radius or filters.</p>
                </div>
            `;
            return;
        }

        this.resultsList.innerHTML = this.filteredResults.map(result => this.createResultCard(result)).join('');
    }

    createResultCard(result) {
        const statusBadge = result.isOpen === true ? 
            '<span class="inline-block px-2 py-1 bg-green-600 text-white text-xs rounded font-semibold">Open Now</span>' :
            result.isOpen === false ? 
            '<span class="inline-block px-2 py-1 bg-red-600 text-white text-xs rounded font-semibold">Closed</span>' :
            '';

        const distanceBadge = `<span class="inline-block px-2 py-1 bg-blue-600 text-white text-xs rounded">${result.distance} km</span>`;

        const contactInfo = `
            ${result.phone ? `<p class="text-sm text-gray-400"><i class="fas fa-phone mr-2"></i>${result.phone}</p>` : ''}
            ${result.website ? `<p class="text-sm"><a href="${result.website}" target="_blank" rel="noopener" class="text-blue-400 hover:text-blue-300"><i class="fas fa-globe mr-2"></i>Website</a></p>` : ''}
        `;

        return `
            <div class="bg-slate-700 rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow border border-slate-600">
                <div class="mb-3 flex justify-between items-start gap-2">
                    <h3 class="text-lg font-bold text-white flex-1">${this.escapeHtml(result.name)}</h3>
                </div>
                
                <div class="mb-3 flex flex-wrap gap-2">
                    ${statusBadge}
                    ${distanceBadge}
                </div>

                <p class="text-sm text-gray-300 mb-2"><i class="fas fa-map-marker-alt mr-2 text-amber-500"></i>${this.escapeHtml(result.address)}</p>
                
                ${result.openingHours ? `<p class="text-xs text-gray-400 mb-2"><i class="fas fa-clock mr-2"></i>${this.escapeHtml(result.openingHours)}</p>` : ''}

                <div class="text-sm">
                    ${contactInfo}
                </div>

                <div class="mt-3 pt-3 border-t border-slate-600">
                    <a href="https://www.google.com/maps/dir/?api=1&destination=${result.lat},${result.lon}" target="_blank" rel="noopener" class="text-blue-400 hover:text-blue-300 text-sm">
                        <i class="fas fa-directions mr-1"></i>Get Directions
                    </a>
                </div>
            </div>
        `;
    }

    escapeHtml(text) {
        if (!text) return '';
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    showStatus(message) {
        this.statusText.textContent = message;
        this.statusMsg.classList.remove('hidden');
        this.errorMsg.classList.add('hidden');
    }

    hideStatus() {
        this.statusMsg.classList.add('hidden');
    }

    showError(message) {
        this.errorText.textContent = message;
        this.errorMsg.classList.remove('hidden');
        this.statusMsg.classList.add('hidden');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new NearbyFinder();
});
