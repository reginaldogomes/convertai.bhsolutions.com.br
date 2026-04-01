import { tryGetAuthContext } from '@/infrastructure/auth'
import { useCases } from '@/application/services/container'
import { PageHeader } from '@/components/layout/PageHeader'
import { Settings as SettingsIcon, Building, Puzzle, Mail, MessageSquare, MessageCircle, CheckCircle2, XCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SettingsTabs } from './settings-tabs'

export default async function SettingsPage() {
    const auth = await tryGetAuthContext()
    const profileWithOrg = auth ? await useCases.getUserSettings().execute(auth.userId) : null

    const integrations = {
        sendgrid: !!process.env.SENDGRID_API_KEY,
        twilioWhatsapp: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_WHATSAPP_NUMBER),
        twilioSms: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_SMS_NUMBER),
    }

    return (
        <div className="p-8 space-y-8 max-w-4xl">
            <PageHeader category="Administração" title="Configurações" icon={SettingsIcon} />

            <SettingsTabs profileWithOrg={profileWithOrg} integrations={integrations} />
        </div>
    )
}
