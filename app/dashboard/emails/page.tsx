import { Suspense } from "react";
import { EmailsHeader } from "@/components/emails/emails-header";
import { EmailsList } from "@/components/emails/emails-list";
import { getUser, getEmailsWithLeads, getEmailTemplates } from "@/lib/cache";

// Enable ISR with 3-minute revalidation for emails
export const revalidate = 180;

function EmailsListSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-4 bg-card border border-border rounded-lg animate-pulse">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-muted rounded-lg"></div>
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded w-20"></div>
                <div className="h-6 bg-muted rounded w-8"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Email list skeleton */}
      <div className="space-y-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="p-6 bg-card border border-border rounded-lg animate-pulse">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-5 bg-muted rounded w-48"></div>
                <div className="h-4 bg-muted rounded w-32"></div>
              </div>
              <div className="h-6 bg-muted rounded w-16"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

async function EmailsContent() {
  try {
    const [emailsWithLeads, templates] = await Promise.all([
      getEmailsWithLeads(),
      getEmailTemplates()
    ]);
    
    const fromEmail = process.env.FROM_EMAIL || 'AIRS@aireadyschool.com';
    
    return <EmailsList emails={emailsWithLeads} templates={templates} fromEmail={fromEmail} />;
  } catch (error) {
    console.error('Error loading emails:', error);
    return (
      <div className="p-8 text-center">
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg inline-block">
          <p className="text-destructive">Failed to load emails. Please try again later.</p>
        </div>
      </div>
    );
  }
}

export default async function EmailsPage() {
  const user = await getUser();

  if (!user) {
    return null;
  }

  return (
    <div className="p-8 space-y-8 bg-background min-h-full">
      <EmailsHeader />
      
      <Suspense fallback={<EmailsListSkeleton />}>
        <EmailsContent />
      </Suspense>
    </div>
  );
}
