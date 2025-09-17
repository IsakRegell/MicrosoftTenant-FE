import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { DiffItem, Decision } from '@/types/diff';
import { AlertTriangle, Info, AlertCircle, ChevronRight, ChevronDown } from 'lucide-react';

interface ComparisonTableViewProps {
  template: any;
  customerData: any;
  diffs: DiffItem[];
  onDecision: (decision: Decision) => void;
  pendingDecisions: Decision[];
}

export function ComparisonTableView({ 
  template, 
  customerData, 
  diffs, 
  onDecision, 
  pendingDecisions 
}: ComparisonTableViewProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const getSeverityIcon = (severity?: string) => {
    switch (severity) {
      case 'error': return <AlertCircle className="h-4 w-4 text-diff-type-mismatch" />;
      case 'warn': return <AlertTriangle className="h-4 w-4 text-diff-value-mismatch" />;
      default: return <Info className="h-4 w-4 text-diff-missing" />;
    }
  };

  const getSeverityColor = (type: string) => {
    switch (type) {
      case 'typeMismatch': return 'text-diff-type-mismatch';
      case 'valueMismatch': return 'text-diff-value-mismatch';
      case 'missing': return 'text-diff-missing';
      case 'unexpected': return 'text-diff-unexpected';
      case 'lengthMismatch': return 'text-diff-length-mismatch';
      default: return 'text-muted-foreground';
    }
  };

  const getValueAtPath = (obj: any, path: string): any => {
    if (!path || path === '') return obj;
    const pathParts = path.split('/').filter(Boolean);
    let current = obj;
    
    for (const part of pathParts) {
      if (current === null || current === undefined) return undefined;
      current = current[part];
    }
    
    return current;
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'string') return `"${value}"`;
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  const hasPendingDecision = (path: string) => {
    return pendingDecisions.some(d => d.path === path);
  };

  const getRecommendedAction = (diff: DiffItem): string => {
    switch (diff.type) {
      case 'missing': return 'Lägg till från template';
      case 'unexpected': return 'Ta bort eller behåll';
      case 'typeMismatch': return 'Ändra typ enligt template';
      case 'valueMismatch': return 'Uppdatera värde från template';
      case 'lengthMismatch': return 'Justera array-längd';
      default: return 'Granska manuellt';
    }
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  // Group diffs by top-level section
  const groupedDiffs = diffs.reduce((acc, diff) => {
    const topLevel = diff.path.split('/')[1] || 'root';
    if (!acc[topLevel]) acc[topLevel] = [];
    acc[topLevel].push(diff);
    return acc;
  }, {} as Record<string, DiffItem[]>);

  return (
    <div className="space-y-6">
      {Object.entries(groupedDiffs).map(([section, sectionDiffs]) => (
        <Card key={section}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleSection(section)}
                className="h-8 w-8 p-0"
              >
                {expandedSections.has(section) ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
              <CardTitle className="text-lg capitalize">{section}</CardTitle>
              <Badge variant="secondary" className="ml-2">
                {sectionDiffs.length} skillnader
              </Badge>
            </div>
          </CardHeader>
          
          {expandedSections.has(section) && (
            <CardContent>
              <ScrollArea className="h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-1/6">Fält</TableHead>
                      <TableHead className="w-1/4">Template värde</TableHead>
                      <TableHead className="w-1/4">Ditt värde</TableHead>
                      <TableHead className="w-1/6">Rekommendation</TableHead>
                      <TableHead className="w-1/6">Åtgärd</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sectionDiffs.map((diff, index) => {
                      const templateValue = getValueAtPath(template, diff.path);
                      const customerValue = getValueAtPath(customerData, diff.path);
                      const isPending = hasPendingDecision(diff.path);
                      const fieldName = diff.path.split('/').pop() || diff.path;

                      return (
                        <TableRow 
                          key={index}
                          className={cn(
                            isPending && "bg-green-50 dark:bg-green-950/20"
                          )}
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {getSeverityIcon(diff.severity)}
                              <span className="text-sm">{fieldName}</span>
                            </div>
                            <Badge 
                              variant="outline" 
                              className={cn("text-xs mt-1", getSeverityColor(diff.type))}
                            >
                              {diff.type}
                            </Badge>
                          </TableCell>
                          
                          <TableCell>
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {formatValue(templateValue)}
                            </code>
                          </TableCell>
                          
                          <TableCell>
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {formatValue(customerValue)}
                            </code>
                          </TableCell>
                          
                          <TableCell className="text-sm text-muted-foreground">
                            {getRecommendedAction(diff)}
                          </TableCell>
                          
                          <TableCell>
                            {isPending ? (
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                Vald
                              </Badge>
                            ) : (
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs px-2"
                                  onClick={() => onDecision({ path: diff.path, action: "applyTemplate" })}
                                >
                                  Ändra
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs px-2"
                                  onClick={() => onDecision({ path: diff.path, action: "keepCustomer" })}
                                >
                                  Behåll
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          )}
        </Card>
      ))}
      
      {diffs.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <div className="text-muted-foreground">
              <Info className="h-8 w-8 mx-auto mb-2" />
              <p>Inga skillnader hittade mellan template och kunddata</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}