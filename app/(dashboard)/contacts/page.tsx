import { tryGetAuthContext } from '@/infrastructure/auth'
import { useCases } from '@/application/services/container'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/layout/PageHeader'
import { Users, Search } from 'lucide-react'
import Link from 'next/link'
import { AddContactButton } from '@/components/crm/AddContactButton'

export default async function ContactsPage() {
    const auth = await tryGetAuthContext()
    const contacts = auth
        ? await useCases.listContacts().execute(auth.orgId)
        : []

    return (
        <div className="p-8 space-y-6">
            <PageHeader
                category="CRM"
                title="Contatos"
                icon={Users}
                actions={
                    <>
                        <span className="text-muted-foreground text-xs font-mono-data">{contacts.length} contatos</span>
                        <AddContactButton />
                    </>
                }
            />

            {/* Table */}
            <div className="bg-card border border-border rounded-(--radius)">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="text-left px-5 py-3 text-muted-foreground text-xs uppercase tracking-wider font-medium">Nome</th>
                                <th className="text-left px-5 py-3 text-muted-foreground text-xs uppercase tracking-wider font-medium">Email</th>
                                <th className="text-left px-5 py-3 text-muted-foreground text-xs uppercase tracking-wider font-medium">Telefone</th>
                                <th className="text-left px-5 py-3 text-muted-foreground text-xs uppercase tracking-wider font-medium">Empresa</th>
                                <th className="text-left px-5 py-3 text-muted-foreground text-xs uppercase tracking-wider font-medium">Tags</th>
                            </tr>
                        </thead>
                        <tbody>
                            {contacts.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-5 py-12 text-center text-muted-foreground/50 text-sm">
                                        Nenhum contato ainda. Adicione o primeiro!
                                    </td>
                                </tr>
                            )}
                            {contacts.map(contact => (
                                <tr key={contact.id} className="border-b border-border-subtle hover:bg-secondary/70 transition-colors">
                                    <td className="px-5 py-3">
                                        <Link href={`/contacts/${contact.id}`} className="text-foreground font-medium hover:text-primary transition-colors text-sm">
                                            {contact.name}
                                        </Link>
                                    </td>
                                    <td className="px-5 py-3 text-muted-foreground text-xs font-mono-data">{contact.email ?? '—'}</td>
                                    <td className="px-5 py-3 text-muted-foreground text-xs font-mono-data">{contact.phone ?? '—'}</td>
                                    <td className="px-5 py-3 text-foreground-secondary text-xs">{contact.company ?? '—'}</td>
                                    <td className="px-5 py-3">
                                        <div className="flex flex-wrap gap-1">
                                            {contact.tags.map((tag) => (
                                                <span key={tag} className="px-2 py-0.5 bg-primary/20 text-primary text-xs font-semibold border border-primary/40 rounded-(--radius)">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
