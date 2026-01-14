import { Link } from 'react-router-dom';

const DEFAULT_FOOTER_LINKS = [
  { label: 'プライバシーポリシー', to: '/privacy' },
  { label: '利用規約', to: '/terms' },
];

function normalizeLinks(links) {
  // 互換: 旧形式（文字列配列）も受け付ける
  if (!Array.isArray(links) || links.length === 0) {
    return DEFAULT_FOOTER_LINKS;
  }

  return links
    .map((item) => {
      if (typeof item === 'string') {
        // 旧形式のラベルだけ渡された場合は、既知のものだけルーティングする
        if (item === 'プライバシーポリシー') return { label: item, to: '/privacy' };
        if (item === '利用規約') return { label: item, to: '/terms' };
        return { label: item, to: '/' };
      }
      if (item && typeof item === 'object') {
        const label = item.label ?? item.text ?? item.name;
        const to = item.to ?? item.href ?? item.path;
        if (typeof label === 'string' && typeof to === 'string') {
          return { label, to };
        }
      }
      return null;
    })
    .filter(Boolean);
}

function SiteFooter({
  year = 2024,
  links,
  className = 'footer',
  ariaHidden,
}) {
  const resolvedLinks = normalizeLinks(links);

  return (
    <footer className={className} aria-hidden={ariaHidden}>
      <div className="container footer-content">
        <p>© {year} 食PULL. All Rights Reserved.</p>
        {resolvedLinks.length > 0 && (
          <div className="footer-links">
            {resolvedLinks.map(({ label, to }) => (
              <Link key={`${label}-${to}`} to={to} className="footer-link">
                {label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </footer>
  );
}

export default SiteFooter;

