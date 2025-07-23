// Welcome page using shadcn/ui Card, centered with two buttons

import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Welcome() {
  return (
    <div className="h-screen flex items-center justify-center">
      <Card className="min-w-[340px] shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">
            openlexicon
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Optionally, add a subtitle or description here */}
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button className="w-full" variant="default">
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
