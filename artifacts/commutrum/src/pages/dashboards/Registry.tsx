import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface RegistryFactor {
  factorId: number;
  factorName: string;
  mechanismType: string;
  status: string;
  registeredAt: string;
}

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  "R&D": "secondary",
  "Validation": "default",
  "Paper Portfolio": "default",
  "Production": "default",
  "Watch": "outline",
  "Retired": "destructive",
};

export default function RegistryDashboard() {
  const [factors, setFactors] = useState<RegistryFactor[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/registry/factors")
      .then((r) => r.json())
      .then((res) => setFactors(res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = factors.filter((f) => {
    const matchesSearch =
      f.factorName.toLowerCase().includes(search.toLowerCase()) ||
      f.mechanismType.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || f.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Hypothesis Registry</h1>
        <p className="text-sm text-muted-foreground">
          Searchable factor registry with lifecycle tracking and audit history
        </p>
      </div>

      <div className="flex items-center gap-4">
        <Input
          placeholder="Search factors..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="R&D">R&amp;D</SelectItem>
            <SelectItem value="Validation">Validation</SelectItem>
            <SelectItem value="Paper Portfolio">Paper Portfolio</SelectItem>
            <SelectItem value="Production">Production</SelectItem>
            <SelectItem value="Watch">Watch</SelectItem>
            <SelectItem value="Retired">Retired</SelectItem>
          </SelectContent>
        </Select>
        <Badge variant="secondary">{factors.length} total</Badge>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading...</div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            {factors.length === 0
              ? "No factors registered yet. Submit a hypothesis to get started."
              : "No factors match your filters."}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((f) => (
            <Card key={f.factorId}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-sm font-medium">
                    {f.factorName}
                  </CardTitle>
                  <Badge
                    variant={statusColors[f.status] ?? "secondary"}
                    className="text-xs"
                  >
                    {f.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p className="font-mono text-xs text-muted-foreground">
                  ID: {f.factorId}
                </p>
                <p className="text-muted-foreground capitalize">
                  {f.mechanismType.replace(/_/g, " ")}
                </p>
                <p className="text-xs text-muted-foreground">
                  Registered: {f.registeredAt?.slice(0, 10)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}