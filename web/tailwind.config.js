const { fontFamily } = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['selector'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
  	container: {
  		center: true,
  		padding: '2rem'
  	},
  	extend: {
  		colors: {
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			'bg-base': 'var(--bg-base)',
  			'bg-title': 'var(--bg-title)',
  			'bg-card': 'var(--bg-card)',
  			'bg-component': 'var(--bg-component)',
  			'bg-input': 'var(--bg-input)',
  			'bg-canvas': {
  				DEFAULT: 'rgb(var(--bg-canvas) / <alpha-value>)'
  			},
  			'bg-list': {
  				DEFAULT: 'rgb(var(--bg-list) / <alpha-value>)'
  			},
  			'text-primary': {
  				DEFAULT: 'rgb(var(--text-primary) / <alpha-value>)'
  			},
  			'text-primary-inverse': {
  				DEFAULT: 'rgb(var(--text-primary-inverse) / <alpha-value>)'
  			},
  			'text-secondary': {
  				DEFAULT: 'rgb(var(--text-secondary) / <alpha-value>)'
  			},
  			'text-secondary-inverse': {
  				DEFAULT: 'rgb(var(--text-secondary-inverse) / <alpha-value>)'
  			},
  			'text-disabled': 'var(--text-disabled)',
  			'text-input-tip': 'var(--text-input-tip)',
  			'border-default': 'var(--border-default)',
  			'border-accent': 'var(--border-accent)',
  			'border-button': 'var(--border-button)',
  			'accent-primary': {
  				DEFAULT: 'rgb(var(--accent-primary) / <alpha-value>)',
  				'5': 'rgba(var(--accent-primary) / 0.05)'
  			},
  			'bg-accent': 'var(--bg-accent)',
  			'state-error': {
  				'5': 'rgba(var(--state-error) / 0.05)',
  				DEFAULT: 'rgb(var(--state-error) / <alpha-value>)'
  			},
  			'state-success': {
  				'5': 'rgba(var(--state-success) / 0.05)',
  				DEFAULT: 'rgb(var(--state-success) / <alpha-value>)'
  			},
  			'state-warning': {
  				'5': 'rgba(var(--state-warning) / 0.05)',
  				DEFAULT: 'rgb(var(--state-warning) / <alpha-value>)'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		borderWidth: {
  			'0.5': '0.5px'
  		},
  		borderRadius: {
  			xl: '0.5rem',
  			lg: 'var(--radius)',
  			DEFAULT: '0.375rem',
  			sm: 'calc(var(--radius) - 4px)',
  			xs: '0.25rem',
  			md: 'calc(var(--radius) - 2px)'
  		},
  		fontFamily: {
  			sans: [
  				'Inter',
                    ...fontFamily.sans
                ]
  		}
  	}
  },
  plugins: [require('tailwindcss-animate')],
};
