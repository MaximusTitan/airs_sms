import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { FileX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="p-8 bg-background min-h-full">
      <div className="max-w-2xl mx-auto">
        <Card className="border-border shadow-lg">
          <CardContent className="p-12 text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-primary/10 rounded-full">
                <FileX className="h-12 w-12 text-primary" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-4">
              Form Not Found
            </h1>
            <p className="text-muted-foreground text-lg mb-8">
              The form you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to edit it.
            </p>
            <Link href="/dashboard/forms">
              <Button className="bg-primary hover:bg-primary/90 h-11 px-8 font-medium">
                Back to Forms
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
