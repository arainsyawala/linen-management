"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

export function OccupancySubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" loading={pending} className="min-w-[60px]">
      Set
    </Button>
  );
}
