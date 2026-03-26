import { ValidationError } from '@/domain/errors'

export class Email {
    private constructor(public readonly value: string) {}

    static create(raw: string | null | undefined): Email | null {
        if (!raw || raw.trim() === '') return null
        const trimmed = raw.trim().toLowerCase()
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
            throw new ValidationError('Email inválido')
        }
        return new Email(trimmed)
    }
}

export class Phone {
    private constructor(public readonly value: string) {}

    static create(raw: string | null | undefined): Phone | null {
        if (!raw || raw.trim() === '') return null
        const cleaned = raw.replace(/\D/g, '')
        if (cleaned.length < 8 || cleaned.length > 15) {
            throw new ValidationError('Telefone inválido')
        }
        return new Phone(raw.trim())
    }
}

export class Money {
    private constructor(public readonly amount: number) {}

    static create(raw: number): Money {
        if (raw < 0) throw new ValidationError('Valor não pode ser negativo')
        return new Money(Math.round(raw * 100) / 100)
    }

    static zero(): Money {
        return new Money(0)
    }

    format(locale = 'pt-BR', currency = 'BRL'): string {
        return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(this.amount)
    }
}
