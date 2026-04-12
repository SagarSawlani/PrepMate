'use client';

// Generic college card renderer — works with ANY JSON structure.
// Top-level keys → section headers. Values rendered based on type.

type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue };
type JsonObject = { [k: string]: JsonValue };

function label(key: string) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block bg-primary/10 text-primary text-sm font-medium px-3 py-1 rounded-full mr-2 mb-2">
      {children}
    </span>
  );
}

function InfoRow({ k, v }: { k: string; v: string | number | boolean | null }) {
  if (v === null || v === undefined || v === '') return null;
  return (
    <div className="flex gap-2 mb-1 text-sm">
      {k && <span className="font-semibold min-w-[160px] shrink-0 text-foreground/65">{label(k)}:</span>}
      <span className="text-foreground/90">{String(v)}</span>
    </div>
  );
}

function RenderValue({ k, v, depth = 0 }: { k: string; v: JsonValue; depth?: number }) {
  if (v === null || v === undefined) return null;

  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
    return <InfoRow k={k} v={v} />;
  }

  if (Array.isArray(v)) {
    if (v.length === 0) return null;
    const allStrings = v.every(item => typeof item === 'string' || typeof item === 'number');
    return (
      <div className="mb-2">
        {k && <p className="text-xs font-semibold text-foreground/50 uppercase tracking-wide mb-1">{label(k)}</p>}
        {allStrings ? (
          <div className="flex flex-wrap">
            {v.map((item, i) => <Tag key={i}>{String(item)}</Tag>)}
          </div>
        ) : (
          <div className="space-y-1 pl-2 border-l-2 border-primary/20">
            {v.map((item, i) => (
              <RenderValue key={i} k="" v={item} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (typeof v === 'object') {
    const entries = Object.entries(v as JsonObject).filter(([, val]) => val !== null && val !== undefined && val !== '');
    if (entries.length === 0) return null;
    return (
      <div className={depth > 0 ? 'pl-3 border-l-2 border-primary/10 mb-2' : 'mb-2'}>
        {k && <p className="text-xs font-semibold text-foreground/50 uppercase tracking-wide mb-1">{label(k)}</p>}
        {entries.map(([subKey, subVal]) => (
          <RenderValue key={subKey} k={subKey} v={subVal} depth={depth + 1} />
        ))}
      </div>
    );
  }

  return null;
}

// Extract top-level header fields for the card header
function extractHeader(data: JsonObject) {
  const nameKeys = ['college_name', 'college_university', 'name', 'institution_name', 'College Name', 'Institution Name'];
  const webKeys = ['official_website_url', 'website', 'Official Website URL', 'Website'];
  const estKeys = ['year_of_establishment', 'established', 'Year of Establishment', 'Founded'];
  const locKeys = ['location', 'Location'];

  const findStr = (keys: string[]): string => {
    for (const k of keys) {
      const v = data[k];
      if (typeof v === 'string' && v) return v;
      if (Array.isArray(v) && v.length > 0 && typeof v[0] === 'string') return v[0] as string;
    }
    return '';
  };

  const name    = findStr(nameKeys);
  const website = findStr(webKeys);
  const est     = findStr(estKeys);

  let address = '';
  for (const k of locKeys) {
    const loc = data[k];
    if (loc && typeof loc === 'object' && !Array.isArray(loc)) {
      const l = loc as JsonObject;
      address = (l['address'] || l['Address'] || l['Full Address'] || l['address_details'] || '') as string
             || [l['city'] || l['City'], l['state'] || l['State']].filter(Boolean).join(', ');
      break;
    }
  }

  // Keys to skip in the body (already shown in header)
  const headerKeys = new Set([...nameKeys, ...webKeys, ...estKeys, ...locKeys]);
  
  return { name, website, est, address, headerKeys };
}

// Section-level keys to skip if they're primitive
const SKIP_IF_PRIMITIVE: Set<string> = new Set();

export default function CollegeCard({ data }: { data: Record<string, unknown> }) {
  const d = data as JsonObject;
  const { name, website, est, address, headerKeys } = extractHeader(d);

  // Remaining top-level entries (exclude header fields)
  const sections = Object.entries(d).filter(([k]) => !headerKeys.has(k));

  return (
    <div className="w-full rounded-2xl bg-card border border-border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-primary/10 border-b border-border px-6 py-4">
        <h2 className="text-2xl font-bold text-primary">{name || 'College Details'}</h2>
        {address && (
          <p className="text-muted-foreground text-sm mt-1">📍 {address}</p>
        )}
        <div className="flex flex-wrap gap-2 mt-2">
          {website && (
            <a href={website.startsWith('http') ? website : `https://${website}`}
              target="_blank" rel="noopener noreferrer"
              className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded-full hover:bg-primary/80 transition-colors">
              🌐 Official Website
            </a>
          )}
          {est && (
            <span className="text-xs bg-muted text-muted-foreground px-3 py-1 rounded-full">
              Est. {est}
            </span>
          )}
        </div>
      </div>

      {/* Body — each top-level key as its own section */}
      <div className="px-6 py-5 divide-y divide-border">
        {sections.map(([sectionKey, sectionVal]) => {
          if (sectionVal === null || sectionVal === undefined) return null;

          // If top-level value is a plain string/number, show as a simple row
          if (typeof sectionVal === 'string' || typeof sectionVal === 'number') {
            return (
              <div key={sectionKey} className="py-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-primary mb-1">
                  {label(sectionKey)}
                </h3>
                <p className="text-sm text-foreground/90">{String(sectionVal)}</p>
              </div>
            );
          }

          return (
            <div key={sectionKey} className="py-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">
                {label(sectionKey)}
              </h3>
              <RenderValue k="" v={sectionVal} depth={0} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
