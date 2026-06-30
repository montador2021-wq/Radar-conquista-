# RadarConquista - Diretrizes de Desenvolvimento e Regras de Negócio

Este arquivo serve como memória persistente para todas as futuras sessões de desenvolvimento de IA neste espaço de trabalho. Ele garante que as regras de negócio cruciais e as decisões de design de alta fidelidade sejam mantidas de forma consistente.

---

## 🚀 1. Funcionalidades de Logística e Condições do Orçamento
Sempre que novos fluxos de oportunidade ou orçamentos forem criados ou editados, os seguintes campos devem ser incluídos e respeitados:

- **Frete / Entrega**:
  - Opção de Frete Grátis (`shippingFee: 0`).
  - Opção de Frete Cobrado com campo dinâmico de entrada monetária (`shippingFee: valor`).
- **Montagem de Móveis**:
  - Opção de Montagem Grátis (`isAssemblyFree: true`, `assemblyFee: 0`).
  - Opção de Montagem Cobrada com campo de entrada monetária (`isAssemblyFree: false`, `assemblyFee: valor`).
- **Validade do Orçamento**:
  - Dias corridos/úteis salvos em `validityDays`. Opções típicas: 1, 3, 5 (padrão), 7, 10, 15, 30 dias.

---

## 🎨 2. Identidade Visual e Temas do App
- O aplicativo utiliza um design premium focado em alta legibilidade, com tons de roxo institucional e lavanda sutil para destacar seções administrativas e de logística.
- Nos formulários, agrupar as opções de entrega e montagem sob um painel estilizado com fundo roxo sutil (`bg-purple-50/50`) e bordas suaves (`border-purple-100`).

---

## 📄 3. Gerador de PDF Profissional (Sono Show Móveis)
O arquivo `radarconquista-utils.ts` possui um gerador de PDFs corporativos altamente otimizado (`generateProfessionalQuotePDF`) com as seguintes especificações:

- **Imagens de Produtos**: Carregamento assíncrono seguro com verificação de CORS e placeholders de fallback elegantes em formato retangular 15mm x 15mm ("SEM FOTO") para produtos sem imagem definida.
- **Logomarca**: Tentativa automatizada de puxar o logo oficial da Sono Show Móveis no cabeçalho com um container de contraste branco e cantos arredondados de 30mm x 30mm.
- **Paleta de Cores do Documento**:
  - Cor Principal: Grafite escuro / Charcoal (`r: 18, g: 17, b: 16`).
  - Cor de Destaque Primária: Roxo corporativo (`r: 147, g: 51, b: 234`).
  - Cor de Destaque Secundária: Dourado / Amber premium (`r: 217, g: 119, b: 6`).
- **Estrutura de Páginas**:
  - Paginação automática inteligente com cálculos de margem de segurança (`rowHeight = 22` e limite de página em `Y ~ 250`) para evitar overlaps ou quebras feias de texto.
  - Rodapé institucional absoluto e numeração dinâmica das páginas ("Página X de Y") em todas as folhas geradas.
