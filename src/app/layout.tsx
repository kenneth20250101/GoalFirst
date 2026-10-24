import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'GoalFirst — Ready for what’s next',description:'A practical checklist. Thoughtful choices. Buy only what is missing.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
