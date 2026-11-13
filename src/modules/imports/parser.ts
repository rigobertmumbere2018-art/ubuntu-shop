import * as XLSX from 'xlsx';
import JSZip from 'jszip';

export interface ParsedProductRow {
  rowNumber: number;
  reference: string;
  name: string;
  category: string;
  support: string;
  description: string;
  priceMinCents: number;
  priceMaxCents: number;
  depositType: 'fixed' | 'percentage';
  depositValue: number;
  keywords: string;
  dimensions: string;
  personalization: string;
  availability: 'in_stock' | 'made_to_order' | 'out_of_stock';
  stock: number | null;
  primaryImageRef: string;
  secondaryImageRefs: string[];
  errors: string[];
}

export function parseExcelBuffer(buffer: ArrayBuffer): ParsedProductRow[] {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

  return rows.map((raw, idx) => {
    const errors: string[] = [];
    const reference = String(raw['Référence'] || '').trim();
    const name = String(raw['Nom'] || '').trim();
    const description = String(raw['Description'] || '');
    const priceMin = Number(raw['Prix minimum']);
    const priceMax = Number(raw['Prix maximum'] === '' ? priceMin : raw['Prix maximum']);
    const depTypeRaw = String(raw['Type acompte (fixed/percentage)'] || 'fixed').trim();
    const depValRaw = Number(raw['Valeur acompte'] || 0);

    if (!reference) errors.push('Référence obligatoire manquante');
    if (!name) errors.push('Nom obligatoire manquant');
    if (!description.trim()) errors.push('Description obligatoire manquante');
    if (Number.isNaN(priceMin) || priceMin < 0) errors.push('Prix minimum invalide');
    if (Number.isNaN(priceMax) || priceMax < priceMin) errors.push('Prix maximum invalide (< prix minimum)');

    const depositType: 'fixed' | 'percentage' = depTypeRaw === 'percentage' ? 'percentage' : 'fixed';
    const depositValue = depositType === 'percentage'
      ? Math.round(depValRaw * 100) // % -> basis points
      : Math.round(depValRaw * 100); // USD -> cents

    return {
      rowNumber: idx + 2,
      reference,
      name,
      category: String(raw['Catégorie'] || '').trim(),
      support: String(raw['Support'] || '').trim(),
      description,
      priceMinCents: Number.isNaN(priceMin) ? 0 : Math.round(priceMin * 100),
      priceMaxCents: Number.isNaN(priceMax) ? 0 : Math.round(priceMax * 100),
      depositType,
      depositValue: Number.isNaN(depositValue) ? 0 : depositValue,
      keywords: String(raw['Mots-clés'] || '').trim(),
      dimensions: String(raw['Dimensions'] || '').trim(),
      personalization: String(raw['Personnalisation'] || '').trim(),
      availability: (['in_stock', 'made_to_order', 'out_of_stock'].includes(String(raw['Disponibilité']))
        ? String(raw['Disponibilité'])
        : 'made_to_order') as ParsedProductRow['availability'],
      stock: raw['Stock'] === '' ? null : Number(raw['Stock']),
      primaryImageRef: String(raw['Référence de photographie principale'] || '').trim(),
      secondaryImageRefs: String(raw['Références des photographies secondaires'] || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      errors,
    };
  });
}

export async function parseDocxBuffer(buffer: ArrayBuffer): Promise<{
  rows: ParsedProductRow[];
  embeddedImages: Map<string, Uint8Array>;
}> {
  const zip = await JSZip.loadAsync(buffer);
  const embeddedImages = new Map<string, Uint8Array>();

  for (const [path, file] of Object.entries(zip.files)) {
    if (path.startsWith('word/media/') && !file.dir) {
      embeddedImages.set(path.replace('word/media/', ''), await file.async('uint8array'));
    }
  }

  const xmlText = await zip.file('word/document.xml')?.async('text');
  if (!xmlText) throw new Error('Fichier Word invalide : word/document.xml manquant.');

  const rows: ParsedProductRow[] = [];
  const trMatches = xmlText.match(/<w:tr[\s\S]*?<\/w:tr>/g) || [];

  for (let i = 1; i < trMatches.length; i++) {
    const tcMatches = trMatches[i].match(/<w:tc[\s\S]*?<\/w:tc>/g) || [];
    const cells = tcMatches.map((tc) =>
      (tc.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g) || [])
        .map((t) => t.replace(/<[^>]+>/g, ''))
        .join('')
    );

    if (cells.every((c) => !c.trim())) continue;

    const errors: string[] = [];
    const [
      reference = '', name = '', category = '', support = '', description = '',
      pMin = '', pMax = '', dep = '', dimensions = '', personalization = '',
      availability = '', stock = '', keywords = '', primaryImg = ''
    ] = cells;

    const priceMin = Number(pMin.trim());
    const priceMax = Number(pMax.trim() === '' ? priceMin : pMax.trim());

    if (!reference.trim()) errors.push('Référence obligatoire manquante');
    if (!name.trim()) errors.push('Nom obligatoire manquant');
    if (!description.trim()) errors.push('Description obligatoire manquante');
    if (Number.isNaN(priceMin) || priceMin < 0) errors.push('Prix minimum invalide');

    rows.push({
      rowNumber: i + 1,
      reference: reference.trim(),
      name: name.trim(),
      category: category.trim(),
      support: support.trim(),
      description,
      priceMinCents: Number.isNaN(priceMin) ? 0 : Math.round(priceMin * 100),
      priceMaxCents: Number.isNaN(priceMax) ? 0 : Math.round(priceMax * 100),
      depositType: 'fixed',
      depositValue: Math.round(Number(dep.trim() || 0) * 100),
      keywords: keywords.trim(),
      dimensions: dimensions.trim(),
      personalization: personalization.trim(),
      availability: (['in_stock', 'made_to_order', 'out_of_stock'].includes(availability.trim())
        ? availability.trim()
        : 'made_to_order') as ParsedProductRow['availability'],
      stock: stock.trim() === '' ? null : Number(stock.trim()),
      primaryImageRef: primaryImg.trim(),
      secondaryImageRefs: [],
      errors,
    });
  }

  return { rows, embeddedImages };
}
