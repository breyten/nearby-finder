// Location Finder - JavaScript Application
class LocationFinder {
    constructor() {
        this.currentLocation = null;
        this.currentCategory = 'breakfast';
        this.allResults = [];
        this.currentSortMethod = 'relevance';
        this.currentPriceFilter = '';
        
        this.initializeEventListeners();
        this.showUserLocation();
    }

    initializeEventListeners() {
        // Geolocation button
        document.getElementById('geoBtn').addEventListener('click', () => this.getUserLocation());

        // Category buttons
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.selectCategory(e.target));
        });

        // Sort select
        document.getElementById('sortSelect').addEventListener('change', (e) => {
            this.currentSortMethod = e.target.value;
            this.displayResults(this.allResults);
        });

        // Price filter select
        document.getElementById('priceFilter').addEventListener('change', (e) => {
            this.currentPriceFilter = e.target.value;
            this.displayResults(this.allResults);
        });

        // Auto-search when category changes
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (this.currentLocation) {
                    this.searchLocations();
                }
            });
        });

        // Auto-search when radius changes
        document.getElementById('radiusInput').addEventListener('change', () => {
            if (this.currentLocation) {
                this.searchLocations();
            }
        });
    }

    selectCategory(button) {
        document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        this.currentCategory = button.getAttribute('data-category');
    }

    getUserLocation() {
        const geoBtn = document.getElementById('geoBtn');
        geoBtn.disabled = true;
        geoBtn.textContent = '📍 Getting location...';

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.currentLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    this.displayUserLocation();
                    this.searchLocations();
                    geoBtn.disabled = false;
                    geoBtn.textContent = '📍 Get My Location';
                },
                (error) => {
                    this.showError('Unable to get your location. Please enable location services.');
                    geoBtn.disabled = false;
                    geoBtn.textContent = '📍 Get My Location';
                    console.error('Geolocation error:', error);
                }
            );
        } else {
            this.showError('Geolocation is not supported by your browser.');
            geoBtn.disabled = false;
            geoBtn.textContent = '📍 Get My Location';
        }
    }

    showUserLocation() {
        // Try to get location on page load
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.currentLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    this.displayUserLocation();
                },
                (error) => {
                    console.log('Initial geolocation request skipped');
                }
            );
        }
    }

    displayUserLocation() {
        if (this.currentLocation) {
            const coordsSpan = document.getElementById('locationCoords');
            coordsSpan.textContent = `${this.currentLocation.lat.toFixed(4)}, ${this.currentLocation.lng.toFixed(4)}`;
            document.getElementById('locationDisplay').style.display = 'block';
        }
    }

    searchLocations() {
        if (!this.currentLocation) {
            this.showError('Please enable location services to search.');
            return;
        }

        const radius = parseInt(document.getElementById('radiusInput').value) || 5000;
        
        this.showLoading(true);
        this.clearError();

        const params = new URLSearchParams({
            action: 'search',
            lat: this.currentLocation.lat,
            lng: this.currentLocation.lng,
            category: this.currentCategory,
            radius: radius
        });

        // Add price filter if selected
        if (this.currentPriceFilter) {
            params.append('price', this.currentPriceFilter);
        }

        fetch(`api.php?${params}`)
            .then(response => response.json())
            .then(data => {
                this.showLoading(false);
                
                if (data.error) {
                    this.showError(`Error: ${data.error}`);
                    this.allResults = [];
                } else if (data.results && data.results.length > 0) {
                    // Calculate distance for each result
                    this.allResults = data.results.map(result => ({
                        ...result,
                        distance: this.calculateDistance(
                            this.currentLocation.lat,
                            this.currentLocation.lng,
                            result.lat,
                            result.lng
                        )
                    }));
                    this.displayResults(this.allResults);
                } else {
                    this.allResults = [];
                    this.displayNoResults();
                }
            })
            .catch(error => {
                this.showLoading(false);
                this.showError(`Error fetching results: ${error.message}`);
                console.error('Fetch error:', error);
            });
    }

    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // Earth's radius in km
        const dLat = this.toRad(lat2 - lat1);
        const dLng = this.toRad(lng2 - lng1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance in km
    }

    toRad(deg) {
        return deg * (Math.PI / 180);
    }

    displayResults(results) {
        if (results.length === 0) {
            this.displayNoResults();
            return;
        }

        // Apply price filter if set
        let filteredResults = results;
        if (this.currentPriceFilter) {
            const allowedPrices = this.currentPriceFilter.split(',').map(p => parseInt(p));
            filteredResults = results.filter(result => 
                result.price_level && allowedPrices.includes(result.price_level)
            );
        }

        // Sort results based on current sort method
        const sortedResults = this.sortResults(filteredResults);

        const container = document.getElementById('resultsContainer');
        container.innerHTML = '';

        const resultsList = document.createElement('div');
        resultsList.className = 'results-list';

        if (sortedResults.length === 0) {
            this.displayNoResults();
            return;
        }

        sortedResults.forEach((result, index) => {
            const card = this.createResultCard(result);
            resultsList.appendChild(card);
        });

        container.appendChild(resultsList);
    }

    sortResults(results) {
        const sorted = [...results];

        if (this.currentSortMethod === 'distance') {
            sorted.sort((a, b) => a.distance - b.distance);
        } else {
            // Sort by relevance (rating)
            sorted.sort((a, b) => {
                if (b.rating !== a.rating) {
                    return b.rating - a.rating;
                }
                // If rating is the same, sort by distance
                return a.distance - b.distance;
            });
        }

        return sorted;
    }

    getPriceLabel(priceLevel) {
        const priceMap = {
            1: '$',
            2: '$$',
            3: '$$$',
            4: '$$$$'
        };
        return priceMap[priceLevel] || 'N/A';
    }

    createResultCard(result) {
        const card = document.createElement('div');
        card.className = 'result-card';

        // Image section
        const imageDiv = document.createElement('div');
        imageDiv.className = 'result-image placeholder';
        
        if (result.photoUrl) {
            const img = document.createElement('img');
            img.src = result.photoUrl;
            img.alt = result.name;
            imageDiv.className = 'result-image';
            imageDiv.innerHTML = '';
            imageDiv.appendChild(img);
        } else {
            imageDiv.textContent = '🏪';
        }

        // Content section
        const contentDiv = document.createElement('div');
        contentDiv.className = 'result-content';

        // Header
        const headerDiv = document.createElement('div');
        headerDiv.className = 'result-header';

        const nameDiv = document.createElement('div');
        nameDiv.className = 'result-name';
        nameDiv.textContent = result.name;

        const descriptionDiv = document.createElement('div');
        descriptionDiv.className = 'result-description';
        descriptionDiv.textContent = result.description;

        headerDiv.appendChild(nameDiv);
        headerDiv.appendChild(descriptionDiv);

        // Meta section
        const metaDiv = document.createElement('div');
        metaDiv.className = 'result-meta';

        // Rating
        if (result.rating > 0) {
            const ratingDiv = document.createElement('div');
            ratingDiv.className = 'rating';

            const starsSpan = document.createElement('span');
            starsSpan.className = 'stars';
            starsSpan.textContent = '★'.repeat(Math.round(result.rating)) + 
                                    '☆'.repeat(5 - Math.round(result.rating));

            const ratingValue = document.createElement('span');
            ratingValue.className = 'rating-value';
            ratingValue.textContent = result.rating.toFixed(1);

            ratingDiv.appendChild(starsSpan);
            ratingDiv.appendChild(ratingValue);
            metaDiv.appendChild(ratingDiv);
        }

        // Price level
        if (result.price_level) {
            const priceDiv = document.createElement('div');
            priceDiv.className = 'price-level';
            priceDiv.title = `Price Level: ${this.getPriceLabel(result.price_level)}`;
            priceDiv.textContent = `💰 ${this.getPriceLabel(result.price_level)}`;
            metaDiv.appendChild(priceDiv);
        }

        // Distance
        const distanceDiv = document.createElement('div');
        distanceDiv.className = 'distance';
        distanceDiv.textContent = `📍 ${result.distance.toFixed(1)} km away`;
        metaDiv.appendChild(distanceDiv);

        // Status (if available)
        if (result.isOpen !== null) {
            const statusDiv = document.createElement('div');
            statusDiv.className = result.isOpen ? 'status-open' : 'status-closed';
            statusDiv.textContent = result.isOpen ? '🟢 Open' : '🔴 Closed';
            metaDiv.appendChild(statusDiv);
        }

        contentDiv.appendChild(headerDiv);
        contentDiv.appendChild(metaDiv);

        card.appendChild(imageDiv);
        card.appendChild(contentDiv);

        return card;
    }

    displayNoResults() {
        const container = document.getElementById('resultsContainer');
        container.innerHTML = `<p class="no-results">No results found for ${this.currentCategory} places. Try adjusting the search radius or price filter.</p>`;
    }

    showLoading(show) {
        document.getElementById('loadingSpinner').style.display = show ? 'flex' : 'none';
    }

    showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }

    clearError() {
        document.getElementById('errorMessage').style.display = 'none';
    }
}

// Initialize the application when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new LocationFinder();
});
