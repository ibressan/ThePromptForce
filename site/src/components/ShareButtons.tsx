import { useState } from 'react';
import { FaWhatsapp, FaLinkedin, FaFacebook, FaXTwitter, FaLink } from 'react-icons/fa6';
import { useLanguage } from '../i18n/LanguageContext';

interface ShareButtonsProps {
  title: string;
  url: string;
}

const ICON_BUTTON_CLASS =
  'w-8 h-8 flex items-center justify-center rounded-full border border-[var(--line)] text-[var(--ink-soft)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-colors';

const ShareButtons = ({ title, url }: ShareButtonsProps) => {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const links = [
    {
      key: 'whatsapp',
      label: 'WhatsApp',
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      icon: <FaWhatsapp />,
    },
    {
      key: 'x',
      label: 'X',
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      icon: <FaXTwitter />,
    },
    {
      key: 'linkedin',
      label: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      icon: <FaLinkedin />,
    },
    {
      key: 'facebook',
      label: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      icon: <FaFacebook />,
    },
  ];

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API unavailable — silently ignore, the link is still visible in the address bar
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="tag-number">{t('shareLabel').toUpperCase()}</span>
      {links.map((link) => (
        <a
          key={link.key}
          href={link.href}
          target="_blank"
          rel="noreferrer"
          aria-label={link.label}
          className={ICON_BUTTON_CLASS}
        >
          {link.icon}
        </a>
      ))}
      <button
        onClick={copyLink}
        aria-label={t('copyLink')}
        className={ICON_BUTTON_CLASS}
        title={copied ? t('linkCopied') : t('copyLink')}
      >
        <FaLink />
      </button>
    </div>
  );
};

export default ShareButtons;
