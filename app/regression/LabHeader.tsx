import Link from "next/link";
import { ChevronIcon, SparkIcon } from "../components/icons";
import styles from "./LabChrome.module.css";

type LabLink = { href: string; label: string };

/**
 * Shared top bar for the /regression evidence labs. It mirrors the public
 * showcase navigation (brand mark, pill links, EN/中 switch) so the labs read
 * as part of the same site while keeping each page's own link labels.
 */
export function LabHeader({
  locale,
  onLocaleChange,
  links,
  home,
  navLabel,
}: {
  locale: "en" | "zh";
  onLocaleChange: (locale: "en" | "zh") => void;
  links: LabLink[];
  home: string;
  navLabel: string;
}) {
  return (
    <header className={styles.bar}>
      <div className={styles.inner}>
        <Link className={styles.brand} href="/">
          <span className={styles.brandMark}><SparkIcon /></span>
          <strong>AdMind</strong>
          <small aria-hidden="true">Labs</small>
        </Link>
        <nav aria-label={navLabel} className={styles.nav}>
          {links.map((link) => <Link href={link.href} key={link.href}>{link.label}</Link>)}
          <Link className={styles.home} href="/">
            <ChevronIcon aria-hidden="true" className={styles.homeIcon} />
            {home}
          </Link>
        </nav>
        <div className={styles.locale} role="group" aria-label="Language / 语言">
          <button aria-pressed={locale === "en"} onClick={() => onLocaleChange("en")} type="button">EN</button>
          <button aria-pressed={locale === "zh"} onClick={() => onLocaleChange("zh")} type="button">中</button>
        </div>
      </div>
    </header>
  );
}
