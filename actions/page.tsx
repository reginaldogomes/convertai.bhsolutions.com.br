// Força a página a ser renderizada estaticamente para isolar o problema.
export const dynamic = 'force-static'

export default function SitesPage() {
    return (
        <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
            <h1>Meus Sites</h1>
            <p>
                Esta é uma página de teste estática para a rota /sites. Se você está
                vendo isso, a rota está funcionando, mas há um problema com o
                carregamento de dados dinâmicos.
            </p>
        </div>
    )
}