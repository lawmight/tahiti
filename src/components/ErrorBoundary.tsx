import { Component, type ErrorInfo, type ReactNode } from 'react';

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  message: string;
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    message: '',
  };

  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      message: error.message,
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Erreur de rendu capturée par ErrorBoundary', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <section className="panel error-panel">
          <h2>Impossible d’afficher cet onglet</h2>
          <p>
            Une erreur inattendue s’est produite pendant le rendu du module. Vous pouvez
            changer d’onglet ou recharger la page.
          </p>
          <code>{this.state.message}</code>
        </section>
      );
    }

    return this.props.children;
  }
}
