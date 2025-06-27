import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Router, Route, Switch } from 'wouter';
import { queryClient } from '@/lib/queryClient';

import Dashboard from '@/pages/Dashboard';
import AgentEditor from '@/pages/AgentEditor';
import WidgetConfig from '@/pages/WidgetConfig';
import Navigation from '@/components/layout/Navigation';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <Router>
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/agents/:id/edit" component={AgentEditor} />
              <Route path="/agents/new" component={AgentEditor} />
              <Route path="/agents/:id/widget" component={WidgetConfig} />
              <Route>
                <div className="text-center py-12">
                  <h1 className="text-2xl font-bold text-muted-foreground">Página não encontrada</h1>
                </div>
              </Route>
            </Switch>
          </Router>
        </main>
      </div>
    </QueryClientProvider>
  );
}

export default App;