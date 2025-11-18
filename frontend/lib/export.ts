import { Idea } from './ideas';

export function exportToCSV(ideas: Idea[]): void {
  const headers = ['Title', 'Description', 'Script', 'Caption', 'Hashtags', 'Platform', 'Niche', 'Tone', 'Duration', 'Status', 'Scheduled At'];
  
  const rows = ideas.map(idea => [
    idea.title,
    idea.description || '',
    idea.script || '',
    idea.caption || '',
    idea.hashtags?.join(', ') || '',
    idea.platform,
    idea.niche,
    idea.tone,
    idea.duration?.toString() || '',
    idea.status,
    idea.scheduledAt ? new Date(idea.scheduledAt).toLocaleString() : '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `content-ideas-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToText(ideas: Idea[]): void {
  const textContent = ideas.map((idea, index) => {
    return `
${index + 1}. ${idea.title}
${idea.description ? `Description: ${idea.description}` : ''}
${idea.script ? `Script:\n${idea.script}` : ''}
${idea.caption ? `Caption: ${idea.caption}` : ''}
${idea.hashtags && idea.hashtags.length > 0 ? `Hashtags: ${idea.hashtags.join(' ')}` : ''}
Platform: ${idea.platform} | Niche: ${idea.niche} | Tone: ${idea.tone}
${idea.duration ? `Duration: ${idea.duration}s` : ''}
${idea.scheduledAt ? `Scheduled: ${new Date(idea.scheduledAt).toLocaleString()}` : ''}
Status: ${idea.status}
---
`;
  }).join('\n');

  const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `content-ideas-${new Date().toISOString().split('T')[0]}.txt`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function copyAllToClipboard(ideas: Idea[]): void {
  const text = ideas.map((idea, index) => {
    return `
${index + 1}. ${idea.title}
${idea.description ? `Description: ${idea.description}` : ''}
${idea.script ? `Script:\n${idea.script}` : ''}
${idea.caption ? `Caption: ${idea.caption}` : ''}
${idea.hashtags && idea.hashtags.length > 0 ? `Hashtags: ${idea.hashtags.join(' ')}` : ''}
Platform: ${idea.platform} | Niche: ${idea.niche} | Tone: ${idea.tone}
${idea.duration ? `Duration: ${idea.duration}s` : ''}
${idea.scheduledAt ? `Scheduled: ${new Date(idea.scheduledAt).toLocaleString()}` : ''}
Status: ${idea.status}
---
`;
  }).join('\n');

  navigator.clipboard.writeText(text);
}

