function SiteFooter({
  year = 2024,
  links = ['プライバシーポリシー', '利用規約', 'お問い合わせ'],
  className = 'footer',
  ariaHidden
}) {
  return (
    <footer className={className} aria-hidden={ariaHidden}>
      <div className="container footer-content">
        <p>© {year} 食PULL. All Rights Reserved.</p>
        {Array.isArray(links) && links.length > 0 && (
          <div className="footer-links">
            {links.map((label) => (
              <a key={label} className="footer-link">
                {label}
              </a>
            ))}
          </div>
        )}
      </div>
    </footer>
  );
}

export default SiteFooter;

