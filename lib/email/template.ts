type RenderEmailTemplateInput = {
  title: string
  preheader?: string
  contentHtml: string
  footerHtml?: string
  logoHref?: string
}

const BRAND = {
  name: 'FeedForge',
  accent: '#090088',
  text: '#111827',
  mutedText: '#6b7280',
  bg: '#f6f7fb',
  cardBg: '#ffffff',
  border: '#e5e7eb',
  darkText: '#f3f4f6',
  darkMutedText: '#9ca3af',
  darkBg: '#000000',
  darkCardBg: '#0a0a0a',
  darkBorder: '#1f2937',
} as const

export function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function brandMarkSvg(fill: string) {
  return `
    <svg width="28" height="26" viewBox="0 0 98 91" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" style="display:block">
      <g fill="${fill}">
        <circle cx="52.14" cy="36.19" r="2.96"/><circle cx="55.53" cy="42.1" r="2.66"/><circle cx="58.93" cy="48.02" r="2.4"/><circle cx="62.32" cy="53.93" r="2.13"/><circle cx="65.72" cy="59.84" r="1.86"/><circle cx="69.12" cy="65.76" r="1.6"/><circle cx="72.51" cy="71.67" r="1.33"/><circle cx="75.91" cy="77.59" r="1.06"/><circle cx="79.3" cy="83.5" r=".8"/><circle cx="55.93" cy="31.13" r="2.96"/><circle cx="59.32" cy="37.05" r="2.66"/><circle cx="62.72" cy="42.96" r="2.4"/><circle cx="66.12" cy="48.88" r="2.13"/><circle cx="69.51" cy="54.79" r="1.86"/><circle cx="72.91" cy="60.7" r="1.6"/><circle cx="76.3" cy="66.62" r="1.33"/><circle cx="79.7" cy="72.53" r="1.06"/><circle cx="83.09" cy="78.45" r=".8"/><circle cx="59.72" cy="26.08" r="2.96"/><circle cx="63.12" cy="31.99" r="2.66"/><circle cx="66.51" cy="37.91" r="2.4"/><circle cx="69.91" cy="43.82" r="2.13"/><circle cx="73.3" cy="49.73" r="1.86"/><circle cx="76.7" cy="55.65" r="1.6"/><circle cx="80.09" cy="61.56" r="1.33"/><circle cx="83.49" cy="67.48" r="1.06"/><circle cx="86.88" cy="73.39" r=".8"/><circle cx="63.51" cy="21.02" r="2.96"/><circle cx="66.91" cy="26.94" r="2.66"/><circle cx="70.3" cy="32.85" r="2.4"/><circle cx="73.7" cy="38.77" r="2.13"/><circle cx="77.09" cy="44.68" r="1.86"/><circle cx="80.49" cy="50.59" r="1.6"/><circle cx="83.88" cy="56.51" r="1.33"/><circle cx="87.28" cy="62.42" r="1.06"/><circle cx="90.68" cy="68.34" r=".8"/><circle cx="67.3" cy="15.97" r="2.96"/><circle cx="70.7" cy="21.88" r="2.66"/><circle cx="74.09" cy="27.8" r="2.4"/><circle cx="77.49" cy="33.71" r="2.13"/><circle cx="80.88" cy="39.63" r="1.86"/><circle cx="84.28" cy="45.54" r="1.6"/><circle cx="87.68" cy="51.45" r="1.33"/><circle cx="91.07" cy="57.37" r="1.06"/><circle cx="94.47" cy="63.28" r=".8"/><circle cx="71.09" cy="10.91" r="2.96"/><circle cx="74.49" cy="16.83" r="2.66"/><circle cx="77.89" cy="22.74" r="2.4"/><circle cx="81.28" cy="28.66" r="2.13"/><circle cx="84.68" cy="34.57" r="1.86"/><circle cx="88.07" cy="40.48" r="1.6"/><circle cx="91.47" cy="46.4" r="1.33"/><circle cx="94.86" cy="52.31" r="1.06"/><circle cx="98.26" cy="58.23" r=".8"/>
      </g>
    </svg>
  `
}

export function ctaButton(href: string, label: string) {
  const safeHref = escapeHtml(href)
  const safeLabel = escapeHtml(label)
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 18px 0;">
      <tr>
        <td style="border-radius: 8px; background: ${BRAND.accent};">
          <a href="${safeHref}"
             style="display: inline-block; padding: 11px 22px; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, 'Roboto', Arial, sans-serif;
                    font-size: 14px; font-weight: 600; color: #ffffff; text-decoration: none; letter-spacing: 0.1px; mso-padding-alt: 0;">
            ${safeLabel} &rarr;
          </a>
        </td>
      </tr>
    </table>
  `
}

export function renderEmailTemplate({
  title,
  preheader,
  contentHtml,
  footerHtml,
  logoHref,
}: RenderEmailTemplateInput) {
  const safeTitle = escapeHtml(title)
  const safePreheader = preheader ? escapeHtml(preheader) : ''
  const headerMark = brandMarkSvg(BRAND.accent)
  const headerHref = logoHref ? escapeHtml(logoHref) : ''
  const logoBase = logoHref ? logoHref.replace(/\/+$/, '') : ''
  const logoLightSrc = logoBase ? escapeHtml(`${logoBase}/images/icon-1.svg`) : ''
  const logoDarkSrc = logoBase ? escapeHtml(`${logoBase}/images/icon-2.svg`) : ''
  const hasHostedLogo = Boolean(logoLightSrc)

  return `<!doctype html>
<html lang="en">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light dark" />
    <meta name="supported-color-schemes" content="light dark" />
    <title>${safeTitle}</title>
    <style>
      html, body { margin: 0 !important; padding: 0 !important; }
      body { background: ${BRAND.bg}; }
      a { color: ${BRAND.accent}; }
      .preheader { display:none!important; visibility:hidden; opacity:0; color:transparent; height:0; width:0; overflow:hidden; mso-hide:all; }
      .container { width: 100%; background: ${BRAND.bg}; padding: 32px 12px; }
      .card { width: 100%; max-width: 640px; background: ${BRAND.cardBg}; border: 1px solid ${BRAND.border}; border-radius: 16px; overflow: hidden; }
      .bar { height: 5px; background: ${BRAND.accent}; }
      .content { padding: 28px 28px 10px 28px; font-family: "Segoe UI", -apple-system, BlinkMacSystemFont, "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", Arial, sans-serif; color: ${BRAND.text}; }
      .title { margin: 0 0 18px 0; font-size: 20px; line-height: 1.3; font-weight: 700; letter-spacing: -0.1px; color: ${BRAND.text}; }
      .muted { color: ${BRAND.mutedText}; font-size: 12px; line-height: 1.6; }
      .divider { height: 1px; background: ${BRAND.border}; margin: 20px 0 0 0; }
      .footer { padding: 16px 28px 24px 28px; font-family: "Segoe UI", -apple-system, BlinkMacSystemFont, "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", Arial, sans-serif; }
      .brand { display: flex; align-items: center; gap: 10px; }
      .brand-name { font-weight: 700; color: ${BRAND.text}; font-size: 14px; letter-spacing: 0.2px; }
      .logo { display:block; height: 28px; width:auto; }
      .logo-dark { display:none; }
      @media (prefers-color-scheme: dark) {
        body { background: ${BRAND.darkBg} !important; }
        .container { background: ${BRAND.darkBg} !important; }
        .card { background: ${BRAND.darkCardBg} !important; border-color: ${BRAND.darkBorder} !important; }
        .content { color: ${BRAND.darkText} !important; }
        .title { color: ${BRAND.darkText} !important; }
        .brand-name { color: ${BRAND.darkText} !important; }
        .divider { background: ${BRAND.darkBorder} !important; }
        .muted { color: ${BRAND.darkMutedText} !important; }
        a { color: #ffffff !important; }
        .logo-light { display:none !important; }
        .logo-dark { display:block !important; }
      }
    </style>
  </head>
  <body>
    ${safePreheader ? `<div class="preheader">${safePreheader} &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</div>` : ''}
    <div class="container">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;">
        <tr>
          <td align="center" style="padding:0;">
            <table role="presentation" width="640" cellspacing="0" cellpadding="0" border="0" class="card" style="border-collapse:separate;">
              <tr><td class="bar"></td></tr>
              <tr>
                <td class="content">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;">
                    <tr>
                      <td align="left" style="padding:0 0 18px 0;">
                        ${headerHref ? `<a href="${headerHref}" style="text-decoration:none; display:inline-block;">` : ''}
                        ${
                          hasHostedLogo
                            ? `
                              <img class="logo logo-light" src="${logoLightSrc}" alt="${BRAND.name}" />
                              <img class="logo logo-dark" src="${logoDarkSrc}" alt="${BRAND.name}" />
                            `
                            : `
                              <span class="brand">
                                <span style="display:inline-block; width:28px; height:26px;">${headerMark}</span>
                                <span class="brand-name">${BRAND.name}</span>
                              </span>
                            `
                        }
                        ${headerHref ? `</a>` : ''}
                      </td>
                    </tr>
                  </table>
                  <h1 class="title">${safeTitle}</h1>
                  ${contentHtml}
                  <div class="divider"></div>
                </td>
              </tr>
              <tr>
                <td class="footer">
                  ${footerHtml ?? `<div class="muted">If you didn't request this email, you can safely ignore it.</div>`}
                </td>
              </tr>
            </table>
            <div class="muted" style="max-width:640px; padding:16px 6px 0 6px; text-align:center;">
              &copy; ${new Date().getFullYear()} ${BRAND.name}. All rights reserved.
            </div>
          </td>
        </tr>
      </table>
    </div>
  </body>
</html>`
}
