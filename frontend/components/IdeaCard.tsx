'use client';

import { useState } from 'react';
import { Idea } from '@/lib/ideas';
import { ideasApi } from '@/lib/ideas';
import { analyticsApi } from '@/lib/analytics';
import { sharingApi } from '@/lib/sharing';
import PlatformBadge from './PlatformBadge';
import LanguageBadge from './LanguageBadge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { 
  Save, 
  Edit, 
  Trash2, 
  Copy, 
  Archive, 
  Calendar, 
  Share2, 
  BarChart3,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface IdeaCardProps {
  idea: Idea;
  onSave?: (idea: Idea) => void;
  onEdit?: (idea: Idea) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onArchive?: (id: string) => void;
  onUnarchive?: (id: string) => void;
  showActions?: boolean;
  selected?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
  showCheckbox?: boolean;
}

export default function IdeaCard({ 
  idea, 
  onSave, 
  onEdit, 
  onDelete, 
  onDuplicate,
  onArchive,
  onUnarchive,
  showActions = true,
  selected = false,
  onSelect,
  showCheckbox = false,
}: IdeaCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [predicting, setPredicting] = useState(false);
  const [prediction, setPrediction] = useState<{ reach?: number; engagement?: number; reasoning?: string } | null>(null);
  const [sharing, setSharing] = useState(false);

  const handleSave = async () => {
    if (!onSave) return;
    setSaving(true);
    try {
      await onSave(idea);
    } finally {
      setSaving(false);
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return null;
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  };

  const getViralScoreColor = (score?: number) => {
    if (!score) return 'secondary';
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  const isRTL = idea.language === 'ar';

  return (
    <Card 
      className={cn(
        'transition-all hover:shadow-md',
        selected && 'ring-2 ring-primary'
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          {showCheckbox && onSelect && (
            <Checkbox
              checked={selected}
              onCheckedChange={(checked) => onSelect(idea.id, checked as boolean)}
              className="mt-1"
            />
          )}
          <div className="flex-1 min-w-0">
            <CardTitle className="mb-2 line-clamp-2">{idea.title}</CardTitle>
            {idea.folder && (
              <div className="flex items-center gap-2 mb-2">
                <Badge 
                  variant="outline"
                  style={{
                    borderColor: idea.folder.color || undefined,
                    color: idea.folder.color || undefined,
                  }}
                >
                  {idea.folder.name}
                </Badge>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <PlatformBadge platform={idea.platform} />
              <LanguageBadge language={idea.language} />
              {idea.viralScore !== undefined && (
                <Badge variant={getViralScoreColor(idea.viralScore)}>
                  <Sparkles className="w-3 h-3 mr-1" />
                  {idea.viralScore}/100
                </Badge>
              )}
              {idea.duration && (
                <Badge variant="outline">
                  {formatDuration(idea.duration)}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {idea.description && (
          <CardDescription className={cn(!expanded && 'line-clamp-2')}>
            {idea.description}
          </CardDescription>
        )}

        {expanded && (
          <div className="space-y-3 text-sm">
            {idea.hook && (
              <div>
                <div className="font-medium mb-1">Hook:</div>
                <div className="text-muted-foreground">{idea.hook}</div>
              </div>
            )}
            {idea.script && idea.script.length > 0 && (
              <div>
                <div className="font-medium mb-1">Script:</div>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  {idea.script.map((line, idx) => (
                    <li key={idx}>{line}</li>
                  ))}
                </ul>
              </div>
            )}
            {idea.caption && (
              <div>
                <div className="font-medium mb-1">Caption:</div>
                <div className="text-muted-foreground">{idea.caption}</div>
              </div>
            )}
            {idea.hashtags && idea.hashtags.length > 0 && (
              <div>
                <div className="font-medium mb-1">Hashtags:</div>
                <div className="flex flex-wrap gap-1">
                  {idea.hashtags.map((tag, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {idea.platformOptimization && (
              <div>
                <div className="font-medium mb-1">Platform Tips:</div>
                <div className="text-muted-foreground text-xs">{idea.platformOptimization}</div>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <>
                <ChevronUp className="w-4 h-4 mr-1" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-1" />
                Show More
              </>
            )}
          </Button>

          {showActions && (
            <div className="flex items-center gap-1">
              {onSave && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSave}
                  disabled={saving}
                >
                  <Save className="w-4 h-4" />
                </Button>
              )}
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(idea)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
              )}
              {onDuplicate && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDuplicate(idea.id)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              )}
              {idea.status === 'ARCHIVED' ? (
                onUnarchive && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onUnarchive(idea.id)}
                  >
                    <Archive className="w-4 h-4" />
                  </Button>
                )
              ) : (
                onArchive && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onArchive(idea.id)}
                  >
                    <Archive className="w-4 h-4" />
                  </Button>
                )
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this idea?')) {
                      onDelete(idea.id);
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
