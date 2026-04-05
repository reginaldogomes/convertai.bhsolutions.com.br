import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export function CreateLandingPageButton() {
    return (
        <Button asChild>
            <Link href="/landing-pages/new">
                <Plus className="w-4 h-4 mr-2" />
                Nova Landing Page
            </Link>
        </Button>
    )
}
