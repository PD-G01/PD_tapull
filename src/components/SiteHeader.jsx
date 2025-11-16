function SiteHeader({
  title = '食PULL',
  subtitle = 'フードドライブをもっと身近に、もっと簡単に。',
  logoSrc = '/image/食pull.png',
  className = 'header'
}) {
  return (
    <header className={className}>
      <div className="logo-container">
        <img alt={`${title} Logo`} className="logo-img" src={logoSrc} />
        <h1 className="logo-title">{title}</h1>
      </div>
      {subtitle && <p className="logo-subtitle">{subtitle}</p>}
    </header>
  );
}

export default SiteHeader;

