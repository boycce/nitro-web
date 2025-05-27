import { theme } from 'twin.macro'

const CheckIcon = () => {
    return (
        <svg
            className='w-[70%] h-[70%] pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white group-has-[:disabled]:stroke-gray-950/25' width="16" height="12" viewBox="0 0 16 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g clipPath="url(#clip0_13386_4516)">
                <path d="M14.6666 1.14331L5.5 10.3099L1.33325 6.14331" strokeWidth="2" strokeLinecap="round" stroke={theme`colors.input`} strokeLinejoin="round" />
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