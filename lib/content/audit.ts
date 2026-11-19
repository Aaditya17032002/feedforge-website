export const AUDIT_META = {
  title: 'Free AI Channel Readiness Audit for Product Feeds | FeedForge',
  description:
    'Upload your product feed or store export and see how ready it is for Google Shopping, AI Mode, ChatGPT, Microsoft Copilot and Meta. Free, instant, no account needed.',
}

export const AUDIT_FORMATS = ['Google Merchant feed', 'WooCommerce export', 'Magento export', 'Shopify export', 'OpenAI feed', 'Any CSV / TSV / XML']

export const AUDIT_CHANNEL_INFO: Record<string, { short: string; detail: string }> = {
  google: { short: 'Google', detail: 'Shopping, free listings, AI Mode and Gemini' },
  chatgpt: { short: 'ChatGPT', detail: 'ChatGPT shopping results and product feeds' },
  bing: { short: 'Microsoft', detail: 'Bing Shopping and Copilot' },
  meta: { short: 'Meta', detail: 'Facebook and Instagram shops and ads' },
}

export const AUDIT_DIMENSIONS = [
  {
    title: 'Feed eligibility',
    body: 'Every field each channel requires, checked against its published rules. Find the products that would be rejected outright.',
  },
  {
    title: 'Price, stock & identifiers',
    body: 'Prices, currencies, sale prices, availability values and GTIN barcodes, including the check digit that AI agents rely on to match your product.',
  },
  {
    title: 'Titles & descriptions',
    body: 'Length limits, promotional text, all caps, thin descriptions and the details AI assistants quote when they recommend a product.',
  },
  {
    title: 'AI discoverability',
    body: "Google taxonomy categories, apparel attributes, color, material and size: the structured facts that answer shoppers' follow-up questions.",
  },
  {
    title: 'Variants & structure',
    body: 'Duplicate IDs, ungrouped variants and look-alike products that confuse Google, ChatGPT and Copilot.',
  },
  {
    title: 'Live store check',
    body: 'Whether your robots.txt lets the crawlers behind Google, ChatGPT and Copilot in, and whether your product pages show the same price and stock as your feed.',
  },
]

export const AUDIT_FAQS = [
  {
    question: 'What does the AI Channel Readiness Audit check?',
    answer:
      'It reads the first 100 products in your file and checks them against the rules of Google Merchant Center (Shopping, AI Mode and Gemini), the ChatGPT product feed, Microsoft Merchant Center (Bing and Copilot) and Meta catalogs. It covers more than 50 checks across eligibility, pricing and stock, identifiers, titles and descriptions, attributes, variants and policy. With your store URL it also checks AI crawler access and compares live product pages with your feed.',
  },
  {
    question: 'Which files can I upload?',
    answer:
      'A Google Merchant Center feed (CSV, TSV or XML), an OpenAI product feed, or a raw product export from WooCommerce, Magento or Shopify. The audit recognizes the format and reads each field from the right column. Any file size works: for large feeds only the start of the file is uploaded, because the audit reads the first 100 products.',
  },
  {
    question: 'Do you keep my file?',
    answer:
      'No. The file is read once to run the checks and is not stored. We keep the audit results so you can reopen your report.',
  },
  {
    question: 'Why do you ask for my email and store URL?',
    answer:
      'The full report includes fixes for every issue, per-product scores, AI-written examples and a live check of your store. We use your store URL to run that live check and email you a link so you can reopen the report on any device. We never share either.',
  },
  {
    question: 'How are the AI-written examples made?',
    answer:
      'For up to three products with the weakest titles and descriptions, AI rewrites them using only the facts already in your file. Before a rewrite is shown it is checked automatically: it may not add any number that is not in your data, may not use promotional language, must keep your brand, and must stay within channel length limits. The report lists exactly which issues each rewrite fixes.',
  },
  {
    question: 'How is the AI Readiness Score calculated?',
    answer:
      'Every finding is labelled either a channel rule (a published requirement from the Google Merchant Center or OpenAI product feed specifications, linked in the report) or a recommendation (a best practice for AI shopping answers). Only channel rules can mark a product as rejected; recommendations never count as more than medium. Each product is scored per channel: a product a channel would reject scores 0; otherwise it starts at 100 and loses points per issue. The overall score weights Google 35%, ChatGPT 30%, Meta 20% and Microsoft 15%. It is a readiness index built from these checks, not a ranking published by any channel.',
  },
  {
    question: 'Is a store export judged unfairly because it is not a feed?',
    answer:
      'No. WooCommerce, Magento and Shopify exports leave out things like product URLs and currency that the store itself holds. The audit recognizes those exports and does not count those fields against you, because FeedForge reads them from your store connection.',
  },
] as const
