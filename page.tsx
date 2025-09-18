import { notFound } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { Client } from '@neondatabase/serverless';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, ExternalLink, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface DocumentationPageProps {
  params: {
    id: string;
  };
}

export default async function DocumentationPage({ params }: DocumentationPageProps) {
  const session = await auth();
  const { userId } = session;
  if (!userId) return notFound();

  const documentationId = parseInt(params.id);
  if (isNaN(documentationId)) return notFound();

  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();

  try {
    // Get the documentation and repository details
    const result = await db.query(
      `SELECT d.*, r.name as repo_name, r.github_repo_id, r.html_url as repo_url
       FROM documentation d
       JOIN repos r ON d.repo_id = r.id
       WHERE d.id = $1 AND r.clerk_user_id = $2`,
      [documentationId, userId]
    );

    if (result.rows.length === 0) {
      return notFound();
    }

    const documentation = result.rows[0];

    // Get the documentation chunks
    const chunksResult = await db.query(
      `SELECT * FROM documentation_chunks 
       WHERE documentation_id = $1 
       ORDER BY chunk_index`,
      [documentationId]
    );

    const chunks = chunksResult.rows;

    return (
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link href="/dashboard" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {documentation.repo_name} Documentation
            </h1>
            <p className="text-muted-foreground mt-2">
              Generated on {new Date(documentation.generated_at).toLocaleString()}
            </p>
          </div>
          
          <Button asChild variant="outline">
            <a 
              href={documentation.repo_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              View Repository
            </a>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              <CardTitle>Documentation</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose dark:prose-invert max-w-none">
              {chunks.length > 0 ? (
                chunks.map((chunk, index) => (
                  <div key={chunk.id} className="mb-8 last:mb-0">
                    <div 
                      className="prose dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: chunk.content }}
                    />
                    {index < chunks.length - 1 && <hr className="my-8" />}
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No documentation content available.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  } catch (error) {
    console.error("Error fetching documentation:", error);
    return notFound();
  } finally {
    await db.end();
  }
}

// Generate static params for better performance
export async function generateStaticParams() {
  // In a real app, you might want to pre-generate pages for popular docs
  return [];
}
