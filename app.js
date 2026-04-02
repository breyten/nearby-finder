class NearbyFinder {
    constructor() {
        // Initialize any properties here if needed
    }

    geolocation() {
        // Method to get the user's current location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(position => {
                console.log(`Latitude: ${position.coords.latitude}, Longitude: ${position.coords.longitude}`);
            }, error => {
                console.error('Error getting location:', error);
            });
        } else {
            console.error('Geolocation is not supported by this browser.');
        }
    }

    async queryOverpassAPI(bounds) {
        // Method to query the Overpass API with specific bounds
        const query = `[out:json];(node['amenity'](${bounds}););out;`;
        const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
        const data = await response.json();
        return data;
    }

    parseResults(data) {
        // Method to parse the API results and extract relevant information
        return data.elements.map(element => {
            return {
                id: element.id,
                type: element.type,
                lat: element.lat,
                lon: element.lon,
                properties: element.tags,
            };
        });
    }

    filterResults(results, criteria) {
        // Method to filter results based on provided criteria
        return results.filter(result => {
            return result.properties.name && result.properties.name.includes(criteria);
        });
    }

    sortResults(results, key) {
        // Method to sort results based on a specified key
        return results.sort((a, b) => a.properties[key] > b.properties[key] ? 1 : -1);
    }
}

// Example usage
const finder = new NearbyFinder();
finder.geolocation();