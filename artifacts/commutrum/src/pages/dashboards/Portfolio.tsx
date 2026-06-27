import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface PortfolioHolding {
  ticker: string;
  targetWeight: number;
  actualWeight: number | null;
  rebalanceDate: string;
  currencyFlag: string;
}

export default function PortfolioDashboard() {
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/portfolio/current")
      .then((r) => r.json())
      .then((res) => setHoldings(res.data?.holdings ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Portfolio Construction</h1>
        <p className="text-sm text-muted-foreground">
          Rebalance scheduler, weights, trade list, and exposure breakdown
        </p>
      </div>

      <div className="flex items-center gap-4">
        <Badge variant="secondary">{holdings.length} holdings</Badge>
        <Button variant="outline" size="sm">
          Run Rebalance
        </Button>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading...</div>
      ) : holdings.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No portfolio data yet. Run the portfolio construction pipeline to generate holdings.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {holdings.map((h, i) => (
            <Card key={`${h.ticker}-${i}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold font-mono">
                    {h.ticker}
                  </CardTitle>
                  <Badge variant="outline">{h.currencyFlag}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Target Weight</span>
                    <p className="font-semibold">{(h.targetWeight * 100).toFixed(2)}%</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Actual Weight</span>
                    <p className="font-semibold">
                      {h.actualWeight !== null
                        ? `${(h.actualWeight * 100).toFixed(2)}%`
                        : "Pending"}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Rebalance Date</span>
                    <p className="font-medium">{h.rebalanceDate}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}