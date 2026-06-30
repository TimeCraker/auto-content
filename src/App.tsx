import { useCallback, useEffect, useState } from 'react';

interface Trend { keyword: string; score: number; source: string }
interface Draft { name: string; content: string }

export default function App() {
  const [trends, setTrends] = useState<Trend[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [selected, setSelected] = useState<Draft | null>(null);
  const [editContent, setEditContent] = useState('');
  const [loading, setLoading] = useState('');
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    const [t, d, i] = await Promise.all([
      fetch('/api/trends').then((r) => r.json()),
      fetch('/api/drafts').then((r) => r.json()),
      fetch('/api/images').then((r) => r.json()),
    ]);
    setTrends(t);
    setDrafts(d);
    setImages(i);
    if (d.length && !selected) {
      setSelected(d[0]);
      setEditContent(d[0].content);
    }
  }, [selected]);

  useEffect(() => { void refresh(); }, [refresh]);

  async function run(action: string, path: string) {
    setLoading(action);
    setError('');
    try {
      const res = await fetch(path, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'failed');
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'error');
    } finally {
      setLoading('');
    }
  }

  function selectDraft(d: Draft) {
    setSelected(d);
    setEditContent(d.content);
  }

  async function copyDraft() {
    await navigator.clipboard.writeText(editContent);
  }

  return (
    <div>
      <header style={{ padding: '20px 24px 0', maxWidth: 1400, margin: '0 auto' }}>
        <h1>Auto Content · 流量引擎</h1>
        <p className="sub">抓取热词 → 生成草稿 → 封面 PNG · 人工审核后手动发布</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
          <button type="button" className="btn-primary" disabled={!!loading} onClick={() => run('crawl', '/api/crawl')}>
            {loading === 'crawl' ? '抓取中…' : '1. 抓取热词'}
          </button>
          <button type="button" className="btn-primary" disabled={!!loading} onClick={() => run('generate', '/api/generate')}>
            {loading === 'generate' ? '生成中…' : '2. 生成草稿'}
          </button>
          <button type="button" className="btn-primary" disabled={!!loading} onClick={() => run('images', '/api/images')}>
            {loading === 'images' ? '出图中…' : '3. 生成封面'}
          </button>
          <button type="button" className="btn-primary" disabled={!!loading} onClick={() => run('weekly', '/api/weekly')}>
            {loading === 'weekly' ? '全流程…' : '一键 weekly'}
          </button>
        </div>
        {error && <p style={{ color: '#dc2626', fontSize: 13 }}>{error}</p>}
      </header>

      <div className="layout">
        <section className="panel">
          <h2 style={{ fontSize: 16, marginBottom: 12 }}>热词 ({trends.length})</h2>
          {trends.map((t) => (
            <div key={t.keyword} className="item">
              <div style={{ fontWeight: 500 }}>{t.keyword}</div>
              <div style={{ fontSize: 12, color: '#86868b' }}>{t.source} · {t.score}</div>
            </div>
          ))}
          {!trends.length && <p style={{ color: '#86868b', fontSize: 13 }}>点击「抓取热词」开始</p>}
        </section>

        <section className="panel">
          <h2 style={{ fontSize: 16, marginBottom: 12 }}>草稿 ({drafts.length})</h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            {drafts.map((d) => (
              <button
                key={d.name}
                type="button"
                className={`item ${selected?.name === d.name ? 'active' : ''}`}
                style={{ border: 'none', textAlign: 'left' }}
                onClick={() => selectDraft(d)}
              >
                {d.name}
              </button>
            ))}
          </div>
          {selected ? (
            <>
              <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} />
              <button type="button" className="btn-primary" style={{ marginTop: 12 }} onClick={() => void copyDraft()}>
                复制到剪贴板
              </button>
            </>
          ) : (
            <p style={{ color: '#86868b', fontSize: 13 }}>生成草稿后在此编辑</p>
          )}
        </section>

        <section className="panel">
          <h2 style={{ fontSize: 16, marginBottom: 12 }}>封面图 ({images.length})</h2>
          {images.map((img) => (
            <div key={img} style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 12, color: '#86868b', marginBottom: 6 }}>{img}</p>
              <img
                src={`/api/images/file/${encodeURIComponent(img)}`}
                alt={img}
                style={{ width: '100%', borderRadius: 12, border: '1px solid #e8e8ed' }}
              />
            </div>
          ))}
          {!images.length && <p style={{ color: '#86868b', fontSize: 13 }}>生成封面后在此预览</p>}
        </section>
      </div>
    </div>
  );
}
