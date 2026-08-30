import React, { useEffect, useState } from 'react'
import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    useMap
} from 'react-leaflet'

import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const defaultPosition = [22.7196, 75.8577] // Indore fallback

const userIcon = new L.Icon({
    iconUrl:
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    iconRetinaUrl:
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    shadowUrl:
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',

    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
})


const RecenterMap = ({ position }) => {
    const map = useMap()

    useEffect(() => {
        if (position) {
            map.setView(position, map.getZoom(), {
                animate: true
            })
        }
    }, [position, map])

    return null
}


const LiveTracking = () => {
    const [currentPosition, setCurrentPosition] =
        useState(defaultPosition)

    const [locationError, setLocationError] =
        useState(false)

    useEffect(() => {
        if (!navigator.geolocation) {
            setLocationError(true)
            return
        }

        const watchId =
            navigator.geolocation.watchPosition(
                (position) => {
                    setCurrentPosition([
                        position.coords.latitude,
                        position.coords.longitude
                    ])

                    setLocationError(false)
                },
                (error) => {
                    console.error(
                        'Geolocation error:',
                        error.message
                    )

                    setLocationError(true)
                },
                {
                    enableHighAccuracy: true,
                    maximumAge: 5000,
                    timeout: 10000
                }
            )

        return () => {
            navigator.geolocation.clearWatch(watchId)
        }
    }, [])


    return (
        <div className="relative h-full w-full overflow-hidden">

            <MapContainer
                center={currentPosition}
                zoom={15}
                zoomControl={false}
                className="h-full w-full"
            >

                <TileLayer
                    attribution="© MapTiler © OpenStreetMap contributors"
                    url={`https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=${import.meta.env.VITE_MAPTILER_API_KEY}`}
                />

                <RecenterMap
                    position={currentPosition}
                />

                <Marker
                    position={currentPosition}
                    icon={userIcon}
                >
                    <Popup>
                        You are here
                    </Popup>
                </Marker>

            </MapContainer>

            {locationError && (
                <div className="
                    absolute
                    top-4
                    left-1/2
                    -translate-x-1/2
                    z-[1000]
                    bg-white
                    shadow-lg
                    rounded-xl
                    px-4
                    py-2
                    text-sm
                    text-gray-700
                    max-w-[90%]
                    text-center
                ">
                    Location permission is required for live tracking.
                </div>
            )}

        </div>
    )
}

export default LiveTracking