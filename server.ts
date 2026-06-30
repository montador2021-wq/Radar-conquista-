import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import fs from "fs";

const LOCAL_CATALOG = [
  {
    code: 'G-BLU-01',
    name: 'Guarda-Roupa Blumenau com Espelho 3 Portas 100% MDF Nature com Offwhite',
    nickname: 'Guarda-Roupa Blumenau',
    description: 'Guarda-roupa fabricado em 100% MDF de altíssima densidade. Conta com portas de correr, espelhos amplos na partição central e ótima profundidade interna.',
    specifications: 'Material: 100% MDF | Portas: 3 de correr | Gavetas: 4 internas | Altura: 2.30m',
    image: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=600&auto=format&fit=crop&q=80',
    category: 'Dormitório',
    price: 1899.00
  },
  {
    code: 'S-COP-02',
    name: 'Sofá Retrátil e Reclinável Copenhague 3 Lugares Suede Azul Caneta',
    nickname: 'Sofá Copenhague',
    description: 'Sofá retrátil com molas ensacadas e encosto reclinável de 5 estágios.',
    specifications: 'Lugares: 3 pessoas | Tipo: Retrátil e Reclinável | Tecido: Suede Premium',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&auto=format&fit=crop&q=80',
    category: 'Estofados',
    price: 2799.00
  }
];

// ==========================================
// CONFIGURAÇÕES & LISTA DE USER AGENTS (Anti-Blocking)
// ==========================================
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.1 Safari/605.1.15',
  'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1'
];

export interface CatalogProduct {
  code: string;
  sku: string;
  name: string;
  nickname: string;
  description: string;
  price: number;
  image: string;
  category: string;
  url: string;
  specifications?: string;
}

export type PlatformType = 'vtex' | 'shopify' | 'woocommerce' | 'unknown';

interface SearchResult {
  platform: PlatformType;
  products: CatalogProduct[];
}

// ==========================================
// HELPER DE CONEXÃO RESILIENTE (Retries + Timeouts)
// ==========================================
async function resilientFetch(
  url: string, 
  options: { timeoutMs?: number; retries?: number; headers?: Record<string, string> } = {}
): Promise<any> {
  const { timeoutMs = 8000, retries = 2, headers = {} } = options;
  let attempt = 0;
  let lastErr: any;

  while (attempt <= retries) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const randomUA = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
      const mergedHeaders = {
        'User-Agent': randomUA,
        'Accept': 'application/json, text/html, application/xhtml+xml, */*',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        ...headers
      };

      const response = await fetch(url, {
        headers: mergedHeaders,
        signal: controller.signal
      });

      clearTimeout(id);

      if (response.ok || response.status === 206) {
        return response;
      }

      throw new Error(`Erro HTTP status: ${response.status}`);
    } catch (err) {
      clearTimeout(id);
      lastErr = err;
      attempt++;
      if (attempt <= retries) {
        await new Promise(res => setTimeout(res, 500 * attempt)); // Delay progressivo
      }
    }
  }

  throw lastErr || new Error(`Falha ao conectar com o catálogo de destino.`);
}

// ==========================================
// CACHE EM MEMÓRIA COM TTL
// ==========================================
class CatalogCache {
  private static cache = new Map<string, { data: any; expiresAt: number }>();
  private static DEFAULT_TTL = 10 * 60 * 1000; // 10 Minutos

  static set(key: string, data: any, ttlMs: number = this.DEFAULT_TTL): void {
    const expiresAt = Date.now() + ttlMs;
    this.cache.set(key, { data, expiresAt });
  }

  static get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }
}

// ==========================================
// DETECTOR AUTOMÁTICO DE PLATAFORMA
// ==========================================
async function detectPlatform(site: string): Promise<PlatformType> {
  const protocol = site.startsWith('http') ? '' : 'https://';
  const cleanSite = site.replace(/\/$/, '');
  const targetUrl = `${protocol}${cleanSite}`;
  const lowercaseSite = cleanSite.toLowerCase();

  if (lowercaseSite.includes('shopify.com') || lowercaseSite.includes('myshopify')) return 'shopify';
  if (lowercaseSite.includes('sonoshow') || lowercaseSite.includes('vtexcommercestable')) return 'vtex';

  try {
    const response = await resilientFetch(targetUrl, { timeoutMs: 4000 });
    const serverHeader = response.headers.get('server')?.toLowerCase() || '';
    const xPoweredBy = response.headers.get('x-powered-by')?.toLowerCase() || '';

    if (serverHeader.includes('cloudflare') && xPoweredBy.includes('wp')) {
      return 'woocommerce';
    }

    const html = await response.text();
    const cleanHtml = html.toLowerCase();

    if (cleanHtml.includes('/cdn.shopify.com/') || cleanHtml.includes('shopify.theme') || cleanHtml.includes('shopify.checkout')) {
      return 'shopify';
    }

    if (cleanHtml.includes('/wp-content/') || cleanHtml.includes('/wp-json/') || cleanHtml.includes('woocommerce-js')) {
      return 'woocommerce';
    }

    if (cleanHtml.includes('/arquivos/') || cleanHtml.includes('vtex-image') || cleanHtml.includes('vtex.io') || cleanHtml.includes('/api/catalog_system/')) {
      return 'vtex';
    }
  } catch (err) {
    console.warn(`[Platform Detector] Não foi possível obter o HTML de ${site}. Usando fallback padrão.`, err);
  }

  return 'unknown';
}

// ==========================================
// ADAPTADOR VTEX
// ==========================================
async function searchVTEX(site: string, query: string): Promise<CatalogProduct[]> {
  const protocol = site.startsWith('http') ? '' : 'https://';
  const cleanSite = site.replace(/\/$/, '');
  const url = `${protocol}${cleanSite}/api/catalog_system/pub/products/search?ft=${encodeURIComponent(query)}`;

  try {
    const response = await resilientFetch(url, {
      headers: { 'Range': 'resources=0-24' }
    });

    const productsData = await response.json();
    if (!Array.isArray(productsData)) return [];

    return productsData.map(prod => {
      const item = prod.items?.[0];
      const image = item?.images?.[0]?.imageUrl || '';
      const price = item?.sellers?.[0]?.commertialRecord?.Price || item?.sellers?.[0]?.commertialOffer?.Price || 0;
      const category = prod.categories?.[0]?.replace(/^\/|\/$/g, '').split('/')?.[0] || 'Geral';
      const sku = item?.itemId || prod.productId || '';
      const productUrl = prod.link || `${protocol}${cleanSite}/${prod.linkText}/p`;
      const nickname = prod.productName?.split(' - ')?.[0] || prod.productName || '';

      return {
        code: sku,
        sku: sku,
        name: prod.productName || prod.brand || '',
        nickname: nickname,
        description: prod.description || 'Nenhuma descrição detalhada disponível.',
        price: Number(price),
        image: image,
        category: category,
        url: productUrl,
        specifications: prod.brand || 'Geral'
      };
    });
  } catch (err) {
    console.error(`[VTEX Adapter] Falhou para o site ${site}:`, err);
    throw err;
  }
}

// ==========================================
// ADAPTADOR SHOPIFY
// ==========================================
async function searchShopify(site: string, query: string): Promise<CatalogProduct[]> {
  const protocol = site.startsWith('http') ? '' : 'https://';
  const cleanSite = site.replace(/\/$/, '');
  const suggestUrl = `${protocol}${cleanSite}/search/suggest.json?q=${encodeURIComponent(query)}&resources[type]=product`;

  try {
    const response = await resilientFetch(suggestUrl);
    const json = await response.json();
    const products = json?.resources?.results?.products;

    if (Array.isArray(products) && products.length > 0) {
      return products.map((prod: any) => {
        const sku = prod.id?.toString() || '';
        const nickname = prod.title?.split(' - ')?.[0] || prod.title || '';
        return {
          code: sku,
          sku: sku,
          name: prod.title || '',
          nickname: nickname,
          description: prod.body || prod.vendor || 'Produto Shopify',
          price: Number(prod.price || 0),
          image: prod.image || prod.featured_image?.url || '',
          category: prod.type || 'Geral',
          url: `${protocol}${cleanSite}${prod.url}`,
          specifications: prod.vendor || 'Shopify'
        };
      });
    }
  } catch (err) {
    console.warn(`[Shopify Adapter] Suggest API indisponível em ${site}, tentando products.json...`);
  }

  const listUrl = `${protocol}${cleanSite}/products.json?limit=50`;
  try {
    const response = await resilientFetch(listUrl);
    const json = await response.json();
    const products = json?.products;

    if (!Array.isArray(products)) return [];

    const cleanQuery = query.toLowerCase();
    const filtered = products.filter((prod: any) => 
      prod.title?.toLowerCase().includes(cleanQuery) || 
      prod.body_html?.toLowerCase().includes(cleanQuery)
    );

    return filtered.map((prod: any) => {
      const variant = prod.variants?.[0];
      const image = prod.images?.[0]?.src || '';
      const sku = variant?.sku || prod.id?.toString() || '';
      const nickname = prod.title?.split(' - ')?.[0] || prod.title || '';
      return {
        code: sku,
        sku: sku,
        name: prod.title || '',
        nickname: nickname,
        description: prod.body_html?.replace(/<[^>]*>/g, '').slice(0, 160) || '',
        price: Number(variant?.price || 0),
        image: image,
        category: prod.product_type || 'Geral',
        url: `${protocol}${cleanSite}/products/${prod.handle}`,
        specifications: prod.vendor || 'Shopify'
      };
    });
  } catch (err) {
    console.error(`[Shopify Adapter] products.json falhou para o site ${site}:`, err);
    throw err;
  }
}

// ==========================================
// ADAPTADOR WOOCOMMERCE (Wordpress)
// ==========================================
async function searchWooCommerce(site: string, query: string): Promise<CatalogProduct[]> {
  const protocol = site.startsWith('http') ? '' : 'https://';
  const cleanSite = site.replace(/\/$/, '');
  const feedUrl = `${protocol}${cleanSite}/?feed=json&s=${encodeURIComponent(query)}`;

  try {
    const response = await resilientFetch(feedUrl);
    const data = await response.json();
    const items = data?.items || data;

    if (Array.isArray(items) && items.length > 0) {
      return items.map((item: any) => {
        const image = item.image || item.thumbnail || item.attachments?.[0]?.url || '';
        const docText = item.content_html || item.content_text || '';
        const priceRegex = /(?:R\$|USD|\$)\s?([0-9.,]+)/i;
        const match = priceRegex.exec(docText);
        const price = match ? parseFloat(match[1].replace('.', '').replace(',', '.')) : 0;
        const sku = item.id?.toString() || '';
        const nickname = item.title?.split(' - ')?.[0] || item.title || '';

        return {
          code: sku,
          sku: sku,
          name: item.title || '',
          nickname: nickname,
          description: docText.replace(/<[^>]*>/g, '').slice(0, 160) || '',
          price: price,
          image: image,
          category: item.categories?.[0] || 'WooCommerce',
          url: item.url || `${protocol}${cleanSite}/?p=${item.id}`,
          specifications: 'WooCommerce'
        };
      });
    }
  } catch (err) {
    console.warn(`[WooCommerce Adapter] WP Feed JSON indisponível em ${site}, tentando REST API...`);
  }

  const postsUrl = `${protocol}${cleanSite}/wp-json/wp/v2/posts?search=${encodeURIComponent(query)}&_embed`;
  try {
    const response = await resilientFetch(postsUrl);
    const posts = await response.json();

    if (!Array.isArray(posts)) return [];

    return posts.map((post: any) => {
      const title = post.title?.rendered || '';
      const embeddedMedia = post._embedded?.['wp:featuredmedia']?.[0];
      const image = embeddedMedia?.source_url || '';
      const docText = post.excerpt?.rendered || post.content?.rendered || '';

      const priceRegex = /(?:R\$|USD|\$)\s?([0-9.,]+)/i;
      const match = priceRegex.exec(docText);
      const price = match ? parseFloat(match[1].replace('.', '').replace(',', '.')) : 0;
      const sku = post.id?.toString() || '';
      const nickname = title.split(' - ')[0] || title;

      return {
        code: sku,
        sku: sku,
        name: title,
        nickname: nickname,
        description: docText.replace(/<[^>]*>/g, '').slice(0, 160),
        price: price,
        image: image,
        category: 'Geral',
        url: post.link || `${protocol}${cleanSite}/?p=${post.id}`,
        specifications: 'WordPress'
      };
    });
  } catch (err) {
    console.error(`[WooCommerce Adapter] WordPress API falhou para o site ${site}:`, err);
    throw err;
  }
}

// ==========================================
// SCRAPER UNIVERSAL DE COBERTURA (HTML Fallback)
// ==========================================
async function scrapeWebsiteFallback(site: string, query: string): Promise<CatalogProduct[]> {
  const protocol = site.startsWith('http') ? '' : 'https://';
  const cleanSite = site.replace(/\/$/, '');

  const searchPaths = [
    `/search?q=${encodeURIComponent(query)}`,
    `/busca?q=${encodeURIComponent(query)}`,
    `/?s=${encodeURIComponent(query)}`,
    `/busca?ft=${encodeURIComponent(query)}`
  ];

  let html = '';
  let searchUrlUsed = '';

  for (const path of searchPaths) {
    const tryUrl = `${protocol}${cleanSite}${path}`;
    try {
      const response = await resilientFetch(tryUrl, { timeoutMs: 5000 });
      html = await response.text();
      searchUrlUsed = tryUrl;
      break; 
    } catch (err) {
      console.warn(`[Scraper Prober] Falhou ao testar caminho: ${tryUrl}`);
    }
  }

  if (!html) return [];

  try {
    const products: CatalogProduct[] = [];
    let searchPos = 0;
    let limit = 8; 
    
    while (limit > 0) {
      const ldJsonIdx = html.indexOf('"application/ld+json"', searchPos);
      if (ldJsonIdx === -1) break;
      
      const scriptStartIdx = html.lastIndexOf('<script', ldJsonIdx);
      const scriptEndIdx = html.indexOf('</script>', ldJsonIdx);
      if (scriptStartIdx === -1 || scriptEndIdx === -1) {
        searchPos = ldJsonIdx + 20;
        continue;
      }
      
      const tagOpenEnd = html.indexOf('>', scriptStartIdx);
      if (tagOpenEnd === -1 || tagOpenEnd > scriptEndIdx) {
        searchPos = scriptEndIdx + 9;
        continue;
      }
      
      const jsonText = html.substring(tagOpenEnd + 1, scriptEndIdx).trim();
      searchPos = scriptEndIdx + 9;
      limit--;
      
      try {
        const parsed = JSON.parse(jsonText);
        const objs = Array.isArray(parsed) ? parsed : [parsed];
        for (const obj of objs) {
          if (obj && (obj['@type']?.toLowerCase() === 'product' || obj['@type'] === 'Product')) {
            const offer = Array.isArray(obj.offers) ? obj.offers[0] : obj.offers;
            const price = offer?.price || offer?.lowPrice || 0;
            const image = Array.isArray(obj.image) ? obj.image[0] : obj.image || '';
            const sku = obj.sku || obj.mpn || 'SKU-SCRAPER';
            const nickname = obj.name?.split(' - ')?.[0] || obj.name || 'Produto Encontrado';
            
            products.push({
              code: sku,
              sku: sku,
              name: obj.name || 'Produto Encontrado',
              nickname: nickname,
              description: obj.description?.slice(0, 160) || 'Nenhuma descrição estruturada.',
              price: Number(price),
              image: image,
              category: obj.category || 'Geral',
              url: obj.url || searchUrlUsed,
              specifications: 'Scraper Fallback'
            });
          }
        }
      } catch {}
    }

    if (products.length > 0) return products;

    const headEndIdx = html.toLowerCase().indexOf('</head>');
    const headHtml = headEndIdx !== -1 ? html.substring(0, headEndIdx) : html.substring(0, 120000);

    const titleMatch = headHtml.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i);
    const imageMatch = headHtml.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
    const priceMatch = headHtml.match(/<meta\s+property="product:price:amount"\s+content="([^"]+)"/i) || 
                       headHtml.match(/<meta\s+property="og:price:amount"\s+content="([^"]+)"/i);
                        
    if (titleMatch) {
      const title = titleMatch[1];
      const nickname = title.split(' - ')[0] || title;
      return [{
        code: 'SKU-SOCIAL',
        sku: 'SKU-SOCIAL',
        name: title,
        nickname: nickname,
        description: 'Produto identificado via tags sociais OpenGraph.',
        price: priceMatch ? parseFloat(priceMatch[1]) : 0,
        image: imageMatch ? imageMatch[1] : '',
        category: 'Geral',
        url: searchUrlUsed,
        specifications: 'OpenGraph'
      }];
    }

    return [];
  } catch (err) {
    console.warn(`[Scraper Error] Erro ao processar o HTML:`, err);
    return [];
  }
}

// ==========================================
// ORQUESTRADOR CENTRAL DE CONSULTAS
// ==========================================
async function queryUniversalCatalog(site: string, query: string): Promise<SearchResult> {
  const cleanSite = site.trim().replace(/^https?:\/\//i, '').replace(/\/$/, '');
  const cleanQuery = query.trim();

  const cacheKey = `${cleanSite}:${cleanQuery.toLowerCase()}`;
  const cachedData = CatalogCache.get(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  const platform = await detectPlatform(cleanSite);

  let products: CatalogProduct[] = [];
  let success = false;

  try {
    switch (platform) {
      case 'vtex':
        products = await searchVTEX(cleanSite, cleanQuery);
        success = true;
        break;
      case 'shopify':
        products = await searchShopify(cleanSite, cleanQuery);
        success = true;
        break;
      case 'woocommerce':
        products = await searchWooCommerce(cleanSite, cleanQuery);
        success = true;
        break;
      default:
        products = await scrapeWebsiteFallback(cleanSite, cleanQuery);
        success = products.length > 0;
        break;
    }
  } catch (err) {
    console.warn(`[Orchestrator] Adaptador nativo ${platform} falhou para ${cleanSite}. Forçando Scraper Fallback...`);
  }

  if (!success || products.length === 0) {
    try {
      products = await scrapeWebsiteFallback(cleanSite, cleanQuery);
    } catch (fallbackErr) {
      console.error(`[Orchestrator] Falha crítica em todos os métodos para ${cleanSite}:`, fallbackErr);
    }
  }

  const result: SearchResult = { platform, products };
  CatalogCache.set(cacheKey, result);

  return result;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Rota de busca do catálogo universal
  app.get('/api/catalog', async (req, res) => {
    try {
      const site = (req.query.site as string || 'catalogo.sonoshowmoveis.com.br').trim();
      const query = (req.query.query as string || req.query.q as string || '').toString().trim();

      if (!query) {
        return res.status(400).json({ success: false, error: 'O parâmetro de pesquisa "query" ou "q" é obrigatório.' });
      }

      const result = await queryUniversalCatalog(site, query);
      return res.json({
        success: true,
        site,
        query,
        ...result
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: 'Erro interno ao consultar o catálogo inteligente.',
        details: err?.message || err
      });
    }
  });

  // Rota de busca integrada ao catálogo oficial (VTEX)
  app.get('/api/products/search', async (req, res) => {
    const rawQuery = (req.query.q || '').toString().trim();
    if (!rawQuery) {
      return res.json([]);
    }

    // Normalização de termos para melhor taxa de acerto na VTEX
    const queryTerm = rawQuery.replace(/guarda\s+roupa/gi, 'guarda-roupa').toLowerCase();
    
    try {
      // Requisição com timeout seguro de 4 segundos
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 4000);

      const response = await fetch(
        `https://catalogo.sonoshowmoveis.com.br/api/catalog_system/pub/products/search?ft=${encodeURIComponent(queryTerm)}`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json'
          },
          signal: controller.signal
        }
      );
      clearTimeout(id);

      if (response.ok) {
        const vtexProducts = await response.json();
        if (Array.isArray(vtexProducts) && vtexProducts.length > 0) {
          const mappedProducts: any[] = [];

          vtexProducts.forEach((prod: any) => {
            if (!prod.items || !Array.isArray(prod.items)) return;

            let category = 'Móveis';
            if (prod.categories && prod.categories.length > 0) {
              const cleanPath = prod.categories[0].split('/').filter(Boolean);
              category = cleanPath[cleanPath.length - 1] || 'Móveis';
            }
            
            const cleanDesc = (prod.description || '').replace(/<[^>]*>/g, '').substring(0, 300);

            prod.items.forEach((sku: any) => {
              const seller = sku?.sellers?.[0]?.commertialOffer;
              const image = sku?.images?.[0]?.imageUrl || '';
              const price = seller?.Price || 0;

              let displayName = sku.nameComplete || '';
              if (!displayName) {
                if (sku.name && prod.productName && !prod.productName.toLowerCase().includes(sku.name.toLowerCase())) {
                  displayName = `${prod.productName} - ${sku.name}`;
                } else {
                  displayName = prod.productName || sku.name || '';
                }
              }

              mappedProducts.push({
                code: sku?.itemId || prod.productId || '',
                name: displayName,
                nickname: prod.productName?.split(' - ')?.[0] || prod.productName || '',
                description: cleanDesc || displayName,
                specifications: prod.brand || 'Sono Show Móveis',
                image: image,
                category: category,
                price: price
              });
            });
          });

          return res.json(mappedProducts);
        }
      }
    } catch (error) {
      console.warn("API de catálogo offline ou excedeu tempo de resposta. Usando fallback local.", error);
    }

    // Fallback em caso de erro de conexão com a API oficial
    const filtered = LOCAL_CATALOG.filter(prod => {
      return (
        prod.code.toLowerCase().includes(queryTerm) ||
        prod.name.toLowerCase().includes(queryTerm) ||
        prod.nickname.toLowerCase().includes(queryTerm) ||
        prod.category.toLowerCase().includes(queryTerm)
      );
    });

    return res.json(filtered);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);

    app.get('*all', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        const fs = await import('fs');
        let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    fs.writeFileSync(path.resolve(process.cwd(), 'server-debug.log'), `Server started successfully on port ${PORT} at ${new Date().toISOString()}\n`, { flag: 'a' });
    console.log(`Server running on http://localhost:${PORT}`);
  });

  server.on('error', (err: any) => {
    fs.writeFileSync(path.resolve(process.cwd(), 'server-debug.log'), `Server error event: ${err?.stack || err || JSON.stringify(err)}\n`, { flag: 'a' });
  });
}

// Global process error catchers
process.on('uncaughtException', (err) => {
  fs.writeFileSync(path.resolve(process.cwd(), 'server-debug.log'), `Uncaught Exception: ${err?.stack || err}\n`, { flag: 'a' });
});

process.on('unhandledRejection', (reason: any, promise) => {
  fs.writeFileSync(path.resolve(process.cwd(), 'server-debug.log'), `Unhandled Rejection: ${reason?.stack || reason}\n`, { flag: 'a' });
});

startServer().catch((err: any) => {
  fs.writeFileSync(path.resolve(process.cwd(), 'server-debug.log'), `startServer promise catch: ${err?.stack || err}\n`, { flag: 'a' });
});
