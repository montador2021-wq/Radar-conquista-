import { jsPDF } from 'jspdf';
import { Opportunity } from './tipos';

// ==========================================
// 1. INTERFACES E TIPAGEM
// ==========================================

export interface QuoteItem {
  id: string;
  name: string;
  nickname: string;
  price: number;
  quantity: number;
  image?: string;
  description?: string;
}

export interface Quote {
  id: string;
  clientName: string;
  clientPhone: string;
  value: number; // Valor dos produtos
  productInterest?: string;
  notes?: string;
  createdAt: string | Date;
  returnDate?: string;
  shippingFee?: number;
  assemblyFee?: number;
  isAssemblyFree?: boolean;
  validityDays?: number;
  items?: QuoteItem[];
}

export const mapOpportunityToQuote = (opp: Opportunity): Quote => {
  const quoteItems: QuoteItem[] = (opp.products || []).map((p, idx) => ({
    id: p.code || `item-${idx}`,
    name: p.name,
    nickname: p.nickname || p.name.split(' - ')[0],
    price: p.price,
    quantity: 1,
    image: p.image || undefined,
    description: p.category || undefined
  }));

  return {
    id: opp.id,
    clientName: opp.title,
    clientPhone: opp.phone || '',
    value: opp.value,
    productInterest: opp.productInterest || opp.title,
    notes: `Orçamento gerado via RadarConquista.`,
    createdAt: new Date(),
    validityDays: opp.validityDays !== undefined ? opp.validityDays : 5,
    shippingFee: opp.shippingFee !== undefined ? opp.shippingFee : 0,
    assemblyFee: opp.assemblyFee !== undefined ? opp.assemblyFee : 0,
    isAssemblyFree: opp.isAssemblyFree !== undefined ? opp.isAssemblyFree : true,
    items: quoteItems.length > 0 ? quoteItems : (opp.productImage ? [{
      id: '1',
      name: opp.productInterest || opp.title,
      nickname: opp.productNickname || opp.productInterest || opp.title,
      price: opp.value,
      quantity: 1,
      image: opp.productImage,
      description: opp.productCategory || undefined
    }] : undefined)
  };
};

// ==========================================
// 2. FORMATADORES AUXILIARES
// ==========================================

/**
 * Formata um número para a moeda brasileira (R$ 1.250,00)
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

/**
 * Limpa o número de telefone e gera o link direto do WhatsApp API
 */
export const generateWhatsAppLink = (phone: string, message: string): string => {
  const cleanPhone = phone.replace(/\D/g, '');
  // Adiciona o código do país (55) se o usuário não digitou
  const finalPhone = cleanPhone.length === 11 || cleanPhone.length === 10 
    ? `55${cleanPhone}` 
    : cleanPhone;
  
  return `https://api.whatsapp.com/send?phone=${finalPhone}&text=${encodeURIComponent(message)}`;
};

// ==========================================
// 3. MODELOS DE MENSAGENS DO WHATSAPP
// ==========================================

/**
 * GERA A MENSAGEM IMEDIATA (Enviada na hora que cria o orçamento)
 */
export const buildImmediateWhatsAppMessage = (params: {
  quote: Quote;
  sellerName: string;
  branchName: string;
  includePdfNotice?: boolean;
}): string => {
  const { quote, sellerName, branchName, includePdfNotice = true } = params;
  const todayStr = new Date(quote.createdAt).toLocaleDateString('pt-BR');
  const validity = quote.validityDays || 5;

  // Detalhamento dos produtos selecionados
  let itemsLines = '';
  if (quote.items && quote.items.length > 0) {
    quote.items.forEach(item => {
      itemsLines += `• *${item.quantity}x ${item.nickname || item.name}* (Preço Un: ${formatCurrency(item.price)})\n`;
    });
  } else {
    itemsLines = `• *1x ${quote.productInterest || 'Móveis Planejados'}* (${formatCurrency(quote.value)})\n`;
  }

  // Taxas extras
  const shipping = quote.shippingFee || 0;
  const assembly = quote.assemblyFee || 0;
  const isAssemblyFree = quote.isAssemblyFree || false;

  // Cálculo do total geral
  const totalGeral = quote.value + shipping + (isAssemblyFree ? 0 : assembly);

  const message = `🎯 *RADARCONQUISTA* 🎯
_Transformando atendimento em conquista de vendas._

Olá, *${quote.clientName}*!
Espero que esteja excelente! Aqui estão as condições exclusivas do orçamento que preparamos para você na nossa unidade *${branchName}*:

━━━━━━━━━━━━━━━━━━━━
📝 *DADOS DA PROPOSTA*
━━━━━━━━━━━━━━━━━━━━
Vendedor: ${sellerName}
Data: ${todayStr}
Validade: ${validity} dias

📦 *PRODUTOS SELECIONADOS:*
${itemsLines}
🛋️ *VALOR DOS MÓVEIS:* ${formatCurrency(quote.value)}
🚚 *TAXA DE ENTREGA (FRETE):* ${shipping > 0 ? formatCurrency(shipping) : 'GRÁTIS'}
🔧 *SERVIÇO DE MONTAGEM:* ${isAssemblyFree || assembly === 0 ? 'GRÁTIS' : formatCurrency(assembly)}
💰 *VALOR TOTAL GERAL:* ${formatCurrency(totalGeral)}

━━━━━━━━━━━━━━━━━━━━
📌 ${includePdfNotice ? '📄 _O PDF formal detalhado foi gerado e está pronto para download. Caso precise, posso lhe enviar!_' : ''}

Ficamos à inteira disposição para aprovar seu pedido hoje mesmo e liberar sua entrega rápida! Qual forma de pagamento fica melhor para você hoje?`;

  return generateWhatsAppLink(quote.clientPhone, message);
};

/**
 * GERA A MENSAGEM DE RETORNO / FOLLOW-UP
 * (Enviada quando você vai cobrar o cliente na data agendada de retorno)
 */
export const buildFollowUpWhatsAppMessage = (params: {
  quote: Quote;
  sellerName: string;
}): string => {
  const { quote, sellerName } = params;
  
  const message = `Olá *${quote.clientName}*! Tudo bem?
Aqui é o consultor *${sellerName}* da Sono Show Móveis.

Lembra do orçamento de *${quote.productInterest || 'Móveis'}* no valor de *${formatCurrency(quote.value)}* que organizamos para você? 

Estou passando para saber se podemos aprovar o seu pedido ou se ficou alguma dúvida sobre as opções de parcelamento! Como ficou para você?`;

  return generateWhatsAppLink(quote.clientPhone, message);
};

// ==========================================
// 4. GERADOR DE PDF PROFISSIONAL (DÉCOR CORPORATIVO)
// ==========================================

// Helper robust to load external images as Base64/HTMLImage for jsPDF without crashing on CORS or missing resources
const tryLoadImage = async (url: string): Promise<HTMLImageElement | null> => {
  if (!url) return null;
  // Handle relative URLs if any
  let finalUrl = url;
  if (url.startsWith('/')) {
    finalUrl = window.location.origin + url;
  }
  try {
    return await new Promise<HTMLImageElement | null>((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => {
        console.warn(`[tryLoadImage] Falha ao carregar imagem via Image(): ${finalUrl}`);
        resolve(null);
      };
      img.src = finalUrl;
    });
  } catch (e) {
    console.warn(`[tryLoadImage] Exceção ao carregar imagem: ${url}`, e);
    return null;
  }
};

interface GeneratePDFParams {
  quote: Quote;
  branchName: string;
  sellerName: string;
}

/**
 * Gera um PDF corporativo super elegante com design institucional,
 * tabelas bem espaçadas, miniaturas dos produtos e assinaturas formais de forma totalmente offline e segura.
 */
export async function generateProfessionalQuotePDF({
  quote,
  branchName,
  sellerName,
}: GeneratePDFParams): Promise<boolean> {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const primaryColor = { r: 18, g: 17, b: 16 };   // Charcoal / Grafite escuro
    const accentColor = { r: 147, g: 51, b: 234 };  // Roxo / Purple para combinar com a identidade visual do app
    const accentAmber = { r: 217, g: 119, b: 6 };   // Detalhe dourado/amber para destaque premium

    // Margens e Dimensões da Página (A4: 210mm x 297mm)
    const margin = 15; // Margem de 15mm nas laterais para aproveitar melhor o espaço
    const pageWidth = 210;
    const pageHeight = 297;
    const contentWidth = pageWidth - margin * 2; // 180mm

    // --- CARREGAMENTO DE IMAGENS ---
    // Tentativa de puxar logo oficial da Sono Show Móveis
    const logoUrls = [
      'https://graph.facebook.com/sonoshowmoveis/picture?type=large',
      'https://www.sonoshowmoveis.com.br/arquivos/logo.png',
      'https://www.sonoshowmoveis.com.br/favicon.ico'
    ];
    
    let logoImg: HTMLImageElement | null = null;
    for (const url of logoUrls) {
      logoImg = await tryLoadImage(url);
      if (logoImg) break;
    }

    // Itens finais
    const finalItems = quote.items && quote.items.length > 0 
      ? quote.items 
      : [{ 
          id: '1', 
          name: quote.productInterest || 'Móveis de Quarto / Sala', 
          nickname: quote.productInterest || 'Móveis de Quarto / Sala', 
          price: quote.value, 
          quantity: 1,
          image: undefined,
          description: undefined
        }];

    // Pré-carrega as fotos de todos os produtos
    const itemImages: (HTMLImageElement | null)[] = await Promise.all(
      finalItems.map(item => item.image ? tryLoadImage(item.image) : Promise.resolve(null))
    );

    // 1. Cabeçalho com bloco estético no topo da página
    doc.setFillColor(primaryColor.r, primaryColor.g, primaryColor.b);
    doc.rect(0, 0, pageWidth, 42, 'F');

    // Faixa roxa decorativa no rodapé do cabeçalho
    doc.setFillColor(accentColor.r, accentColor.g, accentColor.b);
    doc.rect(0, 42, pageWidth, 2, 'F');

    // Renderiza a Logomarca da empresa no topo se carregada com sucesso
    if (logoImg) {
      // Container branco elegante para destacar a logomarca no cabeçalho escuro
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(margin, 6, 30, 30, 3, 3, 'F');
      try {
        doc.addImage(logoImg, 'PNG', margin + 1, 7, 28, 28);
      } catch (err) {
        console.warn("Falha ao desenhar imagem da logo no PDF.", err);
      }
      
      // Título Principal com deslocamento para a direita da logo
      doc.setTextColor(255, 255, 255);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(20);
      doc.text('SONO SHOW MÓVEIS', margin + 35, 18);

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(190, 190, 190);
      doc.text('PROPOSTA COMERCIAL DE VENDA', margin + 35, 24);
      doc.text(`Unidade de Atendimento: ${branchName.toUpperCase()}`, margin + 35, 29);
    } else {
      // Fallback sem logo (Apenas texto)
      doc.setTextColor(255, 255, 255);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(22);
      doc.text('SONO SHOW MÓVEIS', margin, 18);

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(190, 190, 190);
      doc.text('PROPOSTA COMERCIAL DE VENDA', margin, 24);
      doc.text(`Unidade de Atendimento: ${branchName.toUpperCase()}`, margin, 29);
    }

    // Número do Orçamento e Data (Canto superior direito)
    const quoteCode = `ORÇAMENTO: #${quote.id.substring(0, 8).toUpperCase()}`;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(accentAmber.r, accentAmber.g, accentAmber.b);
    doc.text(quoteCode, pageWidth - margin, 18, { align: 'right' });

    const docDate = new Date(quote.createdAt).toLocaleDateString('pt-BR');
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(`Emitido em: ${docDate}`, pageWidth - margin, 24, { align: 'right' });
    doc.text(`Validade da Proposta: ${quote.validityDays || 5} dias`, pageWidth - margin, 29, { align: 'right' });

    // 2. Seção de Informações do Cliente e Vendedor
    let currentY = 56;

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
    doc.text('DADOS GERAIS', margin, currentY);

    // Linha fina separadora de seção
    currentY += 2;
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.4);
    doc.line(margin, currentY, pageWidth - margin, currentY);

    // Grid de Detalhes
    currentY += 6;
    doc.setFontSize(9.5);
    doc.setFont('Helvetica', 'bold');
    doc.text('CLIENTE:', margin, currentY);
    doc.setFont('Helvetica', 'normal');
    doc.text(quote.clientName.toUpperCase(), margin + 24, currentY);

    doc.setFont('Helvetica', 'bold');
    doc.text('CONSULTOR:', margin + 95, currentY);
    doc.setFont('Helvetica', 'normal');
    doc.text(sellerName.toUpperCase(), margin + 124, currentY);

    currentY += 6;
    doc.setFont('Helvetica', 'bold');
    doc.text('CONTATO:', margin, currentY);
    doc.setFont('Helvetica', 'normal');
    doc.text(quote.clientPhone, margin + 24, currentY);

    doc.setFont('Helvetica', 'bold');
    doc.text('INTERESSE:', margin + 95, currentY);
    doc.setFont('Helvetica', 'normal');
    const interestText = (quote.productInterest || 'Consulta de Móveis').toUpperCase();
    const truncatedInterest = interestText.length > 24 ? interestText.substring(0, 22) + '...' : interestText;
    doc.text(truncatedInterest, margin + 124, currentY);

    // 3. Tabela de Produtos / Serviços (Mais espaçada com imagens de produtos)
    currentY += 12;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
    doc.text('ESPECIFICAÇÕES DOS PRODUTOS', margin, currentY);

    currentY += 2;
    doc.line(margin, currentY, pageWidth - margin, currentY);

    // Cabeçalho da Tabela
    currentY += 4;
    doc.setFillColor(245, 245, 245);
    doc.rect(margin, currentY, contentWidth, 8, 'F');
    
    doc.setFontSize(8.5);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(60, 60, 60);
    
    // Coordenadas das Colunas: 
    // ITEM: 0-10mm, IMAGEM: 10-30mm, PRODUTO: 30-115mm, QTD: 115-130mm, VLR UNIT: 130-155mm, SUBTOTAL: 155-180mm
    doc.text('ITEM', margin + 5, currentY + 5.5, { align: 'center' });
    doc.text('IMAGEM', margin + 20, currentY + 5.5, { align: 'center' });
    doc.text('DESCRIÇÃO DO PRODUTO / ESPECIFICAÇÕES', margin + 32, currentY + 5.5);
    doc.text('QTD', margin + 122.5, currentY + 5.5, { align: 'center' });
    doc.text('VLR. UNITÁRIO', margin + 152, currentY + 5.5, { align: 'right' });
    doc.text('SUBTOTAL', margin + 178, currentY + 5.5, { align: 'right' });

    currentY += 8;

    // Linhas de Produtos
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(40, 40, 40);

    finalItems.forEach((item, index) => {
      const rowHeight = 22; // Altura da linha expandida para acomodar imagens de 15mm

      // Verifica se a linha atual vai ultrapassar a área segura da página (Y ~ 250)
      if (currentY + rowHeight > 250) {
        doc.addPage();
        // Redesenha cabeçalho reduzido na nova página
        doc.setFillColor(primaryColor.r, primaryColor.g, primaryColor.b);
        doc.rect(0, 0, pageWidth, 20, 'F');
        doc.setFillColor(accentColor.r, accentColor.g, accentColor.b);
        doc.rect(0, 20, pageWidth, 1.5, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('SONO SHOW MÓVEIS - PROPOSTA COMERCIAL', margin, 13);
        doc.text(quoteCode, pageWidth - margin, 13, { align: 'right' });
        
        currentY = 28;
      }

      // Zebra background opcional
      if (index % 2 === 1) {
        doc.setFillColor(252, 252, 253);
        doc.rect(margin, currentY, contentWidth, rowHeight, 'F');
      }

      // Linha separadora de registro
      doc.setDrawColor(240, 240, 240);
      doc.setLineWidth(0.3);
      doc.line(margin, currentY + rowHeight, pageWidth - margin, currentY + rowHeight);

      // ITEM
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      doc.text(String(index + 1).padStart(2, '0'), margin + 5, currentY + 12, { align: 'center' });

      // IMAGEM DO PRODUTO (Renders thumbnail in PDF)
      const pImg = itemImages[index];
      if (pImg) {
        try {
          doc.setDrawColor(225, 225, 230);
          doc.setFillColor(255, 255, 255);
          // Quadrante para foto com pequena borda arredondada ou retangular
          doc.rect(margin + 12.5, currentY + 3.5, 15, 15, 'FD');
          doc.addImage(pImg, 'JPEG', margin + 13, currentY + 4, 14, 14);
        } catch (imgErr) {
          console.warn("Erro ao renderizar imagem do produto no PDF", imgErr);
        }
      } else {
        // Fallback placeholder para quando o produto não tem imagem
        doc.setDrawColor(235, 235, 240);
        doc.setFillColor(250, 250, 252);
        doc.rect(margin + 12.5, currentY + 3.5, 15, 15, 'FD');
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(160, 160, 160);
        doc.text('SEM FOTO', margin + 20, currentY + 12, { align: 'center' });
      }

      // NOME E DESCRIÇÃO DO PRODUTO (Embaixo um do outro para total clareza)
      doc.setTextColor(30, 30, 30);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9.5);
      
      const pName = (item.nickname || item.name || '').toUpperCase();
      // Encurta se for enorme para manter alinhado
      const displayName = pName.length > 40 ? pName.substring(0, 37) + '...' : pName;
      doc.text(displayName, margin + 32, currentY + 8);

      // DESCRIÇÃO DO PRODUTO
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(120, 120, 120);
      
      const pDesc = item.description || (item.name.includes('-') ? item.name.substring(item.name.indexOf('-') + 1) : 'Item oficial do catálogo Sono Show Móveis.');
      const cleanDesc = pDesc.trim().toUpperCase();
      const displayDesc = cleanDesc.length > 56 ? cleanDesc.substring(0, 53) + '...' : cleanDesc;
      doc.text(displayDesc, margin + 32, currentY + 13);

      // SKU/CÓDIGO se disponível
      if (item.id && !item.id.startsWith('item-')) {
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        doc.text(`SKU: ${item.id.toUpperCase()}`, margin + 32, currentY + 17.5);
      }

      // QTD
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(40, 40, 40);
      doc.text(String(item.quantity), margin + 122.5, currentY + 12, { align: 'center' });

      // VALOR UNITÁRIO
      doc.setFont('Helvetica', 'normal');
      doc.text(formatCurrency(item.price), margin + 152, currentY + 12, { align: 'right' });

      // SUBTOTAL
      doc.setFont('Helvetica', 'bold');
      doc.text(formatCurrency(item.price * item.quantity), margin + 178, currentY + 12, { align: 'right' });

      currentY += rowHeight;
    });

    // Linha final da tabela
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.4);
    doc.line(margin, currentY, pageWidth - margin, currentY);

    // 4. Painel de Valores Totais (Com margem de segurança para evitar overlaps)
    currentY += 6;
    if (currentY + 40 > 250) {
      doc.addPage();
      currentY = 25;
    }

    const totalsX = pageWidth - margin - 85;
    
    // Caixa de Totais do lado direito
    doc.setFillColor(250, 250, 252);
    doc.rect(totalsX, currentY, 85, 36, 'F');
    doc.setDrawColor(225, 225, 230);
    doc.rect(totalsX, currentY, 85, 36, 'S');

    doc.setFontSize(8.5);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text('Soma dos Produtos:', totalsX + 4, currentY + 6);
    doc.text(formatCurrency(quote.value), pageWidth - margin - 4, currentY + 6, { align: 'right' });

    const shipping = quote.shippingFee || 0;
    doc.text('Frete / Entrega:', totalsX + 4, currentY + 13);
    doc.text(shipping > 0 ? formatCurrency(shipping) : 'GRÁTIS', pageWidth - margin - 4, currentY + 13, { align: 'right' });

    const assembly = quote.assemblyFee || 0;
    const isAssemblyFree = quote.isAssemblyFree || false;
    doc.text('Taxa de Montagem:', totalsX + 4, currentY + 20);
    doc.text(isAssemblyFree || assembly === 0 ? 'GRÁTIS' : formatCurrency(assembly), pageWidth - margin - 4, currentY + 20, { align: 'right' });

    // Total Geral destacado em Roxo
    const grandTotal = quote.value + shipping + (isAssemblyFree ? 0 : assembly);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(accentColor.r, accentColor.g, accentColor.b);
    doc.text('VALOR TOTAL GERAL:', totalsX + 4, currentY + 29);
    doc.text(formatCurrency(grandTotal), pageWidth - margin - 4, currentY + 29, { align: 'right' });

    // Observações Gerais (Alinhado à esquerda das taxas, no mesmo Y)
    if (quote.notes) {
      doc.setTextColor(60, 60, 60);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('Observações Complementares:', margin, currentY + 5);
      
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      
      const splitNotes = doc.splitTextToSize(quote.notes, totalsX - margin - 6);
      doc.text(splitNotes, margin, currentY + 10);
    }

    currentY += 42; // Avança o Y para após o bloco de totais

    // 5. Termos Gerais de Aceite e Garantias
    if (currentY + 22 > 250) {
      doc.addPage();
      currentY = 25;
    }

    doc.setFillColor(254, 244, 255); // Fundo lavanda sutil
    doc.rect(margin, currentY, contentWidth, 18, 'F');
    doc.setDrawColor(accentColor.r, accentColor.g, accentColor.b);
    doc.rect(margin, currentY, contentWidth, 18, 'S');

    doc.setTextColor(accentColor.r, accentColor.g, accentColor.b);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('INFORMAÇÕES ADICIONAIS IMPORTANTES', margin + 4, currentY + 5);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 90, 110);
    doc.text('• Os preços contidos neste documento são exclusivos desta proposta e válidos apenas dentro do período estipulado de validade.', margin + 4, currentY + 9);
    doc.text('• O prazo de entrega começa a ser contado somente após a confirmação do pagamento e aprovação financeira.', margin + 4, currentY + 13);

    // 6. Bloco de Assinaturas (Rodapé)
    currentY += 28;
    if (currentY + 15 > 255) {
      doc.addPage();
      currentY = 30;
    }

    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.4);
    
    // Linha de assinatura do Vendedor
    doc.line(margin + 5, currentY, margin + 65, currentY);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(80, 80, 80);
    doc.text(sellerName.toUpperCase(), margin + 35, currentY + 5, { align: 'center' });
    doc.setFontSize(7.5);
    doc.text('Consultor de Vendas', margin + 35, currentY + 9, { align: 'center' });

    // Linha de assinatura do Cliente
    doc.line(pageWidth - margin - 65, currentY, pageWidth - margin - 5, currentY);
    doc.setFontSize(8.5);
    doc.text(quote.clientName.toUpperCase(), pageWidth - margin - 35, currentY + 5, { align: 'center' });
    doc.setFontSize(7.5);
    doc.text('Assinatura do Cliente', pageWidth - margin - 35, currentY + 9, { align: 'center' });

    // 7. Numeração de página e rodapé institucional absoluto em todas as páginas
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(150, 150, 150);
      doc.text('RadarConquista - Gestor Integrado de Vendas Sono Show Móveis', margin, pageHeight - 10);
      doc.text(`Página ${String(i).padStart(2, '0')} de ${String(totalPages).padStart(2, '0')}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
    }

    // Nome oficial para download
    const filename = `Orcamento_${quote.clientName.replace(/\s+/g, '_')}_${quote.id.substring(0, 6)}.pdf`;
    doc.save(filename);

    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    return false;
  }
}
