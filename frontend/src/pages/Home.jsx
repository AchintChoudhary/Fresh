import React, { useEffect, useState, useContext } from "react";

import axios from "axios";
import "remixicon/fonts/remixicon.css";

import LocationSearchPanel from "../components/LocationSearchPanel";
import VehiclePanel from "../components/VehiclePanel";
import ConfirmRide from "../components/ConfirmRide";
import LookingForDriver from "../components/LookingForDriver";
import WaitingForDriver from "../components/WaitingForDriver";
import BottomSheet from "../components/BottomSheet";
import LiveTracking from "../components/LiveTracking";

import { SocketContext } from "../context/SocketContext";
import { UserDataContext } from "../context/UserContext";
import { useNavigate } from "react-router-dom";

const Home = () => {


  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");

  const [pickupSuggestions, setPickupSuggestions] = useState([]);

  const [destinationSuggestions, setDestinationSuggestions] = useState([]);

  const [activeField, setActiveField] = useState(null);

  const [panelOpen, setPanelOpen] = useState(false);



  const [vehiclePanel, setVehiclePanel] = useState(false);

  const [confirmRidePanel, setConfirmRidePanel] = useState(false);

  const [vehicleFound, setVehicleFound] = useState(false);

  const [waitingForDriver, setWaitingForDriver] = useState(false);

  const [fare, setFare] = useState({});

  const [vehicleType, setVehicleType] = useState(null);

  const [ride, setRide] = useState(null);

  const [isLoadingFare, setIsLoadingFare] = useState(false);


  const { socket } = useContext(SocketContext);

  const { user } = useContext(UserDataContext);

  const navigate = useNavigate();



  useEffect(() => {
    if (!socket || !user?._id) {
      return;
    }

    socket.emit("join", {
      userType: "user",
      userId: user._id,
    });

    const handleRideConfirmed = (rideData) => {
      setRide(rideData);

      setVehicleFound(false);

      setConfirmRidePanel(false);

      setWaitingForDriver(true);
    };

    const handleRideStarted = (rideData) => {
      setWaitingForDriver(false);

      navigate("/riding", {
        state: {
          ride: rideData,
        },
      });
    };

    socket.on("ride-confirmed", handleRideConfirmed);

    socket.on("ride-started", handleRideStarted);

    return () => {
      socket.off("ride-confirmed", handleRideConfirmed);

      socket.off("ride-started", handleRideStarted);
    };
  }, [socket, user?._id, navigate]);



  const handlePickupChange = async (e) => {
    const value = e.target.value;

    setPickup(value);

    setActiveField("pickup");

    setPanelOpen(true);

    if (value.trim().length < 2) {
      setPickupSuggestions([]);

      return;
    }

    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/maps/get-suggestions`,
        {
          params: {
            input: value,
          },

          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      setPickupSuggestions(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Pickup suggestion error:", error);

      setPickupSuggestions([]);
    }
  };



  const handleDestinationChange = async (e) => {
    const value = e.target.value;

    setDestination(value);

    setActiveField("destination");

    setPanelOpen(true);

    if (value.trim().length < 2) {
      setDestinationSuggestions([]);

      return;
    }

    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/maps/get-suggestions`,
        {
          params: {
            input: value,
          },

          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      setDestinationSuggestions(
        Array.isArray(response.data) ? response.data : [],
      );
    } catch (error) {
      console.error("Destination suggestion error:", error);

      setDestinationSuggestions([]);
    }
  };



  const submitHandler = (e) => {
    e.preventDefault();
  };

 

  const findTrip = async () => {
    if (!pickup.trim()) {
      alert("Please enter pickup location");

      return;
    }

    if (!destination.trim()) {
      alert("Please enter destination");

      return;
    }

    try {
      setIsLoadingFare(true);

      setPanelOpen(false);

      setVehiclePanel(false);

      setConfirmRidePanel(false);

      setVehicleFound(false);

      setWaitingForDriver(false);

      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/rides/get-fare`,
        {
          params: {
            pickup,
            destination,
          },

          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      setFare(response.data);

      setVehiclePanel(true);
    } catch (error) {
      console.error("Fare calculation error:", error);

      alert(error.response?.data?.message || "Unable to calculate fare");
    } finally {
      setIsLoadingFare(false);
    }
  };



  const createRide = async () => {
    if (!pickup.trim()) {
      alert("Pickup location is required");

      return;
    }

    if (!destination.trim()) {
      alert("Destination is required");

      return;
    }

    if (!vehicleType) {
      alert("Please select a vehicle");

      return;
    }

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/rides/create`,
        {
          pickup,
          destination,
          vehicleType,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      if (response.data) {
        setRide(response.data);
      }
    } catch (error) {
      console.error("Create ride error:", error);

      alert(error.response?.data?.message || "Unable to create ride");
    }
  };



  const handleVehicleSelect = (type) => {
    setVehicleType(type);

    setVehiclePanel(false);

    setConfirmRidePanel(true);
  };



  const closeSearchPanel = () => {
    setPanelOpen(false);

    setPickupSuggestions([]);

    setDestinationSuggestions([]);
  };

 
  return (
    <div
      className="
                relative
                w-full
                h-[100dvh]
                min-h-[100svh]
                overflow-hidden
                bg-white
            "
    >
  

      <div
        className="
                    absolute
                    inset-0
                    w-full
                    h-full
                    z-0
                "
      >
        <LiveTracking />
      </div>

   

      <img
        className="
                    absolute
                    left-5
                    top-5
                    z-40
                    w-16
                    h-auto
                "
        src="https://upload.wikimedia.org/wikipedia/commons/c/cc/Uber_logo_2018.png"
        alt="Logo"
      />

  

      <div
        className="
                    absolute
                    inset-0
                    z-20
                    pointer-events-none
                "
      >
       

        <div
          className="
                        absolute
                        left-0
                        right-0
                        bottom-0
                        w-full
                        pointer-events-auto
                        bg-white
                        rounded-t-[28px]
                        px-4
                        pt-5
                        pb-[calc(1rem+env(safe-area-inset-bottom))]
                        shadow-[0_-8px_30px_rgba(0,0,0,0.12)]
                    "
        >
          {/* Drag indicator */}

          <div
            className="
                            flex
                            justify-center
                            mb-3
                        "
          >
            <span
              className="
                                block
                                w-12
                                h-1.5
                                rounded-full
                                bg-gray-300
                            "
            />
          </div>

          {/* Heading */}

          <h4
            className="
                            text-xl
                            sm:text-2xl
                            font-semibold
                            mb-4
                        "
          >
            Find a trip
          </h4>

       

          <form
            className="
                            relative
                            w-full
                        "
            onSubmit={submitHandler}
          >
            {/* Connecting line */}

            <div
              className="
                                absolute
                                h-[78px]
                                w-1
                                top-1/2
                                -translate-y-1/2
                                left-5
                                bg-gray-700
                                rounded-full
                                z-0
                            "
            />

            {/* Pickup */}

            <div
              className="
                                relative
                                z-10
                                mb-3
                            "
            >
              <i
                className="
                                    ri-map-pin-user-fill
                                    absolute
                                    left-4
                                    top-1/2
                                    -translate-y-1/2
                                    text-lg
                                    text-gray-700
                                "
              />

              <input
                value={pickup}
                onClick={() => {
                  setPanelOpen(true);

                  setActiveField("pickup");
                }}
                onChange={handlePickupChange}
                className="
                                    bg-[#eee]
                                    px-12
                                    py-3.5
                                    text-base
                                    sm:text-lg
                                    rounded-xl
                                    w-full
                                    outline-none
                                    focus:ring-2
                                    focus:ring-black/10
                                "
                type="text"
                placeholder="Add a pick-up location"
                autoComplete="off"
              />
            </div>

            {/* Destination */}

            <div
              className="
                                relative
                                z-10
                            "
            >
              <i
                className="
                                    ri-map-pin-2-fill
                                    absolute
                                    left-4
                                    top-1/2
                                    -translate-y-1/2
                                    text-lg
                                    text-gray-700
                                "
              />

              <input
                value={destination}
                onClick={() => {
                  setPanelOpen(true);

                  setActiveField("destination");
                }}
                onChange={handleDestinationChange}
                className="
                                    bg-[#eee]
                                    px-12
                                    py-3.5
                                    text-base
                                    sm:text-lg
                                    rounded-xl
                                    w-full
                                    outline-none
                                    focus:ring-2
                                    focus:ring-black/10
                                "
                type="text"
                placeholder="Enter your destination"
                autoComplete="off"
              />
            </div>
          </form>

          {/* Find Trip button */}

          <button
            type="button"
            onClick={findTrip}
            disabled={isLoadingFare}
            className="
                            w-full
                            bg-black
                            text-white
                            font-semibold
                            py-3.5
                            px-4
                            rounded-xl
                            mt-4
                            text-base
                            sm:text-lg
                            active:scale-[0.98]
                            transition-transform
                            disabled:opacity-60
                            disabled:cursor-not-allowed
                        "
          >
            {isLoadingFare ? "Finding rides..." : "Find Trip"}
          </button>
        </div>

     

        <div
          className={`
                        absolute
                        left-0
                        right-0
                        bottom-0
                        z-30
                        pointer-events-auto
                        bg-white
                        rounded-t-[28px]
                        shadow-[0_-8px_30px_rgba(0,0,0,0.15)]
                        transition-transform
                        duration-300
                        ease-out
                        max-h-[75vh]
                        overflow-hidden
                        ${panelOpen ? "translate-y-0" : "translate-y-full"}
                    `}
        >
          {/* Search panel header */}

          <div
            className="
                            flex
                            items-center
                            justify-between
                            px-4
                            pt-3
                            pb-2
                        "
          >
            <div
              className="
                                w-12
                                h-1.5
                                bg-gray-300
                                rounded-full
                                absolute
                                left-1/2
                                -translate-x-1/2
                                top-3
                            "
            />

            <div className="pt-5">
              <h3
                className="
                                    text-lg
                                    font-semibold
                                "
              >
                Search location
              </h3>

              <p
                className="
                                    text-sm
                                    text-gray-500
                                    mt-0.5
                                "
              >
                Choose your location
              </p>
            </div>

            <button
              type="button"
              onClick={closeSearchPanel}
              className="
                                mt-5
                                h-10
                                w-10
                                rounded-full
                                bg-gray-100
                                flex
                                items-center
                                justify-center
                                active:scale-95
                            "
              aria-label="Close search"
            >
              <i
                className="
                                    ri-close-line
                                    text-xl
                                "
              />
            </button>
          </div>

          {/* Search suggestions */}

          <div
            className="
                            overflow-y-auto
                            overscroll-contain
                            max-h-[calc(75vh-90px)]
                            px-4
                            pb-[calc(1rem+env(safe-area-inset-bottom))]
                        "
          >
            <LocationSearchPanel
              suggestions={
                activeField === "pickup"
                  ? pickupSuggestions
                  : destinationSuggestions
              }
              setPanelOpen={setPanelOpen}
              setVehiclePanel={setVehiclePanel}
              setPickup={setPickup}
              setDestination={setDestination}
              activeField={activeField}
            />
          </div>
        </div>
      </div>

      <BottomSheet
        open={vehiclePanel}
        onClose={() => {
          setVehiclePanel(false);
        }}
      >
        <VehiclePanel
          selectVehicle={handleVehicleSelect}
          fare={fare}
          setConfirmRidePanel={setConfirmRidePanel}
          setVehiclePanel={setVehiclePanel}
        />
      </BottomSheet>

      <BottomSheet
        open={confirmRidePanel}
        onClose={() => {
          setConfirmRidePanel(false);
        }}
      >
        <ConfirmRide
          createRide={createRide}
          pickup={pickup}
          destination={destination}
          fare={fare}
          vehicleType={vehicleType}
          setConfirmRidePanel={setConfirmRidePanel}
          setVehicleFound={setVehicleFound}
        />
      </BottomSheet>

      <BottomSheet
        open={vehicleFound}
        onClose={() => {
          setVehicleFound(false);
        }}
      >
        <LookingForDriver
          createRide={createRide}
          pickup={pickup}
          destination={destination}
          fare={fare}
          vehicleType={vehicleType}
          setVehicleFound={setVehicleFound}
        />
      </BottomSheet>

      <BottomSheet
        open={waitingForDriver}
        onClose={() => {
          setWaitingForDriver(false);
        }}
      >
        <WaitingForDriver
          ride={ride}
          setVehicleFound={setVehicleFound}
          setWaitingForDriver={setWaitingForDriver}
          waitingForDriver={waitingForDriver}
        />
      </BottomSheet>
    </div>
  );
};

export default Home;
