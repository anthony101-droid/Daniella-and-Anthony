import type { Metadata } from 'next';
import './globals.css';
import MobileScrollHandle from '@/components/mobile-scroll-handle';
export const metadata:Metadata={title:'PhishAware | Employee Awareness & Simulations',description:'Train employees, run controlled phishing exercises, and measure security awareness.',icons:{icon:'/favicon.svg',shortcut:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}<MobileScrollHandle/></body></html>}
