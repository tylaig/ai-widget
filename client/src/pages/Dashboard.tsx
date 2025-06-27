import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Bot, Edit, Settings, MessageCircle, Key, CheckCircle, XCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { Agent, ApiKey } from '@shared/schema';

export default function Dashboard() {
  const [apiKey, setApiKey] = useState('');

  // Fetch API key status
  const { data: currentApiKey } = useQuery<ApiKey>({
    queryKey: ['/api/api-key'],
    queryFn: () => apiRequest('/api/api-key'),
  });

  // Fetch agents
  const { data: agents = [], isLoading: agentsLoading } = useQuery<Agent[]>({
    queryKey: ['/api/agents'],
    queryFn: () => apiRequest('/api/agents'),
  });

  // API key mutation
  const apiKeyMutation = useMutation({
    mutationFn: (key: string) => apiRequest('/api/api-key', {
      method: 'POST',
      body: JSON.stringify({ openaiApiKey: key }),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/api-key'] });
      setApiKey('');
    },
  });

  const handleApiKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      apiKeyMutation.mutate(apiKey.trim());
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Gerencie seus agentes de IA e configurações da OpenAI
        </p>
      </div>

      {/* API Key Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Configuração da API OpenAI
          </CardTitle>
          <CardDescription>
            Configure sua chave da API da OpenAI para ativar os agentes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {currentApiKey && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                {currentApiKey.isValid ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">API Key válida e conectada</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium">API Key inválida</span>
                  </>
                )}
              </div>
            )}
            
            <form onSubmit={handleApiKeySubmit} className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="apiKey">Chave da API OpenAI</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="sk-..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
              </div>
              <Button 
                type="submit" 
                disabled={apiKeyMutation.isPending}
                className="mt-6"
              >
                {apiKeyMutation.isPending ? 'Validando...' : 'Salvar'}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>

      {/* Agents List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Agentes Disponíveis
          </CardTitle>
          <CardDescription>
            Lista de todos os agentes configurados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {agentsLoading ? (
            <div className="text-center py-8">Carregando agentes...</div>
          ) : agents.length === 0 ? (
            <div className="text-center py-8">
              <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum agente encontrado</h3>
              <p className="text-muted-foreground mb-4">
                Crie seu primeiro agente para começar
              </p>
              <Link href="/agents/new">
                <Button>Criar Primeiro Agente</Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {agents.map((agent) => (
                <Card key={agent.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{agent.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {agent.description || 'Sem descrição'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Modelo:</span>
                        <span className="font-medium">{agent.model}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Slug:</span>
                        <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                          {agent.slug}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Status:</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          agent.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {agent.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                      
                      <div className="flex gap-2 pt-2">
                        <Link href={`/agents/${agent.id}/edit`}>
                          <Button variant="outline" size="sm" className="flex-1">
                            <Edit className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                        </Link>
                        <Link href={`/agents/${agent.id}/widget`}>
                          <Button variant="outline" size="sm" className="flex-1">
                            <Settings className="h-4 w-4 mr-1" />
                            Widget
                          </Button>
                        </Link>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(`/api/widget/${agent.slug}`, '_blank')}
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}