import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { SPORT_LIST, type SportId } from "@/lib/sports";

interface SportPickerProps {
  open: boolean;
  onSelect: (id: SportId) => void;
  title?: string;
  description?: string;
}

export function SportPicker({ open, onSelect, title, description }: SportPickerProps) {
  return (
    <Dialog open={open}>
      <DialogContent className="max-w-2xl" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-3xl tracking-wider">
            {title ?? "Choose Your Sport"}
          </DialogTitle>
          <DialogDescription>
            {description ?? "Pick the discipline your club practices. We'll tailor the labels and theme to match."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {SPORT_LIST.map((s, i) => (
            <motion.button
              key={s.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onSelect(s.id)}
              className="flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border-2 border-border bg-card hover:border-primary hover:shadow-md transition-all"
              style={{
                // preview the sport color on hover via inline style
                ["--hover-color" as string]: `oklch(${s.primary})`,
              }}
            >
              <span className="text-4xl">{s.emoji}</span>
              <span className="font-display tracking-wider text-sm">{s.name}</span>
            </motion.button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
