import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-background">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card className="border-border shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-foreground">
                Thank you for signing up!
              </CardTitle>
              <CardDescription className="text-muted-foreground">Check your email to confirm</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-primary/10 border border-primary/20 rounded-md">
                <p className="text-sm text-foreground text-center">
                  You&apos;ve successfully signed up. Please check your email to
                  confirm your account before signing in.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
