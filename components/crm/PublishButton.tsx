'use client'

import { publishLandingPage } from '@/actions/landing-pages'
import { Button } from '@/components/ui/button'
import { Globe, EyeOff } from 'lucide-react'
import { useTransition } from 'react'
import { toast } from 'sonner'

export function PublishButton({ pageId, isPublished }: { pageId: string; isPublished: boolean }) {
    const [isPending, startTransition] = useTransition()

    const handleClick = () => {
        startTransition(async () => {
            const result = await publishLandingPage(pageId, !isPublished)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success(isPublished ? 'Página despublicada' : 'Página publicada!')
            }
        })
    }

    return (
        <Button
            onClick={handleClick}
            disabled={isPending}
            variant={isPublished ? 'outline' : 'default'}
            size="sm"
        >
            {isPublished ? (
                <>
                    <EyeOff className="w-4 h-4 mr-2" />
                    Despublicar
                </>
            ) : (
                <>
                    <Globe className="w-4 h-4 mr-2" />
                    Publicar
                </>
            )}
        </Button>
    )
}
