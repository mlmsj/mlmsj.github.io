import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { categories, getCategoryPath, validateCategories, type Category } from '../../categories';
import { MAX_FILE_BYTES, parseManualImport } from './index';
import { clearWorkspace, createWorkspace, getWorkspaceView, prepareExport, revalidateWorkspace, updateWorkspace, type ImportWorkspaceState, type WorkspaceAction, type WorkspaceRow } from './workspace';
import { FIELDS, type Field } from './types';
import { downloadJson } from './downloadJson';
import './ImportSkeleton.css';

const labels: Record<Field, string> = { name: '名称', fileType: '文件类型', sizeBytes: '大小（字节）', categoryId: '分类', sourceLabel: '来源', note: '备注' };
const fileTypes = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'other'];
type Editor = { id: string; values: Record<Field, string> };
type Modal = { type: 'replace'; file: File; token: number } | { type: 'clear' } | { type: 'export'; version: number; count: number; omitted: number };
type Filter = 'all' | 'valid' | 'pending' | 'invalid' | 'excluded';

function Confirmation({ title, children, confirmLabel, onCancel, onConfirm }: { title: string; children: ReactNode; confirmLabel: string; onCancel: () => void; onConfirm: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const panel = host.current!;
    panel.querySelector<HTMLButtonElement>('button')?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onCancel(); }
      if (event.key === 'Tab') {
        const buttons = panel.querySelectorAll<HTMLButtonElement>('button:not(:disabled)');
        const first = buttons[0], last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    panel.addEventListener('keydown', key);
    return () => { panel.removeEventListener('keydown', key); if (previous?.isConnected) previous.focus(); };
  }, [onCancel]);
  return <div className="import-modal-backdrop"><div ref={host} role="dialog" aria-modal="true" aria-labelledby="import-confirm-title" aria-describedby="import-confirm-body" className="import-modal"><h2 id="import-confirm-title">{title}</h2><div id="import-confirm-body">{children}</div><div className="import-row-actions"><button type="button" onClick={onCancel}>取消</button><button type="button" onClick={onConfirm}>{confirmLabel}</button></div></div></div>;
}

export function ImportWorkspace({ categoryValues = categories }: { categoryValues?: readonly Category[] }) {
  const options = useMemo(() => validateCategories(categoryValues).length ? [] : categoryValues.filter(category => category.level === 3 && category.enabled && getCategoryPath(category.id, categoryValues).length === 3 && getCategoryPath(category.id, categoryValues).every(item => item.enabled)), [categoryValues]);
  const categoryIds = useMemo(() => new Set(options.map(category => category.id)), [options]);
  const currentCategoryIds = useRef(categoryIds);
  const [state, setState] = useState<ImportWorkspaceState | null>(null);
  const stateRef = useRef<ImportWorkspaceState | null>(null);
  const version = useRef(0), readToken = useRef(0);
  const [reading, setReading] = useState(false);
  const [notice, setNotice] = useState('请选择本地 CSV 或 JSON 清单。内容只在当前页面内存中处理。');
  const [dirty, setDirty] = useState(false);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [modal, setModal] = useState<Modal | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [page, setPage] = useState(0);
  const [reentry, setReentry] = useState<ReadonlySet<string>>(new Set());
  const input = useRef<HTMLInputElement>(null);
  const commit = (next: ImportWorkspaceState | null) => { version.current++; stateRef.current = next; setState(next); setDirty(next !== null); };

  useEffect(() => () => { readToken.current++; }, []);
  useEffect(() => {
    currentCategoryIds.current = categoryIds;
    if (!stateRef.current) return;
    const checked = revalidateWorkspace(stateRef.current, categoryIds);
    if (checked.ok) { version.current++; stateRef.current = checked.state; setState(checked.state); setDirty(true); setNotice('分类快照已更新，记录及重复复核已重新校验。'); }
  }, [categoryIds]);
  useEffect(() => {
    const leave = (event: BeforeUnloadEvent) => { if (dirty || editor || reading) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', leave);
    return () => window.removeEventListener('beforeunload', leave);
  }, [dirty, editor, reading]);

  const view = state ? getWorkspaceView(state, categoryIds, 0, 100) : null;
  const rows = view?.ok ? view.rows : [];
  const stats = view?.ok ? view.stats : { total: 0, valid: 0, invalid: 0, pendingReview: 0, excluded: 0, exportable: 0 };
  const filtered = rows.filter(row => filter === 'all' || (filter === 'valid' && row.validation === 'valid' && !row.excluded) || (filter === 'invalid' && row.validation === 'invalid' && !row.excluded) || (filter === 'pending' && row.duplicateReview === 'pending') || (filter === 'excluded' && row.excluded));
  const pages = Math.max(1, Math.ceil(filtered.length / 10)), visiblePage = Math.min(page, pages - 1);
  const visibleRows = filtered.slice(visiblePage * 10, visiblePage * 10 + 10);
  const locked = reading || modal !== null;

  const readFile = async (file: File, token: number) => {
    if (file.size === 0 || file.size > MAX_FILE_BYTES) { setNotice(file.size === 0 ? 'EMPTY_FILE：文件为空。' : 'FILE_TOO_LARGE：文件超过 1 MiB，未读取内容。'); return; }
    const format = file.name.toLowerCase().endsWith('.csv') ? 'csv' : file.name.toLowerCase().endsWith('.json') ? 'json' : null;
    if (!format) { setNotice('INVALID_FORMAT：请选择 .csv 或 .json 文件。'); return; }
    setReading(true); setNotice('正在本地读取并严格检查清单……');
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      if (readToken.current !== token) return;
      const parsed = parseManualImport(bytes, format, currentCategoryIds.current);
      if (parsed.status === 'rejected') { setNotice(`${parsed.code}：清单整批拒绝，请检查格式、字段与数量；原文未保留。`); return; }
      const created = createWorkspace(parsed, currentCategoryIds.current);
      if (!created.ok) { setNotice(`${created.code}：无法创建工作区。`); return; }
      commit(created.state); setEditor(null); setFilter('all'); setPage(0);
      setReentry(new Set(parsed.rows.filter(row => row.status === 'invalid').map(row => `local-row-${row.index}`)));
      setNotice(`已检查 ${parsed.totalRecords} 条记录；无效行使用空白占位，请重新填写。未上传或保存。`);
    } catch { if (readToken.current === token) setNotice('FILE_READ_FAILED：本地读取失败，请重试；现有整理结果仍保留。'); }
    finally { if (readToken.current === token) setReading(false); }
  };
  const selectFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; event.target.value = ''; if (!file) return;
    const token = ++readToken.current; setReading(false);
    if (stateRef.current || editor) setModal({ type: 'replace', file, token });
    else void readFile(file, token);
  };
  const act = (action: WorkspaceAction) => {
    if (!stateRef.current) return;
    const result = updateWorkspace(stateRef.current, action, categoryIds);
    if (result.ok) { commit(result.state); setNotice('记录已重新校验；编辑或排除变化会撤销旧重复复核。'); }
    else setNotice(`${result.code}：操作未完成。`);
  };
  const edit = (row: WorkspaceRow) => { setEditor({ id: row.id, values: Object.fromEntries(FIELDS.map(field => [field, row.values[field] === null ? '' : String(row.values[field])])) as Record<Field, string> }); };
  const applyEdit = () => {
    if (!editor || !stateRef.current) return;
    let next = stateRef.current;
    for (const field of FIELDS) {
      const text = editor.values[field];
      const value = field === 'sizeBytes' ? !text.trim() ? null : /^\d+$/.test(text.trim()) ? Number(text.trim()) : text : text;
      const result = updateWorkspace(next, { type: 'edit', id: editor.id, field, value }, categoryIds);
      if (!result.ok) { setNotice(`${result.code}：编辑未应用。`); return; } next = result.state;
    }
    commit(next); setEditor(null); setNotice('编辑已应用并重新校验；有错误的记录不会进入导出。');
  };
  const startExport = () => {
    if (!stateRef.current || editor) return;
    const result = prepareExport(stateRef.current, categoryIds);
    if (!result.ok) { setNotice(`${result.code}：没有可导出结果或导出检查失败。`); return; }
    setModal({ type: 'export', version: version.current, count: result.exportedCount, omitted: result.omittedCount });
  };
  const confirm = () => {
    const current = modal; setModal(null); if (!current) return;
    if (current.type === 'replace') { setEditor(null); void readFile(current.file, current.token); return; }
    if (current.type === 'clear') { readToken.current++; commit(clearWorkspace()); setEditor(null); setReentry(new Set()); setPage(0); setFilter('all'); setNotice('已清空当前预览。刷新后不会恢复；不承诺物理擦除 JavaScript 内存。'); return; }
    if (!stateRef.current || current.version !== version.current || editor) { setNotice('EXPORT_CHANGED：内容或分类已变化，请重新确认导出。'); return; }
    const result = prepareExport(stateRef.current, categoryIds);
    if (!result.ok || result.exportedCount !== current.count || result.omittedCount !== current.omitted) { setNotice('EXPORT_CHANGED：导出检查变化，请重新确认。'); return; }
    if (downloadJson(result.jsonText)) { setDirty(result.omittedCount > 0); setNotice(`已发起 ${result.exportedCount} 条记录的 JSON 下载，请自行确认浏览器保存结果；未保存到草稿库。`); }
    else setNotice('DOWNLOAD_FAILED：下载未发起，预览仍保留，请重试。');
  };
  const cancelModal = useCallback(() => setModal(null), []);
  return <main className="import-skeleton import-live" aria-labelledby="import-live-title">
    <header className="import-skeleton-head"><p className="import-skeleton-eyebrow">运营者工作区 · 仅本地开发预览</p><h1 id="import-live-title">资料导入</h1><p>本地清单检查与整理</p></header>
    <aside className="import-skeleton-warning" aria-label="发布限制"><strong>未启用管理员认证 · 不可公开发布</strong><span>开发限制不是权限保护；真实草稿保存仍不可用。</span></aside>
    <div className="import-skeleton-layout">
      <aside className="import-skeleton-steps" aria-label="整理流程"><h2>整理流程</h2><ol>{['选择清单', '检查与编辑', '完成整理'].map((step, i) => <li key={step} aria-current={i === (state ? 1 : 0) ? 'step' : undefined}><span aria-hidden="true">{i + 1}</span><strong>{step}</strong></li>)}</ol><p>仅在内存整理，不自动合并或发布。</p></aside>
      <section className="import-skeleton-workspace" aria-label="清单工作区">
        <section className="import-skeleton-panel import-skeleton-file"><div><h2>选择本地清单</h2><p>CSV / JSON · 严格 UTF-8 · 最多 100 条 · 不超过 1 MiB</p><p>原文和文件名不显示、不上传、不持久化。</p></div><label className="import-file-label" htmlFor="import-file-input">选择文件<input ref={input} id="import-file-input" type="file" accept=".csv,.json" disabled={modal !== null} onChange={selectFile} /></label>{reading && <button type="button" onClick={() => { readToken.current++; setReading(false); setNotice('已取消读取，旧结果不会回写。'); }}>取消读取</button>}</section>
        <p role="status" className="import-live-status">{notice}</p>
        <dl className="import-skeleton-summary" aria-label="实际记录统计">{[['记录总数', stats.total], ['有效', stats.valid], ['待确认', stats.pendingReview], ['错误', stats.invalid]].map(([label, count]) => <div key={label}><dt>{label}</dt><dd>{count}</dd></div>)}</dl>
        <section className="import-skeleton-panel"><div className="import-skeleton-section-head"><h2>记录预览</h2><label>状态筛选<select aria-label="状态筛选" value={filter} disabled={locked || editor !== null} onChange={event => { setFilter(event.target.value as Filter); setPage(0); }}><option value="all">全部</option><option value="valid">有效</option><option value="pending">待确认</option><option value="invalid">错误</option><option value="excluded">已排除</option></select></label></div>
          {!state ? <div className="import-skeleton-empty"><h3>尚未选择清单</h3><p>选择本地文件后，将在这里显示真实检查结果。</p></div> : <>
            {!visibleRows.length && <p>当前筛选没有记录。</p>}
            <div className="import-record-list">{visibleRows.map(row => <article key={row.id} className="import-skeleton-record" aria-label={`记录 ${row.originalIndex + 1}`}>
              <header><h3>{typeof row.values.name === 'string' && row.values.name.trim() ? row.values.name : '待重新填写'}</h3><span>{row.excluded ? '已排除' : row.validation === 'invalid' ? '字段错误' : row.duplicateReview === 'pending' ? '待人工确认' : '有效'}</span></header>
              {reentry.has(row.id) && !row.values.name && <p>原始无效字段未保留，请重新填写这条记录。</p>}
              {row.duplicateReview !== 'not-needed' && <p>发现相似记录，请人工核对；不会自动合并。</p>}
              <details><summary>查看六字段详情</summary><dl>{FIELDS.map(field => <div key={field}><dt>{labels[field]}</dt><dd>{field === 'categoryId' ? options.find(category => category.id === row.values.categoryId)?.name ?? '未指定或已失效' : row.values[field] === null || row.values[field] === '' ? '未填写' : String(row.values[field])}</dd></div>)}</dl></details>
              {row.errors.length > 0 && <ul id={`errors-${row.id}`} className="import-field-errors" aria-label={`记录 ${row.originalIndex + 1} 错误`}>{row.errors.map(issue => <li key={issue.field}>{labels[issue.field]}：{issue.code}</li>)}</ul>}
              {editor?.id === row.id ? <form className="import-editor" onSubmit={event => { event.preventDefault(); applyEdit(); }} aria-label={`编辑记录 ${row.originalIndex + 1}`}>
                {FIELDS.map(field => <label key={field} htmlFor={`edit-${field}`}>{labels[field]}{field === 'name' ? '（必填）' : ''}
                  {field === 'fileType' || field === 'categoryId' ? <select id={`edit-${field}`} value={editor.values[field]} aria-describedby={row.errors.some(issue => issue.field === field) ? `errors-${row.id}` : undefined} onChange={event => setEditor({ ...editor, values: { ...editor.values, [field]: event.target.value } })}><option value="">未指定</option>{field === 'fileType' ? fileTypes.map(type => <option key={type} value={type}>{type}</option>) : options.map(category => <option key={category.id} value={category.id}>{getCategoryPath(category.id, categoryValues).map(item => item.name).join(' / ')}</option>)}</select> : field === 'note' ? <textarea id={`edit-${field}`} rows={3} value={editor.values[field]} aria-describedby={row.errors.some(issue => issue.field === field) ? `errors-${row.id}` : undefined} onChange={event => setEditor({ ...editor, values: { ...editor.values, [field]: event.target.value } })} /> : <input id={`edit-${field}`} value={editor.values[field]} inputMode={field === 'sizeBytes' ? 'numeric' : undefined} aria-required={field === 'name'} aria-invalid={row.errors.some(issue => issue.field === field)} aria-describedby={row.errors.some(issue => issue.field === field) ? `errors-${row.id}` : undefined} onChange={event => setEditor({ ...editor, values: { ...editor.values, [field]: event.target.value } })} />}</label>)}
                <p>编辑值尚未应用，不会进入导出；点击应用后重新校验。</p><div className="import-row-actions"><button type="submit" disabled={locked}>应用编辑并校验</button><button type="button" disabled={locked} onClick={() => setEditor(null)}>取消编辑</button></div>
              </form> : <div className="import-row-actions"><button type="button" disabled={locked || editor !== null} onClick={() => edit(row)}>编辑</button><button type="button" disabled={locked || editor !== null} onClick={() => act({ type: 'exclude', id: row.id, excluded: !row.excluded })}>{row.excluded ? '恢复记录' : '排除记录'}</button>{row.duplicateReview !== 'not-needed' && <button type="button" disabled={locked || editor !== null} onClick={() => act({ type: 'review', id: row.id, reviewed: row.duplicateReview !== 'reviewed' })}>{row.duplicateReview === 'reviewed' ? '撤销人工复核' : '已人工核对此记录'}</button>}</div>}
            </article>)}</div>
            <nav className="import-pagination" aria-label="记录分页"><button type="button" disabled={visiblePage === 0 || locked || editor !== null} onClick={() => setPage(visiblePage - 1)}>上一页</button><span>第 {visiblePage + 1} / {pages} 页 · 每页 10 条 · 筛选结果 {filtered.length} 条</span><button type="button" disabled={visiblePage + 1 >= pages || locked || editor !== null} onClick={() => setPage(visiblePage + 1)}>下一页</button></nav>
          </>}
        </section>
        <footer className="import-skeleton-actions"><p id="import-save-reason">保存为草稿不可用：需要可信后端及管理员认证，当前不可用。</p><p>可导出 {stats.exportable} 条 · 已排除 {stats.excluded} 条。刷新或离开后不恢复内存数据。</p>{editor && <p>请先应用或取消编辑，再进行导出。</p>}<div><button type="button" disabled={!state || locked} onClick={() => setModal({ type: 'clear' })}>清空预览</button><button type="button" disabled={!state || locked || editor !== null} onClick={() => { if (stateRef.current) { const result = revalidateWorkspace(stateRef.current, categoryIds); if (result.ok) { commit(result.state); setNotice('已按当前分类重新校验。'); } } }}>重新校验</button><button type="button" disabled={stats.exportable === 0 || locked || editor !== null} onClick={startExport}>导出 JSON</button><button type="button" disabled aria-describedby="import-save-reason">保存为草稿 · 不可用</button></div></footer>
      </section>
    </div>
    {modal && <Confirmation title={modal.type === 'replace' ? '替换当前清单？' : modal.type === 'clear' ? '清空当前预览？' : '确认导出 JSON'} confirmLabel={modal.type === 'replace' ? '确认替换' : modal.type === 'clear' ? '确认清空' : '确认导出'} onCancel={cancelModal} onConfirm={confirm}>{modal.type === 'export' ? <><p>仅导出有效、未排除且已完成必要人工复核的 {modal.count} 条记录；省略 {modal.omitted} 条。</p><p>文件将保存在本机设备；这不会保存到草稿库。</p></> : <p>此操作会丢弃当前预览及未导出的编辑／复核结果。取消可保留当前内容。</p>}</Confirmation>}
  </main>;
}
