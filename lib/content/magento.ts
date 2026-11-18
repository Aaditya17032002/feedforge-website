/** Same audit destination as the WooCommerce page. The audit page is added separately. */
export const MAGENTO_AUDIT_PATH = '/audit-tool'

export const MAGENTO_META = {
  title: 'Magento Product Feed Optimization & AI Readiness | FeedForge',
  description:
    'Optimize your Magento product feeds for Google Merchant Center, ChatGPT, Bing Shopping, and Meta. Find feed issues and check your AI shopping readiness.',
} as const

export const MAGENTO_CHANNELS = [
  {
    name: 'Google Merchant Center',
    logo: '/images/integrations/google.svg',
    description:
      'A product feed built for Merchant Center. Deliver it over SFTP or an HTTPS link the channel fetches.',
  },
  {
    name: 'Meta',
    logo: '/images/integrations/meta.svg',
    description: 'A Meta catalog from the same Magento import, shaped for that channel.',
  },
  {
    name: 'Bing Shopping',
    logo: '/images/integrations/bing.svg',
    description: 'A Bing Shopping feed to submit in Microsoft Merchant Center.',
  },
  {
    name: 'ChatGPT',
    logo: '/images/integrations/chatgpt.svg',
    description: 'An OpenAI / ChatGPT commerce feed, delivered as an HTTPS link or an SFTP snapshot.',
  },
] as const

export const SYNC_PANEL_PRODUCTS = [
  { title: 'Blue Shirt L', meta: 'Example product' },
  { title: 'Cotton shirt, blue', meta: 'Example description' },
] as const

export const MAGENTO_PROBLEMS = [
  {
    title: 'Missing AI visibility',
    description:
      'A catalog written only for the store page can stay hard to find in ChatGPT and other AI shopping experiences.',
  },
  {
    title: 'Poor product data',
    description: 'Thin titles, descriptions, and attributes make it harder for a channel to understand what you sell.',
  },
  {
    title: 'Feed rule failures',
    description:
      'Missing prices, availability, identifiers, or images can keep a product out of Google Merchant Center and other feeds.',
  },
  {
    title: 'Manual feed management',
    description: 'Rebuilding a separate file for every channel takes time each time the catalog changes.',
  },
] as const

export const MAGENTO_CALLOUTS = [
  'Import the catalog',
  'Map fields automatically',
  'Build a feed per channel',
  'Validate before export',
] as const

export const MAGENTO_STEPS = [
  {
    number: '01',
    title: 'Connect',
    description:
      'Connect Magento with the store URL, the store view code, and an integration token that can read the catalog. Do not use an admin password. Nothing to install.',
  },
  {
    number: '02',
    title: 'Analyze',
    description:
      'Fields map to a standard product structure automatically. Validation flags channel-rule issues before you export.',
  },
  {
    number: '03',
    title: 'Optimize',
    description:
      'AI suggests clearer titles, descriptions, and categories. Accept, reject, or edit each suggestion. The Magento product stays as it is.',
  },
  {
    number: '04',
    title: 'Export',
    description:
      'Send a feed built for Google Merchant Center, Meta, Bing Shopping, and ChatGPT over SFTP or HTTPS. Run Import again when the Magento catalog changes.',
  },
] as const

export const AUDIT_CHECKS = [
  'Product data completeness and quality',
  'Google Merchant Center, Meta, Bing Shopping, and ChatGPT feed rules',
  'Price and availability fields that would fail a feed check',
  'Row-level issues that can keep products out of a feed',
  'Titles and descriptions that are hard for shoppers and AI to understand',
] as const

export const AUDIT_SAMPLE = {
  caption: 'Illustrative sample. Not a customer result.',
  score: '64',
  scoreLabel: 'Example readiness',
  productsReviewed: '120 products in this example',
  issues: [
    { count: '18', label: 'Missing attributes' },
    { count: '7', label: 'Price or availability fields' },
    { count: '4', label: 'Channel rule warnings' },
  ],
  recommendation: 'Example recommendation: fill missing attributes before export.',
} as const

export const MAGENTO_BENEFITS = [
  {
    title: 'AI-powered product enrichment',
    description:
      'Clearer titles, descriptions, and categories, with a suggestion you can accept, reject, or edit.',
  },
  {
    title: 'Automated feed optimization',
    description: 'Validation and enrichment run on the imported catalog before a file goes out.',
  },
  {
    title: 'Centralized product feed management',
    description: 'One workspace for the Magento catalog, the mapping, and every export.',
  },
  {
    title: 'Multi-channel exports',
    description: 'A separate feed for Google Merchant Center, Meta, Bing Shopping, and ChatGPT.',
  },
  {
    title: 'Better product data quality',
    description: 'Missing fields, weak copy, and channel-rule issues show up before export.',
  },
  {
    title: 'Less manual maintenance',
    description:
      'One Magento import feeds every channel, so you are not rebuilding a separate file by hand. Run Import again when the catalog changes.',
  },
] as const

export const MAGENTO_FAQS = [
  {
    question: 'What is FeedForge for Magento?',
    answer:
      'FeedForge imports a Magento or Adobe Commerce catalog, maps the fields, improves titles, descriptions, and categories with AI, checks the data, and exports a feed for each channel. You connect with the store URL, the store view code, and an integration token. There is no extension to install.',
  },
  {
    question: 'How can I get my Magento products discovered on ChatGPT?',
    answer:
      'FeedForge builds an OpenAI / ChatGPT commerce feed. You paste the HTTPS link into ChatGPT commerce, or send a snapshot over SFTP. That prepares the catalog for submission. It does not guarantee that ChatGPT will show every product.',
  },
  {
    question: 'What is an AI Channel Readiness Audit?',
    answer:
      'It reviews a Magento catalog for missing product data and for issues that affect Google Merchant Center, Meta, Bing Shopping, and OpenAI / ChatGPT feeds. The sample report on this page is an illustration. Open the audit from the button on this page.',
  },
  {
    question: 'Does FeedForge optimize product titles and descriptions?',
    answer:
      'Yes. AI suggests clearer titles, descriptions, and categories. You can accept, reject, or edit each suggestion before export. An accepted suggestion is used in the feed. It does not change the product in Magento.',
  },
  {
    question: 'Can FeedForge identify Google Merchant Center issues?',
    answer:
      'Yes. Validation checks the feed against Merchant Center field rules before export, including required fields, price and availability values, identifiers, images, and title and description length. It reports those issues row by row. It does not pull live disapproval reports from Merchant Center.',
  },
  {
    question: 'How do I connect a Magento store?',
    answer:
      'In FeedForge, enter the store URL, the store view code, and an integration token with catalog read access. Do not use an admin password. FeedForge reads simple, configurable, and virtual products from that store view. Grouped, bundle, downloadable, and gift card products are skipped. A wrong store view imports the wrong catalog, or none.',
  },
  {
    question: 'Will FeedForge change my Magento products?',
    answer:
      'No. Import reads the catalog. Accepted titles, descriptions, and categories stay in FeedForge and go out in the export. They are not written back to Magento.',
  },
] as const
