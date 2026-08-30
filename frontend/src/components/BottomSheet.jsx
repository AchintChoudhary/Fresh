import React, { useEffect } from 'react'

const BottomSheet = ({
    open,
    onClose,
    children,
    maxHeight = '85vh',
    zIndex = 50
}) => {

    useEffect(() => {
        if (!open) return

        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                onClose?.()
            }
        }

        document.addEventListener('keydown', handleEscape)

        return () => {
            document.removeEventListener(
                'keydown',
                handleEscape
            )
        }
    }, [open, onClose])


    return (
        <>
            {/* Backdrop */}
            <div
                className={`
                    fixed
                    inset-0
                    bg-black/30
                    transition-opacity
                    duration-300
                    ease-out
                    ${
                        open
                            ? 'opacity-100 pointer-events-auto'
                            : 'opacity-0 pointer-events-none'
                    }
                `}
                style={{
                    zIndex: zIndex - 1
                }}
                onClick={onClose}
                aria-hidden="true"
            />


            {/* Bottom Sheet */}
            <section
                className={`
                    fixed
                    left-0
                    right-0
                    bottom-0
                    w-full
                    bg-white
                    rounded-t-[28px]
                    shadow-[0_-10px_40px_rgba(0,0,0,0.15)]
                    overflow-hidden
                    transition-transform
                    duration-300
                    ease-out
                    ${
                        open
                            ? 'translate-y-0'
                            : 'translate-y-full'
                    }
                `}
                style={{
                    zIndex,
                    maxHeight
                }}
                aria-hidden={!open}
            >

                {/* Handle */}
                <div className="
                    w-full
                    flex
                    justify-center
                    pt-3
                    pb-3
                    shrink-0
                ">
                    <span className="
                        block
                        w-12
                        h-1.5
                        rounded-full
                        bg-gray-300
                    " />
                </div>


                {/* Content */}
                <div
                    className="
                        w-full
                        overflow-y-auto
                        overscroll-contain
                        px-4
                        pb-[calc(1rem+env(safe-area-inset-bottom))]
                    "
                    style={{
                        maxHeight: `calc(${maxHeight} - 42px)`
                    }}
                >
                    {children}
                </div>

            </section>
        </>
    )
}

export default BottomSheet