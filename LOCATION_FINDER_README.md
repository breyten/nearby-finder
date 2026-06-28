# Location Finder - Find Nearby Places

A PHP web application that uses the Google Maps API to find nearby locations in different categories (breakfast, coffee, lunch, dinner, beer places).

## Features

- 📍 **Geolocation**: Automatically detect your current location
- 🔍 **Category Search**: Find places by category (breakfast, coffee, lunch, dinner, beer)
- 📏 **Adjustable Radius**: Search radius from 500m to 50km
- 📊 **Sorting Options**: Sort results by relevance (rating) or distance
- ⭐ **Ratings**: Display place ratings with star ratings
- 🖼️ **Photos**: Show place photos when available
- 🟢 **Open Status**: Display whether a place is currently open or closed
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile devices

## Requirements

- PHP 5.4+
- Google Maps API Key with Places API enabled
- Modern web browser with geolocation support

## Setup Instructions

### 1. Get a Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable the following APIs:
   - Places API
   - Maps JavaScript API
4. Create an API key (Web application credentials)
5. Restrict your API key to HTTP referrers matching your website

### 2. Configure the API Key

Open `api.php` and replace:
```php
$apiKey = 'YOUR_GOOGLE_PLACES_API_KEY';
```

With your actual Google Maps API key.

### 3. Upload Files

Upload all files to your web server:
- `api.php` - PHP backend
- `index.html` - HTML markup
- `style.css` - CSS styling
- `script.js` - JavaScript application logic

### 4. Access the Application

Navigate to your web server's URL where the files are hosted. The application will automatically request permission to access your location.

## File Structure

```
nearby-finder/
├── api.php           # PHP backend for API calls
├── index.html        # HTML markup
├── style.css         # CSS styling
├── script.js         # JavaScript application logic
└── README.md         # This file
```

## How to Use

1. **Enable Location Access**: Click "Get My Location" or allow the browser to access your location
2. **Select Category**: Choose from Breakfast, Coffee, Lunch, Dinner, or Beer places
3. **Adjust Search Radius**: Change the radius input to search a wider or narrower area
4. **Sort Results**: Toggle between sorting by Relevance (rating) or Distance
5. **View Details**: Each result shows:
   - Place name
   - Address/vicinity
   - Star rating
   - Distance from your location
   - Current open/closed status
   - Photo (if available)

## Category Mapping

- **Breakfast**: breakfast_restaurant
- **Coffee**: cafe
- **Lunch**: restaurant
- **Dinner**: restaurant
- **Beer**: bar

## API Limits

- Free tier of Google Places API allows limited requests per day
- Each search uses one request
- Consider implementing caching for production use

## Troubleshooting

### "Failed to fetch data from Google Places API"
- Verify your Google Maps API key is correct
- Check that Places API is enabled in Google Cloud Console
- Ensure your API key is not rate-limited

### "Unable to get your location"
- Enable location services in your browser
- Check if the website has permission to access location
- Some browsers require HTTPS for geolocation to work

### No results found
- Try increasing the search radius
- Check if the category is available in your area
- Verify that your location is correctly detected

## Privacy & Security

- Your location is only used for searching nearby places
- The location data is sent to Google's Places API
- Consider implementing user data privacy policies for production use
- Store API keys securely and rotate them periodically

## Browser Compatibility

- Chrome/Edge 60+
- Firefox 55+
- Safari 11+
- Mobile browsers with geolocation support

## License

Feel free to use and modify this application for your needs.

## Future Enhancements

- Google Maps integration to show places on a map
- Search history/favorites
- Advanced filters (price range, opening hours)
- User reviews and comments
- Booking integration
- Multiple language support
