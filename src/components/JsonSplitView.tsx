import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { DiffItem, Decision } from '@/types/diff';
import { AlertTriangle, Info, AlertCircle } from 'lucide-react';

interface JsonSplitViewProps {
  template: any;
  customerData: any;
  diffs: DiffItem[];
  onDecision: (decision: Decision) => void;
  pendingDecisions: Decision[];
}

export function JsonSplitView({ 
  template, 
  customerData, 
  diffs, 
  onDecision, 
  pendingDecisions 
}: JsonSplitViewProps) {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  const getDiffColor = (type: string) => {
    switch (type) {
      case 'typeMismatch': return 'border-diff-type-mismatch bg-diff-type-mismatch/10';
      case 'valueMismatch': return 'border-diff-value-mismatch bg-diff-value-mismatch/10';
      case 'missing': return 'border-diff-missing bg-diff-missing/10';
      case 'unexpected': return 'border-diff-unexpected bg-diff-unexpected/10';
      case 'lengthMismatch': return 'border-diff-length-mismatch bg-diff-length-mismatch/10';
      default: return 'border-border';
    }
  };

  const getSeverityIcon = (severity?: string) => {
    switch (severity) {
      case 'error': return <AlertCircle className="h-3 w-3 text-diff-type-mismatch" />;
      case 'warn': return <AlertTriangle className="h-3 w-3 text-diff-value-mismatch" />;
      default: return <Info className="h-3 w-3 text-diff-missing" />;
    }
  };

  const getDiffsForPath = (path: string) => {
    return diffs.filter(diff => diff.path === path);
  };

  const hasPendingDecision = (path: string) => {
    return pendingDecisions.some(d => d.path === path);
  };

  const renderJsonNode = (data: any, path = '', isTemplate = false): React.ReactNode => {
    if (data === null || data === undefined) {
      return <span className="text-muted-foreground italic">null</span>;
    }

    if (typeof data === 'string') {
      const nodeDiffs = getDiffsForPath(path);
      const hasDiff = nodeDiffs.length > 0;
      const isPending = hasPendingDecision(path);
      
      return (
        <span 
          className={cn(
            "inline-block px-1 rounded",
            hasDiff && !isPending && getDiffColor(nodeDiffs[0].type),
            isPending && "border border-green-500 bg-green-500/10",
            selectedPath === path && "ring-2 ring-primary"
          )}
          onClick={() => setSelectedPath(selectedPath === path ? null : path)}
        >
          <span className="text-green-600">"{data}"</span>
          {!isTemplate && hasDiff && !isPending && (
            <div className="mt-1 flex gap-1">
              {nodeDiffs.map((diff, i) => (
                <Badge key={i} variant="secondary" className="text-xs px-1 py-0">
                  {getSeverityIcon(diff.severity)}
                  {diff.type}
                </Badge>
              ))}
              <div className="flex gap-1 mt-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 text-xs px-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDecision({ path, action: "applyTemplate" });
                  }}
                >
                  Ändra
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 text-xs px-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDecision({ path, action: "keepCustomer" });
                  }}
                >
                  Behåll
                </Button>
              </div>
            </div>
          )}
        </span>
      );
    }

    if (typeof data === 'number' || typeof data === 'boolean') {
      const nodeDiffs = getDiffsForPath(path);
      const hasDiff = nodeDiffs.length > 0;
      const isPending = hasPendingDecision(path);

      return (
        <span 
          className={cn(
            "inline-block px-1 rounded",
            hasDiff && !isPending && getDiffColor(nodeDiffs[0].type),
            isPending && "border border-green-500 bg-green-500/10",
            selectedPath === path && "ring-2 ring-primary"
          )}
          onClick={() => setSelectedPath(selectedPath === path ? null : path)}
        >
          <span className={typeof data === 'number' ? "text-blue-600" : "text-purple-600"}>
            {String(data)}
          </span>
          {!isTemplate && hasDiff && !isPending && (
            <div className="mt-1 flex gap-1">
              {nodeDiffs.map((diff, i) => (
                <Badge key={i} variant="secondary" className="text-xs px-1 py-0">
                  {getSeverityIcon(diff.severity)}
                  {diff.type}
                </Badge>
              ))}
              <div className="flex gap-1 mt-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 text-xs px-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDecision({ path, action: "applyTemplate" });
                  }}
                >
                  Ändra
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 text-xs px-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDecision({ path, action: "keepCustomer" });
                  }}
                >
                  Behåll
                </Button>
              </div>
            </div>
          )}
        </span>
      );
    }

    if (Array.isArray(data)) {
      return (
        <div className="ml-4">
          <span className="text-muted-foreground">[</span>
          {data.map((item, index) => (
            <div key={index} className="ml-4">
              {renderJsonNode(item, `${path}/${index}`, isTemplate)},
            </div>
          ))}
          <span className="text-muted-foreground">]</span>
        </div>
      );
    }

    if (typeof data === 'object') {
      return (
        <div className="ml-4">
          <span className="text-muted-foreground">{"{"}</span>
          {Object.entries(data).map(([key, value]) => (
            <div key={key} className="ml-4">
              <span className="text-orange-600">"{key}"</span>: {renderJsonNode(value, `${path}/${key}`, isTemplate)}
            </div>
          ))}
          <span className="text-muted-foreground">{"}"}</span>
        </div>
      );
    }

    return <span>{String(data)}</span>;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      {/* Template Column */}
      <div className="bg-card border border-border rounded-lg shadow-soft">
        <div className="p-4 border-b border-border">
          <h3 className="font-medium text-foreground flex items-center gap-2">
            <div className="w-3 h-3 bg-muted rounded-full"></div>
            Template (Read-only)
          </h3>
        </div>
        <ScrollArea className="h-[calc(100vh-16rem)]">
          <div className="p-4 font-mono text-sm">
            {renderJsonNode(template, '', true)}
          </div>
        </ScrollArea>
      </div>

      {/* Customer Data Column */}
      <div className="bg-card border border-border rounded-lg shadow-soft">
        <div className="p-4 border-b border-border">
          <h3 className="font-medium text-foreground flex items-center gap-2">
            <div className="w-3 h-3 bg-primary rounded-full"></div>
            Kunddata (Interaktiv)
          </h3>
          <div className="text-xs text-muted-foreground mt-1">
            {diffs.length} skillnader hittade
          </div>
        </div>
        <ScrollArea className="h-[calc(100vh-16rem)]">
          <div className="p-4 font-mono text-sm">
            {renderJsonNode(customerData)}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}