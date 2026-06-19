---
name: Nexus Intelligence
colors:
  surface: '#f8f9fa'
  surface-dim: '#d9dadb'
  surface-bright: '#f8f9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f5'
  surface-container: '#edeeef'
  surface-container-high: '#e7e8e9'
  surface-container-highest: '#e1e3e4'
  on-surface: '#191c1d'
  on-surface-variant: '#43474f'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f2'
  outline: '#737780'
  outline-variant: '#c3c6d1'
  surface-tint: '#3a5f94'
  primary: '#001e40'
  on-primary: '#ffffff'
  primary-container: '#003366'
  on-primary-container: '#799dd6'
  inverse-primary: '#a7c8ff'
  secondary: '#0059bb'
  on-secondary: '#ffffff'
  secondary-container: '#0070ea'
  on-secondary-container: '#fefcff'
  tertiary: '#2f0057'
  on-tertiary: '#ffffff'
  tertiary-container: '#4c0088'
  on-tertiary-container: '#bd7eff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d5e3ff'
  primary-fixed-dim: '#a7c8ff'
  on-primary-fixed: '#001b3c'
  on-primary-fixed-variant: '#1f477b'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc7ff'
  on-secondary-fixed: '#001a41'
  on-secondary-fixed-variant: '#004493'
  tertiary-fixed: '#efdbff'
  tertiary-fixed-dim: '#dcb8ff'
  on-tertiary-fixed: '#2c0051'
  on-tertiary-fixed-variant: '#6700b5'
  background: '#f8f9fa'
  on-background: '#191c1d'
  surface-variant: '#e1e3e4'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 56px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  gutter: 24px
  margin-desktop: 64px
  margin-mobile: 20px
  container-max: 1280px
---

## Brand & Style
The design system is engineered for an AI-assisted exam builder, prioritizing **clarity, academic integrity, and technological sophistication**. The brand personality is professional yet visionary—acting as a reliable co-pilot for educators while maintaining the cutting-edge feel of modern artificial intelligence.

The visual style blends **Corporate Modern** with **Glassmorphism**. It utilizes high-contrast typography and structured layouts inspired by editorial design, modernized through the use of translucent "glass" surfaces for AI-driven insights. The interface aims to evoke a sense of focused efficiency, reducing cognitive load while highlighting the power of automated content generation.

## Colors
The palette is anchored by **Deep Blue**, establishing a foundation of trust and authority essential for educational tools. **Electric Blue** serves as the primary action color, driving user flow through the platform.

To distinguish AI-enhanced features, the system employs a **vibrant gradient (Cyan to Purple)**. This "AI signature" is used sparingly to signify intelligence, such as on generative buttons, active AI processing states, and focus indicators. Backgrounds are kept in **Pure White** and **Soft Gray** to ensure maximum legibility of complex exam text, while borders and dividers utilize low-opacity neutrals to maintain a light, airy feel.

## Typography
The system uses **Inter** exclusively to provide a highly legible, systematic aesthetic. Headlines are intentionally heavy and tightly tracked to create a strong visual anchor, mirroring the editorial precision found in professional examinations. 

Hierarchy is established through significant weight contrast between titles and body text. Label styles are used for metadata and small UI indicators (e.g., "AI ASSISTED"), utilizing all-caps and increased letter spacing to differentiate functional UI from educational content.

## Layout & Spacing
This design system utilizes a **12-column fluid grid** for desktop, transitioning to a **4-column grid** for mobile. The layout philosophy is "Spacious Utility"—using generous margins and gutters to separate the creation tools from the content preview.

Horizontal segments are divided by high-contrast whitespace. In complex workspace views, a split-pane model is used: the left side handles inputs and AI configurations, while the right side provides a live, high-fidelity preview of the exam paper. All spacing is derived from a 4px/8px baseline grid to ensure vertical rhythm.

## Elevation & Depth
Hierarchy is achieved through **Tonal Layering** and **Glassmorphism**.
- **Level 0 (Background):** Soft Gray (#F8F9FA) creates a neutral canvas.
- **Level 1 (Cards):** Pure White surfaces with a subtle, 1px border (#E9ECEF) and a soft, wide-spread shadow (0px 4px 20px rgba(0,0,0,0.05)).
- **Level 2 (AI Modules):** Glassmorphic surfaces with a 20px backdrop-blur and semi-transparent white fills. These include a faint internal "glow" border to signify active intelligence.
- **Level 3 (Overlays):** Modals and dropdowns use deeper shadows with higher opacity to provide clear focus separation.

## Shapes
The shape language is approachable yet structured. A **0.5rem (8px)** radius is the standard for functional elements like inputs and small buttons. Larger containers, cards, and AI-feature modules use a more pronounced **1.5rem (24px)** radius to create a soft, modern silhouette that feels contemporary and friendly.

## Components
### Buttons
- **Primary:** Solid Electric Blue with white text; 8px border radius.
- **AI-Action:** Features the Cyan-to-Purple gradient background with a slight hover-lift effect.
- **Ghost:** Transparent background with a 1px deep blue border, used for secondary navigation.

### Cards
Cards are the primary container. They must feature a 24px corner radius. AI-generated suggestion cards utilize the frosted glass effect with a subtle purple-tinted border.

### Input Fields
Inputs use a white background, 8px radius, and a 1px light gray border. Upon focus, the border transitions to Electric Blue with a soft outer glow.

### Chips & Badges
Small, pill-shaped indicators for "Question Difficulty" or "Subject Tag." These use low-saturation background tints of the primary colors to avoid clashing with main actions.

### AI Progress Indicator
A custom horizontal bar component utilizing the AI gradient with a pulse animation to indicate generative states.