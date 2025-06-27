import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRoute, useLocation } from 'wouter';
import { ArrowLeft, Copy, Eye, Code, Palette } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { apiRequest } from '@/lib/queryClient';
import type { Agent, WidgetConfig } from '@shared/schema';

export default function WidgetConfig() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute('/agents/:id/widget');
  const agentId = params?.id;

  const [config, setConfig] = useState<WidgetConfig>({
    agentSlug: '',
    theme: 'light',
    enableAudio: true,
    primaryColor: '#007bff',
    position: 'bottom-right',
    welcomeMessage: 'Olá! Como posso te ajudar hoje?',
  });

  const [copied, setCopied] = useState(false);

  // Fetch agent data
  const { data: agent } = useQuery<Agent>({
    queryKey: ['/api/agents', agentId],
    queryFn: () => apiRequest(`/api/agents/${agentId}`),
    enabled: !!agentId,
  });

  // Update config when agent loads
  useState(() => {
    if (agent) {
      setConfig(prev => ({ ...prev, agentSlug: agent.slug }));
    }
  });

  const generateWidgetCode = () => {
    const baseUrl = window.location.origin;
    const widgetUrl = `${baseUrl}/api/widget/${config.agentSlug}?theme=${config.theme}&enableAudio=${config.enableAudio}&primaryColor=${encodeURIComponent(config.primaryColor)}`;
    
    return `<!-- Widget de Chat - ${agent?.name} -->
<iframe 
  src="${widgetUrl}"
  width="100%" 
  height="600px" 
  frameborder="0"
  title="Chat Widget ${agent?.name}"
  allow="microphone">
</iframe>

<!-- Alternativa: Script Embed -->
<script>
(function() {
  var iframe = document.createElement('iframe');
  iframe.src = '${widgetUrl}';
  iframe.style.position = 'fixed';
  iframe.style.bottom = '0';
  iframe.style.right = '0';
  iframe.style.width = '350px';
  iframe.style.height = '500px';
  iframe.style.border = 'none';
  iframe.style.zIndex = '9999';
  iframe.allow = 'microphone';
  document.body.appendChild(iframe);
})();
</script>`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateWidgetCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const previewWidget = () => {
    const baseUrl = window.location.origin;
    const widgetUrl = `${baseUrl}/api/widget/${config.agentSlug}?theme=${config.theme}&enableAudio=${config.enableAudio}&primaryColor=${encodeURIComponent(config.primaryColor)}`;
    window.open(widgetUrl, '_blank');
  };

  if (!agent) {
    return (
      <div className="text-center py-12">
        <div>Carregando agente...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => setLocation('/')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Configuração do Widget</h1>
          <p className="text-muted-foreground">
            Configure e personalize o widget de chat para {agent.name}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Configuration Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Aparência
              </CardTitle>
              <CardDescription>
                Personalize a aparência do widget
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="theme">Tema</Label>
                <Select value={config.theme} onValueChange={(value: any) => setConfig(prev => ({ ...prev, theme: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Claro</SelectItem>
                    <SelectItem value="dark">Escuro</SelectItem>
                    <SelectItem value="auto">Automático</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="primaryColor">Cor Principal</Label>
                <div className="flex gap-2">
                  <Input
                    id="primaryColor"
                    type="color"
                    value={config.primaryColor}
                    onChange={(e) => setConfig(prev => ({ ...prev, primaryColor: e.target.value }))}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={config.primaryColor}
                    onChange={(e) => setConfig(prev => ({ ...prev, primaryColor: e.target.value }))}
                    placeholder="#007bff"
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="position">Posição</Label>
                <Select value={config.position} onValueChange={(value: any) => setConfig(prev => ({ ...prev, position: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bottom-right">Inferior Direita</SelectItem>
                    <SelectItem value="bottom-left">Inferior Esquerda</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="welcomeMessage">Mensagem de Boas-vindas</Label>
                <Textarea
                  id="welcomeMessage"
                  value={config.welcomeMessage}
                  onChange={(e) => setConfig(prev => ({ ...prev, welcomeMessage: e.target.value }))}
                  placeholder="Olá! Como posso te ajudar hoje?"
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="enableAudio"
                  checked={config.enableAudio}
                  onChange={(e) => setConfig(prev => ({ ...prev, enableAudio: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="enableAudio">Habilitar gravação de áudio</Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Código de Incorporação
              </CardTitle>
              <CardDescription>
                Copie e cole este código em seu site
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  value={generateWidgetCode()}
                  readOnly
                  rows={12}
                  className="font-mono text-sm"
                />
                
                <div className="flex gap-2">
                  <Button onClick={copyToClipboard} className="flex-1">
                    <Copy className="h-4 w-4 mr-2" />
                    {copied ? 'Copiado!' : 'Copiar Código'}
                  </Button>
                  <Button variant="outline" onClick={previewWidget}>
                    <Eye className="h-4 w-4 mr-2" />
                    Visualizar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview Panel */}
        <Card className="lg:sticky lg:top-6">
          <CardHeader>
            <CardTitle>Pré-visualização</CardTitle>
            <CardDescription>
              Veja como o widget aparecerá em seu site
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative bg-gray-100 rounded-lg p-4 min-h-[400px]">
              <div className="absolute inset-4 bg-white rounded border-2 border-dashed border-gray-300 flex items-center justify-center">
                <span className="text-gray-500">Conteúdo do seu site</span>
              </div>
              
              {/* Widget Preview */}
              <div 
                className={`absolute ${config.position === 'bottom-right' ? 'bottom-4 right-4' : 'bottom-4 left-4'}`}
              >
                {/* Chat Bubble */}
                <div 
                  className="w-14 h-14 rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:scale-110 transition-transform"
                  style={{ backgroundColor: config.primaryColor }}
                >
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Agente:</span>
                <span className="font-medium">{agent.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Slug:</span>
                <span className="font-mono text-xs">{agent.slug}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tema:</span>
                <span className="capitalize">{config.theme}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Áudio:</span>
                <span>{config.enableAudio ? 'Habilitado' : 'Desabilitado'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}