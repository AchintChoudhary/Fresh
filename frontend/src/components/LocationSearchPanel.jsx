import React from 'react'

const LocationSearchPanel = ({
    suggestions,
    setVehiclePanel,
    setPanelOpen,
    setPickup,
    setDestination,
    activeField
}) => {

    const handleSuggestionClick = (suggestion) => {

        if (activeField === 'pickup') {
            setPickup(suggestion)
        }

        if (activeField === 'destination') {
            setDestination(suggestion)
        }

        setPanelOpen(false)
    }

    return (
        <div className="w-full pb-4">

            {suggestions.length === 0 && (
                <p className="text-sm text-gray-500 py-3">
                    Start typing to search locations
                </p>
            )}

            {suggestions.map((suggestion, index) => (

                <button
                    key={`${suggestion}-${index}`}
                    type="button"
                    onClick={() =>
                        handleSuggestionClick(suggestion)
                    }
                    className="
                        flex
                        gap-4
                        border-2
                        p-3
                        border-gray-50
                        active:border-black
                        rounded-xl
                        items-center
                        my-2
                        justify-start
                        w-full
                        text-left
                    "
                >

                    <span className="
                        bg-[#eee]
                        h-9
                        min-w-9
                        flex
                        items-center
                        justify-center
                        rounded-full
                    ">
                        <i className="ri-map-pin-fill" />
                    </span>

                    <span className="font-medium text-sm sm:text-base">
                        {suggestion}
                    </span>

                </button>

            ))}
        </div>
    )
}

export default LocationSearchPanel