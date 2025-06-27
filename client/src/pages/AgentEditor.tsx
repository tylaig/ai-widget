import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useRoute, useLocation } from 'wouter';
import { ArrowLeft, Upload, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { Agent, AgentInsert } from '@shared/schema';

export default function AgentEditor() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute('/agents/:id/edit');
  const isEditing = match && params?.id !== 'new';
  const agentId = params?.id;

  const [formData, setFormData] = useState<AgentInsert>({
    name: '',
    description: '',
    model: 'gpt-4o',
    slug: '',
    instructions: '',
    isActive: true,
    files: [],
  });

  const [slugError, setSlugError] = useState('');

  // Fetch agent data if editing
  const { data: agent } = useQuery<Agent>({
    queryKey: ['/api/agents', agentId],
    queryFn: () => apiRequest(`/api/agents/${agentId}`),
    enabled: isEditing,
  });

  // Fetch OpenAI assistants
  const { data: assistants = [] } = useQuery({
    queryKey: ['/api/openai/assistants'],
    queryFn: () => apiRequest('/api/openai/assistants'),
  });

  useEffect(() => {
    if (agent && isEditing) {
      setFormData({
        name: agent.name,
        description: agent.description || '',
        model: agent.model,
        slug: agent.slug,
        instructions: agent.instructions || '',
        isActive: agent.isActive,
        files: agent.files,
      });
    }
  }, [agent, isEditing]);

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  // Validate slug
  const validateSlug = (slug: string) => {
    if (!slug) {
      setSlugError('Slug é obrigatório');
      return false;
    }
    if (!/^[a-z0-9-]+$/.test(slug)) {
      setSlugError('Slug deve conter apenas letras minúsculas, números e hífens');
      return false;
    }
    setSlugError('');
    return true;
  };

  // Save agent mutation
  const saveAgentMutation = useMutation({
    mutationFn: (data: AgentInsert) => {
      if (isEditing) {
        return apiRequest(`/api/agents/${agentId}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
      } else {
        return apiRequest('/api/agents', {
          method: 'POST',
          body: JSON.stringify(data),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/agents'] });
      setLocation('/');
    },
  });

  // Delete agent mutation
  const deleteAgentMutation = useMutation({
    mutationFn: () => apiRequest(`/api/agents/${agentId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/agents'] });
      setLocation('/');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateSlug(formData.slug)) {
      saveAgentMutation.mutate(formData);
    }
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: prev.slug || generateSlug(name),
    }));
  };

  const handleSlugChange = (slug: string) => {
    setFormData(prev => ({ ...prev, slug }));
    validateSlug(slug);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !isEditing) return;

    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await apiRequest(`/api/agents/${agentId}/files`, {
        method: 'POST',
        body: formData,
        headers: {}, // Remove Content-Type to let browser set it with boundary
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/agents', agentId] });
    } catch (error) {
      console.error('Error uploading files:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => setLocation('/')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {isEditing ? 'Editar Agente' : 'Novo Agente'}
          </h1>
          <p className="text-muted-foreground">
            Configure as propriedades e comportamento do agente
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
              <CardDescription>
                Dados principais do agente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Nome do Agente *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Ex: Atendimento ao Cliente"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descreva a função do agente..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="slug">Slug (URL) *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="atendimento-cliente"
                  className={slugError ? 'border-red-500' : ''}
                  required
                />
                {slugError && (
                  <p className="text-sm text-red-500 mt-1">{slugError}</p>
                )}
                <p className="text-sm text-muted-foreground mt-1">
                  URL do widget: /api/widget/{formData.slug}
                </p>
              </div>

              <div>
                <Label htmlFor="model">Modelo OpenAI</Label>
                <Select value={formData.model} onValueChange={(value) => setFormData(prev => ({ ...prev, model: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4o">GPT-4o (Recomendado)</SelectItem>
                    <SelectItem value="gpt-4">GPT-4</SelectItem>
                    <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* AI Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Configuração da IA</CardTitle>
              <CardDescription>
                Instruções e comportamento do agente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="instructions">Instruções do Sistema</Label>
                <Textarea
                  id="instructions"
                  value={formData.instructions}
                  onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                  placeholder="Você é um assistente especializado em..."
                  rows={6}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Defina como o agente deve se comportar e responder
                </p>
              </div>

              {assistants.length > 0 && (
                <div>
                  <Label>Assistentes OpenAI Disponíveis</Label>
                  <div className="mt-2 space-y-2">
                    {assistants.map((assistant: any) => (
                      <div key={assistant.id} className="p-3 border rounded-lg">
                        <div className="font-medium">{assistant.name}</div>
                        <div className="text-sm text-muted-foreground">
                          ID: {assistant.id}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Modelo: {assistant.model}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* File Upload */}
        {isEditing && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Arquivos de Treinamento
              </CardTitle>
              <CardDescription>
                Faça upload de arquivos para treinar o agente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Input
                  type="file"
                  multiple
                  accept=".pdf,.txt,.docx,.md"
                  onChange={handleFileUpload}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Formatos aceitos: PDF, TXT, DOCX, MD
                </p>
              </div>

              {formData.files.length > 0 && (
                <div className="space-y-2">
                  <Label>Arquivos Enviados</Label>
                  {formData.files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm">{file}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            files: prev.files.filter((_, i) => i !== index)
                          }));
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between">
          {isEditing && (
            <Button
              type="button"
              variant="destructive"
              onClick={() => deleteAgentMutation.mutate()}
              disabled={deleteAgentMutation.isPending}
            >
              {deleteAgentMutation.isPending ? 'Excluindo...' : 'Excluir Agente'}
            </Button>
          )}
          
          <div className="flex gap-2 ml-auto">
            <Button type="button" variant="outline" onClick={() => setLocation('/')}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saveAgentMutation.isPending}>
              {saveAgentMutation.isPending 
                ? 'Salvando...' 
                : isEditing ? 'Salvar Alterações' : 'Criar Agente'
              }
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}