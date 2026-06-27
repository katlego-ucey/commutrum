import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MetricRow {
  metricDate: string;
  factorId: string;
  metricName: string;
  value: number;
  validatedBandLow: number | null;
  validatedBandHigh: number | null;
  isWithinBand: boolean | null;
}

interface AlertRow {
  id: number;
  alertDate: string;
  alertType: string;
  factorId: string | null;
  severity: string;
  message: string;
  acknowledged: boolean;
}

export default function MonitoringDashboard() {
  const [metrics, setMetrics] = useState<MetricRow[]>([]);
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/v1/monitoring/metrics").then((r) => r.json()),
      fetch("/api/v1/monitoring/alerts").then((r) => r.json()),
    ])
      .then(([metricsRes, alertsRes]) => {
        setMetrics(metricsRes.data ?? []);
        setAlerts(alertsRes.data ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const acknowledgeAlert = async (id: number) => {
    await fetch(`/api/v1/monitoring/alerts/${id}/acknowledge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ acknowledgedBy: "frontend" }),
    });
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)),
    );
  };

  const unacknowledgedAlerts = alerts.filter((a) => !a.acknowledged);
  const activeAlerts = alerts.filter((a) => !a.acknowledged);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Monitoring</h1>
          <p className="text-sm text-muted-foreground">
            Rolling metrics, alerts, and capacity utilization
          </p>
        </div>
        {activeAlerts.length > 0 && (
          <Badge variant="destructive">{activeAlerts.length} active alerts</Badge>
        )}
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading...</div>
      ) : (
        <Tabs defaultValue="metrics">
          <TabsList>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="alerts">
              Alerts
              {unacknowledgedAlerts.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unacknowledgedAlerts.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="metrics" className="space-y-4 mt-4">
            {metrics.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  No monitoring metrics yet. Run the data pipeline to populate.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {metrics.slice(0, 20).map((m, i) => (
                  <Card key={i}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium">
                          {m.metricName}
                        </CardTitle>
                        <Badge
                          variant={
                            m.isWithinBand === true
                              ? "secondary"
                              : m.isWithinBand === false
                                ? "destructive"
                                : "outline"
                          }
                          className="text-xs"
                        >
                          {m.isWithinBand === true
                            ? "In band"
                            : m.isWithinBand === false
                              ? "Out of band"
                              : "No band"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{m.value.toFixed(4)}</p>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Factor: {m.factorId} &middot; {m.metricDate}
                        {m.validatedBandLow !== null &&
                          ` · Band: [${m.validatedBandLow.toFixed(4)}, ${m.validatedBandHigh?.toFixed(4)}]`}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="alerts" className="space-y-4 mt-4">
            {alerts.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  No alerts. All systems nominal.
                </CardContent>
              </Card>
            ) : (
              alerts.map((a) => (
                <Card key={a.id} className={a.acknowledged ? "opacity-60" : ""}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-sm font-medium">
                          {a.alertType}
                        </CardTitle>
                        <Badge
                          variant={
                            a.severity === "critical"
                              ? "destructive"
                              : a.severity === "warning"
                                ? "default"
                                : "secondary"
                          }
                          className="text-xs"
                        >
                          {a.severity}
                        </Badge>
                      </div>
                      {!a.acknowledged && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => acknowledgeAlert(a.id)}
                        >
                          Acknowledge
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="text-sm space-y-1">
                    <p>{a.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.alertDate}
                      {a.factorId && ` · Factor: ${a.factorId}`}
                      {a.acknowledged && " · Acknowledged"}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}