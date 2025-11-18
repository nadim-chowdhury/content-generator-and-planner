import { Idea } from './ideas';
import api from './api';

export function exportToCSV(ideas: Idea[]): void {
  const headers = ['Title', 'Description', 'Hook', 'Script', 'Caption', 'Hashtags', 'Platform', 'Niche', 'Tone', 'Language', 'Duration', 'Status', 'Viral Score', 'Folder', 'Scheduled At', 'Created At'];
  
  const rows = ideas.map(idea => [
    idea.title,
    idea.description || '',
    idea.hook || '',
    idea.script || '',
    idea.caption || '',
    idea.hashtags?.join('; ') || '',
    idea.platform,
    idea.niche,
    idea.tone,
    idea.language || 'en',
    idea.duration?.toString() || '',
    idea.status,
    idea.viralScore?.toString() || '',
    idea.folder?.name || '',
    idea.scheduledAt ? new Date(idea.scheduledAt).toLocaleString() : '',
    idea.createdAt ? new Date(idea.createdAt).toLocaleString() : '',
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
${idea.hook ? `Hook: ${idea.hook}` : ''}
${idea.script ? `Script:\n${idea.script}` : ''}
${idea.caption ? `Caption: ${idea.caption}` : ''}
${idea.hashtags && idea.hashtags.length > 0 ? `Hashtags: ${idea.hashtags.join(' ')}` : ''}
Platform: ${idea.platform} | Niche: ${idea.niche} | Tone: ${idea.tone}
${idea.language && idea.language !== 'en' ? `Language: ${idea.language}` : ''}
${idea.duration ? `Duration: ${idea.duration}s` : ''}
${idea.viralScore ? `Viral Score: ${idea.viralScore}/100` : ''}
Status: ${idea.status}
${idea.scheduledAt ? `Scheduled: ${new Date(idea.scheduledAt).toLocaleString()}` : ''}
${idea.createdAt ? `Created: ${new Date(idea.createdAt).toLocaleString()}` : ''}
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
${idea.hook ? `Hook: ${idea.hook}` : ''}
${idea.script ? `Script:\n${idea.script}` : ''}
${idea.caption ? `Caption: ${idea.caption}` : ''}
${idea.hashtags && idea.hashtags.length > 0 ? `Hashtags: ${idea.hashtags.join(' ')}` : ''}
Platform: ${idea.platform} | Niche: ${idea.niche} | Tone: ${idea.tone}
${idea.duration ? `Duration: ${idea.duration}s` : ''}
${idea.viralScore ? `Viral Score: ${idea.viralScore}/100` : ''}
Status: ${idea.status}
${idea.scheduledAt ? `Scheduled: ${new Date(idea.scheduledAt).toLocaleString()}` : ''}
---
`;
  }).join('\n');

  navigator.clipboard.writeText(text);
}

export async function exportToPDF(ideas: Idea[]): Promise<void> {
  try {
    const response = await api.post('/api/ideas/export', {
      ideaIds: ideas.map(idea => idea.id),
      format: 'pdf',
    });

    if (response.data.type === 'html') {
      // Create a new window with HTML content
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(response.data.data);
        printWindow.document.close();
        
        // Wait for content to load, then print
        setTimeout(() => {
          printWindow.print();
        }, 250);
      }
    }
  } catch (error) {
    console.error('Failed to export to PDF:', error);
    alert('Failed to export to PDF. Please try again.');
  }
}

export async function exportToGoogleSheets(ideas: Idea[], spreadsheetId?: string): Promise<void> {
  try {
    if (!spreadsheetId) {
      const input = prompt('Enter Google Sheets Spreadsheet ID (or leave empty to get CSV data):');
      if (!input) {
        // If no ID provided, export as CSV instead
        exportToCSV(ideas);
        return;
      }
      spreadsheetId = input;
    }

    const response = await api.post('/api/ideas/export', {
      ideaIds: ideas.map(idea => idea.id),
      format: 'google_sheets',
      googleSheetsId: spreadsheetId,
    });

    if (response.data.csvData) {
      // For now, download CSV and provide instructions
      const blob = new Blob([response.data.csvData], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `content-ideas-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      alert('CSV file downloaded. Import it into Google Sheets manually, or configure Google Sheets API integration for direct export.');
    }
  } catch (error) {
    console.error('Failed to export to Google Sheets:', error);
    alert('Failed to export to Google Sheets. Please try again or use CSV export instead.');
  }
}

export async function exportToNotion(ideas: Idea[], databaseId?: string): Promise<void> {
  try {
    if (!databaseId) {
      const input = prompt('Enter Notion Database ID (or leave empty to get JSON data):');
      if (!input) {
        // If no ID provided, export as JSON instead
        const dataStr = JSON.stringify(ideas, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ideas-${new Date().toISOString()}.json`;
        link.click();
        return;
      }
      databaseId = input;
    }

    const response = await api.post('/api/ideas/export', {
      ideaIds: ideas.map(idea => idea.id),
      format: 'notion',
      notionDatabaseId: databaseId,
    });

    if (response.data.data) {
      // For now, download JSON and provide instructions
      const dataStr = JSON.stringify(response.data.data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `notion-ideas-${new Date().toISOString()}.json`;
      link.click();
      
      alert('JSON file downloaded. Import it into Notion manually, or configure Notion API integration for direct export.');
    }
  } catch (error) {
    console.error('Failed to export to Notion:', error);
    alert('Failed to export to Notion. Please try again or use JSON export instead.');
  }
}
