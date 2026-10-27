import './ImportSkeleton.css';

/** Unwired presentation only. No imported parser, workspace, or business actions. */
export function ImportSkeleton({ display = 'empty' }: { display?: 'empty' | 'example' }) {
  const example = display === 'example';
  return <main className="import-skeleton" aria-labelledby="import-skeleton-title">
    <header className="import-skeleton-head">
      <p className="import-skeleton-eyebrow">运营者工作区 · 开发预览</p>
      <h1 id="import-skeleton-title">资料导入</h1>
      <p>本地清单检查与整理</p>
    </header>
    <aside className="import-skeleton-warning" aria-label="发布限制">
      <strong>未启用管理员认证，不可公开发布</strong>
      <p>开发预览不代表管理员权限。本页仅展示布局，尚未连接导入、编辑、导出或保存。</p>
    </aside>
    <div className="import-skeleton-layout">
      <aside className="import-skeleton-steps" aria-labelledby="import-steps-title">
        <h2 id="import-steps-title">整理流程</h2>
        <ol>{['选择清单', '检查与编辑', '完成整理'].map((step, i) => <li key={step} aria-current={i === 0 ? 'step' : undefined}><span aria-hidden="true">{i + 1}</span><div><strong>{step}</strong><small>{['CSV / JSON 本地清单', '检查字段，人工复核', '确认整理结果'][i]}</small></div></li>)}</ol>
        <p>草稿不会自动发布。公开使用前必须完成可信服务端认证与授权。</p>
      </aside>
      <section className="import-skeleton-workspace" aria-label="清单工作区">
        <section className="import-skeleton-panel import-skeleton-file" aria-labelledby="import-file-title">
          <span className="import-skeleton-mark" aria-hidden="true">＋</span>
          <div><h2 id="import-file-title">选择本地清单</h2><p>支持 CSV / JSON · 最多 100 条 · 文件不超过 1 MiB</p><p id="import-file-disabled">文件选择尚未启用；此区域不读取文件，也不接收拖放。</p></div>
          <button type="button" disabled aria-describedby="import-file-disabled">选择文件 · 尚未启用</button>
        </section>
        <section aria-labelledby="import-summary-title">
          <div className="import-skeleton-section-head"><h2 id="import-summary-title">检查摘要</h2><span>{example ? '模拟统计 · 全部为虚构示例' : '尚未导入 · 静态占位'}</span></div>
          <dl className="import-skeleton-summary">{[['记录总数', example ? 1 : 0], ['有效', example ? 1 : 0], ['待确认', 0], ['错误', 0]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
        </section>
        <section className="import-skeleton-panel" aria-labelledby="import-records-title">
          <div className="import-skeleton-section-head"><h2 id="import-records-title">记录预览</h2><span>{example ? '示例 · 不代表实际校验结果' : '仅展示页面骨架'}</span></div>
          {example ? <article className="import-skeleton-record" aria-label="虚构示例记录">
            <header><h3>示例练习清单</h3><span className="import-skeleton-badge">虚构示例</span></header>
            <dl>{[['名称', '示例练习清单'], ['文件类型', 'pdf'], ['大小', '120 字节'], ['分类', '未指定'], ['来源', '虚构手动清单'], ['备注', '仅供布局展示，不会进入正式资源']].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
            <button type="button" disabled>编辑 · 尚未启用</button><button type="button" disabled>人工复核 · 尚未启用</button>
          </article> : <div className="import-skeleton-empty"><span aria-hidden="true">↳</span><h3>尚未选择清单</h3><p>未来可在这里检查记录和字段问题。本轮不导入真实资料。</p><button type="button" disabled>编辑 · 尚未启用</button></div>}
        </section>
        <section className="import-skeleton-note" aria-label="隐私与操作说明"><h2>整理前请留意</h2><p>清单内容可能包含私密信息。未来预览仅保留在浏览器内存，不应自动保存、上报或发布。</p><p>导出须经明确确认，重复记录只提供人工复核线索，不会自动合并。</p></section>
        <footer className="import-skeleton-actions" aria-label="整理操作">
          <p id="import-save-disabled">保存为草稿不可用：缺少可信后端、管理员认证和对象授权。</p>
          <div><button type="button" disabled>清空 · 尚未启用</button><button type="button" disabled>导出 JSON · 尚未启用</button><button type="button" disabled aria-describedby="import-save-disabled">保存为草稿 · 不可用</button></div>
        </footer>
      </section>
    </div>
  </main>;
}
