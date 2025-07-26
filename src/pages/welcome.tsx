import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { hasStoredWordbank, loadWordbankFromFile } from "@/utils/file";

export default function WelcomePage() {
  const [hasWordbank, setHasWordbank] = useState<boolean | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    hasStoredWordbank().then(setHasWordbank);
  }, []);

  const handleOpenWordbank = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        await loadWordbankFromFile(file);
        setHasWordbank(true);
        // Optionally, show a success message or redirect
      } catch (err) {
        alert((err as Error).message);
      }
    }
    // Reset input so same file can be selected again if needed
    e.target.value = "";
  };

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
          <Button className="w-full" variant="outline" onClick={handleOpenWordbank}>
            Open wordbank
          </Button>
          <input
            type="file"
            accept="application/json"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
        </CardFooter>
      </Card>
    </div>
  );
}
