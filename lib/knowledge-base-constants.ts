export const KNOWLEDGE_ENTRY_TYPES = [
    { value: 'geral',       label: 'Conteúdo Geral' },
    { value: 'produto',     label: 'Produto / Serviço' },
    { value: 'faq',         label: 'FAQ / Objeções' },
    { value: 'processo',    label: 'Processo / Operação' },
    { value: 'competitivo', label: 'Diferencial Competitivo' },
    { value: 'marca',       label: 'Marca / Tom de Voz' },
    { value: 'politica',    label: 'Política / Contrato' },
    { value: 'case',        label: 'Case / Resultado' },
] as const

export type KnowledgeEntryType = typeof KNOWLEDGE_ENTRY_TYPES[number]['value']

export const PROFILE_TYPES = [
    { value: 'empresa',  label: 'Perfil Empresarial', description: 'Para empresas, marcas e lojas' },
    { value: 'pessoal',  label: 'Perfil Pessoal',     description: 'Para profissionais, criadores e consultores' },
] as const

export type ProfileType = typeof PROFILE_TYPES[number]['value']
