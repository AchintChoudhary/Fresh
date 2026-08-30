const axios = require('axios');
const captainModel = require('../models/captain.model');

const MAPTILER_API_KEY = process.env.MAPTILER_API_KEY;
const ORS_API_KEY = process.env.ORS_API_KEY;

if (!MAPTILER_API_KEY) {
    console.warn('MAPTILER_API_KEY is not configured');
}

if (!ORS_API_KEY) {
    console.warn('ORS_API_KEY is not configured');
}

function validateCoordinates(result) {
    if (
        !result ||
        !Array.isArray(result.features) ||
        !result.features.length
    ) {
        throw new Error('Location not found');
    }

    const coordinates = result.features[0].geometry.coordinates;

    if (
        !Array.isArray(coordinates) ||
        coordinates.length < 2
    ) {
        throw new Error('Invalid coordinates returned');
    }

    return {
        lng: Number(coordinates[0]),
        ltd: Number(coordinates[1])
    };
}

/**
 * Address -> latitude/longitude
 * MapTiler Geocoding
 */
module.exports.getAddressCoordinate = async (address) => {
    if (!address || !address.trim()) {
        throw new Error('Address is required');
    }

    if (!MAPTILER_API_KEY) {
        throw new Error('MAPTILER_API_KEY is missing');
    }

    const url =
        `https://api.maptiler.com/geocoding/${encodeURIComponent(address)}.json`;

    try {
        const response = await axios.get(url, {
            params: {
                key: MAPTILER_API_KEY,
                limit: 1,
                language: 'en'
            },
            timeout: 10000
        });

        return validateCoordinates(response.data);
    } catch (error) {
        console.error(
            'MapTiler geocoding error:',
            error.response?.data || error.message
        );

        throw new Error('Unable to find location');
    }
};


/**
 * Address -> distance + duration
 *
 * First geocodes both addresses with MapTiler,
 * then gets driving route from ORS.
 */
module.exports.getDistanceTime = async (origin, destination) => {
    if (!origin || !destination) {
        throw new Error('Origin and destination are required');
    }

    if (!ORS_API_KEY) {
        throw new Error('ORS_API_KEY is missing');
    }

    try {
        const [originCoordinates, destinationCoordinates] =
            await Promise.all([
                module.exports.getAddressCoordinate(origin),
                module.exports.getAddressCoordinate(destination)
            ]);

        const response = await axios.post(
            'https://api.openrouteservice.org/v2/directions/driving-car',
            {
                coordinates: [
                    [
                        originCoordinates.lng,
                        originCoordinates.ltd
                    ],
                    [
                        destinationCoordinates.lng,
                        destinationCoordinates.ltd
                    ]
                ],
                units: 'm'
            },
            {
                headers: {
                    Authorization: ORS_API_KEY,
                    'Content-Type': 'application/json'
                },
                timeout: 15000
            }
        );

        const route = response.data?.routes?.[0];

        if (!route) {
            throw new Error('No route found');
        }

        return {
            distance: {
                value: Math.round(route.summary.distance),
                text: `${(route.summary.distance / 1000).toFixed(1)} km`
            },

            duration: {
                value: Math.round(route.summary.duration),
                text: `${Math.round(route.summary.duration / 60)} mins`
            },

            geometry: route.geometry
        };

    } catch (error) {
        console.error(
            'ORS routing error:',
            error.response?.data || error.message
        );

        throw new Error('Unable to calculate route');
    }
};


/**
 * Search suggestions
 * MapTiler replaces Google Places Autocomplete.
 */
module.exports.getAutoCompleteSuggestions = async (input) => {
    if (!input || input.trim().length < 2) {
        return [];
    }

    if (!MAPTILER_API_KEY) {
        throw new Error('MAPTILER_API_KEY is missing');
    }

    try {
        const response = await axios.get(
            `https://api.maptiler.com/geocoding/${encodeURIComponent(input)}.json`,
            {
                params: {
                    key: MAPTILER_API_KEY,
                    limit: 6,
                    language: 'en'
                },
                timeout: 8000
            }
        );

        return (response.data?.features || [])
            .map((feature) => feature.place_name)
            .filter(Boolean);

    } catch (error) {
        console.error(
            'MapTiler autocomplete error:',
            error.response?.data || error.message
        );

        throw new Error('Unable to fetch location suggestions');
    }
};


/**
 * Find captains near pickup.
 *
 * IMPORTANT:
 * MongoDB's $centerSphere expects [longitude, latitude].
 */
module.exports.getCaptainsInTheRadius = async (
    ltd,
    lng,
    radius
) => {
    if (
        typeof ltd !== 'number' ||
        typeof lng !== 'number' ||
        typeof radius !== 'number'
    ) {
        throw new Error('Invalid location');
    }

    const captains = await captainModel.find({
        status: 'active',
        'location.ltd': { $exists: true },
        'location.lng': { $exists: true }
    });

    const earthRadiusKm = 6371;

    return captains.filter((captain) => {
        const lat1 = ltd * Math.PI / 180;
        const lat2 = captain.location.ltd * Math.PI / 180;

        const deltaLat =
            (captain.location.ltd - ltd) * Math.PI / 180;

        const deltaLng =
            (captain.location.lng - lng) * Math.PI / 180;

        const a =
            Math.sin(deltaLat / 2) ** 2 +
            Math.cos(lat1) *
            Math.cos(lat2) *
            Math.sin(deltaLng / 2) ** 2;

        const distance =
            2 *
            earthRadiusKm *
            Math.atan2(
                Math.sqrt(a),
                Math.sqrt(1 - a)
            );

        return distance <= radius;
    });
};