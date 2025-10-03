import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { DiffItem, UiDecision } from '@/types/diff';
import {
  AlertTriangle,
  Info,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  Check,
  Filter,
  Undo2,
  GitBranch
} from 'lucide-react';

interface ComparisonTableViewProps {
  template: any;
  customerData: any;
  diffs: DiffItem[];
  onDecision: (decision: UiDecision) => void;
  pendingDecisions: UiDecision[];
  onApplyAllTemplate?: () => void;
  isLoading?: boolean;

  // rapportera upp hur många diffor som faktiskt visas
  onVisibleCountChange?: (visible: number, raw: number) => void;
}

export function ComparisonTableView({
  template,
  customerData,
  diffs,
  onDecision,
  pendingDecisions,
  onApplyAllTemplate,
  isLoading = false,
  onVisibleCountChange
}: ComparisonTableViewProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [showOnlyDifferences, setShowOnlyDifferences] = useState(false);

  // toggle för parent+children vs leaf-only
  const [showAllChildren, setShowAllChildren] = useState(false);

  // ⬇️ Viktigt: markera rad som vald för både 'applyTemplate' OCH 'keepCustomer' (ignorera bara 'undo')
  const getDecisionForPath = (path: string) =>
  pendingDecisions.find(d => d.path === path && d.action !== 'undo');


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
    const parts = path.split('/').filter(Boolean);
    let cur = obj;
    for (const part of parts) {
      if (cur === null || cur === undefined) return undefined;
      cur = cur[part];
    }
    return cur;
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'Inget värde';
    if (typeof value === 'string') return value;
    if (typeof value === 'boolean') return value ? 'Ja' : 'Nej';
    if (typeof value === 'number') return value.toString();
    if (Array.isArray(value)) return `Lista med ${value.length} objekt`;
    if (typeof value === 'object') return `Objekt med ${Object.keys(value).length} fält`;
    return String(value);
  };

  const getRecommendedAction = (diff: DiffItem): string => {
    switch (diff.type) {
      case 'missing': return 'Lägg till från mall';
      case 'unexpected': return 'Ta bort eller behåll';
      case 'typeMismatch': return 'Ändra typ enligt mall';
      case 'valueMismatch': return 'Uppdatera värde från mall';
      case 'lengthMismatch': return 'Justera längd';
      default: return 'Granska manuellt';
    }
  };

  const getFieldDisplayName = (path: string): string => {
    const fieldName = path.split('/').pop() || path;
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/^\w/, c => c.toUpperCase());
  };

  // Hämtar alla paths från både template och kunddata (objekt-noder och leafs)
  const getAllDataFields = (templateObj: any, customerObj: any): string[] => {
    const all = new Set<string>();
    const walk = (obj: any, prefix = '') => {
      if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
        for (const k of Object.keys(obj)) {
          const p = prefix ? `${prefix}/${k}` : `/${k}`;
          all.add(p); // inkludera även parent
          const v = obj[k];
          if (v && typeof v === 'object' && !Array.isArray(v)) walk(v, p);
          // (arrays hoppar vi här – FE visar ändå sammanfattning via formatValue)
        }
      }
    };
    walk(templateObj);
    walk(customerObj);
    return Array.from(all);
  };

  const toggleSection = (section: string) => {
    const next = new Set(expandedSections);
    if (next.has(section)) next.delete(section); else next.add(section);
    setExpandedSections(next);
  };

  // Alla möjliga paths
  const allFields = useMemo(
    () => getAllDataFields(template, customerData),
    [template, customerData]
  );

  // Paths att visa: alla eller bara de som finns som diffs
  const fieldsToShow = useMemo(() => {
    const base = showOnlyDifferences ? diffs.map(d => d.path) : allFields;
    // leaf-only? Ta bort parent-paths som har barn (endast när showAllChildren = false)
    if (showAllChildren) return base;

    const set = new Set(base);
    return base.filter(p => !hasChildrenPath(set, p));
  }, [showOnlyDifferences, diffs, allFields, showAllChildren]);

  // Grupp efter toppnivå
  const groupedFields = fieldsToShow.reduce((acc, path) => {
    const top = path.split('/')[1] || 'root';
    (acc[top] ??= []).push(path);
    return acc;
  }, {} as Record<string, string[]>);

  // Räkna hur många av de synliga paths som har diff
  const visibleDiffCount = useMemo(() => {
    const set = new Set(fieldsToShow);
    let count = 0;
    for (const d of diffs) {
      if (set.has(d.path)) count++;
    }
    return count;
  }, [fieldsToShow, diffs]);

  // rapportera upp till AdminPanel
  useEffect(() => {
    onVisibleCountChange?.(visibleDiffCount, diffs.length);
  }, [onVisibleCountChange, visibleDiffCount, diffs.length]);

  const handleApplyAllTemplate = () => {
    onApplyAllTemplate?.();
  };

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <Card className="bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-sm border-primary/30 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {isLoading ? <Skeleton className="h-6 w-48" /> : 'Kunddata Jämförelse'}
            </CardTitle>
            <div className="flex items-center gap-6">
              {/* Visa endast skillnader */}
              <div className="flex items-center space-x-2">
                {isLoading ? (
                  <Skeleton className="h-6 w-6" />
                ) : (
                  <Switch
                    id="show-differences"
                    checked={showOnlyDifferences}
                    onCheckedChange={setShowOnlyDifferences}
                  />
                )}
                <Label htmlFor="show-differences" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  {isLoading ? <Skeleton className="h-4 w-32" /> : 'Visa endast skillnader'}
                </Label>
              </div>

              {/* Visa alla underfält (parent + barn) */}
              <div className="flex items-center space-x-2">
                {isLoading ? (
                  <Skeleton className="h-6 w-6" />
                ) : (
                  <Switch
                    id="show-all-children"
                    checked={showAllChildren}
                    onCheckedChange={setShowAllChildren}
                  />
                )}
                <Label htmlFor="show-all-children" className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4" />
                  {isLoading ? <Skeleton className="h-4 w-36" /> : 'Visa alla underfält'}
                </Label>
              </div>

              {diffs.length > 0 && onApplyAllTemplate && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="gap-2" disabled={isLoading}>
                      <Check className="h-4 w-4" />
                      {isLoading ? <Skeleton className="h-4 w-32" /> : 'Använd alla mallvärden'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Bekräfta ändring</AlertDialogTitle>
                      <AlertDialogDescription>
                        Är du säker på att du vill använda alla mallvärden? Detta ersätter kundens värden där det finns skillnader.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Avbryt</AlertDialogCancel>
                      <AlertDialogAction onClick={handleApplyAllTemplate}>
                        Ja, använd alla mallvärden
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {isLoading ? (
        /* Loading skeletons */
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-card/80 backdrop-blur">
              <CardHeader className="pb-3 bg-muted/50">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-5 w-20 ml-2" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex gap-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="flex gap-4">
                      <Skeleton className="h-8 w-24" />
                      <Skeleton className="h-8 w-32" />
                      <Skeleton className="h-8 w-32" />
                      <Skeleton className="h-8 w-24" />
                      <div className="flex gap-1">
                        <Skeleton className="h-7 w-16" />
                        <Skeleton className="h-7 w-16" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* Actual content */
        <>
          {Object.entries(groupedFields).map(([section, sectionFields]) => {
            const sectionDiffs = diffs.filter(d => sectionFields.includes(d.path));
            return (
              <Card key={section} className="bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-sm border-primary/30 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-3 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSection(section)}
                      className="h-9 w-9 p-0 hover:bg-primary/20 transition-colors duration-200 rounded-lg"
                    >
                      {expandedSections.has(section) ? (
                        <ChevronDown className="h-5 w-5 text-primary" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-primary" />
                      )}
                    </Button>
                    <CardTitle className="text-lg capitalize font-semibold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">{getFieldDisplayName(section)}</CardTitle>
                    <Badge variant="secondary" className="ml-2 bg-primary/15 text-primary border-primary/30 shadow-sm">
                      {showOnlyDifferences ? `${sectionDiffs.length} skillnader` : `${sectionFields.length} fält`}
                    </Badge>
                    {sectionDiffs.length > 0 && !showOnlyDifferences && (
                      <Badge variant="outline" className="text-orange-600 border-orange-500 bg-orange-50 dark:bg-orange-950/30 shadow-sm">
                        {sectionDiffs.length} skillnader
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                {expandedSections.has(section) && (
                  <CardContent className="bg-gradient-to-b from-muted/10 to-transparent">
                    <ScrollArea className="h-96">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gradient-to-r from-primary/15 via-primary/10 to-primary/15 border-b-2 border-primary/30 hover:bg-primary/15">
                            <TableHead className="w-1/6 font-bold text-primary">Fält</TableHead>
                            <TableHead className="w-1/4 font-bold text-primary">Mallvärde</TableHead>
                            <TableHead className="w-1/4 font-bold text-primary">Kundens värde</TableHead>
                            <TableHead className="w-1/6 font-bold text-primary">Rekommendation</TableHead>
                            <TableHead className="w-1/6 font-bold text-primary">Åtgärd</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sectionFields.map((fieldPath, index) => {
                            const diff = sectionDiffs.find(d => d.path === fieldPath);
                            const templateValue = getValueAtPath(template, fieldPath);
                            const customerValue = getValueAtPath(customerData, fieldPath);
                            const decision = getDecisionForPath(fieldPath);
                            const hasChoice = !!decision;
                            const fieldName = getFieldDisplayName(fieldPath);

                            const chosenText =
                              decision?.action === 'applyTemplate'
                                ? 'Ändra vald'
                                : decision?.action === 'keepCustomer'
                                ? 'Behåll vald'
                                : 'Vald';

                            const chosenBadgeClasses =
                              decision?.action === 'applyTemplate'
                                ? 'text-blue-600 border-blue-600'
                                : decision?.action === 'keepCustomer'
                                ? 'text-orange-600 border-orange-600'
                                : 'text-green-600 border-green-600';

                            return (
                              <TableRow
                                key={index}
                                className={cn(
                                  'border-b border-border/50 transition-all duration-300 hover:bg-accent/40 hover:shadow-md',
                                  hasChoice && 'bg-gradient-to-r from-primary/10 to-primary/5 hover:from-primary/15 hover:to-primary/10 border-l-4 border-l-primary shadow-sm',
                                  diff && !hasChoice && 'bg-gradient-to-r from-diff-value-mismatch/8 to-diff-value-mismatch/4 hover:from-diff-value-mismatch/12 hover:to-diff-value-mismatch/8 border-l-4 border-l-diff-value-mismatch shadow-sm'
                                )}
                              >
                                <TableCell className="font-medium">
                                  <div className="flex items-center gap-2">
                                    {diff && getSeverityIcon(diff.severity)}
                                    <span className="text-sm font-semibold">{fieldName}</span>
                                  </div>
                                  {diff && (
                                    <Badge
                                      variant="outline"
                                      className={cn('text-xs mt-1', getSeverityColor(diff.type))}
                                    >
                                      {diff.type}
                                    </Badge>
                                  )}
                                </TableCell>

                                <TableCell>
                                  <div className="text-sm px-4 py-2.5 rounded-lg bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/30 font-medium text-foreground shadow-md hover:shadow-lg transition-shadow duration-200">
                                    {formatValue(templateValue)}
                                  </div>
                                </TableCell>

                                <TableCell>
                                  <div className="text-sm px-4 py-2.5 rounded-lg bg-gradient-to-br from-accent to-muted border border-border/50 font-medium text-foreground shadow-md hover:shadow-lg transition-shadow duration-200">
                                    {formatValue(customerValue)}
                                  </div>
                                </TableCell>

                                <TableCell>
                                  <div className={cn(
                                    "text-xs px-3 py-1.5 rounded-lg inline-block font-semibold shadow-sm",
                                    diff 
                                      ? "bg-gradient-to-r from-diff-value-mismatch/15 to-diff-value-mismatch/10 text-diff-value-mismatch border border-diff-value-mismatch/40" 
                                      : "bg-gradient-to-r from-green-500/15 to-green-500/10 text-green-700 dark:text-green-400 border border-green-500/40"
                                  )}>
                                    {diff ? getRecommendedAction(diff) : 'Ingen ändring krävs'}
                                  </div>
                                </TableCell>

                                <TableCell>
                                  {!diff ? (
                                    <Badge variant="outline" className="text-green-600 border-green-600">
                                      OK
                                    </Badge>
                                  ) : hasChoice ? (
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className={chosenBadgeClasses}>
                                        {chosenText}
                                      </Badge>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 text-xs px-2 text-red-600"
                                        onClick={() => onDecision({ path: fieldPath, action: 'undo' })}
                                        title="Återställ valet"
                                      >
                                        <Undo2 className="h-4 w-4 mr-1" />
                                        Ångra
                                      </Button>
                                    </div>
                                  ) : (
                                    <div className="flex gap-1">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 text-xs px-2"
                                        onClick={() => onDecision({ path: fieldPath, action: 'applyTemplate' })}
                                      >
                                        Ändra
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 text-xs px-2"
                                        onClick={() => onDecision({ path: fieldPath, action: 'keepCustomer' })}
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
            );
          })}

          {diffs.length === 0 && !isLoading && (
            <Card>
              <CardContent className="text-center py-8">
                <div className="text-muted-foreground">
                  <Info className="h-8 w-8 mx-auto mb-2" />
                  <p>Inga skillnader hittade mellan template och kunddata</p>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

/* ---------------- helpers ---------------- */

function hasChildrenPath(allPaths: Set<string>, path: string) {
  const prefix = path.endsWith('/') ? path : path + '/';
  for (const p of allPaths) {
    if (p !== path && p.startsWith(prefix)) return true;
  }
  return false;
}
