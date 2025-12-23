import { alpha, createTheme } from '@mui/material/styles';

const teal = '#008B8B';
const deepTeal = '#006E6E';
const coral = '#FF725E';
const background = '#F6F8FA';
const navy = '#0F1F2B';
const slate = '#4F6272';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: teal,
      light: '#33BABA',
      dark: deepTeal,
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: coral,
      contrastText: '#FFFFFF',
    },
    background: {
      default: background,
      paper: '#FFFFFF',
    },
    text: {
      primary: navy,
      secondary: slate,
    },
    divider: alpha(navy, 0.08),
  },
  typography: {
    fontFamily: 'var(--font-inter), sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.5rem',
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 999,
          padding: '10px 24px',
        },
        containedPrimary: {
          background: `linear-gradient(135deg, ${teal}, ${alpha(teal, 0.8)})`,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          border: `1px solid ${alpha(navy, 0.06)}`,
          boxShadow: '0 20px 40px rgba(15,31,43,0.08)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: '#041519',
          color: 'white',
        },
      },
    },
  },
});

