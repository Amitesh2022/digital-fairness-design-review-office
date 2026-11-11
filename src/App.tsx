import { useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, Route, Switch } from 'wouter'
import './App.css'
import './forms.css'

type FairnessReview = { id: number; title: string; owner: string; status: 'Draft' | 'Review' | 'Resolved'; priority: 'Low' | 'Medium' | 'High' }
const api = '/api/items'

async function readEvidence(): Promise<FairnessReview[]> {
  const response = await fetch(api)
  if (!response.ok) throw new Error('The digital fairness review service is unavailable.')
  return response.json()
}

async function createEvidence(item: Omit<FairnessReview, 'id'>): Promise<FairnessReview> {
  const response = await fetch(api, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) })
  if (!response.ok) throw new Error('The fairness review could not be saved.')
  return response.json()
}

async function advanceEvidence(item: FairnessReview): Promise<FairnessReview> {
  const status = item.status === 'Draft' ? 'Review' : 'Resolved'
  const response = await fetch(`${api}/${item.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...item, status }) })
  if (!response.ok) throw new Error('The fairness review could not be updated.')
  return response.json()
}

function Register() {
  const cache = useQueryClient()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const { data = [], isPending, error } = useQuery({ queryKey: ['evidence'], queryFn: readEvidence })
  const save = useMutation({ mutationFn: createEvidence, onSuccess: () => { cache.invalidateQueries({ queryKey: ['evidence'] }); setOpen(false) } })
  const advance = useMutation({ mutationFn: advanceEvidence, onSuccess: () => cache.invalidateQueries({ queryKey: ['evidence'] }) })
  const visible = data.filter((item) => `${item.title} ${item.owner} ${item.status}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => a.title.localeCompare(b.title))
  const approved = data.filter((item) => item.status === 'Resolved').length
  const high = data.filter((item) => item.priority === 'High').length

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const values = new FormData(event.currentTarget)
    save.mutate({ title: String(values.get('title')), owner: String(values.get('owner')), status: 'Draft', priority: String(values.get('priority')) as FairnessReview['priority'] })
  }

  return <main>
    <header className="hero"><div><span className="eyebrow">Test online journeys for fairness, transparency and genuine consumer choice</span><h1>Digital Fairness Design Review Office</h1><p>Help product, legal and consumer teams review dark patterns, pricing, subscriptions, personalisation and influencer disclosures.</p></div><button className="primary" onClick={() => setOpen(!open)}>{open ? 'Close form' : 'Add fairness review'}</button></header>
    <section className="metrics" aria-label="digital fairness review summary"><article><span>Reviews tracked</span><strong>{isPending ? '…' : data.length}</strong><small>Shared product view</small></article><article><span>Resolved</span><strong>{approved}</strong><small>Evidence confirmed</small></article><article><span>High priority</span><strong>{high}</strong><small>Needs immediate redesign</small></article></section>
    {open && <form className="panel form" onSubmit={submit}><h2>Add a fairness review</h2><label>Digital journey or consumer risk<input required name="title" minLength={4} placeholder="Example: free-trial conversion flow" /></label><label>Responsible product or compliance team<input required name="owner" minLength={3} placeholder="Example: Subscription Experience Team" /></label><label>Priority<select name="priority"><option>High</option><option>Medium</option><option>Low</option></select></label><button className="primary" disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save fairness review'}</button>{save.error && <p role="alert">{save.error.message}</p>}</form>}
    <section className="panel"><div className="panel-title"><h2>Digital fairness review pipeline</h2><span>{error ? 'Connection problem' : 'Live API data'}</span></div><label className="search">Find a fairness review<input aria-label="Find a fairness review" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by journey, pattern, price, owner or status" /></label>{error && <p role="alert">{error.message}</p>}{!isPending && !error && visible.length === 0 && <p>No fairness reviews match this view.</p>}{visible.map((item) => <div className="row" key={item.id}><span className={`dot ${item.status === 'Resolved' ? '' : 'degraded'}`} /><div><b>{item.title}</b><small>{item.owner} · {item.status}</small></div><strong>{item.priority}</strong>{item.status !== 'Resolved' && <button className="secondary" disabled={advance.isPending} onClick={() => advance.mutate(item)}>Move to {item.status === 'Draft' ? 'review' : 'resolved'}</button>}</div>)}</section>
  </main>
}

function About() { return <main><header className="hero"><div><span className="eyebrow">Why it matters</span><h1>Fair digital choices depend on product design, not disclaimers alone</h1></div></header><section className="panel prose"><h2>A clear path from consumer risk to corrected journey</h2><p>Teams can see who owns each review, which fairness concern applies and what evidence remains before resolution.</p></section></main> }

export default function App() { return <div className="shell"><nav><b>FairJourneyEU<span>/design office</span></b><div><Link href="/">Fairness reviews</Link><Link href="/about">Purpose</Link></div></nav><Switch><Route path="/" component={Register} /><Route path="/about" component={About} /></Switch></div> }
