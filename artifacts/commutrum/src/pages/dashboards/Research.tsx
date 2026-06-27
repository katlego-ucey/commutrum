import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface ResearchRow {
  ticker: string;
  scoreDate: string;
  compositeScore: number;
  regime: string;
  currencySensitivityFlag: boolean;
  factorAttribution: Record<string, number>;
}

export default function ResearchDashboard() {
  const [data, setData] = useState<ResearchRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/research?date=" + new Date().toISOString().slice(0, 10))
      .then((r) => r.json())
      .then((res) => setData(res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = data.filter(
    (r) =>
      r.ticker.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Research</h1>
        <p className="text-sm text-muted-foreground">
          Factor score tables, return attribution, and rolling IC
        </p>
      </div>

      <div className="flex items-center gap-4">
        <Input
          placeholder="Search ticker..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Badge variant="secondary">{data.length} securities</Badge>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading...</div>
      ) : (
        <div className="grid gap-4">
          {filtered.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                No data loaded. Run the data pipeline to populate research results.
              </CardContent>
            </Card>
          )}
          {filtered.map((row) => (
            <Card key={row.ticker}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold font-mono">
                    {row.ticker}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        row.regime === "bull" ? "default" : row.regime === "bear" ? "destructive" : "secondary"
                      }
                    >
                      {row.regime}
                    </Badge>
                    <span className="text-sm font-bold">
                      {row.compositeScore.toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">
                  Score date: {row.scoreDate}
                  {row.currencySensitivityFlag && (
                    <Badge variant="outline" className="ml-2">
                      Currency Sensitive
                    </Badge>
                  )}
                </div>
                {row.factorAttribution && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {Object.entries(row.factorAttribution).map(([k, v]) => (
                      <Badge key={k} variant="secondary" className="text-xs">
                        {k}: {v.toFixed(3)}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}