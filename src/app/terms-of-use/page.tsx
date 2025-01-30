// import {
// AcademicCapIcon,
// BanknotesIcon,
// CheckBadgeIcon,
// ClockIcon,
// ReceiptRefundIcon,
// UsersIcon,
//   } from '@heroicons/react/24/outline'

import {
    ShieldCheck,
    MessageSquareWarning,
    Users,
    BadgeAlert,
    Smile,
    DollarSign
} from "lucide-react"




interface Action {
    title: string
    href: string
    icon?: React.ComponentType<React.ComponentProps<'svg'>>,
    description?: string
}

const actions: Action[] = [
    {
        title: 'Privacy',
        href: '#',
        icon: ShieldCheck,
        description: `All the information you provide is kept private and secure using Supabase. We don't require any sensitive information from you`
    },
    {
        title: 'Reports',
        href: '#',
        icon: MessageSquareWarning,
        description: 'Because the project is managed by a single developer, all reports will be sent to an email and if there will be detected inappropriate content it will be deleted immediatelly and the user which posted it will be banned, so please be respectful.'
    },
    {
        title: 'Groups and Events',
        href: '#',
        icon: Users,
        description: 'Every user can create groups and events with no payments required, there are no limitations'
    },
    {
        title: 'Technical Support',
        href: '#',
        icon: BadgeAlert,
        description: 'If you detect any bugs or just have some suggestions of how to improve the project, please contact via contact form or socials'
    },
    {
        title: 'Payments',
        href: '#',
        icon: DollarSign,
        description: 'There are no payments so just enjoy the project, have fun and share positive experiences'
    },
    {
        title: 'Community',
        href: '#',
        icon: Smile,
        description: "And just be kind to each other, we're all here to learn and improve. Enjoy!"
    }
]

function classNames(...classes: (string | boolean)[]): string {
    return classes.filter(Boolean).join(' ')
}

export default function Example() {
    return (
        <div className="max-w-[1200px] justify-self-center divide-y divide-gray-200 mt-24 overflow-hidden rounded-lg shadow-sm sm:grid sm:grid-cols-2 sm:gap-px sm:divide-y-0">
            {actions.map((action) => (
                <div
                    key={action.title}
                    className={classNames(
                        'group relative flex flex-col gap-4 p-6 hover:ring-2 hover:ring-white/10 rounded-lg hover:ring-inset transition-all duration-300',
                    )}
                >
                    <div>
                        <span
                            className={classNames(
                                'inline-flex rounded-lg ',
                            )}
                        >
                            {action.icon && <action.icon aria-hidden="true" className="size-10 text-white/70" />}
                        </span>
                    </div>
                    <div className="hover:pl-2 transition-all duration-300">
                        <h3 className="text-base tracking-wider font-semibold text-white/70">
                            <a href={action.href} className="focus:outline-hidden">
                                <span aria-hidden="true" className="absolute inset-0" />
                                {action.title}
                            </a>
                        </h3>
                        <p className="mt-2 text-sm text-white/50 tracking-wide">
                            {action.description}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    )
}
