import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FactorDef {
  factorId: number;
  factorName: string;
  description: string;
  mechanism: string;
  decayHorizon: number | null;
  formulaVersion: string;
  effectiveFrom: string;
}

export default function FactorExplorer() {
  const [definitions, setDefinitions] = useState<FactorDef[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/factors/definitions")
      .then((r) => r.json())
      .then((res) => setDefinitions(res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = definitions.filter(
    (f) =>
      f.factorName.toLowerCase().includes(search.toLowerCase()) ||
      f.description.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Factor Explorer</h1>
        <p className="text-sm text-muted-foreground">
          Factor definitions, backtests, and decay charts
        </p>
      </div>

      <Input
        placeholder="Search factors..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-xs"
      />

      <Tabs defaultValue="definitions">
        <TabsList>
          <TabsTrigger value="definitions">Definitions</TabsTrigger>
          <TabsTrigger value="backtests">Backtests</TabsTrigger>
          <TabsTrigger value="decay">Decay</TabsTrigger>
        </TabsList>

        <TabsContent value="definitions" className="space-y-4 mt-4">
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                {definitions.length === 0
                  ? "No factor definitions loaded. Run the seed pipeline."
                  : "No factors match your search."}
              </CardContent>
            </Card>
          ) : (
            filtered.map((f) => (
              <Card key={f.factorId}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold">
                      {f.factorName}
                    </CardTitle>
                    <Badge variant="outline" className="font-mono text-xs">
                      v{f.formulaVersion}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p className="text-muted-foreground">{f.description}</p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <Badge variant="secondary">Mechanism: {f.mechanism}</Badge>
                    {f.decayHorizon && (
                      <Badge variant="secondary">Decay: {f.decayHorizon}d</Badge>
                    )}
                    <Badge variant="secondary">
                      Since: {f.effectiveFrom}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="backtests">
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Backtest results will appear here. Run a backtest from the validation pipeline.
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="decay">
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Decay detection charts will appear here after pipeline execution.
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}