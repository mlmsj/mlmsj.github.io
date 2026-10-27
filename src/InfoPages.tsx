import { useRef, useState } from 'react'
import { PUBLIC_CONTACT_EMAIL, PUBLIC_CONTACT_MAILTO } from './publicContact'

export type InfoPageKey = 'about' | 'guide' | 'disclaimer' | 'contact'
type Navigate = (page: InfoPageKey | 'home') => void

export function InfoPage({ page, go }: { page: InfoPageKey; go: Navigate }) {
  if (page === 'about') return <About go={go} />
  if (page === 'guide') return <Guide go={go} />
  if (page === 'disclaimer') return <Disclaimer go={go} />
  return <Contact go={go} />
}

function PageTop({ label, title, lead }: { label: string; title: string; lead: string }) {
  return <header className="info-page-top"><p className="kicker">{label}</p><h1>{title}</h1><p className="info-lead">{lead}</p></header>
}

function BackHome({ go }: { go: Navigate }) {
  return <button className="info-primary-button" onClick={() => go('home')}>返回首页　→</button>
}

function About({ go }: { go: Navigate }) {
  const principles = [
    ['资源共享', '希望让寻找学习资料更轻松。'],
    ['简单易用', '当前基础学习工具无需登录，并在浏览器本地处理文件。'],
    ['一起成长', '认真对待建议，持续完善使用体验。'],
  ]
  return <section className="info-page"><PageTop label="ABOUT US" title={'让学习简单一点，\n让成长自由一点。'} lead="一个属于每位学习者的小小角落" /><article className="about-story"><p>你好，欢迎来到这里。</p><p>学习的路上，我们总会遇到一些小小的麻烦。</p><p>也许是找不到合适的复习资料，也许是一个简单的文件转换花费了太多时间，又或者，只是希望有一个方便、安静的地方，整理学习中需要的一切。</p><p>因此，我们希望逐步把实用的学习资源和便捷的学生工具汇集在一起，让知识更容易获取，让学习少一些繁琐。</p><p>我们相信，好的学习体验不一定需要复杂的功能，而是能在需要的时候，恰好提供一点帮助。</p><p>这里还在不断成长。每一条建议、每一次反馈，都可能让它变得更好。</p><p>愿每一个认真学习的你，都能在这里有所收获。</p></article><div className="principle-grid">{principles.map(([title, text], index) => <article className="principle-card" key={title}><span>0{index + 1}</span><h2>{title}</h2><p>{text}</p></article>)}</div><BackHome go={go} /></section>
}

const guideTabs = ['学习资料', '学生工具箱', '常见问题'] as const
type GuideTab = typeof guideTabs[number]
const faqs = [
  ['网站的基础工具需要付费吗？', '当前开放的基础工具可免费使用。未来如推出高级付费功能，会明确标注，不影响已开放的基础功能。'],
  ['使用工具需要注册账号吗？', '当前开放的基础工具无需登录即可使用。'],
  ['学习资料无法访问怎么办？', '当前未开放资料文件获取。目录访问问题可通过「联系我们」页面所列邮箱说明资料名称、链接及遇到的问题。'],
  ['工具处理的文件会被上传吗？', '当前 15 个基础工具在浏览器本地处理所选文件，不上传文件内容；字体、OCR 组件和模型可能需要通过网络加载。浏览资料目录会请求公开资料服务，本地处理不表示所有数据都不会离开设备。'],
  ['目前为什么有些功能无法使用？', '网站仍在完善中；未开放的能力会在对应入口明确标注，具体以当前页面说明为准。'],
]

function Guide({ go }: { go: Navigate }) {
  const [tab, setTab] = useState<GuideTab>('学习资料')
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])
  const selectTab = (index: number) => {
    const nextIndex = (index + guideTabs.length) % guideTabs.length
    setTab(guideTabs[nextIndex])
    tabRefs.current[nextIndex]?.focus()
  }
  const steps = tab === '学习资料' ? [['寻找资料', '通过搜索或分类浏览，寻找需要的学习内容。'], ['查看详情', '阅读资料介绍，了解内容及获取状态。'], ['查看获取状态', '当前未开放资料文件获取，请以详情页提示为准。']] : [['选择工具', '根据学习任务选择文档处理、格式转换等工具。'], ['处理文件', '按照工具提示选择文件并执行操作。'], ['保存结果', '处理完成后保存生成的文件。']]
  return <section className="info-page"><PageTop label="USER GUIDE" title="第一次来到这里？" lead="这里整理了网站当前可用功能、使用方式与常见问题；尚未开放的能力会明确标注。" /><div className="guide-tabs" role="tablist" aria-label="使用说明分类">{guideTabs.map((item, itemIndex) => <button ref={element => { tabRefs.current[itemIndex] = element }} key={item} id={`guide-tab-${item}`} role="tab" aria-selected={tab === item} aria-controls="guide-panel" tabIndex={tab === item ? 0 : -1} className={tab === item ? 'active' : ''} onClick={() => setTab(item)} onKeyDown={event => { const index = guideTabs.indexOf(tab); if (event.key === 'ArrowRight') { event.preventDefault(); selectTab(index + 1) } else if (event.key === 'ArrowLeft') { event.preventDefault(); selectTab(index - 1) } else if (event.key === 'Home') { event.preventDefault(); selectTab(0) } else if (event.key === 'End') { event.preventDefault(); selectTab(guideTabs.length - 1) } }}>{item}</button>)}</div><div id="guide-panel" className="guide-panel" role="tabpanel" aria-labelledby={`guide-tab-${tab}`}>{tab === '常见问题' ? <div className="faq-list">{faqs.map(([question, answer]) => <article key={question}><h2>Q：{question}</h2><p>A：{answer}</p></article>)}</div> : <><div className="status-note">{tab === '学习资料' ? '学习资料目录已可浏览、搜索和收藏，需公开资料服务可用；目录发布不等于提供文件下载，当前文件获取暂未开放。' : '学生工具箱已开放 15 个浏览器本地处理工具；实际格式、大小和处理限制以各工具页面说明为准。'}</div><div className="guide-steps">{steps.map(([title, text], index) => <article key={title}><b>0{index + 1}</b><div><h2>{title}</h2><p>{text}</p></div></article>)}</div>{tab === '学生工具箱' && <p className="guide-footnote">当前基础工具无需登录，所选文件在浏览器本地处理。PDF 水印仅支持文字；PDF 压缩遇到文本层会保留原文件，无文本层时会以 JPEG 重新编码，可能降低清晰度。格式、大小与兼容性以各工具说明为准。</p>}</>}</div><div className="info-cta"><div><h2>仍有疑问？</h2><p>欢迎通过项目联系邮箱与我们联系。</p></div><button onClick={() => go('contact')}>联系我们　→</button></div></section>
}

const disclaimerSections = [
  ['一、资源与版权', '本站尊重知识产权及原创作者、权利人的合法权益。本站展示或链接的学习资料、文字、图片及其他内容，其相关权利归各自合法权利人所有，除另有明确说明外，不因在本站展示或提供链接而转移。若您认为相关内容侵犯了您的合法权益，请通过「联系我们」页面所列邮箱提交具体链接、权利证明及必要说明。我们将在核实后依法依规采取适当措施。'],
  ['二、资料使用', '本站提供学习资源目录的整理、展示和访问指引，当前未开放资料文件获取。用户在获取、下载、分享或使用相关内容时，应遵守适用法律法规、版权规定以及资源自身的许可条件。本站不鼓励未经授权的复制、传播或商业使用。'],
  ['三、第三方链接与服务', '本站可能包含指向第三方网站、网盘或服务的链接。第三方内容、可用性、服务条款及个人信息处理方式由相应服务提供方管理。访问第三方服务前，请自行查看其适用条款与隐私说明。若发现链接失效或存在风险，欢迎反馈。'],
  ['四、服务说明与责任', '本站将尽力保持信息准确与服务稳定，但资料链接、工具兼容性及功能可用性可能因维护、技术限制或第三方服务变化而受到影响。对于依法不能排除或限制的责任，本声明不作排除或限制。请根据实际情况判断信息与工具结果是否适合您的用途。'],
  ['五、隐私与文件处理', '当前公开网站未开放在线反馈提交；用户通过邮件主动联系时，邮件服务会处理反馈内容及其自愿提供的联系邮箱。当前学生工具箱在浏览器本地处理所选文件，不上传到本站服务器；未来如某项工具涉及文件上传、服务器处理或第三方服务，将在使用前另行明确告知。有关个人信息处理的具体情况，以本站实际发布的隐私政策或相应告知为准。'],
  ['六、声明更新与联系', `随着网站功能调整或相关要求变化，本站可能更新本声明。更新版本将在本页面公布，并标注更新日期。如有资源纠错、版权投诉或其他问题，请通过「联系我们」页面反馈，或发送邮件至 ${PUBLIC_CONTACT_EMAIL}。`],
]

function Disclaimer({ go }: { go: Navigate }) {
  return <section className="info-page"><PageTop label="DISCLAIMER" title="免责声明" lead="请在使用本站内容与服务前阅读以下说明。" /><div className="disclaimer-list">{disclaimerSections.map(([title, text]) => <article key={title}><h2>{title}</h2><p>{text}</p></article>)}</div><div className="legal-note"><p>以上内容为产品说明，不等于法律审查意见。若网站未来正式收集个人信息，将补充与真实数据流程一致的隐私告知。</p><time>更新日期：2026年10月17日</time></div><button className="info-text-link" onClick={() => go('contact')}>联系我们　→</button></section>
}

function Contact({ go }: { go: Navigate }) {
  const [copyState, setCopyState] = useState('复制邮箱')
  const copyEmail = async () => { try { await navigator.clipboard.writeText(PUBLIC_CONTACT_EMAIL); setCopyState('已复制'); window.setTimeout(() => setCopyState('复制邮箱'), 1800) } catch { setCopyState('请手动复制') } }
  return <section className="info-page"><PageTop label="CONTACT US" title="我们很乐意听见你的声音。" lead="无论是一个小建议，还是遇到了什么问题，都欢迎告诉我们。" /><div className="contact-card"><div><span>项目联系邮箱</span><a href={PUBLIC_CONTACT_MAILTO} aria-label={`发送邮件至项目联系邮箱 ${PUBLIC_CONTACT_EMAIL}`}>{PUBLIC_CONTACT_EMAIL}</a><p>适用于问题咨询、资料纠错、版权投诉和使用建议。</p></div><div className="contact-actions"><button type="button" onClick={copyEmail} aria-label="复制项目联系邮箱" aria-live="polite">{copyState}</button><a href={PUBLIC_CONTACT_MAILTO}>打开邮件客户端　→</a></div></div><section className="feedback-offline"><p className="kicker">FEEDBACK</p><h2>在线反馈暂未开放</h2><p>当前公开网站尚未接入反馈接收接口、反馈存储和相应隐私告知，因此我们没有启用会丢失数据的反馈表单。目录管理后台的本地能力不等于公开反馈服务已经开放。</p><p>你仍可通过上方项目邮箱发送功能建议、资料问题、版权投诉或其他问题。请勿在邮件中提供密码、身份证号等敏感信息。</p></section><BackHome go={go} /></section>
}
