import { Link, useLocation } from 'wouter';
import { Bot, Settings, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Navigation() {
  const [location] = useLocation();

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <div className="flex items-center space-x-2">
                <Bot className="h-6 w-6 text-primary" />
                <span className="font-bold text-lg">Agentes IA</span>
              </div>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant={location === '/' ? 'default' : 'ghost'} size="sm">
                Dashboard
              </Button>
            </Link>
            
            <Link href="/agents/new">
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Novo Agente
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}