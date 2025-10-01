import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import iconv from 'iconv-lite';
import { parse as parseCsvSync } from 'csv-parse/sync';

type RawRow = Record<string, string | undefined>;

function looksUtf16(buf: Buffer) {
  // UTF-16LE BOM = FF FE, UTF-16BE BOM = FE FF, or lots of nulls
  if (
    buf.length >= 2 &&
    ((buf[0] === 0xff && buf[1] === 0xfe) ||
      (buf[0] === 0xfe && buf[1] === 0xff))
  )
    return true;
  // Heuristic: many 0x00 bytes
  let zeros = 0;
  for (let i = 0; i < Math.min(buf.length, 1024); i++)
    if (buf[i] === 0x00) zeros++;
  return zeros > 50;
}

function normalizeDomain(url?: string) {
  if (!url) return '';
  let s = url.trim();
  s = s.replace(/^https?:\/\//i, '').replace(/^www\./i, '');
  s = s.split('/')[0].split('?')[0].trim().toLowerCase();
  s = s.replace(/[)\s,;]+$/, '');
  const m = s.match(/[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/);
  return m ? m[0] : '';
}

function extractDomainFromText(text?: string) {
  if (!text) return '';
  const s = String(text);
  const urlMatch = s.match(/https?:\/\/[^\s)]+/i);
  if (urlMatch) return normalizeDomain(urlMatch[0]);
  const wwwMatch = s.match(/\bwww\.[^\s)]+/i);
  if (wwwMatch) return normalizeDomain(wwwMatch[0]);
  const domMatch = s.match(/[a-z0-9][a-z0-9.-]*\.[a-z]{2,}/i);
  return domMatch ? normalizeDomain(domMatch[0]) : '';
}

// removed email derivation to avoid injecting artificial emails; we only use real emails from CSV when present

function findCol(cols: string[], ...candidates: string[]) {
  const lc = cols.map((c) => c.toLowerCase());
  for (const cand of candidates) {
    const i = lc.indexOf(cand.toLowerCase());
    if (i !== -1) return cols[i];
  }
  // partial match
  for (const cand of candidates) {
    const idx = lc.findIndex((c) => c.includes(cand.toLowerCase()));
    if (idx !== -1) return cols[idx];
  }
  return undefined;
}

function parseStates(raw?: string) {
  if (!raw) return null;
  // Accept "TX, VA, CA" or "TX VA CA"
  const parts = raw
    .split(/[, \t]+/)
    .map((x) => x.trim().toUpperCase())
    .filter(Boolean);
  const states = parts.filter((p) => /^[A-Z]{2}$/.test(p));
  return states.length ? { licensedStates: states } : null;
}

function coerceInsuranceType(filename: string): 'AUTO' | 'COMMERCIAL_AUTO' {
  const lc = filename.toLowerCase();
  // convention: "(1)" is commercial, the other is auto; adapt if your names differ
  return lc.includes('(1)') || lc.includes('commercial')
    ? 'COMMERCIAL_AUTO'
    : 'AUTO';
}

function loadFileRows(filePath: string): RawRow[] {
  const buf = fs.readFileSync(filePath);
  const decoded = looksUtf16(buf)
    ? iconv.decode(buf, 'utf16le')
    : buf.toString('utf8');

  // choose delimiter: if there are a lot of tabs, treat as TSV
  const isTSV =
    (decoded.match(/\t/g) || []).length > (decoded.match(/,/g) || []).length;
  const rows = parseCsvSync(decoded, {
    columns: true,
    skip_empty_lines: true,
    delimiter: isTSV ? '\t' : ',',
    bom: true,
    relax_column_count: true,
    relax_quotes: true,
    trim: true,
  });

  return rows as RawRow[];
}

function fallbackScanCompanies(filePath: string) {
  const buf = fs.readFileSync(filePath);
  const decoded = looksUtf16(buf)
    ? iconv.decode(buf, 'utf16le')
    : buf.toString('utf8');
  const lines = decoded.split(/\r?\n/);
  const results: {
    companyName: string;
    naic: string;
    types: ('AUTO' | 'COMMERCIAL_AUTO')[];
    websiteUrl?: string | null;
    companyLicensed?: { licensedStates: string[] } | null;
    companyInformation?: string | null;
  }[] = [];
  const seen = new Set<string>();
  let lastIdx = -1;
  for (const line of lines) {
    const m =
      line.match(/^(.*?)(?:\s+|\t)\(NAIC[^0-9]*([0-9]{3,})\)/i) ||
      line.match(/^(.*?)(?:\s+|\t)\(.*?Company Code\s*([0-9]{3,})\)/i);
    if (m) {
      const name = m[1].toString().trim();
      const naic = m[2].toString().trim();
      if (name && naic && !seen.has(name + '|' + naic)) {
        const lc = line.toLowerCase();
        const hasCommercial = /commercial\s*auto|commercial\s*automobile/.test(
          lc,
        );
        const hasAuto = /(^|[^a-z])auto([^a-z]|$)|automobile/.test(lc);
        const types: ('AUTO' | 'COMMERCIAL_AUTO')[] = [];
        if (hasAuto) types.push('AUTO');
        if (hasCommercial) types.push('COMMERCIAL_AUTO');
        results.push({
          companyName: name,
          naic,
          types: types.length ? types : ['AUTO'],
          websiteUrl: null,
          companyLicensed: null,
          companyInformation: null,
        });
        lastIdx = results.length - 1;
        seen.add(name + '|' + naic);
      }
      continue;
    }
    if (lastIdx >= 0) {
      const dom = extractDomainFromText(line);
      if (dom && !results[lastIdx].websiteUrl) {
        results[lastIdx].websiteUrl = `https://${dom}`;
      }
      if (/licensed\s+in|company\s+licensed/i.test(line)) {
        const states = parseStates(line);
        if (states) results[lastIdx].companyLicensed = states as any;
      }
      const trimmed = line.trim();
      if (trimmed) {
        const prev = results[lastIdx].companyInformation || '';
        results[lastIdx].companyInformation = (prev + ' ' + trimmed).trim();
      }
    }
  }
  return results;
}

function toSeedRows(rows: RawRow[], filename: string) {
  if (!rows.length) return [];
  const cols = Object.keys(rows[0]);

  const nameCol = findCol(
    cols,
    'company name',
    'full company name',
    'name',
    'insurer',
    'company',
  );
  const naicCol = findCol(
    cols,
    'naic',
    'naic company code',
    'naic code',
    'company code',
    'cocode',
  );
  // Be strict to avoid matching "licensed" (contains 'site')
  const webCol = findCol(
    cols,
    'Web Site',
    'website',
    'website url',
    'url_start',
    'url',
  );
  const statesCol = findCol(
    cols,
    'licensed states',
    'states',
    'licenses',
    'license states',
    'company licensed in',
    'licensed in',
    'company licensed',
  );
  const addrCol = findCol(cols, 'address', 'location', 'mailing address');
  const infoCol = findCol(cols, 'company information', 'information', 'notes');
  const phoneCol = findCol(cols, 'phone', 'telephone', 'tel', 'contact phone');
  const emailCol = findCol(
    cols,
    'email',
    'e-mail',
    'contact email',
    'mail',
    'contact mail',
  );
  const typesCol = findCol(cols, 'insurance types', 'insurance type', 'types');
  const defaultType: 'AUTO' | 'COMMERCIAL_AUTO' = coerceInsuranceType(
    path.basename(filename),
  );

  const out: Array<{
    companyName: string;
    contactEmail: string | null;
    naic: string;
    insuranceType: 'AUTO' | 'COMMERCIAL_AUTO';
    websiteUrl: string | null;
    companyLicensed: any;
    companyInformation: string | null;
  }> = [];

  rows.forEach((r) => {
    const companyName = (r[nameCol || ''] || '')
      .toString()
      .replace(/\s+/g, ' ')
      .trim();
    let naic = ((r[naicCol || ''] || '').toString().match(/\d{3,}/) || [''])[0];
    // Fallback: sometimes NAIC appears inside the name column like
    // "... (NAIC Company Code 15267)". Extract digits from name if needed.
    if (!naic) {
      const nameCell = (r[nameCol || ''] || '').toString();
      const m =
        nameCell.match(/NAIC[^0-9]*([0-9]{3,})/i) ||
        nameCell.match(/\b([0-9]{3,})\b/);
      naic = m ? m[1] || m[0] : '';
    }
    const websiteRaw = (r[webCol || ''] || '').toString();
    let domain = normalizeDomain(websiteRaw);
    if (!domain) {
      // Fallback: scan entire row for any domain-like token
      const joined = Object.values(r)
        .filter(Boolean)
        .map((v) => String(v))
        .join(' ');
      domain = extractDomainFromText(joined);
    }
    const websiteUrl = domain ? `https://${domain}` : null;
    let contactEmailRaw = (r[emailCol || ''] || '').toString().trim();
    if (contactEmailRaw === '') contactEmailRaw = '';
    const emailMatch = contactEmailRaw.match(
      /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
    );
    const contactEmail = emailMatch ? emailMatch[0] : null;
    // derive types from row if possible
    let types: ('AUTO' | 'COMMERCIAL_AUTO')[] = [];
    if (typesCol) {
      const raw = (r[typesCol] || '').toString().toLowerCase();
      const hasCommercial = /commercial\s*auto|commercial\s*automobile/.test(
        raw,
      );
      const hasAuto = /(^|[^a-z])auto([^a-z]|$)|automobile/.test(raw);
      if (hasAuto) types.push('AUTO');
      if (hasCommercial) types.push('COMMERCIAL_AUTO');
      types = [...new Set(types)];
    }
    if (!types.length) types = [defaultType];

    const licensedJson = parseStates((r[statesCol || ''] || '').toString());
    const addr = (r[addrCol || ''] || '').toString().trim();
    const infoRaw = (r[infoCol || ''] || '').toString().trim();
    const phone = (r[phoneCol || ''] || '').toString().trim();
    const info =
      [infoRaw, addr, phone ? `Phone: ${phone}` : '']
        .filter(Boolean)
        .join(' ')
        .trim() || null;
    types.forEach((t) =>
      out.push({
        companyName,
        contactEmail,
        naic,
        insuranceType: t,
        websiteUrl,
        companyLicensed: licensedJson,
        companyInformation: info,
      }),
    );
  });
  return out.filter((x) => x.companyName && x.naic);
}

export class InsuranceCompanySeeder {
  async run(prisma: PrismaClient) {
    console.log('➡️  Seeding insurance companies...');

    // Adjust file names/locations if needed
    const root = process.cwd();
    const candidatesAll = [
      path.resolve(root, 'prisma/data/insurance_companies_seed.from_csv.csv'),
      path.resolve(root, 'prisma/data/insurance_companies_seed.from_csv2.csv'),
    ];
    const candidates = candidatesAll.filter(fs.existsSync);

    if (!candidates.length) {
      console.warn(
        '⚠️  No seed CSV files found; skipping InsuranceCompany seeding',
      );
      return;
    }

    console.log(
      '   📄 Source files:',
      candidates.map((c) => path.relative(root, c)),
    );
    let all: any[] = [];
    for (const file of candidates) {
      const rows = loadFileRows(file);
      const seedRows = toSeedRows(rows, file);
      if (seedRows.length === 0) {
        // Fallback for poorly formatted TSV/CSV: scan plain text for name + NAIC
        const scanned = fallbackScanCompanies(file).flatMap((r) =>
          (r.types && r.types.length
            ? r.types
            : [coerceInsuranceType(path.basename(file))]
          ).map((t) => ({
            companyName: r.companyName,
            contactEmail: null,
            naic: r.naic,
            insuranceType: t,
            websiteUrl: r.websiteUrl ?? null,
            companyLicensed: null,
            companyInformation: null,
          })),
        );
        console.log(
          `   🔎 Parsed ${seedRows.length} structured + ${scanned.length} scanned from ${path.basename(file)}`,
        );
        all = all.concat(scanned);
      } else {
        console.log(
          `   ✅ Parsed ${seedRows.length} structured rows from ${path.basename(file)}`,
        );
        all = all.concat(seedRows);
      }
    }

    // Group by normalized website domain so that different names with the same website are treated as the same company
    type Aggregated = {
      domainKey: string; // normalized domain or fallback key
      websiteUrl: string | null;
      names: string[];
      naics: string[];
      emails: string[];
      types: Set<'AUTO' | 'COMMERCIAL_AUTO'>;
      licensedStates: Set<string> | null; // union if available
      informationParts: string[];
    };

    function pickPreferredName(names: string[]): string {
      const counts = new Map<string, number>();
      names.forEach((n) => counts.set(n, (counts.get(n) || 0) + 1));
      let best = '';
      let bestCount = -1;
      for (const [n, c] of counts.entries()) {
        if (c > bestCount) {
          best = n;
          bestCount = c;
        } else if (c === bestCount) {
          // tie-breaker: shorter trimmed name
          if (n.trim().length < best.trim().length) best = n;
        }
      }
      return best || names[0] || 'Unknown';
    }

    function normalizeWebsiteToDomainKey(
      websiteUrl: string | null | undefined,
    ) {
      const dom = normalizeDomain(websiteUrl || '');
      return dom || '';
    }

    const groups = new Map<string, Aggregated>();
    for (const r of all) {
      const dom = normalizeWebsiteToDomainKey(r.websiteUrl);
      const key =
        dom ||
        `__no_website__|${r.companyName.toLowerCase()}|${r.insuranceType}`;
      const g = groups.get(key) || {
        domainKey: dom,
        websiteUrl: dom ? `https://${dom}` : null,
        names: [],
        naics: [],
        emails: [],
        types: new Set<'AUTO' | 'COMMERCIAL_AUTO'>(),
        licensedStates: null,
        informationParts: [],
      };
      if (r.companyName) g.names.push(r.companyName);
      if (r.naic) g.naics.push(r.naic);
      if (r.contactEmail) g.emails.push(r.contactEmail);
      if (r.insuranceType) g.types.add(r.insuranceType);
      if (r.companyLicensed && r.companyLicensed.licensedStates) {
        if (!g.licensedStates) g.licensedStates = new Set<string>();
        for (const s of r.companyLicensed.licensedStates)
          g.licensedStates.add(String(s).toUpperCase());
      }
      if (r.companyInformation) g.informationParts.push(r.companyInformation);
      groups.set(key, g);
    }

    const finalRecords: Array<{
      companyName: string;
      contactEmail: string | null;
      naic: string;
      insuranceType: 'AUTO' | 'COMMERCIAL_AUTO';
      websiteUrl: string | null;
      companyLicensed: any;
      companyInformation: string | null;
    }> = [];

    for (const g of groups.values()) {
      const preferredName = pickPreferredName(
        g.names.length ? g.names : ['Unknown'],
      );
      const naic = (g.naics.find((x) => x && x.trim()) || '').trim();
      const websiteUrl = g.websiteUrl;
      const preferredEmail = (g.emails.find((e) => e && e.trim()) || '').trim();
      const contactEmail: string | null = preferredEmail || null;
      const companyLicensed = g.licensedStates
        ? { licensedStates: Array.from(g.licensedStates) }
        : null;
      const infoJoined = Array.from(new Set(g.informationParts.filter(Boolean)))
        .join(' ')
        .trim();
      const companyInformation = infoJoined || null;

      const types = g.types.size ? Array.from(g.types) : (['AUTO'] as const);
      for (const t of types) {
        finalRecords.push({
          companyName: preferredName,
          contactEmail,
          naic,
          insuranceType: t,
          websiteUrl,
          companyLicensed,
          companyInformation,
        });
      }
    }

    console.log(
      `   🧮 Prepared records: ${all.length}, grouped by website: ${finalRecords.length}`,
    );
    let count = 0;
    for (const r of finalRecords) {
      console.log(
        `   🔄 Processing ${r.companyName} (${r.insuranceType}), websiteUrl: ${r.websiteUrl}, companyLicensed: ${r.companyLicensed}, companyInformation: ${r.companyInformation}`,
      );
      await prisma.insuranceCompany.upsert({
        where: {
          insurance_company_unique: {
            companyName: r.companyName,
            insuranceType: r.insuranceType,
          },
        },
        update: {
          contactEmail: { set: r.contactEmail ?? null },
          naic: r.naic,
          websiteUrl: r.websiteUrl,
          companyLicensed: r.companyLicensed,
          companyInformation: r.companyInformation,
        },
        create: {
          companyName: r.companyName,
          contactEmail: r.contactEmail ?? null,
          naic: r.naic,
          insuranceType: r.insuranceType,
          websiteUrl: r.websiteUrl,
          companyLicensed: r.companyLicensed,
          companyInformation: r.companyInformation,
        },
      });
      count++;
    }

    console.log(`   ✅ Seeded ${count} insurance companies`);
  }
}
