import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { DiffItem, Decision } from '@/types/diff';
import { AlertTriangle, Info, AlertCircle, ChevronRight, ChevronDown, Check, Filter } from 'lucide-react';

interface ComparisonTableViewProps {
  template: any;
  customerData: any;
  diffs: DiffItem[];
  onDecision: (decision: Decision) => void;
  pendingDecisions: Decision[];
  onApplyAllTemplate?: () => void;
  isLoading?: boolean;
}

export function ComparisonTableView({ 
  template, 
  customerData, 
  diffs, 
  onDecision, 
  pendingDecisions,
  onApplyAllTemplate,
  isLoading = false
}: ComparisonTableViewProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [showOnlyDifferences, setShowOnlyDifferences] = useState(false);

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
    if (value === null || value === undefined) return 'Inget värde';
    if (typeof value === 'string') return value;
    if (typeof value === 'boolean') return value ? 'Ja' : 'Nej';
    if (typeof value === 'number') return value.toString();
    if (Array.isArray(value)) return `Lista med ${value.length} objekt`;
    if (typeof value === 'object') return `Objekt med ${Object.keys(value).length} fält`;
    return String(value);
  };

  const hasPendingDecision = (path: string) => {
    return pendingDecisions.some(d => d.path === path);
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
    // Convert camelCase and snake_case to readable format
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/^\w/, c => c.toUpperCase());
  };

  const getAllDataFields = (template: any, customerData: any): string[] => {
    const allFields = new Set<string>();
    
    const extractFields = (obj: any, prefix = '') => {
      if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
        Object.keys(obj).forEach(key => {
          const path = prefix ? `${prefix}/${key}` : `/${key}`;
          allFields.add(path);
          if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
            extractFields(obj[key], path);
          }
        });
      }
    };
    
    extractFields(template);
    extractFields(customerData);
    
    return Array.from(allFields);
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

  // Get all data fields or just differences
  const allFields = getAllDataFields(template, customerData);
  const fieldsToShow = showOnlyDifferences ? 
    diffs.map(d => d.path) : 
    allFields;

  // Group fields by top-level section
  const groupedFields = fieldsToShow.reduce((acc, path) => {
    const topLevel = path.split('/')[1] || 'root';
    if (!acc[topLevel]) acc[topLevel] = [];
    if (!acc[topLevel].includes(path)) {
      acc[topLevel].push(path);
    }
    return acc;
  }, {} as Record<string, string[]>);

  const handleApplyAllTemplate = () => {
    if (onApplyAllTemplate) {
      onApplyAllTemplate();
    }
  };

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {isLoading ? <Skeleton className="h-6 w-48" /> : "Kunddata Jämförelse"}
            </CardTitle>
            <div className="flex items-center gap-4">
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
                  {isLoading ? <Skeleton className="h-4 w-32" /> : "Visa endast skillnader"}
                </Label>
              </div>
              {diffs.length > 0 && onApplyAllTemplate && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="gap-2"
                      disabled={isLoading}
                    >
                      <Check className="h-4 w-4" />
                      {isLoading ? <Skeleton className="h-4 w-32" /> : "Använd alla mallvärden"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Bekräfta ändring</AlertDialogTitle>
                      <AlertDialogDescription>
                        Är du säker på att du vill använda alla mallvärden? Detta kommer att ersätta alla kundens värden med mallens värden där det finns skillnader.
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
        // Loading skeletons
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
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
        // Actual content
        <>
          {Object.entries(groupedFields).map(([section, sectionFields]) => {
        const sectionDiffs = diffs.filter(d => sectionFields.includes(d.path));
        return (
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
              <CardTitle className="text-lg capitalize">{getFieldDisplayName(section)}</CardTitle>
              <Badge variant="secondary" className="ml-2">
                {showOnlyDifferences ? `${sectionDiffs.length} skillnader` : `${sectionFields.length} fält`}
              </Badge>
              {sectionDiffs.length > 0 && !showOnlyDifferences && (
                <Badge variant="outline" className="text-orange-600 border-orange-600">
                  {sectionDiffs.length} skillnader
                </Badge>
              )}
            </div>
          </CardHeader>
          
          {expandedSections.has(section) && (
            <CardContent>
              <ScrollArea className="h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-1/6">Fält</TableHead>
                      <TableHead className="w-1/4">Mallvärde</TableHead>
                      <TableHead className="w-1/4">Kundens värde</TableHead>
                      <TableHead className="w-1/6">Rekommendation</TableHead>
                      <TableHead className="w-1/6">Åtgärd</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sectionFields.map((fieldPath, index) => {
                      const diff = sectionDiffs.find(d => d.path === fieldPath);
                      const templateValue = getValueAtPath(template, fieldPath);
                      const customerValue = getValueAtPath(customerData, fieldPath);
                      const isPending = hasPendingDecision(fieldPath);
                      const fieldName = getFieldDisplayName(fieldPath);

                      return (
                        <TableRow 
                          key={index}
                          className={cn(
                            isPending && "bg-green-50 dark:bg-green-950/20",
                            diff && "bg-yellow-50 dark:bg-yellow-950/20"
                          )}
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {diff && getSeverityIcon(diff.severity)}
                              <span className="text-sm">{fieldName}</span>
                            </div>
                            {diff && (
                              <Badge 
                                variant="outline" 
                                className={cn("text-xs mt-1", getSeverityColor(diff.type))}
                              >
                                {diff.type}
                              </Badge>
                            )}
                          </TableCell>
                          
                          <TableCell>
                            <div className="text-sm px-2 py-1 rounded bg-muted/50">
                              {formatValue(templateValue)}
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <div className="text-sm px-2 py-1 rounded bg-muted/50">
                              {formatValue(customerValue)}
                            </div>
                          </TableCell>
                          
                          <TableCell className="text-sm text-muted-foreground">
                            {diff ? getRecommendedAction(diff) : 'Ingen ändring krävs'}
                          </TableCell>
                          
                          <TableCell>
                            {!diff ? (
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                OK
                              </Badge>
                            ) : isPending ? (
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                Vald
                              </Badge>
                            ) : (
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs px-2"
                                  onClick={() => onDecision({ path: fieldPath, action: "applyTemplate" })}
                                >
                                  Ändra
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs px-2"
                                  onClick={() => onDecision({ path: fieldPath, action: "keepCustomer" })}
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