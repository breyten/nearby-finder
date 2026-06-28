<?php
// Location Finder - PHP Backend
// This file handles the API calls to Google Places API

header('Content-Type: application/json');

// Get the request parameters
$action = $_GET['action'] ?? '';
$latitude = $_GET['lat'] ?? '';
$longitude = $_GET['lng'] ?? '';
$category = $_GET['category'] ?? '';
$radius = $_GET['radius'] ?? 5000; // Default 5km

// Replace with your Google Places API key
$apiKey = 'AIzaSyAOy3oNuwPjqNti3hApDGKYkEY3ZYiLz6M';

if ($action === 'search' && $latitude && $longitude && $category) {
    $results = searchNearbyPlaces($latitude, $longitude, $category, $radius, $apiKey);
    echo json_encode($results);
} else {
    echo json_encode(['error' => 'Invalid parameters']);
}

function searchNearbyPlaces($latitude, $longitude, $category, $radius, $apiKey) {
    // Map categories to Google Places types
    $typeMap = [
        'coffee' => 'cafe',
        'lunch' => 'restaurant',
        'dinner' => 'restaurant',
        'beer' => 'bar',
        'tourist_attraction' => 'tourist_attraction',
        'atm' => 'atm'
    ];
    $type = $typeMap[$category] ?? 'restaurant';

    $keywordMap = [
        'lunch' => 'lunch'
    ];
    $keyword = $keywordMap[$category] ?? '';

    $url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?' . http_build_query([
        'location' => "{$latitude},{$longitude}",
        'radius' => $radius,
        'type' => $type,
        'keyword' => $keyword,
        'key' => $apiKey
    ]);

    // Make the API request
    $response = @file_get_contents($url);

    if ($response === false) {
        return ['error' => 'Failed to fetch data from Google Places API'];
    }

    $data = json_decode($response, true);

    if ($data['status'] !== 'OK') {
        return ['error' => 'API Error: ' . $data['status']];
    }

    // Process and enhance results
    $results = [];
    foreach ($data['results'] as $place) {
        $results[] = [
            'name' => $place['name'],
            'description' => $place['vicinity'] ?? '',
            'rating' => $place['rating'] ?? 0,
            'lat' => $place['geometry']['location']['lat'],
            'lng' => $place['geometry']['location']['lng'],
            'placeId' => $place['place_id'],
            'photoUrl' => isset($place['photos'][0]) ? getPhotoUrl($place['photos'][0]['photo_reference'], $apiKey) : '',
            'isOpen' => $place['opening_hours']['open_now'] ?? null
        ];
    }

    return ['status' => 'OK', 'results' => $results];
}

function getPhotoUrl($photoReference, $apiKey) {
    return 'https://maps.googleapis.com/maps/api/place/photo?' . http_build_query([
        'photoreference' => $photoReference,
        'maxwidth' => 200,
        'key' => $apiKey
    ]);
}
?>
