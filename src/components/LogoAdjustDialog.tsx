import { useEffect, useMemo, useRef, useState } from "react";
import { Move, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";

interface LogoAdjustDialogProps {
  file: File | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (file: File) => void;
}

const PREVIEW_SIZE = 288;
const OUTPUT_SIZE = 512;

export function LogoAdjustDialog({ file, open, onOpenChange, onConfirm }: LogoAdjustDialogProps) {
  const imageRef = useRef<HTMLImageElement>(null);
  const dragRef = useRef<{ x: number; y: number; startX: number; startY: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState({ width: 1, height: 1 });

  const imageUrl = useMemo(() => (file ? URL.createObjectURL(file) : ""), [file]);
  const baseScale = Math.max(PREVIEW_SIZE / imageSize.width, PREVIEW_SIZE / imageSize.height);
  const displayWidth = imageSize.width * baseScale * zoom;
  const displayHeight = imageSize.height * baseScale * zoom;

  useEffect(() => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl]);

  const cropLogo = async () => {
    const img = imageRef.current;
    if (!img || !file) return;

    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const left = (PREVIEW_SIZE - displayWidth) / 2 + position.x;
    const top = (PREVIEW_SIZE - displayHeight) / 2 + position.y;
    const sourceScale = baseScale * zoom;
    const sx = -left / sourceScale;
    const sy = -top / sourceScale;
    const sw = PREVIEW_SIZE / sourceScale;
    const sh = PREVIEW_SIZE / sourceScale;

    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
    canvas.toBlob((blob) => {
      if (!blob) return;
      onConfirm(new File([blob], `logo-${Date.now()}.png`, { type: "image/png" }));
      onOpenChange(false);
    }, "image/png", 0.95);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>ლოგოს მორგება</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div
            className="relative mx-auto overflow-hidden rounded-3xl border border-primary/30 bg-secondary shadow-2xl shadow-primary/20 touch-none"
            style={{ width: PREVIEW_SIZE, height: PREVIEW_SIZE }}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              dragRef.current = { x: position.x, y: position.y, startX: e.clientX, startY: e.clientY };
            }}
            onPointerMove={(e) => {
              if (!dragRef.current) return;
              setPosition({
                x: dragRef.current.x + e.clientX - dragRef.current.startX,
                y: dragRef.current.y + e.clientY - dragRef.current.startY,
              });
            }}
            onPointerUp={() => { dragRef.current = null; }}
          >
            {imageUrl && (
              <img
                ref={imageRef}
                src={imageUrl}
                alt="Logo preview"
                draggable={false}
                onLoad={(e) => setImageSize({ width: e.currentTarget.naturalWidth, height: e.currentTarget.naturalHeight })}
                className="absolute max-w-none select-none"
                style={{
                  width: displayWidth,
                  height: displayHeight,
                  left: (PREVIEW_SIZE - displayWidth) / 2 + position.x,
                  top: (PREVIEW_SIZE - displayHeight) / 2 + position.y,
                }}
              />
            )}
            <div className="pointer-events-none absolute inset-0 rounded-3xl ring-4 ring-primary/35" />
            <div className="pointer-events-none absolute inset-6 rounded-2xl border border-primary-foreground/40" />
            <Move className="pointer-events-none absolute bottom-4 right-4 h-5 w-5 text-primary-foreground drop-shadow" />
          </div>

          <div className="rounded-2xl border border-border bg-secondary/50 p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ZoomIn className="h-4 w-4" />
              <span>გადიდება</span>
            </div>
            <Slider value={[zoom]} min={1} max={3} step={0.05} onValueChange={([value]) => setZoom(value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>გაუქმება</Button>
          <Button onClick={cropLogo}>შენახვა</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}