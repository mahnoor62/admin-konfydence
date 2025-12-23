import { Inter } from 'next/font/google';
import ThemeProvider from '@/components/ThemeProvider';
import '../styles/globals.css';
import 'react-quill/dist/quill.snow.css';

const inter = Inter({ subsets: ['latin'] });

export default function App({ Component, pageProps }) {
  return (
    <div className={inter.className}>
      <ThemeProvider>
        <Component {...pageProps} />
      </ThemeProvider>
    </div>
  );
}

