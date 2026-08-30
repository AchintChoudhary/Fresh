import React, { useRef, useState } from 'react'
import BottomSheet from '../components/BottomSheet'
import { Link } from 'react-router-dom'
import CaptainDetails from '../components/CaptainDetails'
import RidePopUp from '../components/RidePopUp'

import ConfirmRidePopUp from '../components/ConfirmRidePopUp'
import { useEffect, useContext } from 'react'
import { SocketContext } from '../context/SocketContext'
import { CaptainDataContext } from '../context/CapatainContext'
import axios from 'axios'

const CaptainHome = () => {

    const [ ridePopupPanel, setRidePopupPanel ] = useState(false)
    const [ confirmRidePopupPanel, setConfirmRidePopupPanel ] = useState(false)

    const ridePopupPanelRef = useRef(null)
    const confirmRidePopupPanelRef = useRef(null)
    const [ ride, setRide ] = useState(null)

    const { socket } = useContext(SocketContext)
    const { captain } = useContext(CaptainDataContext)

   useEffect(() => {

    if (!socket || !captain?._id) {
        return
    }

    socket.emit('join', {
        userId: captain._id,
        userType: 'captain'
    })

    if (!navigator.geolocation) {
        console.error('Geolocation is not supported')
        return
    }

    const updateLocation = () => {

        navigator.geolocation.getCurrentPosition(
            (position) => {

                socket.emit('update-location-captain', {
                    userId: captain._id,
                    location: {
                        ltd: position.coords.latitude,
                        lng: position.coords.longitude
                    }
                })

            },
            (error) => {
                console.error(
                    'Captain location error:',
                    error.message
                )
            },
            {
                enableHighAccuracy: true,
                maximumAge: 5000,
                timeout: 10000
            }
        )
    }

    updateLocation()

    // Then every 10 seconds
    const locationInterval =
        setInterval(updateLocation, 10000)

    return () => {
        clearInterval(locationInterval)
    }

}, [socket, captain?._id])

useEffect(() => {

    if (!socket || !captain?._id) {
        return
    }

    socket.emit('join', {
        userId: captain._id,
        userType: 'captain'
    })

    const handleNewRide = (data) => {
        setRide(data)
        setRidePopupPanel(true)
    }

    socket.on('new-ride', handleNewRide)

    return () => {
        socket.off('new-ride', handleNewRide)
    }

}, [socket, captain?._id])

    async function confirmRide() {

        const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/rides/confirm`, {

            rideId: ride._id,
            captainId: captain._id,


        }, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
            }
        })

        setRidePopupPanel(false)
        setConfirmRidePopupPanel(true)

    }



    return (
        <div className='h-screen'>
            <div className='fixed p-6 top-0 flex items-center justify-between w-screen'>
                <img className='w-16' src="https://upload.wikimedia.org/wikipedia/commons/c/cc/Uber_logo_2018.png" alt="" />
                <Link to='/captain-home' className=' h-10 w-10 bg-white flex items-center justify-center rounded-full'>
                    <i className="text-lg font-medium ri-logout-box-r-line"></i>
                </Link>
            </div>
            <div className='h-3/5'>
                <img className='h-full w-full object-cover' src="https://miro.medium.com/v2/resize:fit:1400/0*gwMx05pqII5hbfmX.gif" alt="" />

            </div>
            <div className='h-2/5 p-6'>
                <CaptainDetails />
            </div>
     <BottomSheet
    open={ridePopupPanel}
    onClose={() => setRidePopupPanel(false)}
>
    <RidePopUp
        ride={ride}
        setRidePopupPanel={setRidePopupPanel}
        setConfirmRidePopupPanel={setConfirmRidePopupPanel}
        confirmRide={confirmRide}
    />
</BottomSheet>
           <BottomSheet
    open={confirmRidePopupPanel}
    onClose={() => setConfirmRidePopupPanel(false)}
    maxHeight="90vh"
>
    <ConfirmRidePopUp
        ride={ride}
        setConfirmRidePopupPanel={setConfirmRidePopupPanel}
        setRidePopupPanel={setRidePopupPanel}
    />
</BottomSheet>
        </div>
    )
}

export default CaptainHome