import type { Feature, Step, Stat, FooterSection } from '@/types';

export const LANDING_FEATURES: Feature[] = [
  {
    icon: 'lock-keyhole',
    title: 'Truly Decentralized',
    description: 'Built on SUI blockchain. No central authority, no censorship. Your content, your rules.',
  },
  {
    icon: 'zap',
    title: 'Zero Gas Fees',
    description: 'Powered by Enoki sponsored transactions. Users never pay transaction fees.',
  },
  {
    icon: 'shield-check',
    title: 'Encrypted Content',
    description: 'Seal + Walrus ensure only authorized subscribers can access your exclusive content.',
  },
  {
    icon: 'user-circle',
    title: 'Human-Readable Names',
    description: 'SuiNS integration for easy-to-remember addresses like alice.sui instead of 0x123...',
  },
];

export const LANDING_STEPS: Step[] = [
  {
    number: 1,
    title: 'Create Your Profile',
    description: 'Sign in with Google/Twitter via ZkLogin. No wallet setup or crypto knowledge needed.',
    icon: 'user-plus',
  },
  {
    number: 2,
    title: 'Set Tiers & Upload',
    description: 'Define subscription tiers and upload encrypted content securely to Walrus storage.',
    icon: 'layers',
  },
  {
    number: 3,
    title: 'Earn & Engage',
    description: 'Subscribers pay in SUI. Revenue goes directly to your wallet—no middleman.',
    icon: 'coins',
  },
];

export const LANDING_STATS: Stat[] = [
  { label: 'Creators', value: '1,234', suffix: '+' },
  { label: 'Content Pieces', value: '12,345', suffix: '+' },
  { label: 'Subscribers', value: '45,678', suffix: '+' },
  { label: 'Total Volume', value: '1.2M', suffix: ' SUI' },
];

export const FOOTER_SECTIONS: FooterSection[] = [
  {
    title: 'Product',
    links: [
      { label: 'Explore Creators', href: '/explore' },
      { label: 'Become a Creator', href: '/creator/dashboard' },
      { label: 'How It Works', href: '#how-it-works' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'SUI Documentation', href: 'https://docs.sui.io', external: true },
      { label: 'GitHub', href: 'https://github.com/depatreon', external: true },
      { label: 'Whitepaper', href: '#' },
    ],
  },
  {
    title: 'Community',
    links: [
      { label: 'Discord', href: 'https://discord.gg/sui', external: true },
      { label: 'Twitter', href: 'https://twitter.com/depatreon', external: true },
      { label: 'Forum', href: 'https://forum.sui.io', external: true },
    ],
  },
];
