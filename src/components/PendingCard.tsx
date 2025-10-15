import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2 } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { sv } from "date-fns/locale";
import type { ChangeCardDto } from "@/types/changes";

type Props = {
  item: ChangeCardDto;
  onOpen: (id: string) => void;
};

export default function PendingCard({ item, onOpen }: Props) {
  const badgeVariant =
    item.status === "applied"
      ? "default"
      : item.status === "failed"
      ? "destructive"
      : "secondary";

  const createdDate = new Date(item.createdUtc);
  const appliedDate = item.appliedUtc ? new Date(item.appliedUtc) : null;

  return (
    <Card className="bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-sm border-primary/30 shadow-lg">
      <CardContent className="p-4 space-y-3">
        {/* överrad */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">{item.customerId}</div>
          <Badge variant={badgeVariant}>{item.status}</Badge>
        </div>

        {/* tider */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <div className="flex flex-col">
              <span className="text-muted-foreground">Skapad</span>
              <span className="font-medium text-foreground">
                {format(createdDate, "d MMM, HH:mm", { locale: sv })}
              </span>
              <span className="text-muted-foreground/70">
                {formatDistanceToNow(createdDate, { addSuffix: true, locale: sv })}
              </span>
            </div>
          </div>
          {appliedDate && (
            <div className="flex items-center gap-2 text-xs">
              <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
              <div className="flex flex-col">
                <span className="text-muted-foreground">Tillämpad</span>
                <span className="font-medium text-foreground">
                  {format(appliedDate, "d MMM, HH:mm", { locale: sv })}
                </span>
                <span className="text-muted-foreground/70">
                  {formatDistanceToNow(appliedDate, { addSuffix: true, locale: sv })}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* decisions teaser */}
        <div className="space-y-1 bg-muted/20 rounded-lg p-2">
          {item.decisions.map((d, i) => (
            <div key={i} className="text-sm font-mono truncate">
              {d.action} → <span className="text-muted-foreground">{d.path}</span>
            </div>
          ))}
          {item.decisionCount > item.decisions.length && (
            <div className="text-xs text-muted-foreground">
              + {item.decisionCount - item.decisions.length} fler…
            </div>
          )}
        </div>

        <Button
          onClick={() => onOpen(item.id)}
          variant="outline"
          className="w-full transition-all hover:scale-105"
        >
          Visa detaljer
        </Button>
      </CardContent>
    </Card>
  );
}
