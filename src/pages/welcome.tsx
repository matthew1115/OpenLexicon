import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { hasStoredWordbank } from "@/utils/file";

export default function WelcomePage() {
  const [hasWordbank, setHasWordbank] = useState<boolean | null>(null);

  useEffect(() => {
    hasStoredWordbank().then(setHasWordbank);
  }, []);

  return (
    <div className="h-screen flex items-center justify-center">
      <Card className="min-w-[340px] shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">
            OpenLexicon
          </CardTitle>
        </CardHeader>
        <CardContent>
          Your AI-powered vocabulary builder
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button
            className="w-full"
            variant="default"
            disabled={hasWordbank === false}
          >
            Resume session
          </Button>
          <Button className="w-full" variant="outline">
            Open wordbank
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
