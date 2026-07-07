/**
 * Componente Layout
 * 
 * Layout principal de la aplicación que envuelve el contenido
 * con Header y Footer.
 */

import { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import './Layout.css';

interface LayoutProps {
  children: ReactNode;
}

/**
 * Componente de layout principal
 * 
 * @example
 * ```tsx
 * <Layout>
 *   <HomePage />
 * </Layout>
 * ```
 */
export function Layout({ children }: LayoutProps) {
  return (
    <div className="layout">
      <Header />
      <main className="layout__main">{children}</main>
      <Footer />
    </div>
  );
}
