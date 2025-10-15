import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

  return (
    <Card className="bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-sm border-primary/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
      <CardContent className="p-4 space-y-3">
        {/* överrad */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">{item.customerId}</div>
          <Badge variant={badgeVariant}>{item.status}</Badge>
        </div>

        {/* tider */}
        <div className="text-xs text-muted-foreground space-y-1">
          <div>Created: {new Date(item.createdUtc).toLocaleString()}</div>
          {item.appliedUtc && <div>Applied: {new Date(item.appliedUtc).toLocaleString()}</div>}
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
          className="w-full"
        >
          Visa detaljer
        </Button>
      </CardContent>
    </Card>
  );
}
