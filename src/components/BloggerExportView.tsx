import { useMemo, useState } from 'react';
import { Check, Copy, Download, Eye, Monitor, Smartphone } from 'lucide-react';
import type { AdSlot, BloggerConfig, Tournament } from '../types';
import {
  generateBloggerStandaloneHtml,
  generateBloggerXmlTheme,
} from '../utils/bloggerTemplate';

interface BloggerExportViewProps {
  config: BloggerConfig;
  tournaments: Tournament[];
  adSlots: AdSlot[];
  onGoToAdmin: () => void;
}

export function BloggerExportView({
  config,
  tournaments,
  adSlots,
  onGoToAdmin,
}: BloggerExportViewProps) {
  const [format, setFormat] = useState<'html' | 'xml'>('html');
  const [showPreview, setShowPreview] = useState(false);
  const [previewWidth, setPreviewWidth] = useState<'desktop' | 'mobile'>('desktop');
  const [copied, setCopied] = useState(false);

  const standaloneHtml = useMemo(
    () => generateBloggerStandaloneHtml({ config, tournaments, adSlots }),
    [config, tournaments, adSlots],
  );

  const xmlTheme = useMemo(
    () => generateBloggerXmlTheme({ config, tournaments, adSlots }),
    [config, tournaments, adSlots],
  );

  const activeCode = format === 'html' ? standaloneHtml : xmlTheme;

  const handleCopy = () => {
    navigator.clipboard?.writeText(activeCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = format === 'html' ? 'html' : 'xml';
    const mime = format === 'html' ? 'text/html' : 'application/xml';
    const blob = new Blob([activeCode], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `booyaharena-blogger.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white">
            Blogger.com HTML &amp; XML Template Studio
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Export a single-file responsive website ready to paste into Blogger.com with your
            tournaments, ads, unique account IDs, and WhatsApp coin system.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold whitespace-nowrap transition-colors"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied Code' : `Copy ${format.toUpperCase()}`}</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium whitespace-nowrap transition-colors"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            <span>Download .{format}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowPreview((prev) => !prev)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg border text-sm font-medium whitespace-nowrap transition-colors ${
              showPreview
                ? 'border-orange-500 bg-orange-500/15 text-orange-300'
                : 'border-slate-700 bg-[#121824] text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Eye className="w-4 h-4" aria-hidden="true" />
            <span>{showPreview ? 'View Code' : 'Live Preview'}</span>
          </button>
        </div>
      </div>

      {/* Deployment Guide & Current Blogger Sync Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 rounded-2xl border border-slate-800 bg-[#121824] p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xl font-bold text-white">Blogger.com Setup Guide</h2>
            <button
              type="button"
              onClick={onGoToAdmin}
              className="text-xs font-medium text-orange-400 hover:text-orange-300 whitespace-nowrap"
            >
              Edit Config in Admin
            </button>
          </div>

          <div className="space-y-3 text-sm text-slate-300">
            <div className="rounded-xl border border-slate-800 bg-[#0B0F17] p-3.5">
              <div className="font-semibold text-white">1. Install on Blogger.com</div>
              <p className="text-xs text-slate-400 mt-1">
                Use <strong>Blogger XML Theme</strong> inside Blogger → Theme → Edit HTML, or paste{' '}
                <strong>Blogger Page HTML</strong> into a full-page Blogger Page in HTML View.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#0B0F17] p-3.5">
              <div className="font-semibold text-white">2. Admin-Only Coin Addition</div>
              <p className="text-xs text-slate-400 mt-1">
                Players message{' '}
                <span className="font-mono text-emerald-400">{config.adminWhatsapp}</span> with
                their Unique ID (<span className="font-mono">FF-XXXXXX</span>). Publish a Blogger
                post labeled <span className="font-mono text-orange-400">{config.coinFeedLabel}</span>{' '}
                containing <span className="font-mono">+250 COINS FF-849201</span> — only the
                blog admin can publish posts!
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#0B0F17] p-3.5">
              <div className="font-semibold text-white">3. Monetize with Ads</div>
              <p className="text-xs text-slate-400 mt-1">
                Paste Google AdSense, Adsterra, or custom sponsor HTML in Admin → Ads &amp; Earning.
                Your live ad tags are embedded directly into this exported code.
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 text-xs text-slate-400 space-y-1">
            <div>
              Blog URL: <span className="font-mono text-slate-200">{config.blogUrl}</span>
            </div>
            <div>
              Active Ad Slots:{' '}
              <span className="font-mono text-slate-200">
                {adSlots.filter((s) => s.enabled).length} / {adSlots.length}
              </span>
            </div>
            <div>
              Embedded Matches:{' '}
              <span className="font-mono text-slate-200">{tournaments.length}</span>
            </div>
          </div>
        </div>

        {/* Code / Preview Workspace */}
        <div className="lg:col-span-8 rounded-2xl border border-slate-800 bg-[#121824] overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-slate-800 bg-[#0B0F17] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1 p-1 rounded-lg bg-[#121824] border border-slate-800">
              <button
                type="button"
                onClick={() => setFormat('html')}
                className={`px-3 py-1.5 min-h-[36px] rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                  format === 'html' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Blogger Page HTML
              </button>
              <button
                type="button"
                onClick={() => setFormat('xml')}
                className={`px-3 py-1.5 min-h-[36px] rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                  format === 'xml' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Blogger XML Theme
              </button>
            </div>

            {showPreview && (
              <div className="flex items-center gap-1 p-1 rounded-lg bg-[#121824] border border-slate-800">
                <button
                  type="button"
                  onClick={() => setPreviewWidth('desktop')}
                  aria-label="Desktop preview"
                  className={`px-2.5 py-1.5 min-h-[36px] rounded-md text-xs font-medium inline-flex items-center gap-1.5 ${
                    previewWidth === 'desktop'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Desktop</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewWidth('mobile')}
                  aria-label="Mobile preview"
                  className={`px-2.5 py-1.5 min-h-[36px] rounded-md text-xs font-medium inline-flex items-center gap-1.5 ${
                    previewWidth === 'mobile'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Mobile</span>
                </button>
              </div>
            )}
          </div>

          {showPreview ? (
            <div className="p-4 bg-[#070A10] flex justify-center">
              <iframe
                title="Exported Blogger HTML live preview"
                srcDoc={standaloneHtml}
                sandbox="allow-scripts allow-forms allow-popups"
                className={`h-[560px] rounded-xl border border-slate-700 bg-[#0B0F17] transition-all ${
                  previewWidth === 'mobile' ? 'w-[390px]' : 'w-full'
                }`}
              />
            </div>
          ) : (
            <textarea
              readOnly
              aria-label="Generated Blogger template source code"
              value={activeCode}
              className="w-full h-[560px] p-4 bg-[#0B0F17] text-slate-200 font-mono text-xs leading-relaxed resize-none focus:outline-none"
            />
          )}
        </div>
      </div>
    </div>
  );
}
