'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface DeleteTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  taskTitle: string;
}

export function DeleteTaskDialog({ open, onOpenChange, onConfirm, taskTitle }: DeleteTaskDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Task</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &quot;{taskTitle}&quot;? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
