// Base email template utilities and styles
// Following HTML email best practices for 2025

export interface BaseTemplateData {
  customerName?: string;
  customerEmail?: string;
  unsubscribeUrl?: string;
  preferencesUrl?: string;
  companyName?: string;
  companyLogo?: string;
  supportEmail?: string;
  websiteUrl?: string;
}

// Brand colors and styling
export const emailStyles = {
  colors: {
    primary: '#8B4513', // Troy BBQ brown
    secondary: '#D2691E', // Warm orange
    accent: '#FF6B35', // Bright orange
    text: '#333333',
    textLight: '#666666',
    background: '#FFFFFF',
    backgroundLight: '#F8F9FA',
    border: '#E9ECEF',
    success: '#28A745',
    warning: '#FFC107',
    error: '#DC3545'
  },
  fonts: {
    primary: 'Arial, Helvetica, sans-serif',
    secondary: 'Georgia, serif'
  },
  spacing: {
    xs: '8px',
    sm: '16px',
    md: '24px',
    lg: '32px',
    xl: '48px'
  }
};

// Base HTML template with inline CSS for maximum compatibility
export function createBaseTemplate(
  title: string,
  content: string,
  data: BaseTemplateData = {}
): { html: string; text: string } {
  const {
    customerName = 'Valued Customer',
    unsubscribeUrl = '#',
    preferencesUrl = '#',
    companyName = 'Troy BBQ',
    companyLogo = 'https://troybbq.com/logo.png',
    supportEmail = 'support@troybbq.com',
    websiteUrl = 'https://troybbq.com'
  } = data;

  const html = `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>${title}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style type="text/css">
    /* Reset styles */
    table, td, div, h1, h2, h3, h4, h5, h6, p { font-family: ${emailStyles.fonts.primary}; }
    table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    td { border-collapse: collapse; }
    
    /* Responsive styles */
    @media screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .mobile-center { text-align: center !important; }
      .mobile-padding { padding: 20px !important; }
      .mobile-font-size { font-size: 16px !important; }
      .mobile-hidden { display: none !important; }
    }
    
    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      .dark-mode-bg { background-color: #1a1a1a !important; }
      .dark-mode-text { color: #ffffff !important; }
      .dark-mode-border { border-color: #333333 !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${emailStyles.colors.backgroundLight}; font-family: ${emailStyles.fonts.primary}; font-size: 16px; line-height: 1.6; color: ${emailStyles.colors.text};">
  
  <!-- Preheader text (hidden in most clients) -->
  <div style="display: none; font-size: 1px; color: ${emailStyles.colors.backgroundLight}; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    ${title} - ${companyName}
  </div>
  
  <!-- Main container -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${emailStyles.colors.backgroundLight};">
    <tr>
      <td align="center" style="padding: ${emailStyles.spacing.md} 0;">
        
        <!-- Email wrapper -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" class="container" style="background-color: ${emailStyles.colors.background}; margin: 0 auto; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="padding: ${emailStyles.spacing.lg} ${emailStyles.spacing.lg} ${emailStyles.spacing.md}; text-align: center; background-color: ${emailStyles.colors.primary};">
              <img src="${companyLogo}" alt="${companyName}" width="120" height="auto" style="display: block; margin: 0 auto; max-width: 120px; height: auto;">
              <h1 style="margin: ${emailStyles.spacing.sm} 0 0; color: ${emailStyles.colors.background}; font-size: 24px; font-weight: bold; text-align: center;">${companyName}</h1>
              <p style="margin: ${emailStyles.spacing.xs} 0 0; color: ${emailStyles.colors.background}; font-size: 14px; text-align: center;">Authentic BBQ • Catering Excellence</p>
            </td>
          </tr>
          
          <!-- Main content -->
          <tr>
            <td style="padding: ${emailStyles.spacing.lg};">
              ${content}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: ${emailStyles.spacing.lg}; background-color: ${emailStyles.colors.backgroundLight}; border-top: 2px solid ${emailStyles.colors.border};">
              
              <!-- Contact info -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center; padding-bottom: ${emailStyles.spacing.md};">
                    <h3 style="margin: 0 0 ${emailStyles.spacing.sm}; color: ${emailStyles.colors.primary}; font-size: 18px;">Stay Connected</h3>
                    <p style="margin: 0 0 ${emailStyles.spacing.xs}; color: ${emailStyles.colors.textLight}; font-size: 14px;">
                      <strong>Troy BBQ</strong><br>
                      📧 <a href="mailto:${supportEmail}" style="color: ${emailStyles.colors.primary}; text-decoration: none;">${supportEmail}</a><br>
                      🌐 <a href="${websiteUrl}" style="color: ${emailStyles.colors.primary}; text-decoration: none;">${websiteUrl}</a>
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Social links (placeholder) -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center; padding: ${emailStyles.spacing.md} 0;">
                    <a href="#" style="display: inline-block; margin: 0 ${emailStyles.spacing.xs}; color: ${emailStyles.colors.primary}; text-decoration: none; font-size: 24px;">📘</a>
                    <a href="#" style="display: inline-block; margin: 0 ${emailStyles.spacing.xs}; color: ${emailStyles.colors.primary}; text-decoration: none; font-size: 24px;">📷</a>
                    <a href="#" style="display: inline-block; margin: 0 ${emailStyles.spacing.xs}; color: ${emailStyles.colors.primary}; text-decoration: none; font-size: 24px;">🐦</a>
                  </td>
                </tr>
              </table>
              
              <!-- Unsubscribe links -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center; padding-top: ${emailStyles.spacing.md}; border-top: 1px solid ${emailStyles.colors.border};">
                    <p style="margin: 0; color: ${emailStyles.colors.textLight}; font-size: 12px; line-height: 1.4;">
                      You're receiving this email because you have an account with ${companyName}.<br>
                      <a href="${preferencesUrl}" style="color: ${emailStyles.colors.primary}; text-decoration: none;">Manage email preferences</a> | 
                      <a href="${unsubscribeUrl}" style="color: ${emailStyles.colors.primary}; text-decoration: none;">Unsubscribe</a>
                    </p>
                    <p style="margin: ${emailStyles.spacing.xs} 0 0; color: ${emailStyles.colors.textLight}; font-size: 12px;">
                      © ${new Date().getFullYear()} ${companyName}. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
              
            </td>
          </tr>
        </table>
        
      </td>
    </tr>
  </table>
</body>
</html>`.trim();

  // Generate plain text version
  const text = generatePlainTextVersion(content, data);

  return { html, text };
}

// Utility functions for email content
export function createButton(
  text: string,
  url: string,
  style: 'primary' | 'secondary' | 'success' | 'warning' = 'primary'
): string {
  const buttonColors = {
    primary: { bg: emailStyles.colors.primary, text: emailStyles.colors.background },
    secondary: { bg: emailStyles.colors.secondary, text: emailStyles.colors.background },
    success: { bg: emailStyles.colors.success, text: emailStyles.colors.background },
    warning: { bg: emailStyles.colors.warning, text: emailStyles.colors.text }
  };

  const colors = buttonColors[style];

  return `
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: ${emailStyles.spacing.md} auto;">
    <tr>
      <td style="border-radius: 6px; background-color: ${colors.bg};">
        <a href="${url}" target="_blank" style="display: inline-block; padding: 16px 32px; font-family: ${emailStyles.fonts.primary}; font-size: 16px; font-weight: bold; color: ${colors.text}; text-decoration: none; border-radius: 6px; text-align: center;">
          ${text}
        </a>
      </td>
    </tr>
  </table>`;
}

export function createAlert(
  message: string,
  type: 'info' | 'success' | 'warning' | 'error' = 'info'
): string {
  const alertColors = {
    info: { bg: '#E3F2FD', border: '#2196F3', text: '#1565C0' },
    success: { bg: '#E8F5E8', border: emailStyles.colors.success, text: '#155724' },
    warning: { bg: '#FFF3CD', border: emailStyles.colors.warning, text: '#856404' },
    error: { bg: '#F8D7DA', border: emailStyles.colors.error, text: '#721C24' }
  };

  const colors = alertColors[type];

  return `
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: ${emailStyles.spacing.md} 0;">
    <tr>
      <td style="padding: ${emailStyles.spacing.md}; background-color: ${colors.bg}; border-left: 4px solid ${colors.border}; border-radius: 4px;">
        <p style="margin: 0; color: ${colors.text}; font-size: 14px; line-height: 1.5;">
          ${message}
        </p>
      </td>
    </tr>
  </table>`;
}

export function createPricingTable(items: Array<{ label: string; amount: number }>): string {
  const rows = items.map(item => `
    <tr>
      <td style="padding: ${emailStyles.spacing.xs} 0; border-bottom: 1px solid ${emailStyles.colors.border}; color: ${emailStyles.colors.text};">
        ${item.label}
      </td>
      <td style="padding: ${emailStyles.spacing.xs} 0; border-bottom: 1px solid ${emailStyles.colors.border}; text-align: right; color: ${emailStyles.colors.text}; font-weight: bold;">
        $${(item.amount / 100).toFixed(2)}
      </td>
    </tr>
  `).join('');

  const total = items.reduce((sum, item) => sum + item.amount, 0);

  return `
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: ${emailStyles.spacing.md} 0; background-color: ${emailStyles.colors.backgroundLight}; border-radius: 6px;">
    <tr>
      <td style="padding: ${emailStyles.spacing.md};">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          ${rows}
          <tr style="border-top: 2px solid ${emailStyles.colors.primary};">
            <td style="padding: ${emailStyles.spacing.sm} 0; color: ${emailStyles.colors.primary}; font-weight: bold; font-size: 18px;">
              Total
            </td>
            <td style="padding: ${emailStyles.spacing.sm} 0; text-align: right; color: ${emailStyles.colors.primary}; font-weight: bold; font-size: 18px;">
              $${(total / 100).toFixed(2)}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;
}

// Generate plain text version of email content
function generatePlainTextVersion(htmlContent: string, data: BaseTemplateData): string {
  const {
    customerName = 'Valued Customer',
    companyName = 'Troy BBQ',
    supportEmail = 'support@troybbq.com',
    websiteUrl = 'https://troybbq.com',
    unsubscribeUrl = '#',
    preferencesUrl = '#'
  } = data;

  // Strip HTML tags and format as plain text
  let text = htmlContent
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace HTML entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();

  // Add footer
  text += `\n\n---\n${companyName}\nEmail: ${supportEmail}\nWebsite: ${websiteUrl}\n\nManage preferences: ${preferencesUrl}\nUnsubscribe: ${unsubscribeUrl}\n\n© ${new Date().getFullYear()} ${companyName}. All rights reserved.`;

  return text;
}