/**
 * ============================================================================
 * CRM GLOBAL DESIGN TOKENS (SINGLE SOURCE OF TRUTH)
 * ============================================================================
 * All colors are 100% dynamic. Changing them here updates the entire app!
 */

export interface CRMThemeTokens {
  // Brand Primary & Accents (Obsidian Dark Pill & Accents)
  primary: string;           // Main Obsidian Black Action Color (#14181F)
  primaryHover: string;
  primaryLight: string;
  primaryDark: string;

  // Backgrounds & Layout Base (Soft Airy Slate / Ice-Blue Glow)
  background: string;        // Airy Ice-Blue Base (#EDF3F7)
  backgroundLight: string;   // Ultra-light Slate (#F4F8FA)
  backgroundDark: string;    // Soft Powder Blue (#E2ECF2)
  
  // Surfaces & Crisp Floating Cards
  cardBg: string;            // Crisp White Card Surface (#FFFFFF)
  cardBgHover: string;       // Card Hover Surface (#F8FAFC)
  cardBgDark: string;        // Dark Obsidian Widget Surface (#14181F)
  border: string;            // Crisp Subtle Border (rgba(0, 0, 0, 0.06))
  borderLight: string;       // Ultra subtle divider border

  // Typography & Text
  textPrimary: string;       // Deep Slate Headings (#0F172A)
  textSecondary: string;     // Subtitles & Labels (#475569)
  textMuted: string;         // Dimmed text (#94A3B8)
  textOnPrimary: string;     // Text on top of Primary Color (#FFFFFF)

  // 🍬 Signature Pastel Accent Cards (From Reference UI)
  pastelLime: string;        // Soft Lime (#D8F4B8)
  pastelLimeText: string;    // #244C0E
  pastelMint: string;        // Soft Aqua/Mint (#A4E8D9)
  pastelMintText: string;    // #0B4F42
  pastelCoral: string;       // Soft Coral/Rose (#F9B7B4)
  pastelCoralText: string;   // #5C1E1C
  pastelPurple: string;      // Soft Lavender (#E2D6FE)
  pastelPurpleText: string;  // #3B1C76
  pastelBlue: string;        // Soft Sky (#C9E4FE)
  pastelBlueText: string;    // #173B82

  // Status & Accents
  success: string;
  warning: string;
  danger: string;
  error: string;
  info: string;
}

export const CRM_COLORS: CRMThemeTokens = {
  // 🖤 OBSIDIAN BRAND PALETTE
  primary: '#14181F',
  primaryHover: '#232936',
  primaryLight: '#F1F5F9',
  primaryDark: '#0A0D12',

  // ❄️ AIRY ICE-BLUE & SOFT SLATE CANVAS
  background: '#EDF3F7',
  backgroundLight: '#F5F8FA',
  backgroundDark: '#E2ECF2',

  // 🪟 CRISP WHITE FLOATING CARDS & OBSIDIAN SURFACES
  cardBg: '#FFFFFF',
  cardBgHover: '#F8FAFC',
  cardBgDark: '#14181F',
  border: 'rgba(15, 23, 42, 0.07)',
  borderLight: 'rgba(15, 23, 42, 0.05)',

  // ✍️ SLEEK TYPOGRAPHY
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  textOnPrimary: '#FFFFFF',

  // 🍬 SIGNATURE PASTEL CANDY ACCENTS
  pastelLime: '#D8F4B8',
  pastelLimeText: '#244C0E',
  pastelMint: '#A4E8D9',
  pastelMintText: '#0B4F42',
  pastelCoral: '#F9B7B4',
  pastelCoralText: '#5C1E1C',
  pastelPurple: '#E2D6FE',
  pastelPurpleText: '#3B1C76',
  pastelBlue: '#C9E4FE',
  pastelBlueText: '#173B82',

  // 🟢 STATUS COLORS
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  error: '#EF4444',
  info: '#0284C7',
};

export default CRM_COLORS;
