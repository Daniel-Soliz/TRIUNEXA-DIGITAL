import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Clock3,
  Copy,
  ExternalLink,
  FileDown,
  Globe2,
  History,
  Laptop,
  Loader2,
  Maximize2,
  MessageSquareText,
  Monitor,
  RefreshCw,
  Rocket,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Tablet,
  Undo2,
  Unplug,
  WandSparkles,
} from 'lucide-react';
import { Lead, User } from './crm';
import { supabase } from './supabaseApi';
import { toJpeg } from 'html-to-image';
import { SiteRendererV2 } from './site-studio/SiteRendererV2';
import {
  adaptLegacySiteSpec,
  ArtDirectionProposal,
  isSiteSpecV2,
  QualityReport,
  SiteSpecV2,
} from './site-studio/types';

type SiteProject = {
  id: string;
  lead_id: string;
  created_by: string;
  status: 'draft' | 'generating' | 'ready' | 'published' | 'error';
  title: string;
  analysis: Record<string, any>;
  site_spec: Record<string, any>;
  source_snapshot: Record<string, any>;
  generation_mode: 'smart_template' | 'openai';
  model_name?: string | null;
  spec_version?: number;
  briefing?: Record<string, any>;
  design_direction?: Record<string, any>;
  quality_report?: QualityReport | Record<string, any>;
  active_version_id?: string | null;
  generation_run_id?: string | null;
  public_token: string;
  published: boolean;
  published_at?: string | null;
  error_message?: string | null;
  updated_at: string;
};

type SiteVersion = {
  id: string;
  project_id: string;
  version_number: number;
  spec_version: number;
  site_spec: Record<string, any>;
  briefing: Record<string, any>;
  design_direction: Record<string, any>;
  quality_report: QualityReport | Record<string, any>;
  change_instruction: string;
  generation_mode: 'design_engine' | 'openai' | 'legacy';
  model_name?: string | null;
  created_at: string;
};

type GenerationStage = {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  message?: string;
  metadata?: Record<string, any>;
  startedAt?: string;
  finishedAt?: string;
};

type GenerationRun = {
  id: string;
  project_id: string;
  action: 'generate' | 'regenerate' | 'refine' | 'restore';
  status: 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled';
  current_stage: string;
  progress: number;
  stages: GenerationStage[];
  research: Record<string, any>;
  briefing: Record<string, any>;
  strategy: Record<string, any>;
  directions: ArtDirectionProposal[];
  selected_direction: ArtDirectionProposal | Record<string, any>;
  quality_report: QualityReport | Record<string, any>;
  error_message?: string | null;
  result_version_id?: string | null;
  created_at: string;
  finished_at?: string | null;
};

type IntegrationStatus = {
  openai: boolean;
  googlePlaces: boolean;
  instagramOfficialApi: boolean;
};

function asV2(spec: Record<string, any> | null | undefined): SiteSpecV2 | null {
  if (!spec || !Object.keys(spec).length) return null;
  return isSiteSpecV2(spec) ? spec : adaptLegacySiteSpec(spec);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function DeviceButton({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className={`grid h-8 w-8 place-items-center rounded-lg transition ${
        active ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-white/[0.05]'
      }`}
    >
      {children}
    </button>
  );
}

interface SiteStudioProps {
  lead: Lead;
  currentUser: User;
  onClose: () => void;
}

export function SiteStudio({ lead, currentUser: _currentUser, onClose }: SiteStudioProps) {
  const [project, setProject] = useState<SiteProject | null>(null);
  const [versions, setVersions] = useState<SiteVersion[]>([]);
  const [latestRun, setLatestRun] = useState<GenerationRun | null>(null);
  const [activeRun, setActiveRun] = useState<GenerationRun | null>(null);
  const [integrations, setIntegrations] = useState<IntegrationStatus>({
    openai: false,
    googlePlaces: false,
    instagramOfficialApi: false,
  });
  const [modelName, setModelName] = useState<string | null>(null);
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [refineText, setRefineText] = useState('');
  const [refining, setRefining] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [directionOpen, setDirectionOpen] = useState(true);
  const [previewFullscreen, setPreviewFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visualReviewing, setVisualReviewing] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const desktopReviewRef = useRef<HTMLDivElement | null>(null);
  const mobileReviewRef = useRef<HTMLDivElement | null>(null);
  const visualReviewAttemptedRef = useRef<string | null>(null);

  const currentSpec = useMemo(() => asV2(project?.site_spec), [project?.site_spec]);
  const quality = project?.quality_report as QualityReport | undefined;
  const running = activeRun?.status === 'queued' || activeRun?.status === 'running';

  const publicUrl = useMemo(() => {
    if (!project?.published) return '';
    const base = `${window.location.origin}${window.location.pathname}`;
    return `${base}?demo=${project.public_token}`;
  }, [project]);

  const loadProject = useCallback(async () => {
    const { data, error: queryError } = await supabase
      .from('truinexa_site_projects')
      .select('*')
      .eq('lead_id', lead.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (queryError) {
      setError(queryError.message);
      return null;
    }

    const next = (data || null) as SiteProject | null;
    setProject(next);
    return next;
  }, [lead.id]);

  const loadVersions = useCallback(async (projectId: string) => {
    const { data, error: queryError } = await supabase
      .from('truinexa_site_versions')
      .select('*')
      .eq('project_id', projectId)
      .order('version_number', { ascending: false })
      .limit(30);

    if (!queryError) setVersions((data || []) as SiteVersion[]);
  }, []);

  const loadLatestRun = useCallback(async (projectId: string) => {
    const { data, error: queryError } = await supabase
      .from('truinexa_site_generation_runs')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!queryError && data) {
      const run = data as GenerationRun;
      setLatestRun(run);
      if (run.status === 'running' || run.status === 'queued') setActiveRun(run);
      return run;
    }
    return null;
  }, []);

  const refreshProjectBundle = useCallback(
    async (projectId?: string) => {
      const nextProject = projectId
        ? ((await supabase
            .from('truinexa_site_projects')
            .select('*')
            .eq('id', projectId)
            .maybeSingle()).data as SiteProject | null)
        : await loadProject();

      if (nextProject) {
        setProject(nextProject);
        await Promise.all([loadVersions(nextProject.id), loadLatestRun(nextProject.id)]);
      }
    },
    [loadProject, loadVersions, loadLatestRun]
  );

  const stopRunSubscription = useCallback(() => {
    if (channelRef.current) {
      void supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, []);

  const watchRun = useCallback(
    async (runId: string, projectId: string) => {
      stopRunSubscription();

      const { data } = await supabase
        .from('truinexa_site_generation_runs')
        .select('*')
        .eq('id', runId)
        .maybeSingle();

      if (data) setActiveRun(data as GenerationRun);

      const channel = supabase
        .channel(`truinexa-site-run-${runId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'truinexa_site_generation_runs',
            filter: `id=eq.${runId}`,
          },
          async (payload) => {
            const next = payload.new as GenerationRun;
            setActiveRun(next);
            setLatestRun(next);

            if (next.status === 'succeeded') {
              await refreshProjectBundle(projectId);
              setRefining(false);
              stopRunSubscription();
            }

            if (next.status === 'failed') {
              setError(next.error_message || 'A geração falhou. A versão anterior foi preservada.');
              setRefining(false);
              await refreshProjectBundle(projectId);
              stopRunSubscription();
            }
          }
        )
        .subscribe();

      channelRef.current = channel;
    },
    [refreshProjectBundle, stopRunSubscription]
  );

  useEffect(() => {
    let mounted = true;

    const boot = async () => {
      setLoading(true);
      setError(null);

      const [{ data: configData }, nextProject] = await Promise.all([
        supabase.functions.invoke('truinexa-site-studio', {
          body: { action: 'configuration' },
        }),
        loadProject(),
      ]);

      if (!mounted) return;

      if (configData?.integrations) {
        setIntegrations(configData.integrations as IntegrationStatus);
        setModelName(configData.model || null);
      }

      if (nextProject) {
        await Promise.all([loadVersions(nextProject.id), loadLatestRun(nextProject.id)]);
        if (nextProject.generation_run_id) {
          const { data: run } = await supabase
            .from('truinexa_site_generation_runs')
            .select('*')
            .eq('id', nextProject.generation_run_id)
            .maybeSingle();
          if (run && ['queued', 'running'].includes(run.status)) {
            await watchRun(run.id, nextProject.id);
          }
        }
      }

      if (mounted) setLoading(false);
    };

    void boot();

    return () => {
      mounted = false;
      stopRunSubscription();
    };
  }, [lead.id, loadProject, loadVersions, loadLatestRun, stopRunSubscription, watchRun]);

  const waitForImages = async (node: HTMLElement) => {
    const images = Array.from(node.querySelectorAll('img'));
    await Promise.all(
      images.map(
        (image) =>
          new Promise<void>((resolve) => {
            if (image.complete) {
              resolve();
              return;
            }
            const done = () => resolve();
            image.addEventListener('load', done, { once: true });
            image.addEventListener('error', done, { once: true });
            window.setTimeout(done, 2500);
          })
      )
    );
  };

  const captureReviewNode = async (node: HTMLElement, viewport: string) => {
    await waitForImages(node);
    let dataUrl = await toJpeg(node, {
      quality: 0.68,
      pixelRatio: 0.55,
      cacheBust: true,
      backgroundColor: '#ffffff',
    });

    if (dataUrl.length > 4_300_000) {
      dataUrl = await toJpeg(node, {
        quality: 0.48,
        pixelRatio: 0.4,
        cacheBust: true,
        backgroundColor: '#ffffff',
      });
    }

    return { viewport, dataUrl };
  };

  const collectLayoutMetrics = (node: HTMLElement) =>
    Array.from(node.querySelectorAll<HTMLElement>('[data-site-block-type]')).map((element) => {
      const rect = element.getBoundingClientRect();
      return {
        type: element.dataset.siteBlockType || '',
        variant: element.dataset.siteBlockVariant || '',
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      };
    });

  const startVisualReview = useCallback(
    async (projectId: string, versionId: string) => {
      if (!desktopReviewRef.current || !mobileReviewRef.current) return;
      setVisualReviewing(true);

      try {
        await new Promise((resolve) => window.setTimeout(resolve, 900));

        const screenshots = await Promise.all([
          captureReviewNode(desktopReviewRef.current, 'desktop-1440'),
          captureReviewNode(mobileReviewRef.current, 'mobile-390'),
        ]);

        const metrics = {
          desktop: collectLayoutMetrics(desktopReviewRef.current),
          mobile: collectLayoutMetrics(mobileReviewRef.current),
        };

        const { data, error: invokeError } = await supabase.functions.invoke('truinexa-site-studio', {
          body: {
            action: 'start_visual_review',
            projectId,
            versionId,
            screenshots,
            metrics,
          },
        });

        if (invokeError || data?.error) {
          throw new Error(
            data?.message || invokeError?.message || 'Não foi possível iniciar a revisão visual.'
          );
        }

        if (data?.runId) {
          await watchRun(data.runId, projectId);
        }
      } catch (reviewError) {
        console.error('Visual review failed:', reviewError);
      } finally {
        setVisualReviewing(false);
      }
    },
    [watchRun]
  );

  useEffect(() => {
    const versionId = project?.active_version_id;
    const visualReviewed = Boolean((project?.quality_report as any)?.visualReview?.reviewedAt);

    if (
      !versionId ||
      !project ||
      !currentSpec ||
      !integrations.openai ||
      project.generation_mode !== 'openai' ||
      running ||
      visualReviewed ||
      visualReviewing ||
      visualReviewAttemptedRef.current === versionId
    ) {
      return;
    }

    visualReviewAttemptedRef.current = versionId;
    const timer = window.setTimeout(() => {
      void startVisualReview(project.id, versionId);
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [
    currentSpec,
    integrations.openai,
    project,
    running,
    startVisualReview,
    visualReviewing,
  ]);

  const startGeneration = async (directionId?: string) => {
    setError(null);
    const { data, error: invokeError } = await supabase.functions.invoke('truinexa-site-studio', {
      body: {
        action: 'start_generate',
        leadId: lead.id,
        projectId: project?.id || null,
        directionId: directionId || null,
      },
    });

    if (invokeError || data?.error) {
      setError(data?.message || invokeError?.message || 'Não foi possível iniciar a geração.');
      return;
    }

    if (data?.projectId && data?.runId) {
      if (!project) await refreshProjectBundle(data.projectId);
      await watchRun(data.runId, data.projectId);
    }
  };

  const startRefinement = async () => {
    const instruction = refineText.trim();
    if (!project || instruction.length < 3) return;

    setRefining(true);
    setError(null);

    const { data, error: invokeError } = await supabase.functions.invoke('truinexa-site-studio', {
      body: {
        action: 'start_refine',
        projectId: project.id,
        instruction,
      },
    });

    if (invokeError || data?.error) {
      setRefining(false);
      setError(data?.message || invokeError?.message || 'Não foi possível iniciar o refinamento.');
      return;
    }

    setRefineText('');
    if (data?.runId) await watchRun(data.runId, project.id);
  };

  const restoreVersion = async (version: SiteVersion) => {
    if (!project) return;
    if (!window.confirm(`Restaurar o conteúdo da versão ${version.version_number}? A versão atual continuará no histórico.`)) return;

    setError(null);
    const { data, error: invokeError } = await supabase.functions.invoke('truinexa-site-studio', {
      body: {
        action: 'restore',
        projectId: project.id,
        versionId: version.id,
      },
    });

    if (invokeError || data?.error) {
      setError(data?.message || invokeError?.message || 'Não foi possível restaurar a versão.');
      return;
    }

    await refreshProjectBundle(project.id);
  };

  const togglePublish = async () => {
    if (!project) return;
    setPublishing(true);
    setError(null);

    const { data, error: invokeError } = await supabase.functions.invoke('truinexa-site-studio', {
      body: {
        action: project.published ? 'unpublish' : 'publish',
        projectId: project.id,
      },
    });

    if (invokeError || data?.error) {
      setError(data?.message || invokeError?.message || 'Não foi possível atualizar a publicação.');
    } else if (data?.project) {
      setProject(data.project as SiteProject);
    }
    setPublishing(false);
  };

  const copyPublicUrl = async () => {
    if (!publicUrl) return;
    await navigator.clipboard?.writeText(publicUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const exportPdf = () => window.print();

  const previewWidth =
    device === 'mobile' ? 'max-w-[390px]' : device === 'tablet' ? 'max-w-[768px]' : 'max-w-[1440px]';

  const renderProgress = () => {
    if (!activeRun || !running) return null;
    const stages = activeRun.stages || [];

    return (
      <div className="mt-4 rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.06] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.14em] text-indigo-300">
              <Sparkles className="h-3.5 w-3.5" />
              Processamento real
            </div>
            <div className="mt-1 text-xs font-semibold text-slate-300">
              {stages.find((stage) => stage.id === activeRun.current_stage)?.label || 'Preparando execução'}
            </div>
          </div>
          <div className="font-mono text-sm font-black text-indigo-300">{activeRun.progress}%</div>
        </div>

        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full bg-indigo-500 transition-all duration-500"
            style={{ width: `${activeRun.progress}%` }}
          />
        </div>

        <div className="mt-4 space-y-2">
          {stages.map((stage) => (
            <div key={stage.id} className="flex items-start gap-2 text-[10px]">
              <span
                className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full ${
                  stage.status === 'completed'
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : stage.status === 'running'
                      ? 'bg-indigo-500/20 text-indigo-300'
                      : stage.status === 'failed'
                        ? 'bg-rose-500/15 text-rose-400'
                        : 'bg-white/[0.04] text-slate-700'
                }`}
              >
                {stage.status === 'completed' ? (
                  <Check className="h-3 w-3" />
                ) : stage.status === 'running' ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <span className="h-1 w-1 rounded-full bg-current" />
                )}
              </span>
              <div>
                <div className={stage.status === 'pending' ? 'text-slate-700' : 'text-slate-300'}>
                  {stage.label}
                </div>
                {stage.message && stage.status !== 'pending' && (
                  <div className="mt-0.5 leading-4 text-slate-600">{stage.message}</div>
                )}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-3 text-[9px] leading-4 text-slate-600">
          A versão anterior permanece disponível durante toda a regeneração.
        </p>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[70] bg-[#080808] text-white">
      <style>{`
        .site-print-document { display: none; }
        @media print {
          @page { margin: 0; size: A4 portrait; }
          body * { visibility: hidden !important; }
          .site-print-document, .site-print-document * { visibility: visible !important; }
          .site-print-document {
            display: block !important;
            position: absolute !important;
            inset: 0 !important;
            width: 100% !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .site-print-page {
            break-after: page;
            page-break-after: always;
            min-height: 100vh;
          }
          .site-print-page:last-child {
            break-after: auto;
            page-break-after: auto;
          }
        }
      `}</style>

      <div className="flex h-[100dvh] flex-col">
        <header className="flex min-h-16 items-center gap-2 border-b border-white/[0.07] bg-[#101010] px-3 sm:px-5">
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 shrink-0 text-indigo-400" />
              <h2 className="truncate text-sm font-black">Site Studio 3.0 • {lead.company}</h2>
            </div>
            <p className="truncate text-[10px] text-slate-500">
              TRIUNEXA Design Engine • SiteSpec V{project?.spec_version || 1}
            </p>
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            <div className="hidden rounded-xl border border-white/[0.06] bg-white/[0.03] p-1 sm:flex">
              <DeviceButton active={device === 'desktop'} label="Desktop 1440px" onClick={() => setDevice('desktop')}>
                <Laptop className="h-4 w-4" />
              </DeviceButton>
              <DeviceButton active={device === 'tablet'} label="Tablet 768px" onClick={() => setDevice('tablet')}>
                <Tablet className="h-4 w-4" />
              </DeviceButton>
              <DeviceButton active={device === 'mobile'} label="Mobile 375px" onClick={() => setDevice('mobile')}>
                <Smartphone className="h-4 w-4" />
              </DeviceButton>
            </div>

            {currentSpec && (
              <button
                type="button"
                onClick={() => setPreviewFullscreen((value) => !value)}
                className="hidden h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-xs font-semibold text-slate-300 hover:bg-white/[0.08] lg:inline-flex"
              >
                <Maximize2 className="h-4 w-4" />
                Preview
              </button>
            )}

            {currentSpec && (
              <button
                type="button"
                onClick={exportPdf}
                className="hidden h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-xs font-semibold text-slate-300 hover:bg-white/[0.08] sm:inline-flex"
              >
                <FileDown className="h-4 w-4" />
                PDF
              </button>
            )}

            {project && currentSpec && (
              <button
                type="button"
                disabled={publishing || running}
                onClick={() => void togglePublish()}
                className={`inline-flex h-10 items-center gap-2 rounded-xl px-3 text-xs font-bold text-white disabled:opacity-40 ${
                  project.published ? 'bg-slate-700 hover:bg-slate-600' : 'bg-indigo-600 hover:bg-indigo-500'
                }`}
              >
                {publishing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : project.published ? (
                  <Unplug className="h-4 w-4" />
                ) : (
                  <Rocket className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">{project.published ? 'Despublicar' : 'Publicar demonstração'}</span>
              </button>
            )}
          </div>
        </header>

        <div className={`grid min-h-0 flex-1 ${previewFullscreen ? 'grid-cols-1' : 'lg:grid-cols-[350px_minmax(0,1fr)]'}`}>
          {!previewFullscreen && (
            <aside className="overflow-y-auto border-r border-white/[0.07] bg-[#101010] p-4">
              <div
                className={`rounded-2xl border p-4 ${
                  integrations.openai
                    ? 'border-emerald-500/25 bg-emerald-500/[0.06]'
                    : 'border-amber-500/25 bg-amber-500/[0.06]'
                }`}
              >
                <div
                  className={`flex items-center gap-2 text-xs font-black ${
                    integrations.openai ? 'text-emerald-300' : 'text-amber-300'
                  }`}
                >
                  <WandSparkles className="h-4 w-4" />
                  {integrations.openai
                    ? `IA avançada • ${modelName || 'GPT-6.1 Sol'}`
                    : 'Modo estruturado • sem GPT conectado'}
                </div>
                <p className="mt-2 text-[11px] leading-5 text-slate-400">
                  {integrations.openai
                    ? 'Pesquisa, direção de arte, arquitetura, crítica e revisão visual real em desktop/mobile antes da versão final.'
                    : 'Este modo usa regras e componentes seguros. Ele não possui o mesmo nível criativo do ChatGPT até uma chave OpenAI ser configurada no backend.'}
                </p>
              </div>

              {!currentSpec && !running && (
                <button
                  type="button"
                  onClick={() => void startGeneration()}
                  className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3 text-sm font-black text-white hover:bg-indigo-500"
                >
                  <Sparkles className="h-4 w-4" />
                  {integrations.openai ? 'Gerar com IA avançada' : 'Gerar em modo estruturado'}
                </button>
              )}

              {currentSpec && !running && (
                <button
                  type="button"
                  onClick={() => void startGeneration()}
                  className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-3 text-sm font-bold text-white hover:bg-white/[0.08]"
                >
                  <RefreshCw className="h-4 w-4" />
                  {integrations.openai ? 'Regenerar com IA avançada' : 'Regenerar modo estruturado'}
                </button>
              )}

              {renderProgress()}

              {error && (
                <div className="mt-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-[11px] leading-5 text-rose-300">
                  {error}
                </div>
              )}

              {currentSpec && !running && (
                <>
                  <div className="mt-5 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4">
                    <button
                      type="button"
                      onClick={() => setDirectionOpen((value) => !value)}
                      className="flex w-full items-center justify-between gap-2 text-left"
                    >
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-[.14em] text-slate-600">Direção visual</div>
                        <div className="mt-1 text-xs font-bold text-slate-300">{currentSpec.direction.name}</div>
                      </div>
                      <ChevronDown className={`h-4 w-4 text-slate-600 transition ${directionOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {directionOpen && (
                      <div className="mt-3 space-y-2">
                        {(latestRun?.directions?.length
                          ? latestRun.directions
                          : [
                              {
                                id: currentSpec.direction.id,
                                family: currentSpec.direction.family,
                                name: currentSpec.direction.name,
                                rationale: currentSpec.direction.rationale,
                                score: currentSpec.direction.score,
                              } as ArtDirectionProposal,
                            ]
                        ).map((direction) => (
                          <button
                            key={direction.id}
                            type="button"
                            disabled={running}
                            onClick={() => {
                              if (direction.id !== currentSpec.direction.id) void startGeneration(direction.id);
                            }}
                            className={`w-full rounded-xl border p-3 text-left transition ${
                              direction.id === currentSpec.direction.id
                                ? 'border-indigo-500/40 bg-indigo-500/10'
                                : 'border-white/[0.06] bg-white/[0.025] hover:bg-white/[0.05]'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[11px] font-bold text-slate-300">{direction.name}</span>
                              <span className="font-mono text-[9px] text-slate-600">{direction.score}</span>
                            </div>
                            <div className="mt-1 text-[9px] leading-4 text-slate-600">{direction.rationale}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-3 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.14em] text-slate-600">
                      <MessageSquareText className="h-3.5 w-3.5" />
                      Refinar por comando
                    </div>
                    <textarea
                      value={refineText}
                      onChange={(event) => setRefineText(event.target.value.slice(0, 1000))}
                      rows={3}
                      placeholder='Ex.: "Deixe mais sofisticado e aumente as fotografias."'
                      className="mt-3 w-full resize-none rounded-xl border border-white/10 bg-[#151515] p-3 text-xs text-white outline-none placeholder:text-slate-700 focus:border-indigo-500/50"
                    />
                    <button
                      type="button"
                      disabled={refining || refineText.trim().length < 3}
                      onClick={() => void startRefinement()}
                      className="mt-2 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 text-xs font-black text-white hover:bg-violet-500 disabled:opacity-40"
                    >
                      {refining ? <Loader2 className="h-4 w-4 animate-spin" /> : <WandSparkles className="h-4 w-4" />}
                      Aplicar sem destruir o restante
                    </button>
                  </div>

                  {quality && (
                    <div className="mt-3 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.14em] text-slate-600">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Qualidade automática
                        </div>
                        <div className={`font-mono text-lg font-black ${Number(quality.score || 0) >= 78 ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {Number(quality.score || 0)}
                        </div>
                      </div>
                      <div className="mt-3 space-y-1.5">
                        {(quality.checks || []).slice(0, 8).map((check) => (
                          <div key={check.id} className="flex items-center justify-between gap-2 text-[9px]">
                            <span className="text-slate-500">{check.label}</span>
                            <span className={check.passed ? 'text-emerald-400' : 'text-amber-400'}>
                              {check.score}
                            </span>
                          </div>
                        ))}
                      </div>
                      {(quality as any)?.designDiversity?.compared > 0 && (
                        <div className="mt-3 rounded-xl border border-white/[0.07] bg-white/[0.025] p-2.5">
                          <div className="text-[9px] font-black uppercase tracking-[.12em] text-slate-300">
                            Originalidade visual verificada
                          </div>
                          <p className="mt-1 text-[9px] leading-4 text-slate-500">
                            Similaridade estrutural máxima de{' '}
                            {Math.round(Number((quality as any).designDiversity.finalSimilarity) * 100)}%
                            {' '}contra {(quality as any).designDiversity.compared} sites recentes.
                            {' '}Limite: {Math.round(Number((quality as any).designDiversity.threshold) * 100)}%.
                          </p>
                        </div>
                      )}
                      {!(quality as any)?.visualReview?.reviewedAt && (
                        <p className="mt-3 text-[9px] leading-4 text-amber-300/80">
                          Esta nota avalia a estrutura do site. A inspeção visual das capturas
                          desktop e mobile ainda não foi concluída.
                        </p>
                      )}
                      {(quality as any)?.visualReview?.reviewedAt && (
                        <div className="mt-3 rounded-xl border border-emerald-500/15 bg-emerald-500/[0.05] p-2.5">
                          <div className="text-[9px] font-black uppercase tracking-[.12em] text-emerald-400">
                            Revisão visual concluída
                          </div>
                          <div className="mt-1 text-[9px] leading-4 text-slate-500">
                            Desktop e mobile foram inspecionados pela IA antes desta versão.
                          </div>
                        </div>
                      )}
                      {visualReviewing && (
                        <div className="mt-3 flex items-center gap-2 text-[9px] text-indigo-300">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          IA olhando o site renderizado em desktop e mobile...
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-3 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4">
                    <div className="text-[10px] font-black uppercase tracking-[.14em] text-slate-600">Integrações reais</div>
                    <div className="mt-3 space-y-2 text-[10px]">
                      <div className="flex justify-between gap-3">
                        <span className="text-slate-500">OpenAI</span>
                        <span className={integrations.openai ? 'text-emerald-400' : 'text-amber-400'}>
                          {integrations.openai ? `Ativo • ${modelName || 'GPT-6.1 Sol'} + revisão visual` : 'Não configurado • sem IA generativa'}
                        </span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-slate-500">Google Places</span>
                        <span className={integrations.googlePlaces ? 'text-emerald-400' : 'text-amber-400'}>
                          {integrations.googlePlaces ? 'Ativo' : 'Não configurado'}
                        </span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-slate-500">Instagram / Meta API</span>
                        <span className="text-amber-400">Não configurado</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4">
                    <button
                      type="button"
                      onClick={() => setHistoryOpen((value) => !value)}
                      className="flex w-full items-center justify-between gap-2 text-left"
                    >
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.14em] text-slate-600">
                        <History className="h-3.5 w-3.5" />
                        Histórico • {versions.length}
                      </div>
                      <ChevronDown className={`h-4 w-4 text-slate-600 transition ${historyOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {historyOpen && (
                      <div className="mt-3 space-y-2">
                        {versions.map((version) => (
                          <div
                            key={version.id}
                            className={`rounded-xl border p-3 ${
                              version.id === project?.active_version_id
                                ? 'border-indigo-500/35 bg-indigo-500/[0.06]'
                                : 'border-white/[0.05] bg-white/[0.02]'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <div className="text-[10px] font-bold text-slate-300">Versão {version.version_number}</div>
                                <div className="mt-0.5 text-[8px] text-slate-600">{formatDate(version.created_at)}</div>
                              </div>
                              {version.id !== project?.active_version_id && (
                                <button
                                  type="button"
                                  onClick={() => void restoreVersion(version)}
                                  className="inline-flex items-center gap-1 rounded-lg bg-white/[0.05] px-2 py-1.5 text-[9px] font-bold text-slate-400 hover:text-white"
                                >
                                  <Undo2 className="h-3 w-3" />
                                  Restaurar
                                </button>
                              )}
                            </div>
                            {version.change_instruction && (
                              <div className="mt-2 text-[9px] leading-4 text-slate-600">
                                “{version.change_instruction}”
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {project?.published && publicUrl && (
                    <div className="mt-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.14em] text-emerald-400">
                        <Globe2 className="h-3.5 w-3.5" />
                        Demonstração publicada
                      </div>
                      <div className="mt-2 break-all text-[9px] leading-4 text-slate-500">{publicUrl}</div>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => void copyPublicUrl()}
                          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-white/[0.06] text-[10px] font-bold text-white"
                        >
                          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                          {copied ? 'Copiado' : 'Copiar link'}
                        </button>
                        <a
                          href={publicUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 text-[10px] font-bold text-white"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Abrir
                        </a>
                      </div>
                    </div>
                  )}
                </>
              )}
            </aside>
          )}

          <main className={`min-w-0 overflow-auto bg-[#080808] ${previewFullscreen ? 'p-0' : 'p-3 sm:p-6'}`}>
            {loading ? (
              <div className="grid h-full min-h-[480px] place-items-center">
                <div className="text-center">
                  <Loader2 className="mx-auto h-7 w-7 animate-spin text-indigo-400" />
                  <p className="mt-3 text-xs text-slate-600">Carregando Site Studio...</p>
                </div>
              </div>
            ) : currentSpec ? (
              <div
                className={`mx-auto overflow-hidden border border-white/[0.08] bg-white shadow-2xl shadow-black/40 transition-all duration-300 ${
                  previewFullscreen ? 'min-h-full max-w-none rounded-none border-0' : `${previewWidth} rounded-2xl`
                }`}
              >
                <SiteRendererV2 spec={currentSpec} />
              </div>
            ) : running ? (
              <div className="grid h-full min-h-[520px] place-items-center px-5">
                <div className="max-w-md text-center">
                  <Loader2 className="mx-auto h-9 w-9 animate-spin text-indigo-400" />
                  <h3 className="mt-5 text-xl font-black">Criando uma direção exclusiva</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    O preview aparece somente depois que o SiteSpec V2 passa pela revisão automática.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid h-full min-h-[520px] place-items-center px-5">
                <div className="max-w-lg text-center">
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-indigo-500/10 text-indigo-400">
                    <Sparkles className="h-7 w-7" />
                  </div>
                  <h3 className="mt-5 text-xl font-black">Crie um projeto profissional para {lead.company}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    A geração V2 pesquisa fontes permitidas, monta briefing, cria três direções artísticas, planeja páginas e só libera o preview após validação estrutural.
                  </p>
                  <button
                    type="button"
                    onClick={() => void startGeneration()}
                    className="mt-6 inline-flex h-12 items-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-black text-white hover:bg-indigo-500"
                  >
                    <Sparkles className="h-4 w-4" />
                    Analisar e gerar site
                  </button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {currentSpec && integrations.openai && project?.generation_mode === 'openai' && (
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            left: '-20000px',
            top: 0,
            width: 1500,
            pointerEvents: 'none',
            zIndex: -1,
          }}
        >
          <div ref={desktopReviewRef} style={{ width: 1440, background: '#fff' }}>
            <SiteRendererV2 spec={currentSpec} />
          </div>
          <div ref={mobileReviewRef} style={{ width: 390, background: '#fff', marginTop: 40 }}>
            <SiteRendererV2 spec={currentSpec} />
          </div>
        </div>
      )}

      {currentSpec && (
        <div className="site-print-document">
          <SiteRendererV2 spec={currentSpec} forceAllPages />
        </div>
      )}
    </div>
  );
}

export function PublicSiteDemo({ token }: { token: string }) {
  const [spec, setSpec] = useState<SiteSpecV2 | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    const url =
      'https://wsyxykfhxguhyojitpbl.supabase.co/functions/v1/truinexa-site-public?token=' +
      encodeURIComponent(token);

    fetch(url)
      .then(async (response) => {
        if (!response.ok) throw new Error('not found');
        return response.json();
      })
      .then((data) => {
        if (!active) return;
        const loaded = asV2(data?.demo?.siteSpec);
        if (!loaded) throw new Error('invalid');
        setSpec(loaded);
        document.title = data?.demo?.title || loaded.brand.name;
      })
      .catch(() => {
        if (active) setError(true);
      });

    return () => {
      active = false;
    };
  }, [token]);

  if (error) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#0D0D0D] px-5 text-center text-white">
        <div>
          <Globe2 className="mx-auto h-10 w-10 text-slate-600" />
          <h1 className="mt-4 text-xl font-black">Demonstração indisponível</h1>
          <p className="mt-2 text-sm text-slate-500">
            Este link pode ter sido despublicado ou não existe mais.
          </p>
        </div>
      </div>
    );
  }

  if (!spec) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#0D0D0D]">
        <div className="text-center">
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-indigo-400" />
          <p className="mt-3 text-xs text-slate-600">Carregando demonstração...</p>
        </div>
      </div>
    );
  }

  return <SiteRendererV2 spec={spec} publicMode />;
}
