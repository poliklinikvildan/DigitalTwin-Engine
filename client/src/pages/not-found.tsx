import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md mx-auto border-destructive/20 bg-card">
        <CardContent className="pt-6 text-center space-y-4">
          <div className="flex justify-center">
            <AlertTriangle className="h-12 w-12 text-destructive animate-pulse" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              404 Page Not Found
            </h1>
            <p className="text-sm text-muted-foreground font-mono">
              ERR_ROUTE_MISSING: The requested path does not exist in the simulation matrix.
            </p>
          </div>

          <div className="pt-4">
            <Link href="/" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
              Return to Dashboard
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
