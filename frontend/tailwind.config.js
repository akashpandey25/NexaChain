/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Institutional Fintech Surface Tokens
        surface: {
          canvas: 'var(--surface-canvas, #090D16)',
          sidebar: 'var(--surface-sidebar, #0C111C)',
          card: 'var(--surface-card, #111726)',
          'card-hover': 'var(--surface-card-hover, #151D30)',
          elevated: 'var(--surface-elevated, #182238)',
        },
        // Institutional Fintech Border Tokens
        border: {
          subtle: 'var(--border-subtle, #1B2438)',
          strong: 'var(--border-strong, #2A3752)',
        },
        // Typography Hierarchy Tokens
        text: {
          primary: 'var(--text-primary, #F8FAFC)',
          secondary: 'var(--text-secondary, #94A3B8)',
          muted: 'var(--text-muted, #64748B)',
        },
        // Semantic Financial & State Tokens
        semantic: {
          positive: 'var(--semantic-positive, #10B981)',
          pending: 'var(--semantic-pending, #F59E0B)',
          danger: 'var(--semantic-danger, #EF4444)',
          neutral: 'var(--semantic-neutral, #64748B)',
          focus: 'var(--semantic-focus, #3B82F6)',
        },
        // Direct developer-friendly flat token aliases
        'surface-canvas': 'var(--surface-canvas, #090D16)',
        'surface-sidebar': 'var(--surface-sidebar, #0C111C)',
        'surface-card': 'var(--surface-card, #111726)',
        'surface-card-hover': 'var(--surface-card-hover, #151D30)',
        'surface-elevated': 'var(--surface-elevated, #182238)',
        'border-subtle': 'var(--border-subtle, #1B2438)',
        'border-strong': 'var(--border-strong, #2A3752)',
        'text-primary': 'var(--text-primary, #F8FAFC)',
        'text-secondary': 'var(--text-secondary, #94A3B8)',
        'text-muted': 'var(--text-muted, #64748B)',
        'semantic-positive': 'var(--semantic-positive, #10B981)',
        'semantic-pending': 'var(--semantic-pending, #F59E0B)',
        'semantic-danger': 'var(--semantic-danger, #EF4444)',
        'semantic-neutral': 'var(--semantic-neutral, #64748B)',
        'semantic-focus': 'var(--semantic-focus, #3B82F6)',

        // Preserved brand palette for backward compatibility
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          900: '#312e81',
        }
      },
      backgroundColor: {
        canvas: 'var(--surface-canvas, #090D16)',
        sidebar: 'var(--surface-sidebar, #0C111C)',
        card: 'var(--surface-card, #111726)',
        'card-hover': 'var(--surface-card-hover, #151D30)',
        elevated: 'var(--surface-elevated, #182238)',
      },
      borderColor: {
        subtle: 'var(--border-subtle, #1B2438)',
        strong: 'var(--border-strong, #2A3752)',
      },
      textColor: {
        primary: 'var(--text-primary, #F8FAFC)',
        secondary: 'var(--text-secondary, #94A3B8)',
        muted: 'var(--text-muted, #64748B)',
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif'
        ],
        mono: [
          'JetBrains Mono',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace'
        ],
      },
      borderRadius: {
        button: 'var(--radius-button, 8px)',
        input: 'var(--radius-input, 8px)',
        card: 'var(--radius-card, 12px)',
        modal: 'var(--radius-modal, 16px)',
      },
      spacing: {
        'button-sm': 'var(--height-button-sm, 32px)',
        'button-md': 'var(--height-button-md, 40px)',
        'button-lg': 'var(--height-button-lg, 48px)',
        'input': 'var(--height-input, 40px)',
      }
    },
  },
  plugins: [],
}
