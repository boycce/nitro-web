interface CheckIconProps {
    color?: 'black' | 'white' | 'primary'
    className?: string;
}

const CheckIcon = ({ color = 'white', className }: CheckIconProps) => {
    let strokeStyle = 'primary'
    switch (color) {
        case 'primary':
            strokeStyle = 'stroke-primary'
            break
        case 'black':
            strokeStyle = 'stroke-text-primary'
            break
        default:
            strokeStyle = 'stroke-white'
    }
    return (
        <svg
            className={`w-[70%] h-[70%] pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white group-has-[:disabled]:stroke-gray-950/25 ${className}`} width="16" height="12" viewBox="0 0 16 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g clipPath="url(#clip0_13386_4516)">
                <path d="M14.6666 1.14331L5.5 10.3099L1.33325 6.14331" className={strokeStyle} strokeWidth="2" strokeLinecap="round" stroke="white" strokeLinejoin="round" />
            </g>
            <defs>
                <clipPath id="clip0_13386_4516">
                    <rect width="16" height="12" fill="white" />
                </clipPath>
            </defs>
        </svg>

    )
}

export default CheckIcon